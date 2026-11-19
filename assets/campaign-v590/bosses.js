const NEMO_CAMPAIGN_BOSSES = (() => {
 const turn = Math.PI * 2;
 const art = {
  'mirror-stag': {size:[4.45,4.15],flying:false},
  'rime-bear': {size:[4.65,3.82],flying:false},
  'ember-wyrm': {size:[5.05,3.92],flying:true},
  'tide-heron': {size:[4.55,4.26],flying:true},
  'clockwork-mantis': {size:[4.58,4.04],flying:false},
  'void-fox': {size:[4.42,3.56],flying:false},
  'astral-dragon': {size:[5.35,4.36],flying:true}
 };
 const forms = {
  crown:{scout:'정찰 왕관 슬라임',speed:1.04,r:1.36,opening:['fan','dash'],main:['crown-gems','dash','fan'],late:['crown-gems','ring','dash']},
  thorn:{scout:'새싹 가시 파수꾼',speed:1.02,r:1.63,opening:['root-bars','fan'],main:['root-bars','ring','dash'],late:['root-bars','hedge','ring']},
  moon:{scout:'달날개 전령',speed:1.13,r:1.52,opening:['moon-halo','fan'],main:['moon-halo','cross','ring'],late:['moon-halo','spiral','cross']},
  boar:{scout:'뿌리 돌격대장',speed:1.00,r:1.65,opening:['dash','boar-fault'],main:['boar-fault','dash','fan'],late:['dash','boar-fault','ring']},
  owl:{scout:'별바람 파수꾼',speed:1.16,r:1.62,opening:['owl-gust','fan'],main:['owl-gust','wing','dash'],late:['wing','owl-gust','spiral']},
  'mirror-stag':{scout:'거울숲의 전령',speed:1.10,r:1.54,opening:['mirror-lanes','fan'],main:['mirror-lanes','mirror-echo','dash'],late:['mirror-echo','mirror-lanes','ring']},
  'rime-bear':{scout:'서리굴의 전령',speed:.97,r:1.66,opening:['ice-paws','dash'],main:['ice-paws','frost-ring','fan'],late:['frost-ring','ice-paws','dash']},
  'ember-wyrm':{scout:'잿빛 굴의 전령',speed:1.13,r:1.62,opening:['ember-trail','fan'],main:['ember-trail','cinder-rays','dash'],late:['cinder-rays','ember-trail','spiral']},
  'tide-heron':{scout:'잠긴 항구의 전령',speed:1.16,r:1.48,opening:['tide-surge','fan'],main:['tide-surge','rain-pools','ring'],late:['rain-pools','tide-surge','dash']},
  'clockwork-mantis':{scout:'톱니 회랑의 전령',speed:1.11,r:1.53,opening:['clock-blades','dash'],main:['clock-blades','gear-sweep','fan'],late:['gear-sweep','clock-blades','dash']},
  'void-fox':{scout:'공허 숲길의 전령',speed:1.17,r:1.48,opening:['fox-echo','fan'],main:['fox-echo','void-pockets','dash'],late:['void-pockets','fox-echo','ring']},
  'astral-dragon':{scout:'별문의 전령',speed:1.10,r:1.74,opening:['starfall','ring'],main:['starfall','constellation','dash'],late:['eclipse','constellation','starfall','spiral']}
 };
 const patterns={
  "crown-gems": {
    "name": "왕관 보석 연사",
    "shape": "fan",
    "count": 5,
    "spread": 1.05,
    "speed": 3.4,
    "damage": 10,
    "paint": "ring"
  },
  "root-bars": {
    "name": "뿌리 탄막벽",
    "shape": "lanes",
    "count": 6,
    "spread": 1,
    "speed": 3.2,
    "damage": 11,
    "paint": "thorn-wall"
  },
  "moon-halo": {
    "name": "초승달 파상탄",
    "shape": "sweep",
    "count": 7,
    "spread": 1.4,
    "speed": 3.4,
    "damage": 11,
    "paint": "petal"
  },
  "boar-fault": {
    "name": "뿌리 삼지창",
    "shape": "split",
    "count": 6,
    "spread": 1.2,
    "speed": 3.6,
    "damage": 12,
    "paint": "fan"
  },
  "owl-gust": {
    "name": "바람 칼날",
    "shape": "lanes",
    "count": 6,
    "spread": 1,
    "speed": 3.7,
    "damage": 11,
    "paint": "shard"
  },
  "mirror-lanes": {
    "name": "거울 평행탄",
    "shape": "lanes",
    "count": 6,
    "spread": 1,
    "speed": 3.6,
    "damage": 12,
    "paint": "shard"
  },
  "mirror-echo": {
    "name": "거울 쌍갈래",
    "shape": "split",
    "count": 6,
    "spread": 1.3,
    "speed": 3.6,
    "damage": 12,
    "paint": "ring"
  },
  "ice-paws": {
    "name": "서리 눈보라",
    "shape": "fan",
    "count": 7,
    "spread": 1.5,
    "speed": 3.4,
    "damage": 14,
    "paint": "spiral"
  },
  "frost-ring": {
    "name": "엇갈린 얼음탄",
    "shape": "sweep",
    "count": 7,
    "spread": 1.5,
    "speed": 3.4,
    "damage": 13,
    "paint": "spiral"
  },
  "ember-trail": {
    "name": "잿불 파상탄",
    "shape": "sweep",
    "count": 5,
    "spread": 1.3,
    "speed": 3.8,
    "damage": 13,
    "paint": "fan"
  },
  "cinder-rays": {
    "name": "용암 삼지창",
    "shape": "split",
    "count": 6,
    "spread": 1.2,
    "speed": 3.8,
    "damage": 13,
    "paint": "fan"
  },
  "tide-surge": {
    "name": "밀려오는 물결탄",
    "shape": "lanes",
    "count": 8,
    "spread": 1,
    "speed": 3.4,
    "damage": 14,
    "paint": "moth"
  },
  "rain-pools": {
    "name": "빗방울 부채탄",
    "shape": "fan",
    "count": 7,
    "spread": 1.4,
    "speed": 3.6,
    "damage": 12,
    "paint": "moth"
  },
  "clock-blades": {
    "name": "톱니 쌍갈래탄",
    "shape": "split",
    "count": 8,
    "spread": 1.3,
    "speed": 3.8,
    "damage": 14,
    "paint": "shard"
  },
  "gear-sweep": {
    "name": "회전 톱니탄",
    "shape": "sweep",
    "count": 7,
    "spread": 1.4,
    "speed": 3.8,
    "damage": 14,
    "paint": "shard"
  },
  "fox-echo": {
    "name": "여우 엇박탄",
    "shape": "split",
    "count": 6,
    "spread": 1.3,
    "speed": 3.9,
    "damage": 14,
    "paint": "petal"
  },
  "void-pockets": {
    "name": "공허 파상탄",
    "shape": "sweep",
    "count": 7,
    "spread": 1.5,
    "speed": 3.7,
    "damage": 15,
    "paint": "petal"
  },
  "starfall": {
    "name": "별빛 연사",
    "shape": "fan",
    "count": 9,
    "spread": 1.6,
    "speed": 3.7,
    "damage": 15,
    "paint": "ring"
  },
  "constellation": {
    "name": "별자리 협공탄",
    "shape": "split",
    "count": 8,
    "spread": 1.4,
    "speed": 3.9,
    "damage": 15,
    "paint": "ring"
  },
  "eclipse": {
    "name": "일식 물결탄",
    "shape": "sweep",
    "count": 9,
    "spread": 1.7,
    "speed": 3.8,
    "damage": 16,
    "paint": "spiral"
  }
};

 const escortRegions = [
  [5,['crown','thorn','boar','moon']],
  [10,['owl','rime-bear','ember-wyrm','tide-heron','clockwork-mantis']],
  [13,['mirror-stag','moon','thorn']],
  [16,['rime-bear','owl','mirror-stag']],
  [19,['ember-wyrm','boar','clockwork-mantis']],
  [22,['tide-heron','thorn','moon']],
  [25,['clockwork-mantis','mirror-stag','ember-wyrm']],
  [30,['void-fox','rime-bear','tide-heron','clockwork-mantis']]
 ];
 const commonAttacks = new Set(['dash','fan','ring','spiral']);

 function definition(stage,wave,baseTemplates){
  const final=wave===2;
  const [regionEnd,regionForms]=escortRegions.find(([end])=>stage.id<=end);
  const escorts=regionForms.filter(form=>form!==stage.boss);
  const form=final?stage.boss:escorts[(stage.id+wave)%escorts.length];
  const profile=forms[form];
  const base=baseTemplates[form]??{art:form};
  const regionalAttack=final&&stage.patterns?.find(attack=>(
   (attack===base.signature||commonAttacks.has(attack))&&!profile.main.includes(attack)
  ));
  const chapterFinal=final&&stage.id===regionEnd;
  const opening=final&&stage.id===30?[...profile.opening,'constellation']:profile.opening;
  const main=regionalAttack?[...profile.main,regionalAttack]:profile.main;
  const chapterFinisher=chapterFinal&&profile.late.length===3&&[...commonAttacks].find(attack=>!profile.late.includes(attack));
  const late=stage.id<4?main:chapterFinisher?[...profile.late,chapterFinisher]:profile.late;
  const progress=(stage.id-1)/29;
  const advanced=Math.max(0,stage.id-10)/20;
  const threat=[.51,.73,1][wave];
  // Late scouts grow with campaign depth, but the final boss should remain the longest encounter.
  const hpScale=[.23-.05*advanced,.47-.14*advanced,1][wave];
  return {...base,form,final,name:final?stage.title:profile.scout,
   cycles:[opening,main,late],
   hp:Math.round(stage.hp*hpScale),gold:final?0:Math.round(stage.reward*(wave===0?.15:.27)),
   dmg:(15+stage.id*.58)*[.71,.85,1][wave],speed:profile.speed*(.93+.15*progress),
   r:profile.r,tier:Math.min(3,Math.max(1,Math.ceil(stage.id/5)-(2-wave))),
   barrage:(.80+.64*progress+.26*advanced)*threat,projectileTempo:1.08+.20*progress,
   projectileDamage:(.86+.14*progress)*(.87+.13*threat),chargeWake:form==='boar',
   contact:final&&stage.id>=11,advanced
  };
 }


 function start(kind,boss,player,phase,hurtY,pressure=1){
  const rule=patterns[kind];
  if(!rule)return null;
  return {
   type:'campaign-warn',kind,rule,phase,index:0,x:boss.x,y:boss.y,
   aim:Math.atan2(player.y+hurtY-boss.y,player.x-boss.x),
   timer:Math.max(.75,.96-phase*.06),pressure,
   volleys:2+phase+Math.floor((pressure-1)*3)
  };
 }
 function fireVolley(action,fire){
  const {rule,phase,index,aim,x,y,pressure}=action;
  const count=rule.count+phase*2+2*Math.floor((pressure-1)*2);
  for(let i=0;i<count;i++){
   const unit=i/(count-1)-.5;
   let angle=aim+unit*rule.spread,offset=0;
   if(rule.shape==='lanes'){
    angle=aim;
    offset=(i-(count-1)/2)*.68+(index%2?.25:-.25);
   }else if(rule.shape==='split'){
    const side=i%2?1:-1;
    angle=aim+side*(.26+Math.floor(i/2)*.15)+(index%2?.12:-.12);
    offset=side*.60;
   }else if(rule.shape==='sweep'){
    angle+=Math.sin(index*1.3)*.30;
   }
   if(Math.cos(angle-aim)<=.12)continue;
   fire(x-Math.sin(aim)*offset,y+Math.cos(aim)*offset,angle,
    rule.speed*(1+phase*.055),rule.damage,4.5,rule.name,rule.paint);
  }
 }
 function advance(action,dt,fire,onComplete){
  action.timer-=dt;
  if(action.timer>0)return;
  fireVolley(action,fire);
  action.index++;
  if(action.index>=action.volleys){onComplete();return;}
  action.type='campaign-fire';
  action.timer=Math.max(.22,(.61-action.phase*.05)/action.pressure);
 }
 return {art,definition,start,advance};
})();
