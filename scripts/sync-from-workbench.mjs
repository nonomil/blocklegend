/**
 * Overlay 个人工作台/prj/games/blocklegend onto this repo root,
 * plus the files that folder used to load from prj/.
 * Usage: node scripts/sync-from-workbench.mjs [workbenchRoot]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyStandalonePaths } from './apply-standalone-paths.mjs';

const destRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.resolve(process.argv[2] || path.join(destRoot, '..', '个人工作台'));
const prj = path.join(srcRoot, 'prj');
const gameSrc = path.join(prj, 'games', 'blocklegend');

async function exists(p) {
  return fs.stat(p).then(() => true).catch(() => false);
}

async function replaceDir(from, to) {
  if (!(await exists(from))) throw new Error('missing ' + from);
  await fs.rm(to, { recursive: true, force: true });
  await fs.cp(from, to, { recursive: true });
}

if (!(await exists(path.join(gameSrc, 'index.html')))) {
  console.error('[sync] workbench game not found:', gameSrc);
  process.exit(1);
}

await fs.cp(gameSrc, destRoot, { recursive: true });
await replaceDir(path.join(prj, 'games', 'shared'), path.join(destRoot, 'shared'));
await replaceDir(
  path.join(prj, 'assets', 'vocab', 'core-english-2026.08.15'),
  path.join(destRoot, 'vocab', 'core-english-2026.08.15')
);
if (await exists(path.join(prj, 'assets', 'generated', 'blocklegend-roster'))) {
  await replaceDir(
    path.join(prj, 'assets', 'generated', 'blocklegend-roster'),
    path.join(destRoot, 'generated', 'blocklegend-roster')
  );
}
await fs.copyFile(
  path.join(prj, 'preschool-english-vocab.js'),
  path.join(destRoot, 'preschool-english-vocab.js')
);
await fs.copyFile(
  path.join(prj, 'child-courses.js'),
  path.join(destRoot, 'child-courses.js')
);
await applyStandalonePaths(destRoot);

console.log('[sync] repo root = workbench prj/games/blocklegend + vocab/shared');
