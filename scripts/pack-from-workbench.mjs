/**
 * Copy the playable blocklegend tree out of the workbench repo.
 * Usage: node scripts/pack-from-workbench.mjs [workbenchRoot]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const destRoot = path.resolve(here, '..');
const srcRoot = path.resolve(process.argv[2] || path.join(destRoot, '..', '个人工作台'));
const gameSrc = path.join(srcRoot, 'prj', 'games', 'blocklegend');
const www = path.join(destRoot, 'www');

const SKIP_DIR = new Set(['docs', 'raw', 'keyed', 'split', '_backup']);
const SKIP_NAME = new Set([
  'compare-four-view.html',
  'review-roster.html',
  'preview-mobs.html'
]);
const SKIP_EXT = new Set(['.bat', '.py']);

function shouldCopy(rel) {
  const parts = rel.split(path.sep);
  if (parts.some((p) => SKIP_DIR.has(p))) return false;
  if (SKIP_NAME.has(parts[parts.length - 1])) return false;
  if (SKIP_EXT.has(path.extname(rel).toLowerCase())) return false;
  return true;
}

async function copyDir(from, to, filterRel = '') {
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    const rel = path.join(filterRel, entry.name);
    if (!shouldCopy(rel)) continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDir(src, dest, rel);
    else await fs.copyFile(src, dest);
  }
}

async function rewrite(file, fn) {
  const text = await fs.readFile(file, 'utf8');
  await fs.writeFile(file, fn(text), 'utf8');
}

const srcExists = await fs.stat(gameSrc).then(() => true).catch(() => false);
if (!srcExists) {
  console.error('[pack] workbench game not found:', gameSrc);
  process.exit(1);
}

await fs.rm(www, { recursive: true, force: true });
await copyDir(gameSrc, www);

await fs.mkdir(path.join(www, 'vendor'), { recursive: true });
await fs.copyFile(
  path.join(srcRoot, 'prj', 'games', 'shared', 'game-sfx.js'),
  path.join(www, 'vendor', 'game-sfx.js')
);

const vocabSrc = path.join(srcRoot, 'prj', 'assets', 'vocab', 'core-english-2026.08.15');
const vocabDest = path.join(www, 'assets', 'vocab', 'core-english-2026.08.15');
await fs.cp(vocabSrc, vocabDest, { recursive: true });

await rewrite(path.join(www, 'index.html'), (html) => html
  .replace(
    /<a class="bl-back" id="back-link" href="[^"]*">返回工作台<\/a>/,
    '<a class="bl-back" id="back-link" href="https://github.com/nonomil/blocklegend">版本</a>'
  )
  .replace(
    '<script src="../shared/workbench-bridge.js?v=20260815-word-backflow-v1"></script>\n    <script src="../shared/game-sfx.js?v=20260817-bl-sfx2"></script>\n    <script src="../../preschool-english-vocab.js?v=20260815-word-backflow-v1"></script>\n    <script src="../../child-courses.js?v=20260815-word-backflow-v1"></script>\n',
    '<script src="./vendor/local-bridge.js?v=20260818-bl-apk1"></script>\n    <script src="./vendor/game-sfx.js?v=20260817-bl-sfx2"></script>\n'
  )
);

await rewrite(path.join(www, 'data', 'words.js'), (js) => js.replace(
  "const PACK_BASE = '../../assets/vocab/core-english-2026.08.15';",
  "const PACK_BASE = './assets/vocab/core-english-2026.08.15';"
));

await fs.copyFile(
  path.join(destRoot, 'templates', 'local-bridge.js'),
  path.join(www, 'vendor', 'local-bridge.js')
);

console.log('[pack] wrote standalone www/ from', gameSrc);
