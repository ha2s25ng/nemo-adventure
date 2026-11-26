'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const {createHarness}=require('./harness.cjs');

const ROOT=path.resolve(__dirname,'../..');
const ART='assets/world-v51226-art/';
const RUNTIME_KINDS=['green','fat','spore','bramble','thief','boss'];
const FILE_KINDS=['green','fat','spore','bramble','thief','crown'];
const REGIONS=['garden','twilight','crystal','frost','ember','tide','clock','astral'];
const absolute=file=>path.resolve(ROOT,file.replace(/^\.\//,''));
const normalize=file=>file.replace(/^\.\//,'');

// Read actual RIFF chunk headers rather than trusting a file suffix or manifest.
// Pixel-level alpha and frame identity are independently audited in the fixture;
// the SHA256 below pins those decoded RGBA results to the exact tested WebP bytes.
function webpHeader(buffer){
 assert.equal(buffer.toString('ascii',0,4),'RIFF');
 assert.equal(buffer.toString('ascii',8,12),'WEBP');
 assert.equal(buffer.readUInt32LE(4)+8,buffer.length,'RIFF payload must be complete');
 const info={width:0,height:0,alpha:false,animated:false};
 for(let offset=12;offset+8<=buffer.length;){
  const chunk=buffer.toString('ascii',offset,offset+4),length=buffer.readUInt32LE(offset+4),start=offset+8;
  assert.ok(start+length<=buffer.length,'truncated '+chunk+' chunk');
  if(chunk==='VP8X'){
   info.alpha=!!(buffer[start]&0x10);info.animated=!!(buffer[start]&2);
   info.width=1+buffer.readUIntLE(start+4,3);info.height=1+buffer.readUIntLE(start+7,3);
  }else if(chunk==='VP8L'){
   assert.equal(buffer[start],0x2f,'lossless WebP signature');
   const bits=buffer.readUInt32LE(start+1);
   assert.equal(bits>>>29,0,'supported VP8L version');
   info.width=1+(bits&0x3fff);info.height=1+((bits>>>14)&0x3fff);info.alpha||=!!(bits&0x10000000);
  }else if(chunk==='ANIM'||chunk==='ANMF')info.animated=true;
  offset=start+length+(length&1);
 }
 assert.ok(info.width>0&&info.height>0,'missing WebP canvas dimensions');
 return info;
}

module.exports=function worldArtChecks(){
 const results=[];
 const check=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(error){results.push({name,pass:false,error:error.stack});}};
 const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,ART,'manifest.json'),'utf8'));
 const fixture=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/world-art-v5130.json'),'utf8'));
 const context=vm.createContext({});
 vm.runInContext(fs.readFileSync(path.join(ROOT,ART,'registry.js'),'utf8'),context);
 const registry=vm.runInContext('NEMO_WORLD_RENEWAL_ART',context);
 const pixels=new Map(fixture.assets.map(item=>[item.file,item]));

 check('all 17 generated asset identities and registry paths exist',()=>{
  assert.equal(manifest.assets.length,17);assert.equal(new Set(manifest.assets.map(item=>item.id)).size,17);
  assert.equal(manifest.assets.filter(item=>item.type==='landmark').length,8);
  assert.equal(manifest.assets.filter(item=>item.type==='prop').length,3);
  assert.equal(manifest.assets.filter(item=>item.type==='enemy').length,6);
  assert.deepEqual(Object.keys(registry.regions).sort(),[...REGIONS].sort());
  assert.deepEqual(Object.keys(registry.enemies).sort(),[...RUNTIME_KINDS].sort());
  for(const item of manifest.assets){
   assert.ok(fs.statSync(absolute(item.file)).isFile(),item.file);
   assert.ok(pixels.has(item.file),'decoded pixel audit missing '+item.file);
   assert.deepEqual(pixels.get(item.file).dimensions,item.dimensions,item.id);
  }
  for(const [index,kind] of RUNTIME_KINDS.entries()){
   const record=registry.enemies[kind];
   assert.equal(normalize(record.assetPath),ART+FILE_KINDS[index]+'-walk.webp',kind);
   assert.equal(record.frame,256);assert.equal(record.frames,4);assert.equal(record.columns,4);assert.equal(record.rows,1);assert.equal(record.anchor,234);
  }
 });

 check('23 runtime WebPs have real dimensions, genuine decoded transparency and pinned bitmap bytes',()=>{
  assert.equal(pixels.size,23);
  for(const item of fixture.assets){
   const buffer=fs.readFileSync(absolute(item.file)),header=webpHeader(buffer);
   assert.deepEqual([header.width,header.height],item.dimensions,item.file);
   assert.equal(header.animated,false,item.file+' must be a static sprite/strip');
   assert.equal(header.alpha,true,item.file+' must contain alpha');
   assert.equal(buffer.length,item.bytes,item.file+' byte size');
   assert.equal(createHash('sha256').update(buffer).digest('hex'),item.sha256,item.file+' changed: re-audit actual decoded pixels');
   assert.equal(item.alphaMin,0,item.file);assert.equal(item.alphaMax,255,item.file);
   assert.ok(item.transparentPixels>1000,item.file+' needs clear transparent space');
   assert.ok(item.visiblePixels>item.dimensions[0]*item.dimensions[1]*.1,item.file+' must contain visible artwork');
  }
 });

 check('six monster strips contain four distinct RGBA gait frames with consistent baseline',()=>{
  for(const kind of FILE_KINDS){
   const item=pixels.get(ART+kind+'-walk.webp');
   assert.deepEqual(item.dimensions,[1024,256],kind);assert.equal(item.frames.length,4,kind);
   assert.equal(new Set(item.frames.map(frame=>frame.rgbaSha256)).size,4,kind+' must not duplicate one idle frame');
   for(const frame of item.frames){
    assert.ok(frame.bounds[0]>=0&&frame.bounds[2]<=256,kind+' horizontal crop');
    assert.ok(frame.bounds[1]>=0&&frame.bounds[3]<=234&&frame.bounds[3]>=220,kind+' foot baseline');
    assert.ok(frame.transparentPixels>1000,kind+' frame separation');
   }
  }
 });

 check('actual engine preloads the 23 used files and removes obsolete renewed direction atlases',()=>{
  const {game}=createHarness();
  const runtime=new Set(Object.values(game.ASSET_DATA).filter(file=>file.includes('/world-v51226-art/')).map(normalize));
  assert.deepEqual([...runtime].sort(),[...pixels.keys()].sort());
  for(const kind of RUNTIME_KINDS){
   assert.equal(normalize(game.ASSET_DATA['renewalEnemy_'+kind]),normalize(registry.enemies[kind].assetPath),kind);
   for(const suffix of ['directions','gait','move-1','move-2','attack','hit'])
    assert.equal(game.ASSET_DATA['enemy_'+kind+'_'+suffix],undefined,kind+' should not preload superseded '+suffix);
  }
  for(const map of [...game.CAMPAIGN_MAPS,game.SURVIVAL_MAP])assert.equal(normalize(game.ASSET_DATA[map.key]),normalize(registry.regions[map.region]),map.region);
 });

 check('six actual monster and crown-boss draw paths select all four 256px cells in both modes',()=>{
  const {game,drawCalls}=createHarness(123456,true);
  for(const stage of [0,1]){
   game.menu();game.begin(stage);const g=game.g,p=g.player;g.weapons={};g.enemies=[];
   const enemies=RUNTIME_KINDS.map((kind,index)=>game.spawn(kind,{x:p.x+1+(index%3)*.8,y:p.y-1+Math.floor(index/3)*1.5}));
   for(const direction of ['down','down-right','right','up-right','up','up-left','left','down-left'])for(let frame=0;frame<4;frame++){
    for(const enemy of enemies){enemy.gait=1;enemy.stride=(frame+.125)/4;enemy.phase=0;enemy.moveDirection=direction;}
    drawCalls.length=0;game.drawBattle();
    for(const kind of RUNTIME_KINDS){
     const url=game.ASSET_DATA['renewalEnemy_'+kind];
     const calls=drawCalls.filter(call=>call.src===url);
     assert.equal(calls.length,1,kind+': one renewed monster draw, stage '+stage+' frame '+frame+' direction '+direction);
     const args=calls[0].args;
     assert.equal(args.length,8,kind+' atlas draw');
     assert.deepEqual(args.slice(0,4),[frame*256,0,256,256],kind+' selects horizontal strip, not old direction rows');
     assert.ok(args[6]>0&&args[7]>0,kind+' positive destination size');
     assert.ok(Math.abs(args[5]+args[7]*234/256)<1e-10,kind+' foot anchor');
    }
    for(const call of drawCalls)assert.ok(call.args.every(Number.isFinite),'finite in-game image coordinates');
    assert.equal(drawCalls.some(call=>/enemy-directions-v5813|creature-storybook-v597\/boss\.png/.test(call.src||'')),false,'renewed creatures must win before legacy atlas branches');
   }
  }
 });

 check('eight regional landmarks and common trees/pond use renewed bitmaps in the actual world renderer',()=>{
  const {game,drawCalls}=createHarness(13579,true);
  game.saved=game.normalizeSave({...game.saved,stagesCleared:30});
  const firstMaps=REGIONS.map(region=>game.CAMPAIGN_MAPS.find(map=>map.region===region));
  for(const map of firstMaps){
   game.menu();game.begin(map.id);const g=game.g,landmark=g.map.structures[0];
   g.camera={x:landmark.x,y:landmark.y};g.player.x=landmark.x;g.player.y=landmark.y;
   drawCalls.length=0;game.drawBattle();
   assert.ok(drawCalls.some(call=>normalize(call.src||'')===normalize(registry.regions[map.region])),map.region+' landmark missing in actual frame');
  }
  game.menu();game.begin();const g=game.g;
  for(const [key,file] of Object.entries({renewalOak:registry.props.oak,renewalBlossom:registry.props.blossom,renewalPond:registry.props.pond})){
   const prop=[...g.map.landmarks,...g.deco.trees].find(item=>item.key===key);
   assert.ok(prop,key+' authored in survival world');g.camera={x:prop.x,y:prop.y};
   drawCalls.length=0;game.drawBattle();
   assert.ok(drawCalls.some(call=>normalize(call.src||'')===normalize(file)),key+' absent from actual frame');
  }
 });

 const failures=results.filter(result=>!result.pass);
 return {passed:results.length-failures.length,total:results.length,failures,detail:'17 generated designs, 23 pinned transparent WebPs, six 4-frame gait strips, 384 actual monster/boss draws and eight regional landmarks'};
};
if(require.main===module){const result=module.exports();console.log(`${result.failures.length?'FAIL':'PASS'} ${result.passed}/${result.total}: ${result.detail}`);for(const failure of result.failures)console.error(failure.name+'\n'+failure.error);process.exitCode=result.failures.length?1:0;}
