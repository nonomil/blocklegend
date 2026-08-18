import fs from 'node:fs';
import assert from 'node:assert/strict';

const files = [
  'index.html',
  'game.js',
  'data/words.js',
  'data/levels.js',
  'vocab/core-english-2026.08.15/catalog.json',
  'shared/workbench-bridge.js',
  'review-boss-phases.html'
];
files.forEach((f) => assert.ok(fs.existsSync(f), f));

const words = fs.readFileSync('data/words.js', 'utf8');
assert.match(words, /PACK_BASE = '\.\/vocab\/core-english-2026\.08\.15'/);
assert.match(words, /function phoneticOf/);
assert.match(words, /function rebindWorldReviewWords/);

const html = fs.readFileSync('index.html', 'utf8');
assert.match(html, /\.\/shared\/workbench-bridge\.js/);
assert.doesNotMatch(html, /\.\.\/shared\/workbench-bridge\.js/);
assert.match(html, /words\.js\?v=20260818-bl-miss1/);
assert.match(html, /speech-input\.js\?v=20260818-bl-stt2/);
assert.match(html, /interactive-widget=resizes-content/);
const game = fs.readFileSync('game.js', 'utf8');
assert.match(game, /function refreshQuizKeyPaint/);
assert.match(game, /function capacitorSpeech/);
assert.match(game, /function listenViaNative/);
assert.doesNotMatch(game, /input\.readOnly = !!wantTouchPad\(\)/);
const engine = fs.readFileSync('engine.js', 'utf8');
assert.match(engine, /MOBILE_VIEW_CHUNKS = 2/);
assert.match(engine, /function setMoveAxis/);
const patch = fs.readFileSync('scripts/patch-android.mjs', 'utf8');
assert.match(patch, /windowSoftInputMode/);
assert.match(patch, /android\.speech\.RecognitionService/);
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
assert.ok(pkg.dependencies['@capgo/capacitor-speech-recognition']);

const phases = fs.readFileSync('review-boss-phases.html', 'utf8');
assert.match(phases, /\.\/generated\/blocklegend-roster\/boss-phases\/keyed\//);

const catalog = JSON.parse(fs.readFileSync('vocab/core-english-2026.08.15/catalog.json', 'utf8'));
assert.equal(catalog.cardCount, 597);

const levels = fs.readFileSync('data/levels.js', 'utf8');
assert.match(levels, /LEVEL_TOTAL = 12/);
assert.match(levels, /climateWords: \['hot', 'warm', 'wind'\]/);

console.log('standalone smoke files ok');
