/**
 * After overlaying the workbench game folder onto this repo root,
 * retarget the few paths that used to go up into prj/.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export async function applyStandalonePaths(root) {
  const files = [
    {
      rel: 'index.html',
      from: [
        ['href="../../preschool-workbench/index.html"', 'href="./"'],
        ['src="../shared/workbench-bridge.js', 'src="./shared/workbench-bridge.js'],
        ['src="../shared/game-sfx.js', 'src="./shared/game-sfx.js'],
        ['src="../../preschool-english-vocab.js', 'src="./preschool-english-vocab.js'],
        ['src="../../child-courses.js', 'src="./child-courses.js']
      ]
    },
    {
      rel: path.join('data', 'words.js'),
      from: [
        [
          "const PACK_BASE = '../../assets/vocab/core-english-2026.08.15';",
          "const PACK_BASE = './vocab/core-english-2026.08.15';"
        ]
      ]
    },
    {
      rel: 'compare-four-view.html',
      from: [
        [
          "'../../assets/generated/blocklegend-roster/four-view/'",
          "'./generated/blocklegend-roster/four-view/'"
        ]
      ]
    },
    {
      rel: 'review-roster.html',
      from: [
        [
          "'../../assets/generated/blocklegend-roster/four-view/'",
          "'./generated/blocklegend-roster/four-view/'"
        ]
      ]
    }
  ];

  for (const file of files) {
    const full = path.join(root, file.rel);
    let text = await fs.readFile(full, 'utf8');
    for (const [a, b] of file.from) {
      if (!text.includes(a)) {
        if (!text.includes(b)) throw new Error(file.rel + ' missing ' + a);
        continue;
      }
      text = text.split(a).join(b);
    }
    await fs.writeFile(full, text);
  }
}
