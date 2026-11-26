'use strict';
const assert=require('node:assert/strict'),A=require('../../assets/awakening-v51218/awakening.js');
module.exports=()=>{
 const results=[],check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 const recipes=[{id:'fixture-star',weapon:'star',passive:'lucky',name:'test',summary:'test',apply:g=>g.applied=(g.applied||0)+1},{id:'fixture-bell',weapon:'bell',passive:'leafguard',name:'test2',apply:g=>g.applied=(g.applied||0)+1}];
 const state=()=>({weapons:{star:{lv:7},bell:{lv:7}},passives:{lucky:5,leafguard:5}});
 check('requires both full ranks and a real approved effect',()=>{const g=state();g.weapons.star.lv=6;assert(!A.eligible(g,recipes[0]));g.weapons.star.lv=7;g.passives.lucky=4;assert(!A.eligible(g,recipes[0]));g.passives.lucky=5;assert(A.eligible(g,recipes[0]));assert(!A.eligible(g,{...recipes[0],apply:null}));assert.equal(A.next(g,[],'level'),null);});
 check('available on the next level choice, not timed or bonus choices',()=>{const g=state();assert.equal(A.next(g,recipes,'bonus'),null);assert.equal(A.next(g,recipes,'milestone'),null);assert.equal(A.next(g,recipes,'level').id,'fixture-star');});
 check('unselected and rerolled offers stay queued until actually selected',()=>{const g=state();for(let i=0;i<30;i++)assert.equal(A.next(g,recipes,'level').id,'fixture-star');assert(!g.weapons.star.awakened);assert(!g.applied);});
 check('queues in readiness order and applies each effect once',()=>{const g=state();g.passives.lucky=4;A.sync(g,recipes);g.passives.lucky=5;assert.equal(A.next(g,recipes,'level').id,'fixture-bell');assert.equal(A.apply(g,recipes,'fixture-bell').id,'fixture-bell');assert.equal(g.applied,1);assert.equal(A.apply(g,recipes,'fixture-bell'),null);assert.equal(A.next(g,recipes,'level').id,'fixture-star');A.apply(g,recipes,'fixture-star');assert.equal(g.applied,2);assert.equal(A.next(g,recipes,'level'),null);});
 check('stale offers cannot bypass missing conditions',()=>{const g=state();A.next(g,recipes,'level');g.passives.lucky=0;assert.equal(A.apply(g,recipes,'fixture-star'),null);assert(!g.applied);});
 check('actual cards reserve slot one ahead of rare cards and discovery requires selection',()=>{
  const {createHarness}=require('./harness.cjs'),{game,element}=createHarness();game.begin();
  game.AWAKENING_RECIPES.splice(0,game.AWAKENING_RECIPES.length,...recipes);game.g.weapons.star.lv=7;game.g.passives.lucky=5;game.g.cardReason='level';
  const rare={type:'rare',id:'starLegacy',weapon:'star',name:'rare'};
  for(let i=0;i<10;i++){const cards=game.rollCards(rare);assert.equal(cards[0].type,'awakening');assert.equal(cards[1].type,'rare');assert.equal(cards.length,3);}
  game.g.cards=game.rollCards(null);game.renderCards();assert(element('card-options').innerHTML.includes('data-kind="awakening"'));
  assert(!game.saved.awakeningDiscoveries.includes('fixture-star'));
  game.setScreen('cards');game.selectCard(0);assert(game.saved.awakeningDiscoveries.includes('fixture-star'));assert.equal(game.g.applied,1);
  assert(game.readSave().awakeningDiscoveries.includes('fixture-star'));assert(!game.rollCards(null).some(c=>c.type==='awakening'));
  game.setCodexCategory('evolutions');assert(element('codex-details').innerHTML.includes('스타 샷'));
 });
 check('real star reaches seven without boss gates, then awakens only with rank-five ribbon',()=>{
  const {createHarness}=require('./harness.cjs'),{game,element}=createHarness();game.begin();const g=game.g,p=g.player;
  g.cardReason='level';g.passives.lucky=4;g.bossEncounters=0;
  for(let lv=1;lv<7;lv++){
   assert(game.hasGrowth('star'));const card=game.makeGrowth('star');assert.equal(card.type,'growth');g.cards=[card];game.setScreen('cards');game.selectCard(0);assert.equal(g.weapons.star.lv,lv+1);assert.equal(g.weapons.star.evo,null);
   const e=game.spawn('armor',{x:p.x+3,y:p.y});e.hp=1e6;g.shots=[];game.fireWeapon('star');assert.equal(g.shots.length,lv+1>=4?3:1);assert(g.shots.every(s=>Number.isFinite(s.vx)&&Number.isFinite(s.vy)));e.dead=true;
  }
  assert(!game.rollCards(null).some(c=>c.type==='awakening'));g.passives.lucky=5;g.cards=game.rollCards(null);assert.equal(g.cards[0].id,'star-piercing');
  game.renderCards();const cardHtml=element('card-options').innerHTML;
  assert(cardHtml.includes('별의 개수가 늘어나고 관통 효과가 생깁니다.'));
  assert(cardHtml.includes('class="awakening-combination"'));assert(cardHtml.includes(game.ASSET_DATA.ui_lucky));assert(cardHtml.includes('스타 샷'));assert(cardHtml.includes('행운의 리본'));assert(cardHtml.includes('Lv.7'));assert(cardHtml.includes('Lv.5'));
  game.setCodexCategory('evolutions');assert(!element('codex-details').innerHTML.includes('행운의 리본'));
  game.setScreen('cards');game.selectCard(0);assert.equal(g.weapons.star.lv,7);assert.equal(g.weapons.star.awakened,'star-piercing');
  assert(game.readSave().awakeningDiscoveries.includes('star-piercing'));game.setCodexCategory('evolutions');assert(element('codex-details').innerHTML.includes('행운의 리본'));
  const e=game.spawn('armor',{x:p.x+3,y:p.y});e.hp=1e6;g.shots=[];game.fireWeapon('star');assert.equal(g.shots.length,4);assert(g.shots.every(s=>s.chains===1&&Number.isFinite(s.vx)&&Number.isFinite(s.vy)));
  const shot=g.shots[0];g.shots=[shot];g.enemies=[e];shot.x=p.x;shot.y=p.y;shot.vx=17;shot.vy=0;shot.target=null;p.crit=-1;
  const second=game.spawn('armor',{x:p.x+5,y:p.y}),third=game.spawn('armor',{x:p.x+7,y:p.y});second.hp=third.hp=1e6;
  for(let i=0;i<30;i++)game.updateShots(.02,false);
  assert(e.hp<1e6);assert(second.hp<1e6);assert.equal(third.hp,1e6);assert(1e6-second.hp<1e6-e.hp);
 });
 check('larger stars use matching contact radii and awakened-only dust, respecting reduced motion',()=>{
  const {createHarness}=require('./harness.cjs');
  for(const reduced of [false,true]){
   const {game,drawCalls,vectorCalls}=createHarness(123,true,reduced);game.begin();const g=game.g,p=g.player;g.weapons.star.lv=7;
   const e=game.spawn('armor',{x:p.x+3,y:p.y});e.hp=1e6;game.fireWeapon('star');const ordinary=g.shots[0];assert.equal(ordinary.r,.28);assert.equal(ordinary.awakened,false);
   g.weapons.star.awakened='star-piercing';game.fireWeapon('star');const awake=g.shots.at(-1);assert.equal(awake.r,.32);assert.equal(awake.awakened,true);assert.equal(ordinary.r,.28);
   for(const shot of [ordinary,awake])shot.trail=Array.from({length:6},(_,i)=>({x:p.x-i*.1,y:p.y}));
   let normalFills=0;
   for(const shot of [ordinary,awake]){
    drawCalls.length=0;vectorCalls.length=0;game.drawProjectile(shot);
    const body=drawCalls.find(c=>c.src===game.ASSET_DATA.spell_star);assert(body);assert.equal(body.args[2],shot.r*2);assert.equal(body.args[3],shot.r*2);
    const fills=vectorCalls.filter(c=>c.kind==='fill').length;
    if(shot===ordinary)normalFills=fills;else {assert(fills>normalFills);if(reduced)assert.equal(fills,1);else assert.equal(fills,7);}
   }
  }
 });
 check('every discovered codex entry opens its own record while undiscovered recipes stay hidden',()=>{
  const {createHarness}=require('./harness.cjs'),{game,element}=createHarness();game.begin();game.setCodexCategory('evolutions');
  for(const recipe of game.AWAKENING_RECIPES){
   game.saved.awakeningDiscoveries=[];game.selectCodexEntry(recipe.id);let details=element('codex-details').innerHTML;
   assert(details.includes('아직 발견하지 못한 각성'));assert(!details.includes(recipe.summary));assert(!details.includes(game.DATA.passives[recipe.passive][0]));
   game.saved.awakeningDiscoveries=[recipe.id];game.selectCodexEntry(recipe.id);details=element('codex-details').innerHTML;
   assert(details.includes(recipe.name));assert(details.includes(recipe.summary));assert(details.includes(game.DATA.passives[recipe.passive][0]));
  }
 });
 check('unchanged rank seven redraws with a purple awakening marker in HUD and pause, then resets next run',()=>{
  const {createHarness}=require('./harness.cjs'),{game,element}=createHarness();game.begin();game.g.weapons.star.lv=7;game.updateHUD();
  assert(!element('weapon-slots').innerHTML.includes('data-awakened="true"'));
  game.g.weapons.star.awakened='star-piercing';game.updateHUD();
  for(const id of ['weapon-slots','pause-loadout'])assert(element(id).innerHTML.includes('data-awakened="true"'));
  assert(element('weapon-slots').innerHTML.includes('✦ 각성'));assert(element('weapon-slots').innerHTML.includes('Lv.7'));
  assert(element('pause-loadout').innerHTML.includes('pause-awakened-label'));assert.equal(game.g.weapons.star.lv,7);
  game.menu();game.begin();game.updateHUD();assert(!element('weapon-slots').innerHTML.includes('data-awakened="true"'));assert(!element('pause-loadout').innerHTML.includes('data-awakened="true"'));
 });
 const failures=results.filter(r=>!r.pass);return {passed:results.length-failures.length,total:results.length,failures,detail:'normal ranks 1–7, queued awakening, discoveries, hitboxes, reduced motion and HUD/pause awakening markers'};
};
