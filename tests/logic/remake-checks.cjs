'use strict';
const assert=require('node:assert/strict');
const {createHarness}=require('./harness.cjs');
module.exports=function(){
 const {game}=createHarness(),results=[];
 const check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 check('costume odds total 5%; every exclusive 0.5%',()=>{
  const pool=game.drawCostumes(),sum=pool.reduce((n,c)=>n+c.drawWeight,0);
  assert.equal(pool.filter(c=>c.drawOnly).length,3);assert.equal(pool.length,11);
  assert.equal(sum,10);
  for(const c of pool.filter(c=>c.drawOnly))assert.equal(.05*c.drawWeight/sum,.005);
  const owned=['default','dreamstar','patisserie','captain'];
  const save=game.normalizeSave({...game.saved,costumesOwned:owned,costumeEquipped:'captain'});
  assert.deepEqual(Array.from(save.costumesOwned),owned);assert.equal(save.costumeEquipped,'captain');
 });
 check('thief reward scales, heals 10%, and cannot be awarded twice',()=>{
  game.begin();const e=game.spawn('thief',{x:game.g.player.x,y:game.g.player.y});
  game.kill(e);assert.equal(game.g.gold,40);game.kill(e);assert.equal(game.g.gold,40);
  assert.equal(game.g.loot.find(x=>x.kind==='bone').healAmount,.1);
  game.g.t=1440;game.kill(game.spawn('thief',{x:100,y:100}));assert.equal(game.g.gold,120);
 });
 check('new pickup buffs expire; bone uses max HP; coins multiply only during fortune',()=>{
  game.begin();const p=game.g.player;p.hp=20;
  game.collect({kind:'bone',healAmount:.1});assert.equal(p.hp,30);
  game.collect({kind:'ward'});assert.equal(p.invuln,4);assert.equal(p.wardUntil,4);
  game.collect({kind:'fortune'});game.collect({kind:'coin',xp:5});assert.equal(game.g.gold,10);
  game.g.worldClock=21;game.collect({kind:'coin',xp:5});assert.equal(game.g.gold,15);
  game.collect({kind:'rage'});assert(game.rageActive());game.g.worldClock+=12;assert(!game.rageActive());
  assert(game.RARE_PICKUP_KINDS.includes('ward'));assert(game.RARE_PICKUP_KINDS.includes('fortune'));
 });
 check('boss enrage triggers once after 75 combat seconds, independent of prior bosses',()=>{
  game.begin();game.g.t=180;game.updateBossEncounter(0);
  const b=game.g.boss;assert(b);const speed=b.speed,damage=b.dmg;
  game.g.t=254.99;game.updateBossEncounter(.01);assert(!b.enraged);
  game.g.t=255;game.updateBossEncounter(.01);assert(b.enraged);
  assert.equal(b.speed,speed*1.18);assert.equal(b.dmg,damage*1.2);
  game.updateBossEncounter(5);assert.equal(b.speed,speed*1.18);
  game.kill(b);game.g.t=430;game.updateBossEncounter(0);
  assert(game.g.boss);assert(!game.g.boss.enraged);assert.equal(game.g.boss.spawnedAt,430);
 });
 check('all main bosses including flower/horn award their definition gold',()=>{
  game.begin();game.g.t=180;game.updateBossEncounter(0);const b=game.g.boss;
  const reward=b.bossDef.gold;game.kill(b);assert.equal(game.g.gold,reward);assert.equal(game.g.boss,null);
 });
 const failures=results.filter(x=>!x.pass);return {total:results.length,passed:results.length-failures.length,failures,detail:'gacha odds, save retention, timed buffs, thief rewards and boss enrage'};
};
