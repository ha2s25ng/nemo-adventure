'use strict';
const assert=require('node:assert/strict');
const {createHarness}=require('./harness.cjs');
module.exports=()=>{
 const results=[],check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 function setup(){const {game}=createHarness();game.begin();return game;}
 check('gameplay timer survives visual truncation and executes once',()=>{
  const game=setup(),g=game.g;let calls=0;game.schedule(.5,()=>calls++);
  g.effects=Array.from({length:1200},()=>({kind:'spark',life:3}));game.updateWorldEffects(.1);
  assert.equal(g.effects.length,100);assert.equal(calls,0);assert.equal(g.scheduledEvents.length,1);
  game.updateWorldEffects(.4);assert.equal(calls,1);game.updateWorldEffects(1);assert.equal(calls,1);
 });
 check('pause freezes gameplay timers until resume',()=>{
  const game=setup();let calls=0;game.schedule(.5,()=>calls++);game.pause();
  game.updateWorldEffects(10);assert.equal(calls,0);assert.equal(game.g.scheduledEvents[0].life,.5);
  game.resume();game.updateWorldEffects(.5);assert.equal(calls,1);
 });
 check('time seal freezes hostile timers while player attacks keep resolving',()=>{
  const game=setup();let player=0,hostile=0;game.g.timeSealUntil=game.g.worldClock+5;
  game.schedule(.5,()=>player++);game.schedule(.5,()=>hostile++,true);game.updateWorldEffects(.6);
  assert.equal(player,1);assert.equal(hostile,0);assert.equal(game.g.scheduledEvents[0].life,.5);
  game.g.worldClock+=5.1;game.updateWorldEffects(.5);assert.equal(hostile,1);
 });
 check('new runs discard all previous-run callbacks',()=>{
  const game=setup();let calls=0;game.schedule(.5,()=>calls++);game.begin();
  assert.equal(game.g.scheduledEvents.length,0);game.updateWorldEffects(1);assert.equal(calls,0);
 });
 check('callbacks scheduled by callbacks resolve on the next tick',()=>{
  const game=setup(),calls=[];game.schedule(0,()=>{calls.push('first');game.schedule(0,()=>calls.push('second'));});
  game.updateWorldEffects(.1);assert.deepEqual(calls,['first']);game.updateWorldEffects(.1);assert.deepEqual(calls,['first','second']);
 });
 check('reset inside a callback cannot run remaining callbacks against the new run',()=>{
  const game=setup(),calls=[];game.schedule(0,()=>{game.begin();game.schedule(.2,()=>calls.push('new'));});game.schedule(0,()=>calls.push('old'));
  game.updateWorldEffects(.1);assert.deepEqual(calls,[]);game.updateWorldEffects(.2);assert.deepEqual(calls,['new']);
 });
 check('callbacks due after a pause callback remain pending, not lost',()=>{
  const game=setup();let calls=0;game.schedule(0,()=>game.pause());game.schedule(0,()=>calls++);
  game.updateWorldEffects(.1);assert.equal(calls,0);assert.equal(game.g.scheduledEvents.length,1);
  game.resume();game.updateWorldEffects(.1);assert.equal(calls,1);
 });
 check('real delayed meteor damage survives cosmetic overload',()=>{
  const game=setup(),g=game.g,p=g.player;p.crit=0;
  g.weapons.comet={lv:1,up:[0,0,0],break:false,evo:null};
  const e=game.spawn('armor',{x:p.x+3,y:p.y});e.hp=e.maxHp=10000;
  assert(game.fireWeapon('comet'));assert(g.scheduledEvents.length>0);
  for(let i=0;i<1200;i++)g.effects.push({kind:'spark',life:3});game.updateWorldEffects(.1);assert.equal(e.hp,10000);
  game.updateWorldEffects(.5);assert(e.hp<10000);const hp=e.hp;game.updateWorldEffects(1);assert.equal(e.hp,hp);
 });
 const failures=results.filter(r=>!r.pass);return {total:results.length,passed:results.length-failures.length,failures,detail:'visual-overload safety, pause/time-stop, run reset, nested callbacks and real meteor damage'};
};
