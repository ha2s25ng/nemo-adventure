'use strict';
const assert=require('node:assert/strict');const {createHarness}=require('./harness.cjs');
module.exports=function(){
 const results=[],check=(name,fn)=>{try{fn(createHarness().game);results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 const caps={magic:.10,quick:.10,lucky:.20,big:.30,cloak:60,shoes:.30,insight:.30,magnet:2,windstep:.15,leafguard:.30,emberheart:.30,honeypouch:.50,coin:.20,claw:.50,courage:.10,jelly:.50};
 check('all 12 cumulative tables reach agreed Lv.5 caps with a larger final step',game=>{
  assert.equal(game.PASSIVE_MAX_LEVEL,5);
  for(const [id,cap] of Object.entries(caps)){
   const values=Array.from(game.PASSIVE_LEVELS[id]);assert.equal(values.length,6);assert.equal(values[0],0);assert.equal(values[5],cap,id);
   for(let i=1;i<=5;i++)assert(values[i]>values[i-1],id);
   assert(values[5]-values[4]>values[4]-values[3],id);
   assert.equal(game.passiveValue(id,99),cap);assert.equal(game.passiveValue(id,-1),0);
  }
 });
 check('each passive can be selected five times, then stale cards cannot add a sixth rank',game=>{
  for(const id of Object.keys(caps)){
   game.menu();game.begin();
   for(let level=1;level<=5;level++){
    const card={type:'passive',id,name:game.DATA.passives[id][0]};
    game.g.cards=[card];game.setScreen('cards');game.selectCard(0);assert.equal(game.g.passives[id],level,id);
   }
   game.g.cards=[{type:'passive',id,name:game.DATA.passives[id][0]}];game.setScreen('cards');game.selectCard(0);assert.equal(game.g.passives[id],5,id);
  }
 });
 check('Lv.4 owned passives stay in the pool when all five slots are full; Lv.5 disappear',game=>{
  game.begin();game.g.passives={magic:4,quick:5,lucky:5,shoes:5,insight:5};
  let seen=false;for(let i=0;i<500;i++)for(const c of game.rollCards(null))if(c.type==='passive'){assert.equal(c.id,'magic');seen=true;}
  assert(seen);game.g.passives.magic=5;
  for(let i=0;i<100;i++)assert(!game.rollCards(null).some(c=>c.type==='passive'));
 });
 check('attack, speed, critical chance, area and low-health bonuses use cumulative amounts',game=>{
  game.begin();const g=game.g,w=g.weapons.star;g.passives={magic:5,quick:5,lucky:5,big:5,emberheart:5,windstep:5};
  assert(Math.abs(game.weaponPower('star',.6,w)-66)<1e-9);
  g.player.hp=50;assert(Math.abs(game.weaponPower('star',.6,w)-84)<1e-9);
  assert(Math.abs(game.cooldown('star',w)-.68/1.1)<1e-9);
  assert.equal(game.wpCrit('star'),.25);assert.equal(game.radiusMult(),1.30);
  assert.equal(game.moveCastRate(),1);g.player.moving=true;assert.equal(game.moveCastRate(),1.15);
 });
 check('cloak reaches exactly +60 and heals only the rank delta; bone restores 24 at full recovery build',game=>{
  game.begin();const g=game.g;g.player.hp=40;
  for(let rank=1;rank<=5;rank++){g.cards=[{type:'passive',id:'cloak',name:'생명의 망토'}];game.setScreen('cards');game.selectCard(0);assert.equal(g.player.maxHp,100+game.passiveValue('cloak',rank));}
  assert.equal(g.player.maxHp,160);assert.equal(g.player.hp,100);
  g.passives.honeypouch=5;g.player.hp=20;game.collect({kind:'bone',healAmount:.10,x:g.player.x,y:g.player.y});assert.equal(g.player.hp,44);
 });
 check('shield reduces projectiles by 30 percent and leaves contact damage unchanged',game=>{
  game.begin();const g=game.g;g.passives.leafguard=5;g.player.hp=g.player.maxHp=1000;
  game.damagePlayer(100,'test bullet',true);assert.equal(g.player.hp,930);
  g.player.invuln=0;game.damagePlayer(100,'test contact',false);assert.equal(g.player.hp,830);
 });
 check('experience bonus is 30 percent, and UI descriptions show rank totals',game=>{
  game.begin();const g=game.g;g.passives.insight=5;game.collect({kind:'xp',xp:10,x:g.player.x,y:g.player.y});assert.equal(g.player.xp,13);
  for(const id of Object.keys(caps)){g.passives[id]=4;assert(!/NaN|undefined/.test(game.passiveOffer(id)));}
  assert(game.passiveOffer('cloak').includes('36 → +60'));assert(game.passiveOffer('magic').includes('6% → +10%'));
 });
 check('passive names are distinct and old misleading names are gone',game=>{
  const names=Object.values(game.DATA.passives).map(row=>row[0]);assert.equal(new Set(names).size,16);
  for(const old of ['별빛 공부','포근한 망토','바람 걸음','꿀풀 주머니','커다란 마법','공격력 증가'])assert(!names.includes(old));
  assert.equal(game.DATA.passives.insight[0],'배움의 책');assert.equal(game.DATA.passives.cloak[0],'생명의 망토');
 });
 check('HUD and pause show five-rank labels for actual owned passives',()=>{
  const {game:other,element}=createHarness();other.begin();other.g.passives={magic:5,cloak:4,insight:3};other.updateHUD();other.pause();
  for(const id of ['passive-slots','pause-passives']){
   const html=element(id).innerHTML;assert(html.includes('5/5'),id);assert(html.includes('4/5'),id);assert(html.includes('3/5'),id);assert(!html.includes('/3'),id);
  }
 });
 check('passive conditions and number transitions are separate; weapon growth-direction row is removed',()=>{
  const {game:other,element}=createHarness();other.begin();
  for(const id of Object.keys(caps))for(const rank of [0,4]){
   other.g.passives[id]=rank;
   other.g.cards=[{type:'passive',id,name:other.DATA.passives[id][0],desc:other.passiveOffer(id)}];other.renderCards();
   const html=element('card-options').innerHTML;
   assert(!html.includes('class="passive-effect-values"'),id);
   assert(!html.includes('class="effect-line"'),id);
   assert(!html.includes('%'),id);

  }
  other.g.cards=[{type:'new',id:'orbit',name:other.W.orbit.name,ico:other.W.orbit.icon,desc:'회전 공격',meta:'무기 슬롯'}];other.renderCards();
  const html=element('card-options').innerHTML;assert(!html.includes('강화 방향'));assert(!html.includes('choice-growth'));
 });
 const failures=results.filter(r=>!r.pass);return {total:results.length,passed:results.length-failures.length,failures,detail:'16 Lv.5 caps, 80 selections, max-rank exclusion, combat/recovery formulas and card labels'};
};
