/**
 * Assemble Capacitor webDir so original relative paths still work:
 * games/blocklegend/index.html → ../shared, ../../assets/vocab, ../../preschool-english-vocab.js
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const www = path.join(root, 'www');

await fs.rm(www, { recursive: true, force: true });
await fs.mkdir(www, { recursive: true });

async function copy(rel) {
  await fs.cp(path.join(root, rel), path.join(www, rel), { recursive: true });
}

await copy('games');
await copy('assets');
await fs.copyFile(path.join(root, 'preschool-english-vocab.js'), path.join(www, 'preschool-english-vocab.js'));
await fs.copyFile(path.join(root, 'child-courses.js'), path.join(www, 'child-courses.js'));
await fs.copyFile(path.join(root, 'index.html'), path.join(www, 'index.html'));

console.log('[prepare-mobile] assembled www/ with workbench-relative paths');
