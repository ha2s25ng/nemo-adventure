'use strict';
const assert=require('node:assert/strict'),{createHarness}=require('./harness.cjs');
module.exports=()=>{
 const results=[],check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 function setup(id,awake=false){
  const h=createHarness(0x51224);const {game}=h;
  if(id==='cannon'){game.saved.gold=2000;game.selectCharacter('dori');}game.begin();const g=game.g,p=g.player;
  g.map={landmarks:[]};g.treeDecor=[];p.x=p.y=80;p.crit=-1;p.invuln=1e9;
  g.weapons={[id]:{lv:1,up:[0,0,0],break:false,evo:null,clock:0}};g.passives={};g.cardReason='level';g.bossEncounters=0;
  for(let i=1;i<7;i++){assert(game.hasGrowth(id),id);const card=game.makeGrowth(id);assert.equal(card.type,'growth');g.cards=[card];game.setScreen('cards');game.selectCard(0);}
  const recipe=game.AWAKENING_RECIPES.find(r=>r.weapon===id);assert(recipe,id);
  const awaken=()=>{g.passives[recipe.passive]=5;g.cards=game.rollCards(null);assert.equal(g.cards[0].id,recipe.id);game.setScreen('cards');game.selectCard(0);};
  if(awake)awaken();
  const enemy=(dx,dy=0,boss=false)=>{const e=game.spawn('armor',{x:p.x+dx,y:p.y+dy});e.hp=e.maxHp=1e6;e.isBoss=boss;if(boss)e.kind='boss';return e;};
  return {...h,g,p,w:g.weapons[id],recipe,awaken,enemy};
 }
 check('all fifteen actual recipes require both full ranks, reserve slot one, and persist only after choice',()=>{
  const first=createHarness().game;assert.equal(first.AWAKENING_RECIPES.length,15);assert.equal(new Set(first.AWAKENING_RECIPES.map(r=>r.weapon)).size,15);
  for(const id of Object.keys(first.W)){
   const {game,g,w,recipe,element}=setup(id);w.lv=6;g.passives[recipe.passive]=5;assert(!game.rollCards(null).some(c=>c.type==='awakening'),id);
   w.lv=7;g.passives[recipe.passive]=4;assert(!game.rollCards(null).some(c=>c.type==='awakening'),id);
   g.passives[recipe.passive]=5;
   for(let n=0;n<5;n++){g.cards=game.rollCards(null);assert.equal(g.cards[0].id,recipe.id,id);assert.equal(g.cards[0].type,'awakening');}
   assert(!game.saved.awakeningDiscoveries.includes(recipe.id));game.setCodexCategory('evolutions');assert(!element('codex-details').innerHTML.includes(recipe.summary));
   game.setScreen('cards');game.selectCard(0);assert.equal(w.lv,7);assert.equal(w.awakened,recipe.id);assert(game.readSave().awakeningDiscoveries.includes(recipe.id));
   assert(!game.rollCards(null).some(c=>c.type==='awakening'),id);
  }
 });
 check('legacy rare cards never roll or activate',()=>{
  const {game,g}=setup('orbit');for(let i=0;i<100;i++)assert.equal(game.rollRareCard(),null);
  g.cards=[{type:'rare',id:'orbitBloom',name:'legacy'}];game.setScreen('cards');game.selectCard(0);assert.equal(g.rareCard,null);
 });
 check('projectile awakenings attach bounded extra mechanics to actual fired shots',()=>{
  for(const id of ['star','cannon','moon','book','feather']){
   const {game,g,p,w,enemy}=setup(id,true);const a=enemy(3),b=enemy(5,1);game.fireWeapon(id);assert(g.shots.length,id);
   if(id==='star'){assert.equal(g.shots.length,4);assert(g.shots.every(s=>s.chains===1));}
   if(id==='cannon')assert(g.shots.every(s=>s.bounces===1));
   if(id==='moon')assert(g.shots.every(s=>s.returnAllowed));
   if(id==='book')assert(g.shots.every(s=>s.chains===1));
   if(id==='feather'){
    const s=g.shots[0];s.x=a.x;s.y=a.y;s.life=0;s.hit=new Set([a.id]);s.vx=1;s.vy=0;g.shots=[s];game.updateShots(.001,false);
    assert(s.returning);assert.equal(s.returnTarget,b.id);assert(!s.returnTarget||s.returnTarget!==a.id);
   }
  }
 });
 check('orbit blooms after repeated contact and cannot bloom again inside its cooldown',()=>{
  const {game,g,w,enemy}=setup('orbit',true),e=enemy(0);e.r=5;
  for(let i=0;i<3;i++){g.worldClock+=.4;game.updateOrbit(.001);}
  assert(g.effects.some(e=>e.kind==='rareBloom'));const ready=w.bloomReadyAt;
  g.effects=[];g.worldClock+=.4;game.updateOrbit(.001);assert(!g.effects.some(e=>e.kind==='rareBloom'));assert.equal(w.bloomReadyAt,ready);
 });
 check('cloud chains to other enemies, ribbon echoes behind, comet leaves embers',()=>{
  {const {game,enemy}=setup('cloud',true);enemy(2);const other=enemy(3),third=enemy(4);game.fireWeapon('cloud');assert(other.hp<1e6);assert(third.hp<1e6);}
  {const {game,g,enemy}=setup('ribbon',true);enemy(2);const behind=enemy(-2);game.fireWeapon('ribbon');assert.equal(behind.hp,1e6);g.worldClock+=.23;game.updateScheduledEvents(.23);assert(behind.hp<1e6);}
  {const {game,g,enemy}=setup('comet',true);enemy(2);game.fireWeapon('comet');g.worldClock+=1;game.updateScheduledEvents(1);assert(g.zones.some(z=>z.kind==='comet'&&z.weapon==='comet'));}
 });
 check('bloom petals heal at most once per four seconds and consume the picked petal',()=>{
  const {game,g,p,enemy}=setup('bloom',true);enemy(1);p.hp=50;game.fireWeapon('bloom');const z=g.zones[0];assert(z.petal);p.x=z.x;p.y=z.y;game.updateZones(.01);assert.equal(p.hp,52);assert.equal(z.petal,false);
  g.zones.push({...z,id:g.n++,remain:2,petal:true});game.updateZones(.01);assert.equal(p.hp,52);
 });
 check('bell rings without targets; base has no clear or knock, awakening clears nearest two and never knocks bosses',()=>{
  const {game,g,p,w,enemy,awaken}=setup('bell');assert.equal(game.fireWeapon('bell'),true);const cooldown=game.cooldown('bell'),radius=game.weaponReach('bell');
  const mob=enemy(1),boss=enemy(1,1,true);g.enemyShots=[1,1.5,2,8].map((x,i)=>({id:i,x:p.x+x,y:p.y,r:.1,dead:false}));
  game.ringBell(p,w,game.W.bell);assert(g.enemyShots.every(b=>!b.dead));assert.equal(mob.pushTime,undefined);assert.equal(boss.pushTime,undefined);assert.equal(mob.slowAmount,0);
  awaken();assert.equal(game.cooldown('bell'),cooldown);assert.equal(game.weaponReach('bell'),radius);game.ringBell(p,w,game.W.bell);
  assert.equal(g.enemyShots.filter(b=>b.dead).length,2);assert(g.enemyShots[0].dead&&g.enemyShots[1].dead);assert(!g.enemyShots[2].dead&&!g.enemyShots[3].dead);assert(mob.pushTime>0);assert.equal(boss.pushTime,undefined);
 });
 check('split bubbles are staged, armed, exclude parent victims, share hits and never split recursively',()=>{
  const {game,g,p,enemy}=setup('bubble',true);const parentVictim=enemy(0),a=enemy(4),b=enemy(5,1);
  const parent={x:p.x,y:p.y,damage:100,dead:false};game.explodeBubble(parent);assert(parent.dead);assert.equal(g.shots.length,0);assert.equal(g.pendingShots.length,2);
  const children=g.pendingShots.slice();assert(children.every(s=>s.small&&s.armed===.12&&s.hit.has(parentVictim.id)&&s.target!==parentVictim.id));assert.equal(children[0].sharedHits,children[1].sharedHits);
  game.updateShots(.001,false);assert.equal(g.pendingShots.length,0);assert.equal(g.shots.length,2);const hp=parentVictim.hp;
  game.updateShots(.01,false);assert.equal(parentVictim.hp,hp);
  children[0].x=children[1].x=a.x;children[0].y=children[1].y=a.y;
  game.explodeBubble(children[0]);assert(a.hp<1e6);const afterFirst=a.hp;game.explodeBubble(children[1]);assert.equal(a.hp,afterFirst);assert.equal(g.pendingShots.length,0);
  assert(children[0].sharedHits.has(parentVictim.id));
 });
 check('flower trail needs walking, keeps at most three live patches, and overlapping patches do not stack',()=>{
  const {game,g,p,enemy}=setup('seed',true);assert.equal(game.fireWeapon('seed'),false);game.updateFlowerTrail(.5);assert.equal(g.zones.length,0);p.moving=true;
  for(let i=0;i<10;i++){p.x+=1;g.worldClock+=.5;game.updateFlowerTrail(.5);game.updateZones(.01);assert(g.zones.filter(z=>z.kind==='flowerTrail'&&z.remain>0).length<=3);}
  p.moving=false;g.zones=[];const e=enemy(0);const patch={kind:'flowerTrail',weapon:'seed',x:p.x,y:p.y,r:1,remain:2,next:0,damage:100};g.zones=[{...patch,id:1},{...patch,id:2},{...patch,id:3}];g.worldClock+=1;game.updateZones(.01);assert.equal(e.hp,999900);
 });
 check('frost freezes ordinary enemies after three hits, with immunity, but never freezes bosses',()=>{
  for(const boss of [false,true]){
   const {game,g,p,enemy}=setup('frost',true),e=enemy(1,0,boss);
   const hit=()=>{g.shots=[{kind:'frost',weapon:'frost',x:e.x,y:e.y,vx:0,vy:0,r:.2,life:1,damage:1,chains:0,hit:new Set(),trail:[],dead:false}];game.updateShots(.001,false);};
   hit();hit();assert(!e.frozenUntil);hit();
   if(boss){assert(!e.frozenUntil);assert(game.statusReady(e)>0);assert(e.slowAmount<=.2);}
   else {assert(Math.abs(e.frozenUntil-g.worldClock-.45)<1e-9);assert.equal(game.statusReady(e),0);const original=e.frozenUntil;hit();hit();hit();assert.equal(e.frozenUntil,original);}
  }
 });
 check('awakened vortex expands cyclically without gaining a permanent full-size radius',()=>{
  const {game,g,p,enemy}=setup('vortex',true);const base=game.weaponReach('vortex');const e=enemy(base*1.25);e.r=.01;
  g.worldClock=0;game.updateVortex(.01);assert.equal(e.hp,1e6);g.worldClock=.75;g.weapons.vortex.vortexTick=0;game.updateVortex(.01);assert(e.hp<1e6);
 });
 const failures=results.filter(r=>!r.pass);return {passed:results.length-failures.length,total:results.length,failures,detail:'15 recipes; level/passive gates; saved discovery; all mechanics; bell defense caps; staged bubbles; flower overlap; boss freeze immunity'};
};
