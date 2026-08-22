/** 读 GLB 的 JSON 块，看有没有骨骼(skins)和动画(animations)。 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'G:/StudyCode/blocklegend/assets/models';
for (const f of readdirSync(dir).filter((n) => n.endsWith('.glb'))) {
  const buf = readFileSync(join(dir, f));
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const anims = (json.animations || []).map((a) => a.name || '?');
  const skins = (json.skins || []).length;
  const nodes = (json.nodes || []).length;
  const boneNames = (json.skins || []).flatMap((s) => (s.joints || []).slice(0, 6).map((j) => (json.nodes[j] || {}).name));
  console.log(`${f}\n  skins=${skins} nodes=${nodes} animations=[${anims.join(', ')}]`);
  if (boneNames.length) console.log(`  bones: ${boneNames.join(', ')} ...`);
}
