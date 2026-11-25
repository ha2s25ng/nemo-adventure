'use strict';

const assert = require('node:assert/strict');
const { createHarness, runFrame } = require('./harness.cjs');

module.exports = function engineChecks() {
  const { game, storage } = createHarness();
  const results = [];
  const weaponIds = Object.keys(game.W);
  const stageCount = game.NEMO_STAGES.length;
  function check(name, action) {
    try {
      action();
      results.push({ name, pass: true });
    } catch (error) {
      results.push({ name, pass: false, error: error.stack });
    }
  }
  function finiteEntity(entity, label) {
    for (const key of ['x', 'y', 'hp', 'maxHp', 'speed', 'damage', 'dmg', 'r', 'life']) {
      if (entity[key] !== undefined) {
        assert(Number.isFinite(entity[key]), `${label}.${key}=${entity[key]}`);
      }
    }
  }

  check('default save schema and menu codex for all weapons', () => {
    assert.equal(game.saved.version, game.DATA.version);
    assert.equal(game.saved.gold, 0);
    assert.equal(game.saved.stagesCleared, 0);
    assert.equal(game.saved.costumeEquipped, 'default');
    assert(Object.values(game.saved.upgrades).every(value => value === 0));
    game.menu();
    game.openCodex();
    assert.equal(game.screen, 'codex');
    for (const id of weaponIds) {
      const numbers = game.weaponNumbers(id);
      assert.equal(numbers.length, 4);
      for (const stat of numbers) {
        assert(!/NaN|undefined|Infinity/.test(stat.v), `${id}: ${JSON.stringify(stat)}`);
      }
    }
    game.closeCodex();
    assert.equal(game.screen, 'menu');
  });

  check('pause/resume freezes progression', () => {
    game.begin();
    assert.equal(game.screen, 'playing');
    game.update(1 / 60);
    const before = game.g.t;
    game.pause();
    game.update(60);
    assert.equal(game.g.t, before);
    game.resume();
    game.update(1 / 60);
    assert(game.g.t > before);
  });

  check('all weapon upgrade chains and both evolutions', () => {
    for (const id of weaponIds) for (const evolution of [0, 1]) {
      game.begin();
      game.g.weapons = { [id]: { lv: 1, up: [0, 0, 0], break: false, evo: null, clock: 0 } };
      game.g.bossEncounters = 1;
      for (let level = 1; level < 7; level++) {
        assert(game.hasGrowth(id), `${id} has no growth at level ${level}`);
        const card = game.makeGrowth(id);
        assert(card, `${id} has no card at level ${level}`);
        game.g.cards = [card];
        game.setScreen('cards');
        game.selectCard(0);
        if (level === 6) {
          assert.equal(game.screen, 'evolution');
          game.chooseEvo(evolution);
        }
        assert.equal(game.g.weapons[id].lv, level + 1, `${id} upgrade level`);
        for (const stat of game.weaponNumbers(id)) {
          assert(!/NaN|undefined|Infinity/.test(stat.v), `${id} level ${level}: ${JSON.stringify(stat)}`);
        }
      }
      assert.equal(game.g.weapons[id].evo, evolution);
      assert.equal(game.hasGrowth(id), false);
    }
  });

  check('passive/weapon cards respect slot and rank caps', () => {
    game.begin();
    game.g.weapons = Object.fromEntries(['star', 'orbit', 'moon', 'book', 'bell'].map(id => [
      id, { lv: 7, up: [2, 2, 0], break: true, evo: 0, clock: 0 }
    ]));
    game.g.passives = { magic: 5, quick: 5, lucky: 5, shoes: 5, insight: 5 };
    for (let draw = 0; draw < 100; draw++) {
      const cards = game.rollCards(null);
      assert.equal(cards.length, 2);
      // Materialize a host array before comparing values from the VM realm.
      assert.deepEqual(Array.from(cards, card => card.type), ['heal', 'gold']);
    }
  });

  check('XP chains drain one choice at a time', () => {
    game.begin();
    game.g.player.xp = 100;
    game.g.freeCards = 2;
    let expectedLevel=1,remainder=100;
    while(remainder>=game.getLevelNeed()){
      remainder-=game.getLevelNeed();game.g.player.level++;expectedLevel++;
    }
    game.g.player.level=1;
    for (let frame = 0; frame < 40 && (
      game.g.player.xp >= game.getLevelNeed() || game.g.freeCards || ['cards', 'evolution'].includes(game.screen)
    ); frame++) runFrame(game);
    assert.equal(game.g.player.level, expectedLevel);
    assert.equal(game.g.player.xp,remainder);
    assert.equal(game.g.freeCards, 0);
    assert.equal(game.screen, 'playing');
  });

  check('save import normalization and one-time reroll migration', () => {
    const old = {
      version: 1, gold: 100, upgrades: { attack: 999, hp: -5, reroll: 2 },
      stats: { plays: 3, wins: 2 }, stagesCleared: 99,
      costumesOwned: ['default', 'x', 'forest'], costumeEquipped: 'x'
    };
    const normalized = game.parseImportedSave(JSON.stringify(old));
    assert.equal(normalized.gold, 440);
    assert.equal(normalized.upgrades.reroll, 1);
    assert.equal(normalized.upgrades.attack, 10);
    assert.equal(normalized.upgrades.hp, 0);
    assert.equal(normalized.stagesCleared, stageCount);
    assert.equal(normalized.costumeEquipped, 'default');
    storage.set(game.DATA.saveKey, JSON.stringify(old));
    const first = game.readSave();
    const second = game.readSave();
    assert.equal(first.gold, second.gold);
    assert.equal(second.gold, 440);
    for (const raw of ['null', '[]', '{}', '{"version":1,"gold":-2,"upgrades":{}}']) {
      assert.throws(() => game.parseImportedSave(raw));
    }
  });

  check('locked stages rejected and every campaign stage starts', () => {
    game.saved = game.normalizeSave(null);
    game.menu();
    game.begin(2);
    assert.equal(game.g, null);
    game.saved.stagesCleared = stageCount;
    for (let stage = 1; stage <= stageCount; stage++) {
      game.begin(stage);
      assert.equal(game.g.stage.id, stage);
      game.g.player.invuln = 1e9;
      for (let frame = 0; frame < 180; frame++) runFrame(game);
      finiteEntity(game.g.player, `stage ${stage} player`);
      for (const enemy of game.g.enemies) finiteEntity(enemy, `stage ${stage} enemy`);
    }
  });

  check('campaign rewards once and unlocks the next stage', () => {
    game.saved = game.normalizeSave(null);
    game.begin(1);
    const before = game.saved.gold;
    game.finish(true);
    assert.equal(game.saved.stagesCleared, 1);
    assert.equal(game.saved.stats.wins, 1);
    assert(game.saved.gold > before);
    const rewarded = game.saved.gold;
    game.finish(true);
    assert.equal(game.saved.gold, rewarded);
    game.begin(2);
    assert.equal(game.g.stage.id, 2);
  });

  check('all weapons fire and update with both evolutions', () => {
    for (const id of weaponIds) for (const evolution of [0, 1]) {
      game.begin();
      game.g.player.invuln = 1e9;
      game.g.weapons = { [id]: { lv: 7, up: [2, 1, 1], break: true, evo: evolution, clock: 0 } };
      for (let index = 0; index < 8; index++) {
        game.spawn('green', { x: 80 + (index - 4) * 0.4, y: 82 });
      }
      for (let frame = 0; frame < 360; frame++) runFrame(game);
      for (const key of ['totalKills', 'totalDamage', 't', 'worldClock']) {
        assert(Number.isFinite(game.g[key]), `${id} ${key}`);
      }
      for (const entity of [...game.g.enemies, ...game.g.shots, ...game.g.enemyShots, ...game.g.zones]) {
        finiteEntity(entity, id);
      }
    }
  });

  return {
    total: results.length,
    passed: results.filter(result => result.pass).length,
    detail: `${weaponIds.length} weapons, 2 evolution branches, ${stageCount} campaign stages`,
    failures: results.filter(result => !result.pass)
  };
};
