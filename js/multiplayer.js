/**
 * CITY DRIVE — Multiplayer racing
 * Modes:
 *  - local: 2 players, same keyboard
 *  - room:  same-origin tabs via BroadcastChannel + optional PeerJS P2P
 */

import * as THREE from 'three';
import { createVehicleMesh } from './vehicleFactory.js';
import { getVehicleById, cloneVehicle } from './vehicles.js';
import { VehicleController } from './vehiclePhysics.js';

const PREFIX = 'citydrive-mp-';

export function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export class Multiplayer {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.mode = null; // 'local' | 'room'
    this.role = 'host';
    this.room = null;
    this.channel = null;
    this.peer = null;
    this.conns = [];
    this.remotes = new Map(); // id -> { mesh, name, vehicleId, last }
    this.p2 = null; // local player 2
    this.finished = new Map();
    this.lastSend = 0;
    this.myId = 'p-' + Math.random().toString(36).slice(2, 8);
    this.onEvent = () => {};
  }

  startLocal() {
    this.end();
    this.active = true;
    this.mode = 'local';
    this.role = 'host';
    const base = this.game.state.garage.vehicles[0] || cloneVehicle(getVehicleById('metro_s'));
    const def = cloneVehicle(getVehicleById(base.id) || getVehicleById('metro_s'));
    const mesh = createVehicleMesh(def);
    const start = this._gridPos(1);
    mesh.position.set(start.x, 0, start.z);
    mesh.rotation.y = 0;
    this.game.scene.add(mesh);
    const ctrl = new VehicleController(mesh, def);
    this.p2 = { def, mesh, ctrl, name: 'Player 2' };
    this.game.ui.toast('Local 2P — P2 uses I J K L, U nitro, O handbrake');
    this.onEvent({ type: 'local-ready' });
    return this.p2;
  }

  async hostRoom(code) {
    this.end();
    this.active = true;
    this.mode = 'room';
    this.role = 'host';
    this.room = (code || makeRoomCode()).toUpperCase();
    this._openChannel();
    this._broadcast({ type: 'host-hello', room: this.room, host: this.myId, name: this.game.state.player.name });
    this._tryPeerJS(true);
    return this.room;
  }

  async joinRoom(code) {
    this.end();
    this.active = true;
    this.mode = 'room';
    this.role = 'guest';
    this.room = String(code || '').trim().toUpperCase();
    if (this.room.length < 4) throw new Error('Invalid room code');
    this._openChannel();
    this._broadcast({
      type: 'join',
      id: this.myId,
      name: this.game.state.player.name,
      vehicleId: this.game.activeActor?.def?.id || this.game.state.garage.vehicles[0]?.id || 'metro_s'
    });
    this._tryPeerJS(false);
  }

  _openChannel() {
    try {
      this.channel = new BroadcastChannel(PREFIX + this.room);
      this.channel.onmessage = (ev) => this._onMsg(ev.data, 'bc');
    } catch (e) {
      console.warn('BroadcastChannel unavailable', e);
    }
  }

  async _tryPeerJS(isHost) {
    try {
      // PeerJS is intentionally not downloaded at runtime. CITY DRIVE's core
      // single-player and local 2P modes are fully offline. Internet-only
      // PeerJS rooms are skipped when PeerJS is not already bundled.
      if (!window.Peer) return;
      const peerId = isHost ? PREFIX + this.room + '-host' : PREFIX + this.room + '-' + this.myId;
      this.peer = new window.Peer(peerId, { debug: 0 });
      this.peer.on('open', () => {
        if (!isHost) {
          const c = this.peer.connect(PREFIX + this.room + '-host');
          this._bindConn(c);
        }
      });
      this.peer.on('connection', (c) => this._bindConn(c));
      this.peer.on('error', (err) => console.warn('PeerJS', err.type || err));
    } catch (e) {
      console.warn('PeerJS optional path failed', e);
    }
  }

  _bindConn(c) {
    this.conns.push(c);
    c.on('data', (data) => this._onMsg(data, 'peer'));
    c.on('open', () => {
      c.send({
        type: 'join',
        id: this.myId,
        name: this.game.state.player.name,
        vehicleId: this.game.activeActor?.def?.id || 'metro_s'
      });
    });
  }

  _broadcast(msg) {
    const packet = { ...msg, t: Date.now(), from: this.myId };
    try { this.channel?.postMessage(packet); } catch {}
    for (const c of this.conns) {
      try { if (c.open) c.send(packet); } catch {}
    }
  }

  _onMsg(msg, via) {
    if (!msg || msg.from === this.myId) return;
    if (msg.type === 'join') {
      this._ensureRemote(msg);
      this._broadcast({
        type: 'welcome',
        to: msg.id,
        host: this.role === 'host',
        race: this.game.activeMission?.kind === 'race' ? {
          name: this.game.activeMission.name,
          type: this.game.activeMission.type,
          checkpoints: this.game.activeMission.checkpoints
        } : null
      });
      this.game.ui.toast(`${msg.name || 'Racer'} joined the room`);
    } else if (msg.type === 'welcome' && msg.race && this.role === 'guest' && !this.game.activeMission) {
      this.game.activeMission = {
        kind: 'race',
        type: msg.race.type || 'multiplayer',
        name: msg.race.name || 'Multiplayer Race',
        checkpoints: msg.race.checkpoints,
        index: 0,
        startTime: performance.now(),
        multiplayer: true
      };
      this.game.flags.raced = true;
    } else if (msg.type === 'state') {
      this._applyRemoteState(msg);
    } else if (msg.type === 'finished') {
      this.finished.set(msg.from, { name: msg.name, place: msg.place, time: msg.time });
      this.game.ui.toast(`${msg.name} finished`);
    } else if (msg.type === 'start-race' && this.role === 'guest') {
      this.game.startRace({ id: 'multiplayer', name: 'Multiplayer Race', x: msg.x, z: msg.z }, { multiplayer: true, checkpoints: msg.checkpoints });
    }
  }

  _ensureRemote(msg) {
    if (this.remotes.has(msg.id || msg.from)) return this.remotes.get(msg.id || msg.from);
    const id = msg.id || msg.from;
    const vid = msg.vehicleId || 'urban_lx';
    const def = cloneVehicle(getVehicleById(vid) || getVehicleById('metro_s'));
    const mesh = createVehicleMesh(def);
    mesh.position.set(20, 0, 20);
    this.game.scene.add(mesh);
    const label = makeNameLabel(msg.name || 'Racer');
    mesh.add(label);
    const rec = { id, mesh, def, name: msg.name || 'Racer', last: 0 };
    this.remotes.set(id, rec);
    return rec;
  }

  _applyRemoteState(msg) {
    const rec = this._ensureRemote(msg);
    rec.target = {
      x: msg.x, z: msg.z, y: msg.y || 0,
      heading: msg.heading || 0,
      speed: msg.speed || 0
    };
    rec.last = performance.now();
    rec.cp = msg.cp;
  }

  sendState(dt) {
    if (!this.active || this.mode !== 'room') return;
    this.lastSend += dt;
    if (this.lastSend < 0.05) return;
    this.lastSend = 0;
    const ctrl = this.game.controller;
    if (!ctrl) return;
    this._broadcast({
      type: 'state',
      id: this.myId,
      name: this.game.state.player.name,
      vehicleId: ctrl.def.id,
      x: ctrl.mesh.position.x,
      y: ctrl.mesh.position.y,
      z: ctrl.mesh.position.z,
      heading: ctrl.heading,
      speed: ctrl.speed,
      cp: this.game.activeMission?.index || 0
    });
  }

  interpolate(dt) {
    const now = performance.now();
    for (const rec of this.remotes.values()) {
      if (!rec.target) continue;
      rec.mesh.position.x = THREE.MathUtils.damp(rec.mesh.position.x, rec.target.x, 12, dt);
      rec.mesh.position.z = THREE.MathUtils.damp(rec.mesh.position.z, rec.target.z, 12, dt);
      rec.mesh.rotation.y = rec.target.heading;
      if (now - rec.last > 8000) rec.mesh.visible = false;
      else rec.mesh.visible = true;
    }
  }

  updateLocalP2(dt, world) {
    if (!this.p2) return;
    const inp = this.game.ui.input.p2;
    if (!inp) return;
    this.p2.ctrl.update(dt, inp, world);
  }

  announceFinish(place, time) {
    this._broadcast({
      type: 'finished',
      name: this.game.state.player.name,
      place,
      time
    });
  }

  hostStartRace(race, checkpoints) {
    this._broadcast({
      type: 'start-race',
      name: race.name,
      x: race.x,
      z: race.z,
      checkpoints
    });
  }

  standings() {
    const rows = [];
    if (this.game.controller && this.game.activeMission) {
      rows.push({
        id: this.myId,
        name: this.game.state.player.name + ' (You)',
        cp: this.game.activeMission.index || 0,
        you: true
      });
    }
    for (const rec of this.remotes.values()) {
      rows.push({ id: rec.id, name: rec.name, cp: rec.cp || 0, you: false });
    }
    if (this.p2 && this.game.activeMission) {
      rows.push({ id: 'p2', name: 'Player 2', cp: this.p2.cp || 0, you: false });
    }
    rows.sort((a, b) => b.cp - a.cp);
    return rows;
  }

  _gridPos(slot) {
    const origin = this.game.activeMission?.checkpoints?.[0] || { x: 10, z: 60 };
    return { x: origin.x + slot * 4, z: origin.z - 8 };
  }

  end() {
    for (const rec of this.remotes.values()) this.game.scene.remove(rec.mesh);
    this.remotes.clear();
    if (this.p2) {
      this.game.scene.remove(this.p2.mesh);
      this.p2 = null;
    }
    try { this.channel?.close(); } catch {}
    this.channel = null;
    for (const c of this.conns) { try { c.close(); } catch {} }
    this.conns = [];
    try { this.peer?.destroy(); } catch {}
    this.peer = null;
    this.active = false;
    this.mode = null;
    this.finished.clear();
  }
}

function makeNameLabel(text) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(8,12,24,0.75)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(text).slice(0, 16), 128, 42);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const spr = new THREE.Sprite(mat);
  spr.position.y = 2.4;
  spr.scale.set(3.2, 0.8, 1);
  return spr;
}
