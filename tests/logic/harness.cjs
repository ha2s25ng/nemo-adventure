'use strict';

// Load the actual repository scripts in a VM. Only browser startup is omitted;
// test hooks exist in this VM and are never written into the deployed game.
// Canvas/DOM stubs support engine execution, not layout or input verification.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const ROOT = path.resolve(__dirname, '../..');
const ENGINE_MARKER = 'const $ = id => document.getElementById(id)';
const STARTUP_MARKER = 'rankWire();renderMenu();syncFullscreen();setScreen';
const TEST_EXPORTS = `
globalThis.__logicGame = {
  DATA, W, ASSET_DATA, RARE_CARDS, NEMO_STAGES, NEMO_DRAW, weaponAvailableForCharacter,
  begin, menu, pause, resume, setScreen, openCodex, closeCodex, update, finish,
  hasGrowth, makeGrowth, rollCards, selectCard, chooseEvo, weaponNumbers,
  parseImportedSave, normalizeSave, readSave, spawn,
  nextBossEncounter, bossCast, bossUpdate, updateBossEncounter, kill, collect, awardGold,
  drawCostumes, COSTUMES, DRAW_PHOTOS, RARE_PICKUP_KINDS, getLevelNeed, rageActive, updateHUD,
  selectCharacter, activeCharacter, activeCostume, costumeForCharacter, fireWeapon, impactCannon, updateShots, weaponPower, cooldown, normalizeRankLoadout, NEMO_CHARACTERS,
  updateOrbit, orbitPosition, updateVortex, updateMonster, updateEndlessMonster, castEndlessAttack, updateCampaignMonster, drawBattle,
  drawProjectile, drawBookFamiliar, updateBookFamiliar, drawEffects,
  get g() { return g; },
  get screen() { return screen; },
  get saved() { return saved; },
  set saved(value) { saved = value; }
};
})();
`;

function repositoryScripts() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const scripts = [];
  let index = 0;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    index++;
    const source = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(match[1]);
    let code = match[2];
    let filename = `index.html:inline-${index}`;
    if (source) {
      const relative = (source[1] ?? source[2] ?? source[3]).split(/[?#]/)[0];
      const absolute = path.resolve(ROOT, relative);
      const within = path.relative(ROOT, absolute);
      if (/^[a-z]+:|^\//i.test(relative) || within.startsWith('..') || path.isAbsolute(within)) {
        throw new Error(`Logic tests require a repository-local script: ${relative}`);
      }
      filename = within;
      code = fs.readFileSync(absolute, 'utf8');
    }
    if (code.includes(ENGINE_MARKER)) {
      const startup = code.indexOf(STARTUP_MARKER);
      if (startup < 0 || code.indexOf(STARTUP_MARKER, startup + 1) >= 0) {
        throw new Error('Game startup marker changed; update the VM harness.');
      }
      scripts.push({ filename, code: code.slice(0, startup) + TEST_EXPORTS });
      // The later live-update script is unrelated to engine logic and must not run.
      return scripts;
    }
    scripts.push({ filename, code });
  }
  throw new Error('Game engine script was not found in index.html.');
}

function createHarness(seed = 0x4e454d4f, captureDraws = false, reduceMotion = false) {
  const noop = () => {};
  const elements = new Map();
  function element(id = '') {
    if (elements.has(id)) return elements.get(id);
    const node = {
      id, hidden: false, disabled: false, dataset: {},
      style: { setProperty: noop, removeProperty: noop },
      classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
      addEventListener: noop, setAttribute: noop, getAttribute: () => null,
      focus: noop, select: noop, scrollIntoView: noop, removeAttribute: noop,
      append: noop, appendChild: noop, click: noop,
      hasPointerCapture: () => false, releasePointerCapture: noop,
      contains: () => false, matches: () => false,
      querySelector: selector => element(`${id} ${selector}`), querySelectorAll: () => [],
      closest: selector => element(`closest ${selector}`),
      clientWidth: 1600, clientHeight: 900, offsetWidth: 100,
      clientLeft: 0, clientTop: 0, scrollTop: 0,
      value: '', checked: false, innerHTML: '', textContent: '',
      getBoundingClientRect: () => ({ left: 0, top: 0, right: 1600, bottom: 900, width: 1600, height: 900 }),
      getClientRects: () => [{}]
    };
    elements.set(id, node);
    return node;
  }
  const drawCalls = [], vectorCalls = [];
  const drawing = new Proxy({
    globalAlpha: 1,
    drawImage: (source, ...args) => { if (captureDraws) drawCalls.push({ src: source?.src, args }); },
    measureText: value => ({ width: String(value).length * 8 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop })
  }, {
    get: (target, key) => key in target ? target[key] : ['rotate','moveTo','lineTo','quadraticCurveTo','closePath','fill','stroke'].includes(key)
      ? (...args) => { if (captureDraws) vectorCalls.push({ kind:key, args }); } : noop,
    set: (target, key, value) => { target[key] = value; return true; }
  });
  element('canvas').getContext = () => drawing;
  element('canvas').parentElement = element('app');
  const storage = new Map();
  // The engine seeds its own RNG from Math.random. Keep reproductions stable.
  const math = Object.create(Math);
  let randomState = seed >>> 0;
  math.random = () => {
    randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
    return randomState / 4294967296;
  };
  const context = {
    console, Math: math, Date, JSON, Set, Map, Object, Array, Number, String, Boolean,
    RegExp, Infinity, Uint8ClampedArray, Float32Array, URL, URLSearchParams, Intl,
    AbortController, crypto: webcrypto,
    performance: { now: () => 0 }, devicePixelRatio: 1, innerWidth: 1600, innerHeight: 900,
    navigator: { userAgent: 'nemo-logic-test' }, location: { protocol: 'file:', href: 'file:///index.html' },
    requestAnimationFrame: noop, cancelAnimationFrame: noop,
    setInterval: () => 0, clearInterval: noop, setTimeout: () => 0, clearTimeout: noop,
    addEventListener: noop, matchMedia: query => ({ matches: reduceMotion && query.includes('prefers-reduced-motion'), addEventListener: noop }),
    ResizeObserver: class { observe() {} }, MutationObserver: class { observe() {} },
    Image: class {
      constructor() {
        this.complete = true;
        this.naturalWidth = this.naturalHeight = this.width = this.height = 1024;
      }
      addEventListener() {}
    },
    Path2D: class { constructor() { return new Proxy({}, { get: () => noop }); } },
    document: {
      getElementById: element, querySelector: selector => element(selector), querySelectorAll: () => [],
      createElement: tag => element(tag), documentElement: element('html'), body: element('body'),
      addEventListener: noop, hidden: false, visibilityState: 'visible'
    },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    // No real fetch, browser storage, timers, or filesystem writes are exposed.
    fetch: async () => ({ ok: false, status: 503, json: async () => ({}), text: async () => '' })
  };
  context.window = context;
  context.document.activeElement = element('body');
  vm.createContext(context);
  for (const script of repositoryScripts()) {
    vm.runInContext(script.code, context, { filename: script.filename, timeout: 10000 });
  }
  if (!context.__logicGame) throw new Error('VM game hooks were not initialized.');
  return { game: context.__logicGame, storage, drawCalls, vectorCalls };
}

function runFrame(game) {
  if (game.screen === 'cards') game.selectCard(0);
  if (game.screen === 'evolution') game.chooseEvo(0);
  if (game.screen === 'playing') game.update(1 / 60);
}

module.exports = { createHarness, runFrame };
