'use strict';
const assert=require('node:assert/strict');
const {createHarness}=require('./harness.cjs');
module.exports=function(){
 const results=[],check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 check('paper planes point along velocity in eight directions and fit their contact radius',()=>{
  for(const reduced of [false,true])for(const evo of [null,0,1])for(let i=0;i<8;i++){
   const {game,drawCalls,vectorCalls}=createHarness(123,true,reduced);game.begin();
   game.g.weapons.book={lv:7,up:[1,2,1],break:true,evo,clock:0};
   const angle=i*Math.PI/4,r=.23,p=game.g.player;
   game.drawProjectile({kind:'fairy',weapon:'book',x:p.x,y:p.y,vx:Math.cos(angle)*9,vy:Math.sin(angle)*9,r,trail:[]});
   assert(!drawCalls.some(call=>call.src===game.ASSET_DATA.ui_book),'a flying book must never return');
   const turn=vectorCalls.find(call=>call.kind==='rotate');
   assert(turn);assert(Math.abs(Math.sin(turn.args[0]-angle))<1e-9);
   const points=vectorCalls.filter(call=>['moveTo','lineTo'].includes(call.kind));
   assert(points.length>=7);
   for(const point of points)assert(Math.hypot(...point.args)<=r+1e-9,'plane protrudes beyond contact radius');
  }
 });
 check('rare familiar is a gold paper plane facing its travel direction',()=>{
  const {game,drawCalls,vectorCalls}=createHarness(123,true);game.begin();const g=game.g,p=g.player;
  g.weapons.book={lv:7,up:[1,2,1],break:true,evo:1,clock:0};
  g.bookFamiliar={x:p.x,y:p.y,target:null,lastHit:null,wait:0};
  game.spawn('armor',{x:p.x+3,y:p.y-2});game.updateBookFamiliar(.016);
  assert(Math.abs(g.bookFamiliar.artAngle-Math.atan2(-2,3))<1e-9);
  drawCalls.length=0;vectorCalls.length=0;game.drawBookFamiliar();
  assert(!drawCalls.some(call=>call.src===game.ASSET_DATA.ui_book));
  assert.equal(vectorCalls.find(call=>call.kind==='rotate').args[0],g.bookFamiliar.artAngle);
 });
 check('frisbee shows its complete round mint face in all directions and reduced motion',()=>{
  for(const reduced of [false,true])for(let i=0;i<8;i++){
   const {game,drawCalls,vectorCalls}=createHarness(123,true,reduced);game.begin();const p=game.g.player;
   game.beam(p.x,p.y,i*Math.PI/4,14,.87,108,'moon',1);
   const s=game.g.shots[0];game.g.worldClock=.25;game.drawProjectile(s);
   const art=drawCalls.find(c=>c.src===game.ASSET_DATA.spell_moon);assert(art);
   assert.notEqual(art.src,game.ASSET_DATA.cannonProjectile);
   assert.equal(art.args[2],art.args[3],'disc face must stay round, never squash into a half-disc');
   assert.equal(art.args[2],s.longR*2);assert.equal(art.args[3],s.r*2);
   assert.equal(vectorCalls.find(c=>c.kind==='rotate').args[0],Math.atan2(s.vy,s.vx)+(reduced?0:1.75));
   assert(!game.g.effects.some(e=>e.kind==='beam'));
  }
 });
 function setup(back=false){
  const {game}=createHarness(123);game.begin();const g=game.g,p=g.player;p.crit=0;
  g.weapons.moon={lv:1,up:[0,0,0],break:back,evo:null,clock:0};
  return {game,g,p,enemy:(dx,dy=0)=>{const e=game.spawn('green',{x:p.x+dx,y:p.y+dy});e.hp=e.maxHp=10000;return e;}};
 }
 check('frisbee deals no instant damage, then pierces each touched enemy once',()=>{
  const {game,g,p,enemy}=setup();const near=enemy(4,.8),next=enemy(7),miss=enemy(4,1.1),far=enemy(16);
  game.beam(p.x,p.y,0,14,.87,108,'moon',1);
  assert.equal(near.hp,10000);assert.equal(next.hp,10000);
  game.updateShots(.20,false);assert.equal(near.hp,10000);assert.equal(next.hp,10000);
  for(let frame=0;frame<20;frame++)game.updateShots(.10,false);
  assert.equal(near.hp,9892);assert.equal(next.hp,9892);assert.equal(miss.hp,10000);assert.equal(far.hp,10000);
  assert.equal(g.shots.length,0);assert.equal(game.cooldown('moon'),1.58);
 });
 check('frisbee sweep cannot skip targets during a large movement step',()=>{
  const {game,p,enemy}=setup();const e=enemy(3);
  game.beam(p.x,p.y,0,14,.87,108,'moon',1);game.updateShots(.9,false);
  assert.equal(e.hp,9892);game.updateShots(.1,false);assert.equal(e.hp,9892);
 });
 check('return starts at range end and hits once for half damage on a fixed line',()=>{
  const {game,g,p,enemy}=setup(true);const e=enemy(4);const start={x:p.x,y:p.y};
  game.beam(p.x,p.y,0,14,.87,108,'moon',1);
  assert.equal(g.shots[0].speed,12.5);
  for(let i=0;i<11;i++)game.updateShots(.1,false);
  assert.equal(e.hp,9892);assert.equal(g.shots[0].returning,false);
  game.updateShots(.1,false);assert.equal(g.shots[0].returning,true);
  assert(Math.abs(g.shots[0].x-start.x-14)<1e-9);p.y+=5;
  for(let i=0;i<12;i++)game.updateShots(.1,false);
  assert.equal(e.hp,9838);assert.equal(g.shots.length,0);
 });
 check('both evolution variants retain their damage, widths and firing cadence',()=>{
  for(const evo of [0,1]){
   const {game,g,enemy}=setup();g.weapons.moon.evo=evo;enemy(5);game.fireWeapon('moon');
   assert.equal(g.shots.length,evo===0?2:1);
   for(const s of g.shots){assert(Math.abs(s.damage-108*(evo===0?.65:1.6))<1e-8);assert.equal(s.r,.435*(evo===1?1.5:1));}
   assert.equal(game.cooldown('moon'),1.58*(evo===1?1.2:1));
  }
 });
 const failures=results.filter(r=>!r.pass);return {passed:results.length-failures.length,total:results.length,failures,detail:'48 plane cases, 16 frisbee directions, swept piercing, delayed impact, return pass and evolution balance'};
};
