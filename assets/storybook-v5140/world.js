// Layered, scrolling environments: one shared ground atlas and eight prop kits.
const NEMO_STORYBOOK_WORLD = (() => {
 'use strict';
 const root='./assets/storybook-v5140/';
 const regions=['garden','twilight','crystal','frost','ember','tide','clock','astral'];
 const names=['tree','bush','rock','flowers','mushrooms','landmark','pool','lantern'];
 const palettes=[
  ['#c4c735','#e5bd77','#77bcc1','#718e43'],['#328d86','#a0a397','#5bafb8','#466869'],
  ['#9dd59e','#d1c6bc','#8bc1ce','#83aaa6'],['#d7e4fb','#eee5d7','#89b3ce','#b3cbd2'],
  ['#e17e4f','#d7ad76','#e8a353','#9d7155'],['#fadcae','#f3dfb6','#76c9c3','#a4b997'],
  ['#a5ab3f','#d5ad78','#8ab7a5','#8b995a'],['#747fce','#b2acc4','#7eacc9','#687e99']
 ];
 const frames=Object.fromEntries(regions.flatMap(region=>names.map((name,frame)=>[
  'storybook-'+region+'-'+name,{sheet:'storybook-'+region,frame}
 ])));
 const assetPaths=Object.fromEntries(regions.map(region=>['storybook-'+region,root+region+'.webp']));
 assetPaths.storybookGround=root+'ground.webp';
 assetPaths['storybook-features']=root+'features.webp';
 for(const [frame,region] of regions.entries())frames['storybook-feature-'+region]={sheet:'storybook-features',frame};
 function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
 function nearPath(x,y,r,paths,widths){
  return paths.some((route,j)=>route.slice(1).some((b,i)=>{
   const a=route[i],dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy;
   const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/d));
   return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<widths[j]/2+r;
  }));
 }
 function adventureComposition(map,region,index,trees,pools,landmarks){
  const rand=random(93531+index*179),kit='storybook-'+region+'-';
  const scenes=[];
  const safe=(x,y,r)=>Math.hypot(x,y)>6.5+r&&!nearPath(x,y,r+.7,map.paths,map.pathWidths);
  const separated=(x,y,r)=>!scenes.some(p=>Math.hypot(x-p.x,y-p.y)<r);
  // A readable landmark on one side of the opening, a pond on the other.
  for(const [x,y] of [[-7.8,4.8],[-7.8,6.2],[8.2,5.8],[8,-3.8],[-8,-3.8]]){
   if(safe(x,y,1.35)){scenes.push({x,y,kind:'feature',h:4.7,w:4.7});break;}
  }
  for(const [x,y] of [[9.8,-4.3],[-9.8,-4.3],[10.8,-5.8],[-10.8,-5.8],[10.2,4.6],[-10.8,5.7]]){
   if(safe(x,y,1.9)&&separated(x,y,9)&&landmarks.every(p=>Math.hypot(x-p[0],y-p[1])>5)){scenes.push({x,y,kind:'pool',h:3.9,w:6.2});break;}
  }
  // Small composed pockets extend beyond spawn, instead of a tree-only grid.
  for(let x=-64;x<=64;x+=22)for(let y=-60;y<=60;y+=18){
   const tx=x+(rand()-.5)*4,ty=y+(rand()-.5)*3;
   if(Math.hypot(tx,ty)<18||!safe(tx,ty,1.5)||!separated(tx,ty,10))continue;
   if(landmarks.some(p=>Math.hypot(tx-p[0],ty-p[1])<6))continue;
   const pick=rand(),kind=pick<.42?'feature':pick<.76?'house':'pool';
   scenes.push({x:tx,y:ty,kind,h:kind==='feature'?4.3+rand()*.5:3.5,w:kind==='feature'?5.2:kind==='pool'?6:3.9});
  }
  // Clear foliage around landmark silhouettes, not the broad routes themselves.
  const dressing=trees.filter(t=>!scenes.some(p=>Math.hypot(t.x-p.x,t.y-p.y)<(p.kind==='pool'?4.5:4.3)));
  const keptPools=pools.filter(p=>!scenes.some(scene=>Math.hypot(p[0]-scene.x,p[1]-scene.y)<7));
  for(const scene of scenes){
   if(scene.kind==='pool')keptPools.push([scene.x,scene.y,scene.w,scene.h,1.85,1.0]);
   else dressing.push({key:scene.kind==='feature'?'storybook-feature-'+region:kit+'landmark',x:scene.x,y:scene.y,h:scene.h,w:scene.kind==='feature'?scene.h:scene.w,rx:scene.kind==='feature'?1.35:1.0,ry:.55});
  }
  return {dressing,pools:keptPools,landmarks,sceneAnchors:scenes,storybookFeatures:true};
 }
 function decorate(map,index){
  const region=map.region,cell=regions.indexOf(region),survival=index<0;
  const [ground,trail,water,fleck]=palettes[cell];
  const rand=random(71517+(index+1)*877),kit='storybook-'+region+'-';
  const clear=(x,y,r)=>Math.hypot(x,y)>7.5+r&&!nearPath(x,y,r+.55,map.paths,map.pathWidths);
  const dressing=[];
  // Authored clusters frame the starting view; further groves extend across the world.
  for(const [x,y,h] of [[-11,-3,4.8],[12,-2,4.5],[-9,8,4.4],[13,9,4.8],[-16,-10,4.5],[4,-10,4.3],[-19,3,4.7],[20,-8,4.6]]){
   if(clear(x,y,.55))dressing.push({key:kit+'tree',x,y,h,rx:.40,ry:.25});
  }
  const pools=[];
  for(const [x,y] of [[-11,5],[18,-9],[-31,-20],[37,22],[-44,31]]){
   if(clear(x,y,2.1))pools.push([x,y,6.2,3.7,1.9,1.05]);
  }
  const landmarks=[];
  for(const [x,y] of [[10,6],[-20,14],[32,-20],[-37,-24],[42,29],[-47,40]]){
   if(clear(x,y,1.1))landmarks.push([x,y,3.7,1.0,.55]);
  }
  for(let x=-68;x<=68;x+=10.5)for(let y=-65;y<=65;y+=10.5){
   const tx=x+(rand()-.5)*4,ty=y+(rand()-.5)*4;
   if(!clear(tx,ty,.65)||dressing.some(t=>Math.hypot(tx-t.x,ty-t.y)<4.8)||pools.some(p=>Math.hypot(tx-p[0],ty-p[1])<5)||landmarks.some(p=>Math.hypot(tx-p[0],ty-p[1])<4.5))continue;
   dressing.push({key:kit+'tree',x:tx,y:ty,h:3.9+rand()*1.1,rx:.38,ry:.24,flip:rand()<.5?-1:1});
  }
  const composition=survival?{landmarks,pools,dressing,sceneAnchors:[],storybookFeatures:false}:adventureComposition(map,region,index,dressing,pools,landmarks);
  return {...map,ground:survival?'#61a650':ground,trail,water,fleck,storybook:true,groundCell:survival?8:cell,
   landmarkKey:kit+'landmark',poolArt:kit+'pool',...composition,
   // Endless gets a distinct golden meadow with a small mushroom hamlet.
   name:survival?'햇살 버섯 숲':map.name,storybookKits:survival?['garden','clock']: [region],
   preview:root+region+'.webp',decorSeed:19374+(index+1)*893};
 }
 function makeDecor(map,world,center){
  const rand=random(map.decorSeed),dressing=[],trailFlecks=[],trees=[...map.dressing];
  const key=name=>'storybook-'+map.region+'-'+name;
  function free(x,y,r=.45){
   if(nearPath(x-center,y-center,r,map.rawPaths,map.pathWidths))return false;
   return ![...map.structures,...map.pools,...trees].some(p=>Math.hypot(x-p.x,y-p.y)<(p.w?3:1.1)+r);
  }
  // Small, nonblocking details are dense enough to accompany exploration.
  for(let i=0;i<(map.storybookFeatures?1300:2300);i++){
   const x=3+rand()*(world-6),y=3+rand()*(world-6);
   if(!free(x,y))continue;
   const n=rand(),name=n<.45?'flowers':n<.67?'mushrooms':n<.85?'bush':'rock';
   const size=rand(),h=map.storybookFeatures?(name==='bush'?1.1+size*.5:name==='rock'?.85+size*.6:name==='mushrooms'?.7+size*.45:.65+size*.4):(name==='bush'?.7+size*.45:name==='rock'?.5+size*.6:.35+size*.35);
   dressing.push({key:key(name),x,y,h,flip:rand()<.5?-1:1});
  }
  // Hand placed details make the first screen feel like the approved concepts.
  for(const [x,y,name,h] of [[-6,3,'flowers',.7],[5,-3,'flowers',.65],[-7,-3,'mushrooms',.8],[8,5,'bush',1.1],[-12,4,'rock',1.1],[10,-3,'lantern',1.9],[4,7,'mushrooms',.75],[-8,1,'flowers',.65]]){
   dressing.push({key:key(name),x:center+x,y:center+y,h});
  }
  for(const scene of map.sceneAnchors??[]){
   // Nearby flowers, stones and lamps read as one little place, not scattered dots.
   for(const [dx,dy,name,h] of [[-2.5,.5,'flowers',1.05],[2.7,.8,'bush',1.3],[-2.7,-.8,'lantern',1.9],[2.5,-1.2,'mushrooms',.95],[1.8,1.9,'flowers',1.1],[-1.8,1.8,'rock',1.1]]){
    const x=center+scene.x+dx,y=center+scene.y+dy;
    if(free(x,y,.3))dressing.push({key:key(name),x,y,h});
   }
  }
  if(map.groundCell===8){
   for(const [x,y,h] of [[11,-5,3.7],[-13,8,3.4],[-22,-13,3.7],[29,14,3.8]]){
    if(free(center+x,center+y,1.2)&&Math.hypot(x,y)>8)
     trees.push({key:'storybook-clock-landmark',x:center+x,y:center+y,h,rx:1,ry:.55});
   }
   for(const [x,y] of [[-8,-5],[12,4],[-18,12]])dressing.push({key:'storybook-clock-lantern',x:center+x,y:center+y,h:1.8});
  }
  for(const {x,y,dx,dy,length,width} of map.sections)for(let i=0;i<Math.ceil(length*1.7);i++){
   const t=rand(),off=(rand()-.5)*width*.85;
   trailFlecks.push({x:x+t*dx-off*dy/length,y:y+t*dy+off*dx/length,s:.018+rand()*.045,stone:i%4===0});
  }
  return {map,trees,dressing,trailFlecks,grain:[]};
 }
 return Object.freeze({version:'5.14.2',regions,frames,assetPaths,decorate,makeDecor});
})();
