const CAMPAIGN_MONSTERS = Object.freeze({
 'crystal-crab':{name:'유리집게 게',hp:152,dmg:9,speed:1.08,r:.51,size:[1.45,1.14],
  cap:3,range:6,keep:2.9,windup:.95,rest:5.6,tint:'#80f2d8',xp:[.24,.42,.17]},
 'prism-wisp':{name:'프리즘 불씨',hp:108,dmg:7,speed:1.44,r:.39,size:[1.28,1.32],flying:true,
  cap:3,range:8,keep:5.3,windup:.76,rest:5.1,tint:'#ffd29f',xp:[.32,.39,.15]},
 'frost-hare':{name:'서리뜀 토끼',hp:127,dmg:8,speed:1.60,r:.44,size:[1.36,1.28],
  cap:3,range:5.3,keep:2.7,windup:.86,rest:4.9,tint:'#d3f6ff',xp:[.23,.42,.18]},
 'snow-moth':{name:'눈송이 나방',hp:114,dmg:7,speed:1.35,r:.42,size:[1.48,1.25],flying:true,
  cap:3,range:7.7,keep:5.5,windup:.82,rest:5.7,tint:'#a9ddff',xp:[.28,.39,.19]},
 'ember-beetle':{name:'불씨등 딱정벌레',hp:170,dmg:10,speed:1.17,r:.53,size:[1.42,1.10],
  cap:3,range:4.2,keep:1.5,windup:.92,rest:5.2,tint:'#ffb278',xp:[.18,.40,.22]},
 'ash-viper':{name:'잿결 뱀',hp:136,dmg:9,speed:1.50,r:.43,size:[1.36,1.12],
  cap:3,range:6.5,keep:3.4,windup:.90,rest:5.1,tint:'#f8c48b',xp:[.22,.40,.20]},
 'kelp-spirit':{name:'해초 정령',hp:144,dmg:8,speed:1.20,r:.47,size:[1.35,1.30],
  cap:3,range:7.5,keep:5.2,windup:1.03,rest:6.2,tint:'#b8f6ad',xp:[.20,.42,.19]},
 'tide-ray':{name:'조수 가오리',hp:132,dmg:8,speed:1.60,r:.45,size:[1.57,1.18],flying:true,
  cap:3,range:8.5,keep:5.5,windup:.94,rest:5.7,tint:'#98effd',xp:[.23,.42,.19]},
 'clock-scarab':{name:'시계태엽 풍뎅이',hp:177,dmg:10,speed:1.20,r:.54,size:[1.52,1.18],
  cap:3,range:7,keep:3.8,windup:1.13,rest:6.0,tint:'#ffe3a3',xp:[.16,.40,.24]},
 'star-jelly':{name:'별무리 해파리',hp:155,dmg:8,speed:1.30,r:.45,size:[1.39,1.48],flying:true,
  cap:3,range:8.3,keep:5.7,windup:1.00,rest:6.15,tint:'#efc1ff',xp:[.18,.41,.22]}
});

const CAMPAIGN_MONSTER_BOLT_COLORS = {
 'prism-pulse':['#473359','#c76be3','#fff4db'],
 'snow-flake':['#214466','#65b9f1','#effeff'],
 'ember-spark':['#53303b','#ea7444','#fff1b0'],
 'tide-drop':['#15465b','#39b6d1','#ddffff'],
 'star-dust':['#413265','#a878e5','#fff2fb']
};

