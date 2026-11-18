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
 const palettes = {
  crystal:'#83f1f9',leaf:'#d9f288',moon:'#e2a8ff',earth:'#ffcf83',sky:'#a1dfff',
  frost:'#91e9ff',fire:'#ff9e70',water:'#75e7dc',gear:'#ffe385',void:'#f3a0f6',star:'#ffe29e'
 };
 function circle(x,y,r){ return {x,y,r}; }
 function line(x,y,ex,ey,r){ return {x,y,ex,ey,r}; }
 function band(x,y,inner,r){ return {x,y,inner,r}; }
 function point(a,u,v,angle=a.aim){
  const x=Math.cos(angle),y=Math.sin(angle);
  return [a.targetX+x*u-y*v,a.targetY+y*u+x*v];
 }
 function lane(a,v,r,length,angle=a.aim){
  const [x,y]=point(a,-length,v,angle);
  const [ex,ey]=point(a,length,v,angle);
  return line(x,y,ex,ey,r);
 }
 function ray(a,angle,length,r){
  return line(a.x,a.y,a.x+Math.cos(angle)*length,a.y+Math.sin(angle)*length,r);
 }
 function burstPoints(a,spots,r){
  return spots.map(([u,v])=>circle(...point(a,u,v),r));
 }
 const patterns = {
  'crown-gems':{name:'왕관 보석 낙하',color:palettes.star,warn:1.10,damage:10,build(a){
   const offset=a.index%2?1.7:0;
   return burstPoints(a,[[0,offset],[-2,-1.55],[2,1.55],[2,-1.55]],1.05);
  }},
  'root-bars':{name:'뿌리 장벽',color:palettes.leaf,warn:1.05,damage:11,build(a){
   const gap=a.index===0?1:-1;
   return [-3,-1,1,3].filter(v=>v!==gap).map(v=>lane(a,v,.39,5.0));
  }},
  'moon-halo':{name:'달무리',color:palettes.moon,warn:1.08,damage:11,build(a){
   return [band(...point(a,0,a.index*.7),1.3,3.8)];
  }},
  'boar-fault':{name:'뿌리 지진',color:palettes.earth,warn:1.13,damage:12,build(a){
   const direction=a.aim+(a.index?.55:0);
   return [ray(a,direction,9,.93),ray(a,direction-.64,7,.49),ray(a,direction+.64,7,.49)];
  }},
  'owl-gust':{name:'교차 돌풍',color:palettes.sky,warn:1.06,damage:11,build(a){
   const angle=a.aim+(a.index?.88:.28);
   return [lane(a,-.7,.59,5.6,angle),lane(a,.66,.59,5.6,angle+Math.PI/2)];
  }},
  'mirror-lanes':{name:'거울 회랑',color:palettes.crystal,warn:1.03,damage:12,build(a){
   const gap=a.index%2?0:(a.phase===2?1:-1);
   return [-2,-1,0,1,2].filter(v=>v!==gap).map(v=>lane(a,v*1.65,.47,5.9));
  }},
  'mirror-echo':{name:'마주 보는 잔상',color:palettes.crystal,warn:1.02,damage:12,build(a){
   const spots=a.index?[[0,0],[-2.2,-2.85],[2.2,2.85]]:[[-2.1,0],[2.1,0],[0,-2.65],[0,2.65]];
   return burstPoints(a,spots,1.22);
  }},
  'ice-paws':{name:'서리 발자국',color:palettes.frost,warn:1.12,damage:14,build(a){
   const offset=a.index*2.35;
   return burstPoints(a,[[offset,0],[offset-2.1,-1.38],[offset+2.1,1.38]],1.49);
  }},
  'frost-ring':{name:'갈라지는 얼음 고리',color:palettes.frost,warn:1.12,damage:13,build(a){
   return a.index===0?[band(a.targetX,a.targetY,1.45,4.05)]:[circle(a.targetX,a.targetY,1.57)];
  }},
  'ember-trail':{name:'잿불 능선',color:palettes.fire,warn:1.05,damage:13,build(a){
   const from=-3.15+a.index*2.85;
   return burstPoints(a,[[from,-.76],[from+1.05,0],[from+2.1,.76]],1.16);
  }},
  'cinder-rays':{name:'용암 삼지창',color:palettes.fire,warn:1.08,damage:13,build(a){
   const angle=a.aim+(a.index?.37:-.16);
   return [-.54,0,.54].map(offset=>ray(a,angle+offset,10.2,.54));
  }},
  'tide-surge':{name:'밀려오는 파도',color:palettes.water,warn:1.12,damage:14,build(a){
   const height=-2.65+a.index*2.65;
   return [lane(a,height,.85,7.5),lane(a,height-1.33,.29,6.65)];
  }},
  'rain-pools':{name:'빗방울 웅덩이',color:palettes.water,warn:1.00,damage:12,build(a){
   const offset=a.index%2?1.35:-1.22;
   return burstPoints(a,[[-2.6,offset],[0,offset],[2.6,offset],[-1.3,-offset],[1.3,-offset]],1.13);
  }},
  'clock-blades':{name:'교차 톱니날',color:palettes.gear,warn:1.06,damage:14,build(a){
   const angle=a.aim+a.index*Math.PI/4;
   return [lane(a,0,.52,6.4,angle),lane(a,0,.52,6.4,angle+Math.PI/2)];
  }},
  'gear-sweep':{name:'회전 절단날',color:palettes.gear,warn:1.00,damage:14,build(a){
   const angle=a.aim+a.index*Math.PI/5;
   return [0,turn/3,turn*2/3].map(offset=>ray(a,angle+offset,8.25,.68));
  }},
  'fox-echo':{name:'여우 그림자 협공',color:palettes.void,warn:1.02,damage:14,build(a){
   const swipe=a.index%2?1:-1;
   const [x,y]=point(a,-4,swipe*3.65);
   const [ex,ey]=point(a,4,-swipe*1.9);
   const [xx,yy]=point(a,-4,-swipe*3.65);
   const [eex,eey]=point(a,4,swipe*1.9);
   return [line(x,y,ex,ey,.66),line(xx,yy,eex,eey,.55)];
  }},
  'void-pockets':{name:'공허에 열린 구멍',color:palettes.void,warn:1.10,damage:15,build(a){
   const shift=a.index%2?.9:-.9;
   return burstPoints(a,[[0,shift],[-2.5,shift-1.85],[2.5,shift+1.85],[-2.5,shift+1.85],[2.5,shift-1.85]],1.40);
  }},
  starfall:{name:'별똥별 소나기',color:palettes.star,warn:1.13,damage:15,build(a){
   const [u,v]=[[0,0],[2.35,1.6],[-2.35,-1.6]][a.index];
   return burstPoints(a,[[u,v],[u-2.9,v+2.5],[u+2.9,v-2.5]],1.58);
  }},
  constellation:{name:'별자리 광선',color:palettes.star,warn:1.10,damage:15,build(a){
   const angle=a.aim+a.index*Math.PI/5;
   return [-1,0,1].map(i=>lane(a,0,.51,6.8,angle+i*Math.PI/3));
  }},
  eclipse:{name:'밤하늘 일식',color:palettes.void,warn:1.22,damage:16,build(a){
   const [x,y]=point(a,a.index===2?2.40:0,0);
   return a.index===1?[circle(x,y,1.70)]:[band(x,y,1.5,4.75)];
  }}
 };
 const repeated = new Set(['mirror-lanes','ember-trail','tide-surge','gear-sweep','starfall','eclipse']);
 const echoes = new Set(['crown-gems','root-bars','moon-halo','owl-gust','boar-fault','mirror-echo','ice-paws',
  'frost-ring','cinder-rays','rain-pools','clock-blades','fox-echo','void-pockets','constellation']);

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
  const hpScale=[.23,.47,1][wave];
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

 function start(kind,boss,player,phase,hurtY){
  const rule=patterns[kind];
  if(!rule)return null;
  const dx=player.x-boss.x,dy=player.y+hurtY-boss.y;
  const aim=Math.atan2(dy,dx);
  const warned=Math.max(.84,rule.warn+.10*(boss.bossDef.final?0:1)-.08*phase-.07*boss.bossDef.advanced);
  const volleys=repeated.has(kind)?(phase===0?2:3):echoes.has(kind)?(phase===0?1:2):1;
  const action={type:'campaign-warn',kind,phase,rule,aim,volleys,warned,timer:warned,index:0,
   x:boss.x,y:boss.y,targetX:player.x,targetY:player.y+hurtY};
  action.hazards=rule.build(action);
  return action;
 }

 function overlaps(hazard,x,y,radius){
  if(hazard.ex===undefined){
   const d=Math.hypot(x-hazard.x,y-hazard.y);
   return d<hazard.r+radius&&(hazard.inner===undefined||d+radius>hazard.inner);
  }
  const dx=hazard.ex-hazard.x,dy=hazard.ey-hazard.y;
  const along=Math.max(0,Math.min(1,((x-hazard.x)*dx+(y-hazard.y)*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(x-hazard.x-along*dx,y-hazard.y-along*dy)<hazard.r+radius;
 }

 function advance(action,dt,player,hurtY,hurtRadius,onHit,onComplete){
  action.timer-=dt;
  if(action.timer>0)return;
  if(action.type==='campaign-warn'){
   if(action.hazards.some(hazard=>overlaps(hazard,player.x,player.y+hurtY,hurtRadius)))
    onHit(action.rule.damage,action.rule.name);
   action.type='campaign-strike';
   action.timer=.23;
   return;
  }
  action.index++;
  if(action.index>=action.volleys){onComplete();return;}
  action.type='campaign-warn';
  action.timer=Math.max(.72,action.warned*.83);
  action.hazards=action.rule.build(action);
 }

 function drawHazard(ctx,hazard){
  const {x,y,r,inner,ex,ey}=hazard;
  ctx.beginPath();
  if(ex!==undefined){
   const dx=ex-x,dy=ey-y,side=Math.atan2(dy,dx)+Math.PI/2;
   ctx.arc(x,y,r,side,side+Math.PI);
   ctx.arc(ex,ey,r,side+Math.PI,side+turn);
  }else{
   ctx.arc(x,y,r,0,turn);
   if(inner!==undefined){
    ctx.moveTo(x+inner,y);
    ctx.arc(x,y,inner,turn,0,true);
   }
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
 }

 function draw(ctx,action){
  if(!action||!action.hazards)return;
  const winding=action.type==='campaign-warn';
  ctx.save();
  ctx.setLineDash(winding?[.27,.14]:[]);
  ctx.lineWidth=winding?.083:.10;
  ctx.fillStyle=action.rule.color+(winding?'42':'a9');
  ctx.strokeStyle='#322541';
  for(const hazard of action.hazards)drawHazard(ctx,hazard);
  ctx.lineWidth=.046;
  ctx.strokeStyle=action.rule.color;
  ctx.fillStyle='#00000000';
  for(const hazard of action.hazards)drawHazard(ctx,hazard);
  ctx.restore();
 }

 function drawDash(ctx,boss,action){
  if(action?.type!=='dash-warn')return;
  const {x,y,r}=boss,{aim,travel}=action;
  const d=line(x,y,x+Math.cos(aim)*travel,y+Math.sin(aim)*travel,r-.08);
  ctx.save();
  ctx.setLineDash([.3,.19]);
  ctx.lineWidth=.075;
  ctx.fillStyle='#ee917344';
  ctx.strokeStyle='#512c3e';
  drawHazard(ctx,d);
  ctx.restore();
 }

 return {art,definition,start,advance,draw,drawDash};
})();
