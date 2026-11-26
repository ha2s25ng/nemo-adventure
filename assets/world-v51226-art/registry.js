// Crisp storybook world renewal assets. Four unique walking phases per monster.
// Sprites use a single stable three-quarter view; callers mirror with pose.face.
const NEMO_WORLD_RENEWAL_ART=Object.freeze({
 version:'5.13.0',
 regions:Object.freeze({
  garden:'./assets/world-v51226-art/garden.webp',
  twilight:'./assets/world-v51226-art/twilight.webp',
  crystal:'./assets/world-v51226-art/crystal.webp',
  frost:'./assets/world-v51226-art/frost.webp',
  ember:'./assets/world-v51226-art/ember.webp',
  tide:'./assets/world-v51226-art/tide.webp',
  clock:'./assets/world-v51226-art/clock.webp',
  astral:'./assets/world-v51226-art/astral.webp'
 }),
 props:Object.freeze({
  oak:'./assets/world-v51226-art/oak.webp',
  blossom:'./assets/world-v51226-art/blossom.webp',
  pond:'./assets/world-v51226-art/pond.webp'
 }),
 enemies:Object.freeze({
  green:{assetPath:'./assets/world-v51226-art/green-walk.webp',frame:256,frames:4,columns:4,rows:1,anchor:234},
  fat:{assetPath:'./assets/world-v51226-art/fat-walk.webp',frame:256,frames:4,columns:4,rows:1,anchor:234},
  spore:{assetPath:'./assets/world-v51226-art/spore-walk.webp',frame:256,frames:4,columns:4,rows:1,anchor:234},
  bramble:{assetPath:'./assets/world-v51226-art/bramble-walk.webp',frame:256,frames:4,columns:4,rows:1,anchor:234},
  thief:{assetPath:'./assets/world-v51226-art/thief-walk.webp',frame:256,frames:4,columns:4,rows:1,anchor:234},
  boss:{assetPath:'./assets/world-v51226-art/crown-walk.webp',frame:256,frames:4,columns:4,rows:1,anchor:234}
 })
});
