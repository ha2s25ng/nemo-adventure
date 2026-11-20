const NEMO_DRAW = Object.freeze({
 cost:100,
 costumeChance:.05,
 photoRefund:25,
 costumeRefund:50,
 purchase(save,photos,costumes,random=Math.random){
  if(save.gold<this.cost||!photos.length||!costumes.length)return null;
  const type=random()<this.costumeChance?'costume':'photo';
  const pool=type==='costume'?costumes:photos;
  const item=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
  const field=type==='costume'?'costumesOwned':'photosOwned';
  const owned=save[field]??[];
  const duplicate=owned.includes(item.id);
  const refund=duplicate?(type==='costume'?this.costumeRefund:this.photoRefund):0;
  return {
   save:{...save,gold:save.gold-this.cost+refund,drawCount:(save.drawCount??0)+1,
    [field]:duplicate?[...owned]:[...owned,item.id]},
   reward:{type,item,duplicate,refund}
  };
 }
});
