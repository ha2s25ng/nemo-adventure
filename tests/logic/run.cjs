'use strict';

// Run from any working directory: node tests/logic/run.cjs
// Uses only Node's built-in modules and writes no generated files.
const suites = [
  ['Engine invariants', './checks.cjs'],
  ['Boss definitions', './boss-checks.cjs'],
  ['Rare/evolution combinations', './rare-checks.cjs'],
  ['Drop/economy remake', './remake-checks.cjs'],
  ['Photocard collection', './photo-cards.cjs'],
  ['Playable characters', './characters-checks.cjs']
];
let failed = 0;
for (const [name, modulePath] of suites) {
  try {
    const result = require(modulePath)();
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
