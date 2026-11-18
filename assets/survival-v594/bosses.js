const NEMO_SURVIVAL_BOSSES = (() => {
 const TAU=2*Math.PI;
 const openingOrder=['flower','horn','crown','thorn','moon'];
 const openingHp=[6800,13800,48000,62000,75000];
 const returnOrder=['owl','crown','thorn','moon'];
 const cycles={
  flower:[
   ['flower-pollen','flower-bloom','dash'],
   ['flower-bloom','flower-pollen','dash'],
   ['flower-pollen','dash','flower-bloom','flower-pollen']
  ],
  horn:[
   ['horn-skewer','dash','horn-sparks'],
   ['horn-sparks','horn-skewer','dash'],
   ['dash','horn-skewer','horn-sparks','dash']
  ],
  owl:[
   ['wind-shear','wing','dash'],
   ['gust-vortex','wind-shear','dash'],
   ['wind-shear','gust-vortex','wing','dash']
  ],
  crown:[
   ['crown-prism','dash','fan'],
   ['crown-step','crown-prism','dash'],
   ['crown-prism','crown-step','dash','ring']
  ],
  thorn:[
   ['split-vine','thorn-barrage','dash'],
   ['seed-bloom','split-vine','thorn-barrage'],
   ['split-vine','seed-bloom','dash','thorn-barrage']
  ],
  moon:[
   ['lunar-scythe','cross','dash'],
   ['lunar-lanes','lunar-scythe','ring'],
   ['lunar-scythe','lunar-lanes','cross','dash']
  ]
 };

 function definition(count,forms){
  const index=Math.max(0,count-openingOrder.length);
  const round=Math.floor(index/returnOrder.length);
  const form=openingOrder[count]??returnOrder[index%returnOrder.length];
  const base=forms[form];
  const speedBonus=[.14,.09,.08,.06,.06][count]??Math.min(.12,.04+.02*round);
  const projectileTempo=[1.27,1.32,1.37,1.40,1.43][count]??1.46+Math.min(.07,.02*round);
  const projectileDamage=[1.13,1.17,1.22,1.24,1.26][count]??1.28+Math.min(.1,.025*round);
  return {
   ...base,
   art:base.art??(count<2?form:'boss'),
   renderArt:form==='thorn'?'endless-thorn-guardian':base.art,
   endless:true,endlessForm:form,
   cycles:cycles[form],
   hp:openingHp[count]??89000+7500*index+2600*round,
   speed:base.speed*(1+speedBonus),
   tier:base.tier??1,
   chargeWake:form==='horn',contact:true,
   projectileTempo,projectileDamage
  };
 }

 function spray(action,fire,angles,speed,offset=0){
  const {aim,x,y,rule}=action;
  const ox=x-Math.sin(aim)*offset,oy=y+Math.cos(aim)*offset;
  for(const angle of angles)fire(ox,oy,angle,speed,rule.damage,4.7,rule.name,rule.paint);
 }
 function prongs(angle,count,spacing){
  return Array.from({length:count},(_,i)=>angle+(i-(count-1)/2)*spacing);
 }
 function openWheel(angle,count,open){
  return Array.from({length:count},(_,i)=>i)
   .filter(i=>i>open&&i<count-open)
   .map(i=>angle+i*TAU/count);
 }

 const patterns={
  'flower-pollen':{
   name:'꽃모자 버섯 꽃가루 탄막',color:'#ffc78d',paint:'moth',windup:.80,interval:.54,volleys:[2,3,4],damage:8,
   fire(a,shot){
    const side=a.index%2?1:-1;
    spray(a,shot,prongs(a.aim+side*.28,5,.25),2.95+.16*a.phase);
   }
  },
  'flower-bloom':{
   name:'꽃모자 버섯 겹꽃 분화',color:'#f4afb8',paint:'petal',windup:.83,interval:.63,volleys:[2,2,3],damage:8,
   fire(a,shot){
    const count=11+a.phase*2;
    const heading=a.aim+(a.index%2?.65:0);
    spray(a,shot,openWheel(heading,count,1),2.70+.17*a.phase);
   }
  },
  'horn-skewer':{
   name:'별뿔 슬라임 별뿔 협공',color:'#ffd187',paint:'fan',windup:.78,interval:.53,volleys:[2,3,3],damage:9,
   fire(a,shot){
    const spread=[.52,.36,.69][a.index];
    for(const side of [-1,1]){
     const angles=prongs(a.aim-side*spread,3,.22);
     spray(a,shot,angles,3.02+.18*a.phase,side*1.12);
    }
   }
  },
  'horn-sparks':{
   name:'별뿔 슬라임 지그재그 별탄',color:'#f4aedf',paint:'shard',windup:.80,interval:.48,volleys:[2,3,4],damage:8,
   fire(a,shot){
    const side=a.index%2?1:-1;
    spray(a,shot,prongs(a.aim+side*.50,4,.29),3.28+.12*a.phase,side*.55);
   }
  },
  'wind-shear':{
   name:'폭풍 부엉이 바람 칼날',color:'#a3e9ff',paint:'shard',windup:.86,interval:.56,volleys:[2,3,4],damage:8,
   fire(a,shot){
    // Two parallel banks, with a lane along the owl's initial heading.
    const slide=a.index%2?.66:-.66;
    for(const lane of [-3,-2,-1,1,2,3]){
     spray(a,shot,[a.aim],3.05+.18*a.phase,lane*.91+slide);
    }
   }
  },
  'gust-vortex':{
   name:'폭풍 부엉이 돌개바람',color:'#ace7d2',paint:'shard',windup:.91,interval:.58,volleys:[2,3,3],damage:8,
   fire(a,shot){
    const rotation=a.index*.28;
    for(const side of [-1,1]){
     const arm=a.aim+side*(.83+rotation);
     spray(a,shot,prongs(arm,4,.27),3.15+.14*a.phase,side*1.04);
    }
   }
  },
  'crown-prism':{
   name:'왕관 슬라임 프리즘 고리',color:'#f8dc8e',paint:'ring',windup:.88,interval:.61,volleys:[2,2,3],damage:8,
   fire(a,shot){
    const count=12+a.phase*2;
    const safe=a.index===2?a.aim+.66:a.aim;
    spray(a,shot,openWheel(safe,count,2),2.85+.20*a.phase);
   }
  },
  'crown-step':{
   name:'왕관 슬라임 엇박 보석탄',color:'#ffbc84',paint:'fan',windup:.84,interval:.55,volleys:[2,3,4],damage:8,
   fire(a,shot){
    const turn=(a.index%2?1:-1)*(.38+(a.index>=2?.15:0));
    const angles=prongs(a.aim+turn,5,.29);
    spray(a,shot,angles,3.35-.13*a.index);
   }
  },
  'split-vine':{
   name:'가시숲 수호자 갈라진 가시벽',color:'#bfe891',paint:'thorn-wall',windup:.92,interval:.62,volleys:[2,3,3],damage:8,
   fire(a,shot){
    const safe=[-2,2,0][a.index];
    for(let lane=-4;lane<=4;lane++){
     if(Math.abs(lane-safe)<=1)continue;
     spray(a,shot,[a.aim],2.90+.12*a.phase,lane*.91);
    }
   }
  },
  'seed-bloom':{
   name:'가시숲 수호자 가시 씨앗',color:'#f0d998',paint:'thorn-pincer',windup:.91,interval:.64,volleys:[2,3,4],damage:8,
   fire(a,shot){
    const side=a.index%2?1:-1;
    const bearing=a.aim+side*.39;
    spray(a,shot,prongs(bearing,5,.31),2.98+.18*a.phase,side*1.85);
   }
  },
  'lunar-scythe':{
   name:'달날개 여왕 초승달 낫',color:'#edb7ff',paint:'petal',windup:.87,interval:.56,volleys:[2,3,4],damage:8,
   fire(a,shot){
    const bearing=a.aim+(a.index%2?.79:-.79);
    spray(a,shot,prongs(bearing,5,.25),3.12+.16*a.phase);
    spray(a,shot,prongs(bearing+Math.PI,4,.33),2.84+.16*a.phase);
   }
  },
  'lunar-lanes':{
   name:'달날개 여왕 은빛 십자탄',color:'#c5d6ff',paint:'spiral',windup:.93,interval:.60,volleys:[2,3,3],damage:9,
   fire(a,shot){
    const bearing=a.aim+.48+a.index*.26;
    for(let arm=0;arm<4;arm++){
     const direction=bearing+arm*TAU/4;
     spray(a,shot,prongs(direction,2,.22),3.18+.17*a.phase);
    }
   }
  }
 };

 function start(kind,boss,player,phase){
  const rule=patterns[kind];
  if(!rule)return null;
  const dx=player.x-boss.x,dy=player.y-boss.y;
  return {
   type:'survival-warn',kind,rule,phase,x:boss.x,y:boss.y,
   aim:Math.atan2(dy,dx),color:rule.color,index:0,timer:rule.windup-.10-.045*phase
  };
 }

 function advance(action,dt,fire,onDone){
  action.timer-=dt;
  if(action.timer>0)return;
  action.rule.fire(action,fire);
  action.index++;
  if(action.index>=action.rule.volleys[action.phase]){
   onDone();
   return;
  }
  action.type='survival-fire';
  action.timer=action.rule.interval-.04*action.phase;
 }

 return {definition,start,advance};
})();
