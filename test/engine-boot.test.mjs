import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('单独跑 engine.js 时明确提示先加载 world-gen', () => {
  const r = spawnSync(process.execPath, [join(root, 'engine.js')], { encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(String(r.stderr || ''), /BlockLegendWorld missing/);
});

test('world-gen 之后叶色在 0–1 且能亮也能暗', async () => {
  await import('../data/world-gen.js');
  await import('../engine.js');
  const E = globalThis.BlockLegendEngine;
  let lo = 2, hi = -1;
  for (let i = 0; i < 80; i += 1) {
    const c = E.blockColor('leaf', i, 3, i * 2, 'birch', 'plains');
    c.forEach(function (n) {
      assert.ok(n >= 0 && n <= 1, '叶通道越界 ' + n);
      if (n < lo) lo = n;
      if (n > hi) hi = n;
    });
  }
  assert.ok(hi > lo, '叶抖动应有亮暗差');
});
