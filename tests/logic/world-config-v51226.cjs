'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
module.exports=function worldConfigChecks(){
try{
const root=path.resolve(__dirname,'../..');
const context=vm.createContext({});
for(const relative of ['assets/campaign-v573/stages.js','assets/stage-v51226/campaign.js','assets/world-v51226/world.js']){
 vm.runInContext(fs.readFileSync(path.join(root,relative),'utf8'),context,{filename:relative});
}
const world=vm.runInContext('NEMO_WORLD_RENEWAL',context);
const stages=vm.runInContext('NEMO_CAMPAIGN_RENEWAL.stages',context);
assert.equal(world.maps.length,30);
assert.equal(Object.keys(world.palettes).length,8);
assert.equal(new Set(world.maps.map(map=>map.ground)).size,8);
assert.equal(world.worldSize,160);
assert.equal(world.centralClearing,8);
assert.equal(Object.isFrozen(world.maps),true);

function pointSegmentDistance(x,y,a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1];
 const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
 return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);
}
for(const map of [...world.maps,world.survivalMap]){
 assert.equal(map.cleanGround,true);
 assert.equal(map.texture,undefined,'old stretched ground texture must not be used');
 assert.equal(map.groundTextureAlpha,undefined);
 assert.ok(map.art.endsWith('/'+map.region+'.webp'));
 assert.equal(map.landmarks.length,1,'regional landmark should not be cloned');
 assert.equal(map.landmarks[0].join(','),'11,-9,3.8,1.1,0.65');
 assert.ok(map.pools.length<=1);
 assert.equal(map.landmarkPool,false,'a landmark illustration must not masquerade as water');
 assert.equal(map.paths.length,3);
 assert.ok(map.pathWidths.every(width=>width>=2.9),'routes allow space for evasive movement');
 for(const route of map.paths){
  assert.ok(route.some(([x,y])=>x===0&&y===0),'all routes must join the central clearing');
  for(const [x,y] of route)assert.ok(Math.abs(x)<=70&&Math.abs(y)<=70,'raw world-center offsets remain in bounds');
 }
 assert.ok(map.dressing.length>=3&&map.dressing.length<=4,'keep tree density sparse and authored');
 const obstacles=[
  ...map.landmarks.map(([x,y,h,rx,ry])=>({x,y,h,rx,ry})),
  ...map.pools.map(([x,y,w,h,rx,ry])=>({x,y,w,h,rx,ry})),
  ...map.dressing
 ];
 for(const item of obstacles){
  assert.ok(Math.hypot(item.x,item.y)-Math.max(item.h,item.w??item.h)>=8,'entire starting area is visually clear');
  assert.ok(Math.abs(item.x)+Math.max(item.h,item.w??item.h)<80);
  assert.ok(Math.abs(item.y)+Math.max(item.h,item.w??item.h)<80);
  map.paths.forEach((route,index)=>{
   for(let i=1;i<route.length;i++){
    assert.ok(pointSegmentDistance(item.x,item.y,route[i-1],route[i])>map.pathWidths[index]/2+Math.max(item.rx,item.ry),'blocking bases must sit off the paths');
   }
  });
 }
 for(const prop of map.dressing){
  assert.ok(world.assetPaths[prop.key],'tree uses a registered common asset');
  assert.ok(prop.rx<.5&&prop.ry<.5,'tree collision follows a small trunk footprint');
 }
 if(map.id)assert.equal(map.name,stages[map.id-1].name);
}
assert.equal(world.survivalMap.id,0);
assert.equal(world.survivalMap.dressing.length,4);
return {passed:1,total:1,failures:[],detail:'30 maps + survival, 8 clean palettes, connected broad routes and a clear starting area'};
}catch(error){return {passed:0,total:1,failures:[{name:'world registry invariants',error:error.stack}],detail:'world data validation'};}
};
if(require.main===module){const result=module.exports();console.log(`${result.failures.length?'FAIL':'PASS'} ${result.detail}`);for(const failure of result.failures)console.error(failure.error);process.exitCode=result.failures.length?1:0;}
