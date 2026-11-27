'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {createHarness}=require('./harness.cjs');
module.exports=function storybookWorldChecks(){
 const results=[];
 const check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.stack});}};
 const root=path.resolve(__dirname,'../..');
 check('actual exported atlases preserve alpha and have distinct cells',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/storybook-v5140/manifest.json'),'utf8'));
  assert.equal(manifest.assets.length,9);
  for(const asset of manifest.assets){
   const file=fs.readFileSync(path.join(root,'assets/storybook-v5140',asset.file));
   assert.equal(createHash('sha256').update(file).digest('hex'),asset.sha256,asset.file+' audit matches deployed bytes');
   const ground=asset.file==='ground.webp';assert.equal(asset.cells.length,ground?9:8);
   assert.equal(new Set(asset.cells.map(cell=>cell.digest)).size,asset.cells.length,'each material/prop is distinct');
   for(const cell of asset.cells){
    assert.ok(cell.bounds&&cell.bounds[2]>cell.bounds[0]&&cell.bounds[3]>cell.bounds[1],'nonempty artwork');
    assert.equal(cell.alphaRange[1],255);
    if(!ground)assert.equal(cell.alphaRange[0],0,'sprite cells need transparent surroundings');
   }
  }
 });
 check('all 30 maps and endless retain open connected routes and navigable start',()=>{
  const {game}=createHarness(5512);
  game.saved=game.normalizeSave({...game.saved,stagesCleared:30});
  const modes=[0,...game.NEMO_STAGES.map(s=>s.id)];
  for(const id of modes){
   game.menu();game.begin(id);const g=game.g,map=g.map;
   assert.equal(map.storybook,true);assert.equal(map.groundCell,id?['garden','twilight','crystal','frost','ember','tide','clock','astral'].indexOf(map.region):8);
   assert.ok(g.deco.trees.length>70&&g.deco.trees.length<240,'bounded groves across scrolling world');
   assert.ok(g.deco.dressing.length>400&&g.deco.dressing.length<2400,'bounded dense small props');
   const obstacles=[...map.structures,...map.pools,...g.deco.trees];
   const blocked=(x,y)=>obstacles.some(p=>((x-p.x)/((p.rx??.4)+.3))**2+((y-p.y)/((p.ry??.25)+.3))**2<1);
   for(let x=76;x<=84;x+=1)for(let y=76;y<=84;y+=1)assert.equal(blocked(x,y),false,'safe starting clearing');
   // Traverse all authored route centerlines using the actual obstacle footprints.
   for(const route of map.rawPaths)for(let i=1;i<route.length;i++){
    const a=route[i-1],b=route[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);
    for(let k=0;k<=steps;k++)assert.equal(blocked(80+a[0]+(b[0]-a[0])*k/steps,80+a[1]+(b[1]-a[1])*k/steps),false,'broad route not blocked');
   }
  }
 });
 check('each themed renderer crops a single kit and does not draw foreign biome props',()=>{
  const {game,drawCalls}=createHarness(8291,true);game.saved=game.normalizeSave({...game.saved,stagesCleared:30});
  const regions=['garden','twilight','crystal','frost','ember','tide','clock','astral'];
  for(const region of regions){
   const map=game.CAMPAIGN_MAPS.find(m=>m.region===region);game.menu();game.begin(map.id);
   drawCalls.length=0;game.drawBattle();
   const calls=drawCalls.filter(c=>c.src?.includes('/storybook-v5140/'));
   assert.ok(calls.some(c=>c.src.endsWith('/ground.webp')));
   assert.ok(calls.some(c=>c.src.endsWith('/'+region+'.webp')));
   assert.ok(calls.length<160,'view culling keeps atlas draw count bounded');
   for(const c of calls){assert.equal(c.args.length,8);assert.ok(c.args.every(Number.isFinite));assert.ok(c.args[2]>0&&c.args[3]>0&&c.args[6]>0&&c.args[7]>0);}
   assert.equal(calls.some(c=>!c.src.endsWith('/ground.webp')&&!c.src.endsWith('/'+region+'.webp')),false,'no mismatched region kit');
  }
 });
 const failures=results.filter(x=>!x.pass);
 return {passed:results.length-failures.length,total:results.length,failures,detail:'9 audited atlases, 31 playable environments, clear routes, bounded rendering and correct region kits'};
};
if(require.main===module){const r=module.exports();console.log(r.passed+'/'+r.total,r.detail);for(const f of r.failures)console.error(f.name+'\n'+f.error);process.exitCode=r.failures.length?1:0;}
