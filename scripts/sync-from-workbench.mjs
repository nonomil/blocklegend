/**
 * Make this repo match 个人工作台/prj/games/blocklegend plus the files it loads.
 * Usage: node scripts/sync-from-workbench.mjs [workbenchRoot]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const destRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.resolve(process.argv[2] || path.join(destRoot, '..', '个人工作台'));
const prj = path.join(srcRoot, 'prj');

async function exists(p) {
  return fs.stat(p).then(() => true).catch(() => false);
}

async function replaceDir(from, to) {
  if (!(await exists(from))) throw new Error('missing ' + from);
  await fs.rm(to, { recursive: true, force: true });
  await fs.cp(from, to, { recursive: true });
}

if (!(await exists(path.join(prj, 'games', 'blocklegend', 'index.html')))) {
  console.error('[sync] workbench game not found:', prj);
  process.exit(1);
}

await replaceDir(path.join(prj, 'games', 'blocklegend'), path.join(destRoot, 'games', 'blocklegend'));
await replaceDir(path.join(prj, 'games', 'shared'), path.join(destRoot, 'games', 'shared'));
await replaceDir(
  path.join(prj, 'assets', 'vocab', 'core-english-2026.08.15'),
  path.join(destRoot, 'assets', 'vocab', 'core-english-2026.08.15')
);
await fs.copyFile(
  path.join(prj, 'preschool-english-vocab.js'),
  path.join(destRoot, 'preschool-english-vocab.js')
);
await fs.copyFile(
  path.join(prj, 'child-courses.js'),
  path.join(destRoot, 'child-courses.js')
);

console.log('[sync] mirrored workbench blocklegend + shared + vocab');
