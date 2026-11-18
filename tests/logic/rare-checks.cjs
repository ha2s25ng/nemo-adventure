'use strict';

const assert = require('node:assert/strict');
const { createHarness, runFrame } = require('./harness.cjs');

module.exports = function rareChecks() {
  const { game } = createHarness();
  let total = 0;
  let passed = 0;
  const failures = [];
  for (const [rare, card] of Object.entries(game.RARE_CARDS)) for (const evolution of [0, 1]) {
    total++;
    try {
      game.begin();
      game.g.player.invuln = 1e9;
      game.g.weapons = {
        [card.weapon]: { lv: 7, up: [1, 2, 1], break: true, evo: evolution, clock: 0 }
      };
      game.g.cards = [{ type: 'rare', id: rare, ...card }];
      game.setScreen('cards');
      game.selectCard(0);
      assert.equal(game.g.rareCard, rare);
      for (let index = 0; index < 15; index++) {
        const enemy = game.spawn('armor', {
          x: 79 + (index % 5) * 0.45, y: 81 + Math.floor(index / 5) * 0.35
        });
        enemy.hp = enemy.maxHp = 3000;
      }
      for (let frame = 0; frame < 900; frame++) {
        runFrame(game);
        assert(Number.isFinite(game.g.totalDamage), `${rare}: total damage`);
        for (const entity of [...game.g.shots, ...game.g.enemyShots, ...game.g.zones, ...game.g.effects]) {
          for (const key of ['x', 'y', 'vx', 'vy', 'damage']) {
            if (entity[key] !== undefined) {
              assert(Number.isFinite(entity[key]), `${rare}, ${entity.kind}: ${key}=${entity[key]}`);
            }
          }
        }
      }
      assert(game.g.totalDamage > 0, `${rare}: no damage dealt`);
      passed++;
    } catch (error) {
      failures.push({ name: `${rare}, evolution ${evolution}`, error: error.stack });
    }
  }
  return { total, passed, detail: '15 simulated seconds per combination', failures };
};
