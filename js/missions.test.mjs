import test from 'node:test';
import assert from 'node:assert/strict';
import { getWeeklyChallenge, getWeeklyDateKey } from './missions.js';

test('weekly date key remains stable from Monday through Sunday', () => {
  assert.equal(getWeeklyDateKey(new Date('2026-11-16T00:01:00.000Z')), '2026-11-16');
  assert.equal(getWeeklyDateKey(new Date('2026-11-19T18:30:00.000Z')), '2026-11-16');
  assert.equal(getWeeklyDateKey(new Date('2026-11-22T23:59:00.000Z')), '2026-11-16');
});

test('weekly contract is deterministic during the same UTC week', () => {
  const monday = getWeeklyChallenge(new Date('2026-11-16T00:00:00.000Z'));
  const saturday = getWeeklyChallenge(new Date('2026-11-21T12:00:00.000Z'));
  assert.deepEqual(monday, saturday);
  assert.ok(monday.id && monday.title && monday.target > 0 && monday.reward > 0 && monday.xp > 0);
});

test('weekly challenge rotates at the next Monday boundary', () => {
  const sunday = new Date('2026-11-22T23:59:59.000Z');
  const nextMonday = new Date('2026-11-23T00:00:00.000Z');
  assert.equal(getWeeklyDateKey(sunday), '2026-11-16');
  assert.equal(getWeeklyDateKey(nextMonday), '2026-11-23');
});
