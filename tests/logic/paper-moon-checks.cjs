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
 check('moon beam has one advancing crescent, with no repeated moon icons',()=>{
  const {game,drawCalls,vectorCalls}=createHarness(123,true);game.begin();const g=game.g,p=g.player;
  g.weapons.moon={lv:1,up:[0,0,0],break:false,evo:null,clock:0};
  let previous=-Infinity;
  for(const progress of [0,.2,.4,.6,.8]){
   g.effects=[{kind:'beam',x:p.x,y:p.y,ex:p.x+10,ey:p.y,width:.87,life:.44*(1-progress),max:.44}];
   drawCalls.length=0;vectorCalls.length=0;game.drawEffects();
   assert.equal(drawCalls.filter(call=>call.src===game.ASSET_DATA.ui_moon).length,0);
   const curves=vectorCalls.filter(call=>call.kind==='quadraticCurveTo');assert.equal(curves.length,3);
   const head=curves[0].args[0];assert(head>=previous);previous=head;
   assert(curves.every(call=>call.args.every(Number.isFinite)));
  }
 });
 check('moon stays fully visible after .20 seconds while damage, width and reach are unchanged',()=>{
  const {game,vectorCalls}=createHarness(123,true);game.begin();const g=game.g,p=g.player;p.crit=0;
  g.weapons.moon={lv:1,up:[0,0,0],break:false,evo:null,clock:0};
  const inside=game.spawn('green',{x:p.x+4,y:p.y+.8}),outside=game.spawn('green',{x:p.x+4,y:p.y+1.1}),far=game.spawn('green',{x:p.x+14.6,y:p.y});
  for(const e of [inside,outside,far])e.hp=e.maxHp=10000;
  game.beam(p.x,p.y,0,14,.87,108,'moon',1);
  assert.equal(inside.hp,9892);assert.equal(outside.hp,10000);assert.equal(far.hp,10000);
  const fx=g.effects.find(e=>e.kind==='beam');assert.equal(fx.max,.44);assert.equal(fx.width,.87);
  g.effects=[{...fx,life:.24}];vectorCalls.length=0;game.drawEffects();
  assert.equal(vectorCalls.find(call=>call.kind==='fill').alpha,1);
  assert.equal(game.cooldown('moon'),1.58);
 });
 const failures=results.filter(r=>!r.pass);return {passed:results.length-failures.length,total:results.length,failures,detail:'48 plane cases, single visible moon wave, unchanged moon damage and hit area'};
};
