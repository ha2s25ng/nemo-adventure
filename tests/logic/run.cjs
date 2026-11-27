'use strict';

// Run from any working directory: node tests/logic/run.cjs
// Uses only Node's built-in modules and writes no generated files.
const suites = [
  ['Engine invariants', './checks.cjs'],
  ['Boss definitions', './boss-checks.cjs'],
  ['Legacy enhancement removal', './rare-checks.cjs'],
  ['Drop/economy remake', './remake-checks.cjs'],
  ['Photocard collection', './photo-cards.cjs'],
  ['Playable characters', './characters-checks.cjs'],
  ['Fair monster attacks and targeting', './combat-v5123.cjs'],
  ['Unified skill art', './skill-art-checks.cjs'],
  ['Paper planes and magic frisbee', './paper-moon-checks.cjs'],
  ['Five-rank passives', './passive-v5129-checks.cjs'],
  ['New passives and simple cards', './passive-v51216.cjs'],
  ['Guaranteed awakening queue', './awakening-queue.cjs'],
  ['Independent attack schedule', './schedule-v51224.cjs'],
  ['All weapon awakenings', './all-awakenings-v51224.cjs'],
  ['Weapon balance and actual descriptions', './weapon-refresh-v51226.cjs'],
  ['Renewed stage configuration', './stage-config-v51226.cjs'],
  ['Campaign medals and ticket accounting', './stage-progress-v51226.cjs'],
  ['World layout and region palettes', './world-config-v51226.cjs'],
  ['Campaign engine integration', './stage-integration-v5130.cjs'],
  ['Renewed world art and actual draws', './world-art-v5130.cjs'],
  ['Real capsule ticket purchases', './ticket-purchase-v5130.cjs'],
  ['Storybook environments', './storybook-world-v5140.cjs']
];
(async()=>{
let failed = 0;
for (const [name, modulePath] of suites) {
  try {
    const result = await require(modulePath)();
    const passed = result.failures.length === 0 && result.passed === result.total;
    console.log(`${passed ? 'PASS' : 'FAIL'} ${name}: ${result.passed}/${result.total}; ${result.detail}`);
    if (!passed) {
      failed++;
      for (const failure of result.failures) {
        console.error(`  ${failure.name}\n${failure.error}`);
      }
    }
  } catch (error) {
    failed++;
    console.error(`FAIL ${name}: ${error.stack}`);
  }
}
console.log(`${failed ? 'FAIL' : 'PASS'} Logic regression suites: ${suites.length - failed}/${suites.length}.`);
process.exitCode = failed ? 1 : 0;
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