function createCampaignMonsterBehavior({
 getGame,isPlaying,DATA,TAU,MD,ctx,atan,blockedByTerrain,chase,damagePlayer,difficulty,
 distance,enemyBullet,moveForestSpecial,pathHitsNemo,range,visible
}){
 const CAMPAIGN_STRIKES = {
  'crystal-crab':'수정 절단',
  'frost-hare':'서리 착지',
  'ember-beetle':'불씨 폭발',
  'ash-viper':'잿결 돌진',
  'kelp-spirit':'해초 웅덩이',
  'clock-scarab':'태엽 십자'
 };

 function campaignMonsterPoint(x,y,angle,reach){
  return {x:x+Math.cos(angle)*reach,y:y+Math.sin(angle)*reach};
 }
 function campaignMonsterLane(x,y,angle,reach,width,back=0){
  const start=campaignMonsterPoint(x,y,angle,-back);
  const end=campaignMonsterPoint(x,y,angle,reach);
  return {...start,tx:end.x,ty:end.y,width};
 }
 function campaignMonsterTravel(e,aim,reach){
  const probes=Math.ceil(reach/.22);
  let clear=0;
  for(let i=1;i<=probes;i++){
   const step=reach*i/probes;
   const next=campaignMonsterPoint(e.x,e.y,aim,step);
   if(next.x<e.r||next.y<e.r||next.x>DATA.world-e.r||next.y>DATA.world-e.r||
    blockedByTerrain(next.x,next.y,e.r))break;
   clear=step;
  }
  return clear;
 }
 function prepareCampaignMonsterAttack(e,rule,aim,dist){
  const p=getGame().player;
  const a={type:'campaign-warn',t:rule.windup,aim,x:e.x,y:e.y,color:rule.tint,
   lanes:[],circles:[],rays:[]};
  switch(e.kind){
  case 'crystal-crab':
   // A narrow instant strike and no projectiles. Staying sideways avoids it.
   a.lanes.push(campaignMonsterLane(e.x,e.y,aim,5.35,.54));
   break;
  case 'prism-wisp':
   a.rays=[aim-.46,aim+.46];
   break;
  case 'frost-hare':
   a.travel=campaignMonsterTravel(e,aim,Math.min(dist+.35,5.1));
   break;
  case 'snow-moth':
   a.rays=Array.from({length:6},(_,i)=>aim+.24+i*TAU/6);
   break;
  case 'ember-beetle':
   a.circles.push({x:e.x,y:e.y,r:2.12});
   a.rays=Array.from({length:6},(_,i)=>aim+(i+1)*TAU/8);
   break;
  case 'ash-viper':
   a.travel=campaignMonsterTravel(e,aim,Math.min(dist+1.5,7.2));
   break;
  case 'kelp-spirit':{
   const second=campaignMonsterPoint(p.x,p.y,aim+Math.PI/2*(e.id%2?1:-1),2.0);
   a.circles.push({x:p.x,y:p.y,r:1.03},{...second,r:.84});
   break;
  }
  case 'tide-ray':
   a.emitters=[-1.48,0,1.48].map(offset=>campaignMonsterPoint(e.x,e.y,aim+Math.PI/2,offset));
   break;
  case 'clock-scarab':{
   const turn=Math.round(aim/(Math.PI/4))*Math.PI/4;
   for(const axis of [turn,turn+Math.PI/2]){
    a.lanes.push(campaignMonsterLane(p.x,p.y,axis,3.25,.56,3.25));
   }
   break;
  }
  case 'star-jelly':
   // The ring leaves a wide gap facing the position where the first aim locked.
   a.rays=[2,3,4,5,6,7,8].map(i=>aim+i*TAU/10);
   break;
  }
  return a;
 }
 function campaignMonsterShot(e,x,y,aim,speed,damage,paint,life=3.7){
  enemyBullet(x,y,aim,speed,damage,life,MD[e.kind].name+' 탄환',paint,e.id);
 }
 function campaignMonsterHazard(e,shape,attack,damage,life,delay=0){
  getGame().campaignMonsterHazards.push({...shape,color:attack.color,damage,
   warn:delay,life,max:life,hit:false,label:CAMPAIGN_STRIKES[e.kind]});
 }
 function castCampaignMonsterAttack(e,a){
  const shot=(aim,speed,damage,paint)=>campaignMonsterShot(e,a.x,a.y,aim,speed,damage,paint);
  switch(e.kind){
  case 'crystal-crab':
   campaignMonsterHazard(e,a.lanes[0],a,10,.20);
   break;
  case 'prism-wisp':
   for(const aim of a.rays)shot(aim,4.45,8,'prism-pulse');
   if(!a.echo){
    // The narrow delayed volley converges on the original line of sight.
    e.attackState={...a,t:.46,rays:[a.aim-.11,a.aim+.11],echo:true};
    return;
   }
   break;
  case 'frost-hare':
  case 'ash-viper':{
   const hop=e.kind==='frost-hare';
   e.attackState={...a,type:hop?'campaign-leap':'campaign-dash',t:0,left:a.travel,
    speed:hop?10.7:9.15};
   return;
  }
  case 'snow-moth':
   for(const aim of a.rays)shot(aim,3.35,7,'snow-flake');
   if(!a.echo){
    e.attackState={...a,type:'campaign-warn',t:.48,rays:a.rays.map(angle=>angle+TAU/12),echo:true};
    return;
   }
   break;
  case 'ember-beetle':
   campaignMonsterHazard(e,a.circles[0],a,11,.24);
   for(const aim of a.rays)shot(aim,3.12,7,'ember-spark');
   break;
  case 'kelp-spirit':
   for(const shape of a.circles)campaignMonsterHazard(e,shape,a,9,2.4);
   break;
  case 'tide-ray':
   for(const start of a.emitters){
    campaignMonsterShot(e,start.x,start.y,a.aim,4.65,8,'tide-drop');
   }
   if(!a.echo){
    const emitters=[-2.22,-.74,.74,2.22].map(offset=>campaignMonsterPoint(a.x,a.y,a.aim+Math.PI/2,offset));
    e.attackState={...a,type:'campaign-warn',t:.51,emitters,echo:true};
    return;
   }
   break;
  case 'clock-scarab':
   a.lanes.forEach((lane,index)=>campaignMonsterHazard(e,lane,a,11,.23,index*.25));
   break;
  case 'star-jelly':
   for(const aim of a.rays)shot(aim,3.46,9,'star-dust');
   if(!a.echo){
    const turn=(e.id%2?1:-1)*.58;
    e.attackState={...a,type:'campaign-warn',t:.58,rays:a.rays.map(angle=>angle+turn),echo:true};
    return;
   }
   break;
  }
  e.attackState=null;
 }

 function moveCampaignMonsterAttack(e,a,dt){
  const hop=a.type==='campaign-leap';
  const oldX=e.x,oldY=e.y,step=Math.min(a.left,a.speed*dt);
  const next=campaignMonsterPoint(oldX,oldY,a.aim,step);
  const blocked=blockedByTerrain(next.x,next.y,e.r);
  if(!blocked){
   e.x=next.x;e.y=next.y;
   a.left-=step;
   if(!hop&&pathHitsNemo(oldX,oldY,e.x,e.y,e.r-.05)){
    damagePlayer(12*difficulty().damage,CAMPAIGN_STRIKES[e.kind]);
   }
  }
  if(a.left<=.001||blocked){
   if(hop){
    campaignMonsterHazard(e,{x:e.x,y:e.y,r:1.03},a,12,.22);
   }
   e.attackState=null;
   e.halt=hop?.43:.56;
  }
 }
 function updateCampaignMonster(e,dt){
  const g=getGame();
  const rule=CAMPAIGN_MONSTERS[e.kind],p=g.player,a=e.attackState;
  if(e.halt>0){
   e.halt-=dt;
  }else if(a?.type==='campaign-warn'){
   a.t-=dt;
   if(a.t<=0)castCampaignMonsterAttack(e,a);
  }else if(a){
   moveCampaignMonsterAttack(e,a,dt);
  }else{
   const d=distance(e.x,e.y,p.x,p.y);
   if(d>rule.keep+.7)chase(e,dt);
   else if(d<rule.keep-.6)chase(e,dt,-.8);
   else if(rule.flying)moveForestSpecial(e,atan(e.x,e.y,p.x,p.y)+(e.id%2?1:-1)*Math.PI/2,dt,.78);
   e.patternTimer-=dt;
   if(e.patternTimer<=0&&d<=rule.range&&visible(e.x,e.y,-.2)){
    const attacking=g.enemies.filter(other=>!other.dead&&other.attackState?.type.startsWith('campaign-'));
    const poolsFull=e.kind==='kelp-spirit'&&
     g.campaignMonsterHazards.filter(h=>h.label===CAMPAIGN_STRIKES['kelp-spirit']).length+
      attacking.filter(other=>other.kind==='kelp-spirit').length*2>2;
    if(attacking.length<(g.boss?1:3)&&!poolsFull){
     e.attackState=prepareCampaignMonsterAttack(e,rule,atan(e.x,e.y,p.x,p.y),d);
     if(e.attackState.travel!==undefined){
      e.pushTime=0;e.pushX=0;e.pushY=0;
     }
     e.patternTimer=rule.rest+range(0,1.4);
    }else{
     e.patternTimer=range(.3,.8);
    }
   }
  }
  if(a?.type!=='campaign-leap'&&e.attackState?.type!=='campaign-leap'&&
   pathHitsNemo(e.x,e.y,e.x,e.y,e.r-.10)){
   damagePlayer(e.dmg,rule.name+' 접촉');
  }
 }
 function updateCampaignMonsterHazards(dt){
  const g=getGame();
  if(!g.campaignMonsterHazards.length)return;
  for(const h of g.campaignMonsterHazards){
   if(h.warn>0){
    h.warn-=dt;
    if(h.warn>0)continue;
   }
   h.life-=dt;
   if(h.life<=0||h.hit||g.player.invuln>0)continue;
   const hit=h.r===undefined
    ?pathHitsNemo(h.x,h.y,h.tx,h.ty,h.width*.5)
    :pathHitsNemo(h.x,h.y,h.x,h.y,h.r);
   if(hit){
    h.hit=true;
    damagePlayer(h.damage*difficulty().damage,h.label);
    if(!isPlaying())return;
   }
  }
  g.campaignMonsterHazards=g.campaignMonsterHazards.filter(h=>h.life>0);
 }

 function drawCampaignMonsterHazards(){
  for(const h of getGame().campaignMonsterHazards){
   if(h.warn>0||h.life<=0)continue;
   ctx.save();
   ctx.globalAlpha=Math.min(1,.35+h.life/h.max);
   ctx.lineCap='round';
   ctx.beginPath();
   if(h.r===undefined){
    ctx.moveTo(h.x,h.y);ctx.lineTo(h.tx,h.ty);
    ctx.lineWidth=h.width;
    ctx.strokeStyle=h.color+'bc';
    ctx.stroke();
   }else{
    ctx.arc(h.x,h.y,h.r,0,TAU);
    ctx.fillStyle=h.color+'75';
    ctx.fill();
   }
   ctx.lineWidth=.12;
   ctx.strokeStyle='#402944';
   ctx.stroke();
   ctx.lineWidth=.068;
   ctx.strokeStyle=h.color;
   ctx.stroke();
   ctx.restore();
  }
 }

 return {updateCampaignMonster,updateCampaignMonsterHazards,drawCampaignMonsterHazards};
}
