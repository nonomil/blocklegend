/**
 * Assemble Capacitor webDir from the flattened game tree.
 * Skip docs/tools so the APK does not ship the 63MB reference video.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const www = path.join(root, 'www');

const FILES = [
  'index.html',
  'game.js',
  'game.css',
  'engine.js',
  'mobs.js',
  'preschool-english-vocab.js',
  'child-courses.js'
];
const DIRS = ['assets', 'data', 'vendor', 'shared', 'vocab'];

await fs.rm(www, { recursive: true, force: true });
await fs.mkdir(www, { recursive: true });

for (const rel of DIRS) {
  await fs.cp(path.join(root, rel), path.join(www, rel), { recursive: true });
}
for (const rel of FILES) {
  await fs.copyFile(path.join(root, rel), path.join(www, rel));
}

console.log('[prepare-mobile] assembled www/ from flattened game tree');
