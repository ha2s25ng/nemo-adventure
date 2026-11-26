'use strict';
const assert=require('node:assert/strict'),{createHarness}=require('./harness.cjs');
module.exports=()=>{
 const results=[],check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 check('coin grants combat-only bonuses, preserving fractions on tiny drops',()=>{
  const {game}=createHarness();game.begin();game.g.passives.coin=5;
  const before=game.g.gold;for(let i=0;i<5;i++)game.awardGold(1);assert.equal(game.g.gold-before,6);
  assert.equal(game.awardGold(100),120);const old=game.g.gold;
  game.g.cards=[{type:'gold',name:'gold'}];game.setScreen('cards');game.selectCard(0);assert.equal(game.g.gold-old,10);
 });
 check('courage affects bosses, not normal enemies',()=>{
  const {game}=createHarness();game.begin();game.g.player.crit=0;game.g.passives.courage=5;
  const p=game.g.player,a=game.spawn('armor',{x:p.x+2,y:p.y}),b=game.spawn('armor',{x:p.x+3,y:p.y});
  a.hp=b.hp=10000;b.isBoss=true;game.deal(a,100,'star');game.deal(b,100,'star');assert.equal(a.hp,9900);assert.equal(b.hp,9890);
 });
 check('claw adds to both ordinary and strengthened critical multipliers',()=>{
  const {game}=createHarness();game.begin();game.g.passives.claw=5;game.g.player.crit=1;
  for(const [level,mult] of [[1,2],[6,2.5]]){
   game.g.weapons.star.lv=level;const p=game.g.player,e=game.spawn('armor',{x:p.x+2,y:p.y});e.hp=1e6;
   let critical=false;for(let i=0;i<30;i++){const before=e.hp;game.deal(e,100,'star');const loss=before-e.hp;assert(loss===100||loss===100*mult);if(loss===100*mult)critical=true;}assert(critical);
  }
 });
 check('jelly raises actual post-hit immunity to 1.5 seconds at mastery',()=>{
  const {game}=createHarness();game.begin();game.g.passives.jelly=5;game.g.player.invuln=0;
  game.damagePlayer(10,'test');assert.equal(game.g.player.invuln,1.5);const hp=game.g.player.hp;game.damagePlayer(10,'test');assert.equal(game.g.player.hp,hp);
 });
 check('selection cards and evolution choices omit detailed numbers, while codex stays functional',()=>{
  const {game,element}=createHarness();game.begin();
  for(const [id,row] of Object.entries(game.DATA.passives)){
   game.g.cards=[{type:'passive',id,name:row[0],desc:'damage +50% 0.5초'}];game.renderCards();
   const html=element('card-options').innerHTML;assert(!html.includes('%'));assert(!html.includes('0.5초'));assert(!html.includes('undefined'));
  }
  game.g.weapons.moon={lv:2,up:[0,0,0],evo:null};game.g.cards=[{type:'growth',id:'moon',name:'넓은 원반',up:2,desc:'폭 +25%'}];game.renderCards();assert(!element('card-options').innerHTML.includes('%'));
  for(const id of Object.keys(game.W)){game.renderEvo(id);assert(!element('evo-options').innerHTML.includes('%'));}
  game.openCodex();
 });
 const failures=results.filter(r=>!r.pass);return {passed:results.length-failures.length,total:results.length,failures,detail:'combat gold fractions, additive critical damage, boss-only damage, 1.5s immunity and qualitative selections'};
};
