const NEMO_DRAW = Object.freeze({
 cost:100,
 costumeChance:.05,
 photoRefund:25,
 costumeRefund:50,
 purchase(save,photos,costumes,random=Math.random,now=Date.now()){
  if(save.gold<this.cost||!photos.length||!costumes.length)return null;
  const type=random()<this.costumeChance?'costume':'photo';
  const pool=type==='costume'?costumes:photos;
  const total=pool.reduce((sum,item)=>sum+(type==='photo'?(item.weight||1):1),0);
  let cursor=Math.max(0,Math.min(.999999999,random()))*total;
  const item=pool.find(item=>{cursor-=type==='photo'?(item.weight||1):1;return cursor<0;})||pool.at(-1);
  const field=type==='costume'?'costumesOwned':'photosOwned';
  const owned=save[field]??[];
  const duplicate=owned.includes(item.id);
  const refund=duplicate?(type==='costume'?this.costumeRefund:this.photoRefund):0;
  return {
   save:{...save,gold:save.gold-this.cost+refund,drawCount:(save.drawCount??0)+1,
    [field]:duplicate?[...owned]:[...owned,item.id],
    photosObtainedAt:type==='photo'&&!duplicate?{...save.photosObtainedAt,[item.id]:now}:{...save.photosObtainedAt}},
   reward:{type,item,duplicate,refund}
  };
 }
});
