/* CITY DRIVE PERFORMANCE / LAG GUARD */
(function(){
"use strict";
var P=window.CityDrivePerformance={
  maxDelta:0.033,
  quality:"auto",
  frameSamples:[],
  lowFpsMs:0,
  stableMs:0,
  lastAdjust:0
};
P.clampDelta=function(dt){
  if(!Number.isFinite(dt)||dt<0) return 0.016;
  return Math.min(P.maxDelta,dt);
};
P.observe=function(dt){
  dt=P.clampDelta(dt);
  var ms=dt*1000;
  P.frameSamples.push(ms);
  if(P.frameSamples.length>30) P.frameSamples.shift();
  var sum=0;
  for(var i=0;i<P.frameSamples.length;i++) sum+=P.frameSamples[i];
  var avg=sum/P.frameSamples.length;
  if(avg>30){P.lowFpsMs+=ms;P.stableMs=0;}
  else if(avg<19){P.stableMs+=ms;P.lowFpsMs=0;}
  else {P.lowFpsMs=0;P.stableMs=0;}
  return avg;
};
P.apply=function(renderer){
  if(!renderer||P.lastAdjust>Date.now()-2500) return;
  if(P.lowFpsMs>1800 && P.quality!=="low"){
    P.quality="low"; P.lastAdjust=Date.now();
    try{renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1));}catch(e){}
  } else if(P.stableMs>5000 && P.quality==="low"){
    P.quality="auto"; P.lastAdjust=Date.now();
    try{renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));}catch(e){}
  }
};
})();
