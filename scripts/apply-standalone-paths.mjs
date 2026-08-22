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
        ['src="../shared/speech-match.js', 'src="./shared/speech-match.js'],
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
        ],
        [
          "const PACK_MC = '../../assets/vocab/minecraft-english-2026.08.15';",
          "const PACK_MC = './vocab/minecraft-english-2026.08.15';"
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
    },
    {
      rel: 'review-boss-phases.html',
      from: [
        [
          '../../assets/generated/blocklegend-roster/boss-phases/keyed/',
          './generated/blocklegend-roster/boss-phases/keyed/'
        ]
      ]
    },
    {
      rel: '打开方块传奇.bat',
      from: [
        ['set "ROOT=%~dp0..\\..\\.."\r\ncd /d "%ROOT%"', 'cd /d "%~dp0"'],
        ['set "ROOT=%~dp0..\\..\\.."\ncd /d "%ROOT%"', 'cd /d "%~dp0"'],
        ['http://127.0.0.1:4196/prj/games/blocklegend/index.html', 'http://127.0.0.1:4196/']
      ]
    },
    {
      rel: '打开审查场.bat',
      from: [
        ['set "ROOT=%~dp0..\\..\\.."\r\ncd /d "%ROOT%"', 'cd /d "%~dp0"'],
        ['set "ROOT=%~dp0..\\..\\.."\ncd /d "%ROOT%"', 'cd /d "%~dp0"'],
        ['http://127.0.0.1:4198/prj/games/blocklegend/index.html?playtest=1&v=20260816-bl-play2', 'http://127.0.0.1:4198/?playtest=1']
      ]
    },
    {
      rel: '打开角色审查.bat',
      from: [
        ['set "ROOT=%~dp0..\\..\\.."\r\ncd /d "%ROOT%"', 'cd /d "%~dp0"'],
        ['set "ROOT=%~dp0..\\..\\.."\ncd /d "%ROOT%"', 'cd /d "%~dp0"'],
        ['http://127.0.0.1:4198/prj/games/blocklegend/review-roster.html?v=20260816-bl-mobs3', 'http://127.0.0.1:4197/review-roster.html'],
        ['http.server 4198 --bind 127.0.0.1', 'http.server 4197 --bind 127.0.0.1']
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
