/* CITY DRIVE - WOW FRONT MENU / CAR SELECTION FLOW */
(function(){
"use strict";

var state={selected:null};

function css(){
 if(document.getElementById("city-wow-menu-css")) return;
 var s=document.createElement("style");
 s.id="city-wow-menu-css";
 s.textContent=`
 #cityWowMenu{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
   font-family:Inter,Arial,sans-serif;background:
   radial-gradient(circle at 50% 15%,rgba(53,122,255,.22),transparent 38%),
   linear-gradient(135deg,#050914 0%,#09152a 52%,#03060c 100%);color:#fff;overflow:auto}
 #cityWowMenu .wow-shell{width:min(1180px,94vw);padding:28px 0 36px}
 #cityWowMenu .wow-hero{text-align:center;margin-bottom:22px}
 #cityWowMenu .wow-kicker{letter-spacing:.32em;font-size:12px;font-weight:800;color:#8fb9ff}
 #cityWowMenu h1{margin:7px 0 4px;font-size:clamp(42px,7vw,78px);line-height:.9;letter-spacing:-.045em;text-transform:uppercase}
 #cityWowMenu .wow-sub{margin:12px auto 0;max-width:650px;color:#b8c5d8;font-size:15px}
 #cityWowMenu .wow-road{height:5px;width:min(520px,72vw);margin:20px auto 0;border-radius:8px;
   background:linear-gradient(90deg,transparent,#fff,transparent);box-shadow:0 0 24px rgba(255,255,255,.32)}
 #cityWowMenu .wow-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:stretch}
 #cityWowMenu .wow-card{background:rgba(12,19,34,.82);border:1px solid rgba(255,255,255,.11);border-radius:20px;
   padding:22px;box-shadow:0 18px 50px rgba(0,0,0,.38);backdrop-filter:blur(14px)}
 #cityWowMenu .wow-card h2{margin:0 0 6px;font-size:23px}
 #cityWowMenu .wow-card p{color:#9eacc0;font-size:13px;margin:0 0 16px}
 #cityWowMenu .car-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;max-height:360px;overflow:auto;padding-right:3px}
 #cityWowMenu .car-btn{min-height:78px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:#111b2d;color:#fff;
   cursor:pointer;padding:10px;text-align:left;transition:.16s transform,.16s border,.16s background}
 #cityWowMenu .car-btn:hover{transform:translateY(-2px);background:#182641;border-color:rgba(110,169,255,.7)}
 #cityWowMenu .car-btn.selected{border-color:#67a5ff;background:#16305a;box-shadow:0 0 0 2px rgba(103,165,255,.16)}
 #cityWowMenu .car-icon{height:28px;margin-bottom:5px;position:relative}
 #cityWowMenu .car-icon:before{content:"";position:absolute;left:8px;top:9px;width:62px;height:13px;border-radius:7px 13px 5px 5px;background:var(--car,#d8d8d8)}
 #cityWowMenu .car-icon:after{content:"";position:absolute;left:21px;top:3px;width:34px;height:11px;border-radius:13px 13px 3px 3px;background:#1a2b3a}
 #cityWowMenu .car-name{font-size:12px;font-weight:800}
 #cityWowMenu .car-class{font-size:10px;color:#8291a7;text-transform:uppercase;letter-spacing:.08em}
 #cityWowMenu .selected-panel{margin-top:12px;display:flex;justify-content:space-between;gap:12px;align-items:center;
   border-top:1px solid rgba(255,255,255,.08);padding-top:13px}
 #cityWowMenu .selected-name{font-size:18px;font-weight:900}
 #cityWowMenu .selected-meta{font-size:11px;color:#94a4ba}
 #cityWowMenu .wow-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px}
 #cityWowMenu button.action{border:0;border-radius:12px;padding:14px 12px;font-weight:900;cursor:pointer;font-size:14px}
 #cityWowMenu .continue{background:#fff;color:#07101e}
 #cityWowMenu .continue:disabled{opacity:.35;cursor:not-allowed}
 #cityWowMenu .secondary{background:#18243a;color:#fff;border:1px solid rgba(255,255,255,.1)!important}
 #cityWowMenu .wow-features{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
 #cityWowMenu .feature{padding:14px;border-radius:13px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07)}
 #cityWowMenu .feature strong{display:block;font-size:13px;margin-bottom:4px}
 #cityWowMenu .feature span{font-size:11px;color:#8f9eb4}
 #cityWowMenu .level-card{margin-top:18px;padding:16px 18px;border-radius:16px;background:linear-gradient(90deg,rgba(44,96,180,.22),rgba(255,255,255,.035));
   border:1px solid rgba(103,165,255,.25);display:flex;align-items:center;justify-content:space-between;gap:15px}
 #cityWowMenu .level-badge{font-weight:900;font-size:12px;color:#8fb9ff;letter-spacing:.12em}
 @media(max-width:760px){#cityWowMenu .wow-grid{grid-template-columns:1fr}.car-grid{grid-template-columns:repeat(2,1fr)!important}}
 `;
 document.head.appendChild(s);
}

function getCars(){
 var c=window.CityDriveRealStreetCars&&window.CityDriveRealStreetCars.catalog;
 if(c) return Object.entries(c).map(function(x){return {id:x[0],...x[1]};});
 var v=window.VEHICLES;
 if(v&&typeof v==="object") return Object.entries(v).map(function(x){return {id:x[0],...x[1]};});
 return [];
}

function open(){
 css();
 var old=document.getElementById("cityWowMenu"); if(old) old.remove();
 var cars=getCars();
 var el=document.createElement("div"); el.id="cityWowMenu";
 el.innerHTML=`<div class="wow-shell">
   <div class="wow-hero">
     <div class="wow-kicker">ETHAN DIGITAL ACADEMY PRESENTS</div>
     <h1>CITY DRIVE</h1>
     <div class="wow-sub">A living city. Real traffic. Your car. Your road. Choose your ride and take control.</div>
     <div class="wow-road"></div>
   </div>
   <div class="wow-grid">
     <section class="wow-card">
       <h2>Choose Your Car</h2>
       <p>Your selection becomes the vehicle you drive when Level 1 begins.</p>
       <div class="car-grid" id="wowCarGrid"></div>
       <div class="selected-panel">
         <div><div class="selected-name" id="wowSelectedName">Choose a car</div><div class="selected-meta" id="wowSelectedMeta">Level 1 is locked until you choose.</div></div>
         <div>🚗</div>
       </div>
       <div class="wow-actions">
         <button class="action secondary" id="wowBack">Back</button>
         <button class="action continue" id="wowStart" disabled>START LEVEL 1</button>
       </div>
     </section>
     <section class="wow-card">
       <h2>City Drive</h2>
       <p>Start with the world, then master the streets.</p>
       <div class="wow-features">
         <div class="feature"><strong>🌆 Living City</strong><span>Roads, districts and points of interest.</span></div>
         <div class="feature"><strong>🚦 Street Traffic</strong><span>Everyday cars moving through the city.</span></div>
         <div class="feature"><strong>🏁 Level 1</strong><span>Your first driving challenge begins after selection.</span></div>
         <div class="feature"><strong>🎮 Full Control</strong><span>Keyboard and game controls ready.</span></div>
       </div>
       <div class="level-card"><div><div class="level-badge">MISSION 01</div><strong>THE CITY AWAKENS</strong></div><span>🔒 Choose a car first</span></div>
     </section>
   </div>
 </div>`;
 document.body.appendChild(el);

 var grid=el.querySelector("#wowCarGrid");
 cars.forEach(function(car){
   var b=document.createElement("button"); b.className="car-btn";
   b.innerHTML='<div class="car-icon" style="--car:'+(car.color||"#d8d8d8")+'"></div><div class="car-name">'+(car.name||car.id)+'</div><div class="car-class">'+(car.class||"street")+'</div>';
   b.onclick=function(){
     state.selected=car.id;
     grid.querySelectorAll(".car-btn").forEach(function(x){x.classList.remove("selected");});
     b.classList.add("selected");
     el.querySelector("#wowSelectedName").textContent=car.name||car.id;
     el.querySelector("#wowSelectedMeta").textContent=(car.class||"street").toUpperCase()+"  •  "+(car.topSpeed?Math.round(car.topSpeed*3.6)+" km/h":"READY");
     el.querySelector("#wowStart").disabled=false;
     el.querySelector(".level-card span").textContent="✓ Ready to start";
   };
   grid.appendChild(b);
 });
 el.querySelector("#wowStart").onclick=function(){
   if(!state.selected) return;
   try{localStorage.setItem("cityDriveSelectedVehicle",state.selected);}catch(e){}
   // Use existing game APIs; selection is committed before the world starts.
   var g=window.game||window.firstGame||window.cityDriveGame;
   if(g){
     if(typeof g.selectVehicle==="function") try{g.selectVehicle(state.selected);}catch(e){}
     if(typeof g.setActiveVehicle==="function") try{g.setActiveVehicle(state.selected);}catch(e){}
     if(typeof g.enterWorld==="function"){ try{g.enterWorld(true,{startGrid:true,selectedVehicle:state.selected});}catch(e){try{g.enterWorld(true,{startGrid:true});}catch(x){}}}
   }
   el.remove();
   window.dispatchEvent(new CustomEvent("citydrive:level1start",{detail:{vehicleId:state.selected}}));
 };
 el.querySelector("#wowBack").onclick=function(){el.remove();};
}

window.CityDriveWowMenu={open:open};
})();
