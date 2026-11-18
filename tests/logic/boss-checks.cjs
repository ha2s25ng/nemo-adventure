'use strict';

const assert = require('node:assert/strict');
const { createHarness } = require('./harness.cjs');

module.exports = function bossChecks() {
  const { game } = createHarness();
  const stageCount = game.NEMO_STAGES.length;
  game.saved.stagesCleared = stageCount;
  let total = 0;
  let passed = 0;
  let phases = 0;
  const failures = [];

  function runBoss(stage, encounter) {
    game.begin(stage);
    game.g.bossEncounters = encounter;
    game.g.player.invuln = 1e10;
    const [kind, at, definition] = game.nextBossEncounter();
    const name = `stage ${stage}, encounter ${encounter}, ${definition.name}`;
    for (const key of ['hp', 'dmg', 'speed', 'r']) {
      assert(Number.isFinite(definition[key]), `${name}: ${key}=${definition[key]}`);
    }
    const patterns = [...new Set((definition.cycles || [definition.patterns || []]).flat())];
    if (!patterns.length) patterns.push('dash', 'ring', 'fan', 'spiral');
    for (const hpRatio of [1, 0.5, 0.2]) for (const pattern of patterns) {
      const boss = game.spawn(kind, { x: 85, y: 80 }, definition);
      game.g.boss = boss;
      boss.hp = boss.maxHp * hpRatio;
      game.g.t = at;
      game.g.worldClock = at;
      game.bossCast(boss, pattern);
      assert(boss.action, `${name}: missing action ${pattern}`);
      for (let frame = 0; frame < 600 && boss.action; frame++) {
        game.g.worldClock += 1 / 60;
        game.bossUpdate(boss, 1 / 60);
        for (const shot of game.g.enemyShots) {
          for (const key of ['x', 'y', 'vx', 'vy', 'r', 'dmg', 'life']) {
            assert(Number.isFinite(shot[key]), `${name}, ${pattern}, HP ${hpRatio}: shot.${key}=${shot[key]}`);
          }
        }
        game.g.enemyShots = [];
      }
      assert.equal(boss.action, null, `${name}: ${pattern} did not finish within 10 seconds`);
      game.g.enemies = [];
      phases++;
    }
  }

  // Three encounters in every campaign stage, plus twelve survival encounters
  // covering the opening sequence and repeated late-game boss rotations.
  for (let stage = 0; stage <= stageCount; stage++) {
    for (let encounter = 0; encounter < (stage ? 3 : 12); encounter++) {
      total++;
      try {
        runBoss(stage, encounter);
        passed++;
      } catch (error) {
        failures.push({ name: `stage ${stage}, encounter ${encounter}`, error: error.stack });
      }
    }
  }
  return { total, passed, detail: `${phases.toLocaleString('en-US')} pattern/health phases`, failures };
};
