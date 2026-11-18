const SURVIVAL_LATE_DROPS = Object.freeze({
 startsAt:900,
 rare:Object.freeze({chance:.012,pityKills:24,cooldown:40,life:34}),
 heal:Object.freeze({chance:.045,pityKills:12,cooldown:18,life:48,maxOnGround:2,belowHealth:.78,amount:.12})
});

function createSurvivalDropBehavior({getGame,worldSize,legacyRareCooldown,rareKinds,loot,rand,choose,blockedByTree,visible}){
 const rules=SURVIVAL_LATE_DROPS;

 function isActive(drop){
  return !drop.dead&&drop.ttl>0;
 }

 function placeSupportDrop(enemy,p){
  const dx=enemy.x-p.x,dy=enemy.y-p.y,gap=Math.hypot(dx,dy);
  const safe=(x,y)=>x>=p.r&&y>=p.r&&x<=worldSize-p.r&&y<=worldSize-p.r&&
   visible(x,y,-.25)&&!blockedByTree(x,y,p.r);
  if(gap<=6&&safe(enemy.x,enemy.y))return {x:enemy.x,y:enemy.y};

  const aim=Math.atan2(dy,dx);
  const reach=Math.min(5.2,Math.max(1.4,gap));
  for(const step of [reach,reach*.68,reach*.42]){
   for(const offset of [0,1,-1,2,-2,3,-3,4]){
    const angle=aim+offset*Math.PI/4;
    const x=p.x+Math.cos(angle)*step,y=p.y+Math.sin(angle)*step;
    if(safe(x,y))return {x,y};
   }
  }
  return {x:p.x,y:p.y};
 }

 function maybeDropRare(game,enemy,state){
  const {rare}=rules;
  if(game.t<state.rareReady||
   game.loot.some(drop=>isActive(drop)&&rareKinds.includes(drop.kind)))return;
  if(++state.rareKills<rare.pityKills&&rand()>=rare.chance)return;

  const kind=choose(rareKinds.filter(item=>item!==state.lastRareKind));
  const {x,y}=placeSupportDrop(enemy,game.player);
  loot(x,y,0,kind,0,rare.life);
  state.rareReady=game.t+rare.cooldown;
  state.rareKills=0;
  state.lastRareKind=kind;
 }

 function maybeDropHeal(game,enemy,state){
  const {heal}=rules;
  const p=game.player;
  if(p.hp>=p.maxHp*heal.belowHealth||game.t<state.healReady||
   game.loot.filter(drop=>isActive(drop)&&(drop.kind==='bone'||drop.kind==='snack')).length>=heal.maxOnGround)return;
  if(++state.healKills<heal.pityKills&&rand()>=heal.chance)return;

  const {x,y}=placeSupportDrop(enemy,p);
  loot(x,y,0,'bone',heal.amount,heal.life);
  state.healReady=game.t+heal.cooldown;
  state.healKills=0;
 }

 function handleLateSurvivalKill(enemy,allowRareDrop){
  const game=getGame();
  if(game.stage||game.t<rules.startsAt)return false;
  if(enemy.kind==='petal'||!allowRareDrop)return true;

  const state=game.lateSurvivalDrops??={
   rareReady:Math.max(rules.startsAt,(game.nextRareDrop??0)-legacyRareCooldown+rules.rare.cooldown),
   rareKills:0,lastRareKind:null,healReady:rules.startsAt,healKills:0
  };
  maybeDropRare(game,enemy,state);
  maybeDropHeal(game,enemy,state);
  return true;
 }

 return handleLateSurvivalKill;
}
