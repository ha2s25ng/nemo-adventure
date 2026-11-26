'use strict';
const assert=require('node:assert/strict'),{createHarness}=require('./harness.cjs');
module.exports=()=>{
 const results=[],check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 check('starter cadence slows together and keeps Dori restrained, with growth still meaningful',()=>{
  const {game}=createHarness();game.begin();const w=game.g.weapons.star;
  assert.equal(game.W.star.cd,.85);assert.equal(game.W.cannon.cd,1.4);assert.equal(game.W.ribbon.coef,1.02);
  const ratios=[];
  for(let lv=1;lv<=7;lv++){
   w.lv=lv;const a=game.weaponPower('star',game.W.star.coef,w)/game.cooldown('star',w),b=game.weaponPower('cannon',game.W.cannon.coef,w)/game.cooldown('cannon',w);ratios.push(b/a);
   assert(game.cooldown('star',w)>0);assert(game.cooldown('cannon',w)>game.cooldown('star',w));
  }
  assert(ratios[0]>1.1&&ratios[0]<1.25);w.lv=7;assert(game.cooldown('star',w)<game.W.star.cd);
 });
 check('every codex entry displays the actual qualitative base behavior, without old branch claims',()=>{
  const {game,element}=createHarness();game.begin();game.setCodexCategory('weapons');
  const cues={star:'세 갈래',cannon:'직격과 주변 폭발',orbit:'회전하는 별',moon:'직선으로 날아가',bubble:'주변 적을 느리게',bloom:'지속적으로 공격',cloud:'체력이 높은 적',ribbon:'반대 방향',book:'보조 비행기',comet:'별빛 잔불',frost:'일반 적',feather:'경로를 꺾',vortex:'주기적으로 넓게',seed:'덫 대신',bell:'일정한 간격'};
  for(const [id,cue] of Object.entries(cues)){
   game.selectCodexEntry(id);const html=element('codex-details').innerHTML;
   assert(html.includes('codex-behavior'),id);assert(html.includes(cue),id);assert(!/돌파하면|최종 진화에서|130도|70%|35%/.test(html),id);
  }
 });
 check('stage vortex uses the same current behavior explanation as survival',()=>{
  const {game,element}=createHarness();game.begin();game.setCodexCategory('weapons');game.selectCodexEntry('vortex');
  const survival=element('codex-details').innerHTML.match(/<p class="codex-behavior">(.*?)<\/p>/)[1];
  game.menu();game.begin(1);game.setCodexCategory('weapons');game.selectCodexEntry('vortex');
  const campaign=element('codex-details').innerHTML.match(/<p class="codex-behavior">(.*?)<\/p>/)[1];assert.equal(campaign,survival);
 });
 check('cloud mark rewards its own repeat strike rather than boosting unrelated weapons',()=>{
  const {game}=createHarness();game.begin();const g=game.g,p=g.player;p.crit=0;g.weapons.cloud={lv:4,up:[0,0,0],evo:null,break:false};
  const e=game.spawn('armor',{x:p.x+3,y:p.y});e.hp=e.maxHp=1e6;e.kind='boss';e.isBoss=true;g.boss=e;
  const hp=e.hp;game.fireWeapon('cloud');const first=hp-e.hp;game.fireWeapon('cloud');const second=hp-e.hp-first;
  assert(second>first*1.14&&second<first*1.16);assert(!e.vulnerableUntil||e.vulnerableUntil<=g.worldClock);
 });
 const failures=results.filter(r=>!r.pass);return {passed:results.length-failures.length,total:results.length,failures,detail:'coherent starter cadence, restrained melee AoE, 15 truthful codex entries and mode consistency'};
};
