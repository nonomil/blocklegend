/**
 * Print CHANGELOG section for VERSION (or argv[2]).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ver = String(process.argv[2] || fs.readFileSync(path.join(root, 'VERSION'), 'utf8')).trim();
const md = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').replace(/^\uFEFF/, '');
const re = new RegExp('^##\\s+' + ver.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s|·|$).*', 'm');
const start = md.search(re);
if (start < 0) {
  process.stdout.write('方块传奇 ' + ver + '\n');
  process.exit(0);
}
const rest = md.slice(start);
const next = rest.slice(1).search(/^##\s+/m);
const body = (next < 0 ? rest : rest.slice(0, next + 1)).trim();
process.stdout.write(body + '\n');
