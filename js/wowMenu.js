/* CITY DRIVE - WOW FRONT MENU / CAR SELECTION FLOW */
(function(){
"use strict";

var state={selected:null,selectedColor:null};
var menuWasOpenedFromBoot=true;

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
 #cityWowMenu .car-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;max-height:390px;overflow:auto;padding-right:3px}
 #cityWowMenu .car-btn{min-height:88px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:linear-gradient(145deg,#111b2d,#0b1220);color:#fff;
   cursor:pointer;padding:13px;text-align:left;transition:.16s transform,.16s border,.16s background;position:relative;overflow:hidden}
 #cityWowMenu .car-btn:hover{transform:translateY(-2px);background:#182641;border-color:rgba(110,169,255,.7)}
 #cityWowMenu .car-btn.selected{border-color:#67a5ff;background:#16305a;box-shadow:0 0 0 2px rgba(103,165,255,.16)}
 #cityWowMenu .car-icon{display:none!important}
 #cityWowMenu .car-name{font-size:14px;font-weight:950;letter-spacing:.01em}
 #cityWowMenu .car-class{font-size:10px;color:#8291a7;text-transform:uppercase;letter-spacing:.08em;margin-top:5px}
 #cityWowMenu .selected-panel{margin-top:12px;display:flex;justify-content:space-between;gap:12px;align-items:center;
   border-top:1px solid rgba(255,255,255,.08);padding-top:13px}
 #cityWowMenu .paint-palette{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;align-items:center}.paint-palette-label{font-size:9px;letter-spacing:.12em;color:#8090a5;font-weight:900;width:100%}.paint-swatch{width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,.22);cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.35);transition:.15s transform,.15s border}.paint-swatch:hover{transform:scale(1.12);border-color:#fff}.paint-swatch.active{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.2),0 0 16px rgba(255,255,255,.25)}
 #cityWowMenu .selected-showcase{position:relative;height:185px;margin:12px 0 0;border-radius:16px;overflow:hidden;background:radial-gradient(circle at 65% 40%,rgba(0,212,255,.12),transparent 38%),linear-gradient(145deg,#0a1220,#050912);border:1px solid rgba(255,255,255,.08)}
 #cityWowMenu .showcase-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 58%;filter:saturate(1.08) contrast(1.08);display:none}.showcase-photo.gwagon{display:block}.showcase-photo-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,9,18,.88) 0%,rgba(5,9,18,.22) 48%,rgba(5,9,18,.45) 100%),linear-gradient(0deg,rgba(3,6,12,.72),transparent 48%);pointer-events:none}.showcase-car{position:absolute;left:8%;right:6%;bottom:23%;height:42%;background:linear-gradient(150deg,#f2f5f8,#708092 25%,#1a2b3b 60%,#060b12);border-radius:28% 42% 15% 12%;box-shadow:inset 0 3px 7px rgba(255,255,255,.65),inset 0 -18px 25px rgba(0,0,0,.75),0 25px 35px rgba(0,0,0,.55);transform:skewX(-4deg)}
 #cityWowMenu .showcase-car:before{content:"";position:absolute;left:27%;top:-48%;width:42%;height:62%;background:linear-gradient(145deg,#bdcad6,#1c3042);clip-path:polygon(20% 100%,32% 15%,73% 0,100% 100%);border-radius:18px}
 #cityWowMenu .showcase-car:after{content:"";position:absolute;left:35%;top:-34%;width:31%;height:28%;background:linear-gradient(145deg,#07121d,#315067);clip-path:polygon(12% 100%,28% 10%,100% 0,100% 100%);border:1px solid rgba(180,230,255,.35)}
 #cityWowMenu .showcase-wheel{position:absolute;bottom:-20%;width:17%;aspect-ratio:1;border-radius:50%;background:#030507;border:9px solid #151d27;box-shadow:inset 0 0 0 5px #667381}
 #cityWowMenu .showcase-wheel.a{left:12%}.showcase-wheel.b{left:34%}.showcase-wheel.c{right:34%}.showcase-wheel.d{right:12%}
 #cityWowMenu .showcase-label{position:absolute;top:14px;left:16px;font-size:9px;letter-spacing:.2em;color:#7890aa;font-weight:900}
 #cityWowMenu .showcase-name{position:absolute;right:16px;top:13px;text-align:right;font-size:11px;font-weight:900}
 #cityWowMenu .selected-name{font-size:18px;font-weight:900}
 #cityWowMenu .selected-meta{font-size:11px;color:#94a4ba}
 #cityWowMenu .wow-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px}
 #cityWowMenu button.action{border:0;border-radius:12px;padding:14px 12px;font-weight:900;cursor:pointer;font-size:14px}
 #cityWowMenu .continue{background:#fff;color:#07101e}
 #cityWowMenu .continue:disabled{opacity:.35;cursor:not-allowed}
 #cityWowMenu .secondary{background:#18243a;color:#fff;border:1px solid rgba(255,255,255,.1)!important}
 #cityWowMenu .wow-lineup{position:relative;height:150px;margin:0 0 12px;border-radius:15px;overflow:hidden;border:1px solid rgba(255,255,255,.09);background:#0a1019}
 #cityWowMenu .wow-lineup img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(1.12) contrast(1.06);opacity:.88}
 #cityWowMenu .wow-lineup-overlay{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:14px;background:linear-gradient(0deg,rgba(2,6,12,.9),rgba(2,6,12,.05) 70%);}
 #cityWowMenu .wow-lineup-overlay strong{font-size:18px;letter-spacing:.06em}.wow-lineup-overlay span{font-size:9px;color:#b2c0d0;letter-spacing:.13em;margin-top:4px}
 #cityWowMenu .wow-features{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
 #cityWowMenu .feature{padding:14px;border-radius:13px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07)}
 #cityWowMenu .feature strong{display:block;font-size:13px;margin-bottom:4px}
 #cityWowMenu .feature span{font-size:11px;color:#8f9eb4}
 #cityWowMenu .level-card{margin-top:18px;padding:16px 18px;border-radius:16px;background:linear-gradient(90deg,rgba(44,96,180,.22),rgba(255,255,255,.035));
   border:1px solid rgba(103,165,255,.25);display:flex;align-items:center;justify-content:space-between;gap:15px}
 #cityWowMenu .level-badge{font-weight:900;font-size:12px;color:#8fb9ff;letter-spacing:.12em}

 #cityWowMenu .wow-section-label{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}
 #cityWowMenu .wow-section-label strong{font-size:11px;letter-spacing:.14em;color:#7f91a8}
 #cityWowMenu .wow-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:10px}
 #cityWowMenu .wow-tab{border:1px solid rgba(255,255,255,.09);background:#0e1728;color:#9eacc0;border-radius:9px;padding:9px 5px;font-size:10px;font-weight:900;cursor:pointer;letter-spacing:.04em}
 #cityWowMenu .wow-tab:hover{background:#16233a;color:#fff}
 #cityWowMenu .wow-tab.active{color:#fff;border-color:var(--tab-accent);background:color-mix(in srgb,var(--tab-accent) 18%,#0e1728);box-shadow:0 0 0 1px color-mix(in srgb,var(--tab-accent) 25%,transparent)}
 #cityWowMenu .wow-tab[data-filter="car"]{--tab-accent:#00d4ff}
 #cityWowMenu .wow-tab[data-filter="suv"]{--tab-accent:#00ff9d}
  #cityWowMenu .wow-tab[data-filter="commercial"]{--tab-accent:#ffb52e}
 #cityWowMenu .car-btn{position:relative}
 #cityWowMenu .car-btn .car-type-chip{display:inline-block;margin-top:4px;padding:2px 5px;border-radius:4px;font-size:8px;font-weight:900;letter-spacing:.06em;background:rgba(255,255,255,.06);color:#8fa0b8}
 #cityWowMenu .car-btn[data-type="car"]{--type-accent:#00d4ff}
 #cityWowMenu .car-btn[data-type="suv"]{--type-accent:#00ff9d}
  #cityWowMenu .car-btn[data-type="commercial"]{--type-accent:#ffb52e}
 #cityWowMenu .car-btn.selected{border-color:var(--type-accent,#67a5ff);box-shadow:0 0 0 2px color-mix(in srgb,var(--type-accent,#67a5ff) 20%,transparent)}
 @media(max-width:760px){#cityWowMenu .wow-grid{grid-template-columns:1fr}.car-grid{grid-template-columns:repeat(2,1fr)!important}}
 #cityWowMenu:has(.front-shell){background:#03060c;overflow:hidden}
 #cityWowMenu .front-shell{position:relative;width:100%;height:100%;overflow:hidden;background:radial-gradient(circle at 72% 62%,rgba(0,212,255,.15),transparent 24%),radial-gradient(circle at 80% 20%,rgba(123,92,255,.12),transparent 30%),linear-gradient(115deg,#02040a 0%,#07101d 48%,#02050a 100%)}
 #cityWowMenu .front-shell:before{content:"";position:absolute;inset:0;background:linear-gradient(115deg,rgba(0,0,0,.55) 0 42%,transparent 66%),linear-gradient(180deg,transparent 58%,rgba(0,0,0,.7));pointer-events:none}
 #cityWowMenu .front-noise{position:absolute;inset:0;opacity:.12;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:70px 70px;transform:perspective(500px) rotateX(58deg) translateY(35%);transform-origin:center bottom}
 #cityWowMenu .front-top{position:absolute;top:30px;left:5vw;right:5vw;display:flex;justify-content:space-between;align-items:center;z-index:5;font-weight:900;letter-spacing:.18em;font-size:.7rem}.front-brand{color:#fff}.front-live{color:#8191a7}.front-live i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#00ff9d;box-shadow:0 0 14px #00ff9d;margin-right:7px}
 #cityWowMenu .front-copy{position:absolute;z-index:5;left:6vw;top:18%;max-width:520px}.front-kicker{color:#00d4ff;font-size:.68rem;font-weight:900;letter-spacing:.27em;margin-bottom:14px}.front-copy h1{font-size:clamp(4.5rem,10vw,9rem);line-height:.76;margin:0;font-weight:1000;letter-spacing:-.07em;text-shadow:0 18px 60px #000}.front-copy h1 em{font-style:normal;background:linear-gradient(90deg,#fff,#00d4ff 60%,#7b5cff);-webkit-background-clip:text;color:transparent}.front-copy p{font-size:.92rem;letter-spacing:.25em;color:#aebdce;margin:26px 0 16px}.front-rule{width:170px;height:2px;background:linear-gradient(90deg,#00d4ff,transparent);margin-bottom:24px}.front-actions{display:flex;gap:10px}.front-actions button{border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:14px 22px;font-weight:950;letter-spacing:.08em;cursor:pointer}.front-actions #frontStart{background:#fff;color:#06101a;box-shadow:0 12px 35px rgba(255,255,255,.12)}.front-actions #frontContinue{background:rgba(8,16,29,.72);color:#fff}.front-actions button:hover{transform:translateY(-2px);filter:brightness(1.08)}.front-copy>small{display:block;margin-top:16px;color:#60728a;font-size:.54rem;letter-spacing:.16em}
 #cityWowMenu .front-car{position:absolute;z-index:3;right:4vw;bottom:15%;width:min(61vw,850px);height:42vh;min-height:220px;filter:drop-shadow(0 30px 30px rgba(0,0,0,.7));transform:perspective(900px) rotateY(-7deg);animation:frontCarFloat 5s ease-in-out infinite}.front-gwagon-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center;filter:saturate(1.12) contrast(1.08) drop-shadow(0 28px 22px rgba(0,0,0,.72));mix-blend-mode:screen}.front-car .car-shadow{position:absolute;left:5%;right:3%;bottom:4%;height:18%;border-radius:50%;background:rgba(0,0,0,.8);filter:blur(18px)}.front-car .car-body{position:absolute;left:4%;right:4%;bottom:17%;height:48%;background:linear-gradient(155deg,#dce7f1 0%,#718496 23%,#172b3d 54%,#07101a 100%);border-radius:30% 45% 18% 12% / 45% 55% 20% 18%;box-shadow:inset 0 3px 8px rgba(255,255,255,.8),inset 0 -22px 30px rgba(0,0,0,.7),0 20px 40px rgba(0,212,255,.08)}.front-car .car-roof{position:absolute;left:30%;top:-35%;width:38%;height:60%;background:linear-gradient(150deg,#c8d6e4,#243a4e);clip-path:polygon(18% 100%,35% 12%,73% 0,100% 100%);border-radius:20px}.front-car .car-window{position:absolute;top:-27%;height:37%;background:linear-gradient(145deg,#06121e,#29475c);border:1px solid rgba(180,230,255,.4);clip-path:polygon(18% 100%,32% 15%,100% 0,100% 100%)}.front-car .window-a{left:34%;width:15%}.front-car .window-b{left:50%;width:17%;transform:scaleX(-1)}.front-car .car-hood{position:absolute;right:-2%;top:13%;width:38%;height:48%;background:linear-gradient(160deg,#eef5fb,#65798b 35%,#122536 75%);clip-path:polygon(0 26%,82% 0,100% 76%,35% 100%)}.front-car .car-front{position:absolute;right:-1%;bottom:4%;width:30%;height:42%;background:linear-gradient(90deg,#172b3b,#02070c);clip-path:polygon(35% 0,100% 18%,100% 85%,65% 100%,0 70%);border-radius:0 20px 16px 0}.front-car .car-light{position:absolute;right:7%;top:23%;width:13%;height:8%;background:#dffaff;border-radius:60% 10%;box-shadow:0 0 20px #8fefff,0 0 55px rgba(0,212,255,.65);transform:skewX(-25deg)}.front-car .light-a{right:19%}.front-car .light-b{right:7%}.front-car .car-wheel{position:absolute;bottom:-12%;width:18%;aspect-ratio:1;border-radius:50%;background:#030508;border:10px solid #111923;box-shadow:inset 0 0 0 7px #526274,0 8px 12px #000}.front-car .wheel-a{left:15%}.front-car .wheel-b{right:16%}.front-car .car-wheel span{position:absolute;inset:23%;border-radius:50%;background:#d3dbe2;box-shadow:inset 0 0 0 5px #657381}.front-car .car-line{position:absolute;left:5%;right:7%;top:52%;height:2px;background:rgba(255,255,255,.35);box-shadow:0 14px 20px rgba(0,0,0,.5)}@keyframes frontCarFloat{0%,100%{transform:perspective(900px) rotateY(-7deg) translateY(0)}50%{transform:perspective(900px) rotateY(-7deg) translateY(-7px)}}
 #cityWowMenu .front-footer{position:absolute;z-index:5;bottom:22px;left:5vw;right:5vw;display:flex;justify-content:space-between;color:#52647a;font-size:.5rem;letter-spacing:.18em}.front-footer span:nth-child(2){color:#7d8da1}
 @media(max-width:800px){#cityWowMenu .front-top{top:18px}.front-copy{left:7vw;top:15%;max-width:78vw}.front-copy h1{font-size:clamp(3.8rem,18vw,6rem)}.front-copy p{font-size:.65rem}.front-car{right:-18vw!important;bottom:13%!important;width:95vw!important;height:36vh!important;opacity:.8}.front-actions{flex-direction:column;width:190px}.front-actions button{padding:12px}.front-footer span:nth-child(2){display:none}}
 #cityWowMenu button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
 @media(max-width:520px){#cityWowMenu .wow-shell{width:94vw;padding:14px 0 22px}#cityWowMenu .wow-hero{margin-bottom:12px}#cityWowMenu .wow-kicker{font-size:9px;letter-spacing:.22em}#cityWowMenu h1{font-size:clamp(34px,12vw,54px)}#cityWowMenu .wow-sub{font-size:12px;line-height:1.45}#cityWowMenu .wow-card{padding:15px}.car-grid{max-height:310px}.selected-showcase{height:155px!important}.wow-actions{grid-template-columns:1fr!important}}
 @media(max-width:800px){#cityWowMenu .front-shell{overflow:auto;min-height:100%;height:auto}.front-top{top:max(16px,env(safe-area-inset-top))!important}.front-copy{top:12%!important}.front-car{bottom:12%!important;opacity:.78}.front-footer{bottom:max(12px,env(safe-area-inset-bottom))!important}}
 @media(max-width:520px){#cityWowMenu .front-copy{left:6vw!important;top:13%!important;max-width:88vw!important}.front-copy h1{font-size:clamp(3.2rem,17vw,5.2rem)!important}.front-copy p{letter-spacing:.12em!important;line-height:1.45}.front-actions{width:min(220px,60vw)!important}.front-car{right:-28vw!important;width:110vw!important;height:34vh!important;bottom:11%!important;opacity:.62!important}.front-footer{font-size:.42rem!important;left:6vw!important;right:6vw!important}}
 @media(max-height:520px) and (orientation:landscape){#cityWowMenu .front-copy{top:10%!important}.front-copy h1{font-size:clamp(2.7rem,10vw,5rem)!important}.front-copy p{margin:12px 0 8px!important}.front-actions{flex-direction:row!important;width:auto!important}.front-car{height:52vh!important;bottom:5%!important;right:-2vw!important;width:64vw!important;opacity:.7!important}}
  `;
 document.head.appendChild(s);
}

function getCars(){
 var c=window.CityDriveRealStreetCars&&window.CityDriveRealStreetCars.catalog;
 if(c) return Object.entries(c).map(function(x){return {id:x[0],...x[1]};});
 var v=window.VEHICLES;
 if(Array.isArray(v)) return v.map(function(x){return {...x};});
 if(v&&typeof v==="object") return Object.entries(v).map(function(x){return {id:x[0],...x[1]};});
 return [];
}

function openVehicleSelection(){
 css();
 var old=document.getElementById("cityWowMenu"); if(old) old.remove();
 var cars=getCars();
 var existingGame=window.game||window.firstGame||window.cityDriveGame;
 var campaignLevel=Math.max(1,Math.min(20,Number(existingGame?.state?.player?.campaignLevel)||1));
 // Always use the authoritative vehicle database and keep the required catalog at 15.
 if(cars.length>15) cars=cars.slice(0,15);
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
       <div class="wow-section-label"><strong>SELECT BY CATEGORY</strong><span id="wowCarCount">15 VEHICLES</span></div>
       <div class="wow-tabs" id="wowTabs">
         <button class="wow-tab active" data-filter="all">ALL</button>
         <button class="wow-tab" data-filter="car">CARS</button>
         <button class="wow-tab" data-filter="suv">SUVS</button>
         <button class="wow-tab" data-filter="commercial">COMMERCIAL</button>
       </div>
       <div class="car-grid" id="wowCarGrid"></div>
       <div class="selected-showcase"><img class="showcase-photo" id="wowShowcasePhoto" src="assets/gwagon-emerald.png" alt="G-Wagon reference"/><div class="showcase-photo-overlay"></div><div class="showcase-label">SELECTED VEHICLE</div><div class="showcase-name" id="wowShowcaseName">G-WAGON</div><div class="showcase-car" id="wowCssShowcaseCar"><div class="showcase-wheel a"></div><div class="showcase-wheel b"></div><div class="showcase-wheel c"></div><div class="showcase-wheel d"></div></div></div>
       <div class="selected-panel">
         <div><div class="selected-name" id="wowSelectedName">Choose a car</div><div class="selected-meta" id="wowSelectedMeta">Level 1 is locked until you choose.</div></div>
         <div>🚗</div>
       </div>
       <div class="paint-palette" id="wowPaintPalette"><div class="paint-palette-label">CHOOSE YOUR PAINT COLOR</div></div>
       <div class="wow-actions">
         <button class="action secondary" id="wowBack">Back</button>
         <button class="action continue" id="wowStart" disabled>START LEVEL ${campaignLevel}</button>
       </div>
     </section>
     <section class="wow-card">
       <h2>City Drive</h2>
       <p>Start with the world, then master the streets.</p>
       <div class="wow-lineup" aria-label="CITY DRIVE four-wheel vehicle lineup">
         <img src="assets/car-variety-reference.jpg" alt="CITY DRIVE car variety reference"/>
         <div class="wow-lineup-overlay"><strong>15 FOUR-WHEEL RIDES</strong><span>SPORTS CARS • SUVS • PERFORMANCE • UTILITY</span></div>
       </div>
       <div class="wow-features">
         <div class="feature"><strong>🌆 Living City</strong><span>Roads, districts and points of interest.</span></div>
         <div class="feature"><strong>🚦 Street Traffic</strong><span>Everyday four-wheel cars moving through the city.</span></div>
         <div class="feature"><strong>🏁 Level 1</strong><span>Your first driving challenge begins after selection.</span></div>
         <div class="feature"><strong>🎮 Full Control</strong><span>Keyboard and game controls ready.</span></div>
       </div>
       <div class="level-card"><div><div class="level-badge">MISSION ${String(campaignLevel).padStart(2,'0')}</div><strong>THE CITY AWAKENS</strong></div><span>🔒 Choose a car first</span></div>
     </section>
   </div>
 </div>`;
 document.body.appendChild(el);

 var grid=el.querySelector("#wowCarGrid");
 var palette=[
   {name:'Emerald Green',hex:0x1f5b3a},
   {name:'Pearl White',hex:0xf2f4f5},
   {name:'Obsidian Black',hex:0x111318},
   {name:'Crimson Red',hex:0xc51f32},
   {name:'Electric Blue',hex:0x1f6fff},
   {name:'Champagne Gold',hex:0xd4a72c},
   {name:'Royal Purple',hex:0x6d3fd1},
   {name:'Sunset Orange',hex:0xf27a21}
 ];
 var paintPalette=el.querySelector('#wowPaintPalette');
 palette.forEach(function(pc){ var sw=document.createElement('button'); sw.className='paint-swatch'; sw.type='button'; sw.title=pc.name; sw.setAttribute('aria-label',pc.name); sw.dataset.color=pc.hex.toString(16); sw.style.background='#'+pc.hex.toString(16).padStart(6,'0'); paintPalette.appendChild(sw); });
 function syncPalette(car){
   var current=Number(state.selectedColor ?? car?.customization?.primaryColor ?? car?.color ?? palette[0].hex)>>>0;
   paintPalette.querySelectorAll('.paint-swatch').forEach(function(sw){ sw.classList.toggle('active',sw.dataset.color.toLowerCase()===current.toString(16).padStart(6,'0').toLowerCase()); });
 }
 function carType(car){
   var t=String(car.type||car.class||'').toLowerCase();
   if(t.includes('commercial') || /van|cargo|truck|pickup/.test(String(car.name||'').toLowerCase())) return 'commercial';
   if(t.includes('suv')) return 'suv';
   return 'car';
 }
 if(!cars.length){
   grid.innerHTML='<div style="grid-column:1/-1;padding:24px;text-align:center;color:#ff8d8d;border:1px solid rgba(255,100,100,.25);border-radius:12px">VEHICLES ARE STILL LOADING — PLEASE WAIT A MOMENT.</div>';
 }
 cars.forEach(function(car){
   car._wowType=carType(car);
   var b=document.createElement("button"); b.className="car-btn"; b.dataset.type=car._wowType;
   b.innerHTML='<div class="car-name">'+(car.name||car.id)+'</div><div class="car-class">'+(car.manufacturer||"CITY DRIVE")+' • '+(car.class||car.type||"street")+'</div><span class="car-type-chip">'+car._wowType.toUpperCase()+'</span>';
   b.onclick=function(){
     state.selected=car.id;
     state.selectedColor=Number(car.customization?.primaryColor ?? car.color ?? palette[0].hex)>>>0;
     grid.querySelectorAll(".car-btn").forEach(function(x){x.classList.remove("selected");});
     b.classList.add("selected");
     el.querySelector("#wowSelectedName").textContent=car.name||car.id;
     el.querySelector("#wowShowcaseName").textContent=(car.name||car.id).toUpperCase();
     el.querySelector("#wowSelectedMeta").textContent=(car.class||"street").toUpperCase()+"  •  "+(car.topSpeed?Math.round(car.topSpeed*3.6)+" km/h":"READY");
     var photo=el.querySelector("#wowShowcasePhoto"), cssCar=el.querySelector("#wowCssShowcaseCar");
     var isGw=car.id==='metro_s' || String(car.name||'').toLowerCase().includes('g-wagon');
     if(photo) photo.classList.toggle('gwagon',isGw);
     if(cssCar) cssCar.style.display=isGw?'none':'';
     syncPalette(car);
     el.querySelector("#wowStart").disabled=false;
     el.querySelector(".level-card span").textContent="✓ Ready to start";
   };
   grid.appendChild(b);
 });
 paintPalette.querySelectorAll('.paint-swatch').forEach(function(sw){
   sw.onclick=function(){
     var hex=parseInt(sw.dataset.color,16)>>>0;
     state.selectedColor=hex;
     var car=cars.find(function(c){return c.id===state.selected;});
     syncPalette(car);
     var g=window.game||window.cityDriveGame||window.firstGame;
     var owned=g?.state?.garage?.vehicles?.find(function(v){return v.id===state.selected && v.isOwned!==false;});
     if(owned && typeof g.setVehicleColor==='function'){
       g.setVehicleColor(owned,hex,false);
       if(g.ui?.toast) g.ui.toast('COLOR: '+sw.title);
     } else if(g?.ui?.toast) {
       g.ui.toast('COLOR SAVED — IT WILL APPLY WHEN YOU OWN THIS RIDE');
     }
   };
 });
 function applyFilter(filter){
   var visible=0;
   grid.querySelectorAll(".car-btn").forEach(function(b){
     var show=filter==="all" || b.dataset.type===filter;
     b.style.display=show?"":"none";
     if(show) visible++;
   });
   var count=el.querySelector("#wowCarCount"); if(count) count.textContent=visible+" VEHICLE"+(visible===1?"":"S");
   el.querySelectorAll(".wow-tab").forEach(function(t){t.classList.toggle("active",t.dataset.filter===filter);});
 }
 el.querySelectorAll(".wow-tab").forEach(function(t){t.onclick=function(){applyFilter(t.dataset.filter);};});
 applyFilter("all");
 // G-Wagon is the authoritative starter. Preselect it on a fresh start so the user can begin immediately.
 var starter=cars.find(function(c){ return c.id==='metro_s' || String(c.name||'').toLowerCase().includes('g-wagon'); });
 if(starter){ var sb=[...grid.querySelectorAll('.car-btn')].find(function(b){ return b.querySelector('.car-name')?.textContent===starter.name; }); if(sb) sb.click(); }
 el.querySelector("#wowStart").onclick=function(){
   if(!state.selected) return;
   try{localStorage.setItem("cityDriveSelectedVehicle",state.selected);}catch(e){}
   // Use existing game APIs; selection is committed before the world starts.
   var g=window.game||window.firstGame||window.cityDriveGame;
   if(!g){
     try{ window.CityDrivePendingVehicle=state.selected; }catch(e){}
     var retry=function(){
       var gg=window.game||window.firstGame||window.cityDriveGame;
       if(!gg) return;
       try{
         if(typeof gg.startNew==='function' && !gg.state?.player?.name) gg.startNew('Driver');
         if(typeof gg.driveSelectedVehicle==='function') gg.driveSelectedVehicle({id:state.selected});
         else if(typeof gg.enterWorld==='function') gg.enterWorld(true,{startGrid:true,selectedVehicle:state.selected});
       }catch(e){ console.error('CITY DRIVE delayed start error',e); }
       window.removeEventListener('citydrive:game-ready',retry);
     };
     window.addEventListener('citydrive:game-ready',retry,{once:true});
     el.remove();
     return;
   }
   try{
     // Use the game's authoritative vehicle-selection API. This correctly
     // activates an already-owned car OR purchases/activates a new selection.
     if(typeof g.driveSelectedVehicle==='function'){
       g._pendingVehicleColor = state.selectedColor;
       if(!g.driveSelectedVehicle({id:state.selected})) {
         if(g.ui && typeof g.ui.toast==='function') g.ui.toast('This vehicle is not available yet. Complete the required level or check your cash.');
         return;
       }
     } else {
       var v=g.state?.garage?.vehicles?.find(function(x){return x.id===state.selected;});
       if(v){ g.state.activeVehicleUid=v.vehicleUid; g.state.activeVehicleId=v.id; if(typeof g.persist==='function') g.persist(); }
       if(typeof g.enterWorld==='function') g.enterWorld(true,{startGrid:true,selectedVehicle:state.selected});
     }
   }catch(e){ console.error('CITY DRIVE start error',e); return; }
   el.remove();
   window.dispatchEvent(new CustomEvent("citydrive:level1start",{detail:{vehicleId:state.selected}}));
 };
 el.querySelector("#wowBack").onclick=function(){
   el.remove();
   var mm=document.getElementById('main-menu');
   var gc=document.getElementById('game-container');
   if(mm) mm.classList.add('hidden');
   if(gc) gc.classList.add('hidden');
   open();
 };
}

function open(){
 css();
 var old=document.getElementById("cityWowMenu"); if(old) old.remove();
 var el=document.createElement("div"); el.id="cityWowMenu";
 el.innerHTML=`<div class="front-shell">
   <div class="front-noise"></div>
   <div class="front-top"><div class="front-brand">ETHAN DIGITAL ACADEMY</div><div class="front-live"><i></i> PRESENTS</div></div>
   <div class="front-copy">
     <div class="front-kicker">ETHAN DIGITAL ACADEMY PRESENTS</div>
     <h1>CITY<br><em>DRIVE</em></h1>
     <p>YOUR CITY. YOUR RIDE. YOUR STORY.</p>
     <div class="front-rule"></div>
     <div class="front-actions"><button id="frontStart">START CITY DRIVE</button><button id="frontContinue">CONTINUE</button></div>
     <small>OPEN WORLD • 20 CAMPAIGN LEVELS • RACES • JOBS</small>
   </div>
   <div class="front-car" aria-hidden="true">
     <div class="car-shadow"></div>
     <img class="front-gwagon-photo" src="assets/gwagon-emerald.png" alt="Mercedes-Benz G-Wagon"/>
   </div>
   <div class="front-footer"><span>NOVA CITY</span><span>ETHAN DIGITAL ACADEMY</span><span>LEARN • BUILD • GROW • LEAD</span></div>
 </div>`;
 document.body.appendChild(el);
 el.querySelector('#frontStart').onclick=function(){ el.remove(); openVehicleSelection(); };
 el.querySelector('#frontContinue').onclick=function(){
   if(!hasSaveSafe()){ if(window.game?.ui?.toast) window.game.ui.toast('No saved game found'); return; }
   var g=window.game||window.cityDriveGame;
   if(!g && window.dispatchEvent) { window.dispatchEvent(new CustomEvent('citydrive:game-ready')); g=window.game||window.cityDriveGame; }
   try{ if(g&&typeof g.continueGame==='function'){ g.continueGame(); g.enterWorld(true,{startGrid:true}); el.remove(); } }catch(e){console.error('CITY DRIVE continue error',e);}
 };
}
function hasSaveSafe(){ try{return localStorage.getItem('cityDriveSave')||localStorage.getItem('cityDrive_save')||localStorage.getItem('cityDriveState') ? true : false;}catch(e){return false;} }

window.CityDriveWowMenu={open:open};
})();
