'use strict';
const assert=require('node:assert/strict');
const {createHarness}=require('./harness.cjs');
module.exports=function(){
 const results=[],check=(name,fn)=>{try{fn(createHarness().game);results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 check('cannon chooses nearest enemy over a distant crowd or boss',game=>{
  game.saved.gold=2000;game.selectCharacter('dori');game.begin();
  const g=game.g,p=g.player;
  const near=game.spawn('green',{x:p.x+2,y:p.y+1});
  for(let i=0;i<5;i++)game.spawn('green',{x:p.x-5,y:p.y+i*.1});
  g.boss=g.enemies[1];
  game.spawn('green',{x:p.x+.3,y:p.y}).dead=true;
  game.spawn('green',{x:p.x+.5,y:p.y}).retreat=10;
  assert(game.fireWeapon('cannon'));const shot=g.shots[0];
  const aim=Math.atan2(near.y-shot.y,near.x-shot.x);
  assert(Math.abs(Math.atan2(shot.vy,shot.vx)-aim)<1e-9);
 });
 check('vortex retains damage and slow but never displaces enemies in either mode or evolution',game=>{
  for(const stage of [0,1])for(const evo of [null,0,1]){
   game.menu();game.begin(stage);const g=game.g,p=g.player;
   g.weapons.vortex={lv:7,up:[1,1,1],break:true,evo,clock:0};
   const e=game.spawn('green',{x:p.x+2.3,y:p.y});e.hp=e.maxHp=10000;
   const before=[e.x,e.y,e.pushTime,e.pushX,e.pushY];
   game.updateVortex(.1);
   assert(e.hp<10000);assert.deepEqual([e.x,e.y,e.pushTime,e.pushX,e.pushY],before);
   assert(e.slowAmount>0&&e.slowUntil>g.worldClock,'slow retained');
  }
 });
 check('webcap waits, fires from its body toward locked aim, and has no ground damage',game=>{
  game.begin();const g=game.g,p=g.player;
  const e=game.spawn('webcap',{x:p.x+5,y:p.y});e.patternTimer=0;
  game.updateEndlessMonster(e,0);assert.equal(e.attackState.type,'endless-warn');
  assert(e.attackState.t>=.8);const aim=e.attackState.aim;
  game.updateMonster(e,.4);assert.equal(g.enemyShots.length,0);
  p.y+=2;game.updateMonster(e,.5);
  assert.equal(g.enemyShots.length,3);const central=g.enemyShots[1];
  assert(Math.abs(Math.atan2(central.vy,central.vx)-aim)<1e-9);
  assert.equal(central.sourceId,e.id);assert.equal(central.x,e.x);assert.equal(central.y,e.y);
  assert(!g.sporePatches);assert.equal(p.hp,p.maxHp);
 });
 check('webcap cancels point-blank fire',game=>{
  game.begin();const g=game.g,p=g.player;
  const e=game.spawn('webcap',{x:p.x+1,y:p.y});e.patternTimer=0;
  game.updateEndlessMonster(e,0);assert(!e.attackState);
  game.castEndlessAttack(e,{aim:Math.PI});assert.equal(g.enemyShots.length,0);
 });
 check('kelp and beetle fire travelling bolts after wind-up, never ground pools',game=>{
  for(const [kind,count] of [['kelp-spirit',3],['ember-beetle',6]]){
   game.menu();game.begin(1);const g=game.g,p=g.player;
   const e=game.spawn(kind,{x:p.x+3.5,y:p.y});e.patternTimer=0;
   game.updateCampaignMonster(e,0);assert.equal(e.attackState.type,'campaign-warn');
   assert.equal(e.attackState.circles.length,0);
   game.updateCampaignMonster(e,.4);assert.equal(g.enemyShots.length,0);
   game.updateCampaignMonster(e,.7);assert.equal(g.enemyShots.length,count);
   assert(!g.campaignMonsterHazards);assert.equal(p.hp,p.maxHp);
  }
 });
 check('hare lands without a damage field and emits shards only at safe range',game=>{
  for(const dist of [1,4]){
   game.menu();game.begin(1);const g=game.g,p=g.player;
   const e=game.spawn('frost-hare',{x:p.x+dist,y:p.y});
   e.attackState={type:'campaign-leap',t:0,left:0,travel:1,speed:10.7,aim:Math.PI};
   game.updateCampaignMonster(e,0);
   assert(!g.campaignMonsterHazards);assert.equal(g.enemyShots.length,dist<2.4?0:3);
   assert.equal(p.hp,p.maxHp);
  }
 });
 check('battle rendering has no stale removed hazard callbacks',game=>{
  for(const stage of [0,1]){game.menu();game.begin(stage);game.drawBattle();}
 });
 check('cute orbit preserves contact radius and .36 second per-enemy cooldown',game=>{
  game.begin();const g=game.g,p=g.player;p.crit=0;
  const w=g.weapons.orbit={lv:1,up:[0,0,0],evo:null,break:false,angle:0};
  const pos=game.orbitPosition(p,w,0,2,game.W.orbit.range);
  const near=game.spawn('green',{x:pos.x+.48+.27,y:pos.y});near.hp=near.maxHp=10000;
  const far=game.spawn('green',{x:pos.x+.48+.29,y:pos.y});far.hp=far.maxHp=10000;
  game.updateOrbit(0);assert(near.hp<10000);assert.equal(far.hp,10000);assert(w.popUntil[0]>0);
  const damage=10000-near.hp;g.worldClock=.35;game.updateOrbit(0);assert.equal(10000-near.hp,damage);
  g.worldClock=.36;game.updateOrbit(0);assert(Math.abs(10000-near.hp-damage*2)<1e-6);
 });
 check('orbit evolutions and matching effects render; guardian retains .8 second block cooldown',game=>{
  for(const evo of [null,0,1]){
   game.menu();game.begin();const g=game.g,p=g.player;
   g.weapons.orbit={lv:7,up:[2,2,2],evo,break:true,angle:0};
   game.updateOrbit(.016);game.drawBattle();
   if(evo===1){
    g.enemyShots=[{x:p.x+.8,y:p.y,dead:false},{x:p.x+.9,y:p.y,dead:false}];
    game.updateOrbit(0);assert.equal(g.enemyShots.filter(b=>b.dead).length,1);
    assert(g.effects.some(e=>e.kind==='orbitBlock'));game.drawBattle();
    game.updateOrbit(.79);assert.equal(g.enemyShots.filter(b=>b.dead).length,1);
    game.updateOrbit(.02);assert.equal(g.enemyShots.filter(b=>b.dead).length,2);
   }
   for(const life of [.47,.23,.01]){
    g.effects=[{kind:'rareBloom',palette:'orbit',x:p.x+2,y:p.y,r:1.5,life,max:.47},
     {kind:'spellContact',spell:'orbit',x:p.x+1,y:p.y,life:Math.min(.23,life),max:.23}];
    game.drawBattle();
   }
  }
 });
 const failures=results.filter(r=>!r.pass);
 return {passed:results.length-failures.length,total:results.length,failures,detail:'nearest target, no pull, visible wind-up, locked aim, no monster floor hazards'};
};
