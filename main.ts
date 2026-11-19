// NEON COAST — Vice Cover Studio (gta6-cover-art-01 entry, Node 22, standard library only).
// The app is this directory's app/ folder: plain static files a desktop browser loads fully
// offline (app/index.html and its ES modules, no library, no network request). This program
// hands the app in: it copies app/ and screenshots/ from beside this file to /output and
// writes /output/dossier.json, the summary the judge reads, with the vendored make.fun
// library in vendor/makefun-app.ts (kept byte-identical to the kit's copy).
//
// NEON COAST turns any local photo plus a caption into multi-panel, GTA-style cover art:
// six panel layouts, six per-pixel colour grades, an original gradient title block with a
// neon script subtitle, a five-star heat meter and a round studio badge, exported as a PNG
// at 1080x1080, 1080x1350, 1080x1920 or 1920x1080.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// NEON COAST needs its four judge screenshots (cover, editor, portrait, square):
// refuse to hand in an entry whose screenshots folder is missing or short, so a
// packaging mistake fails loudly here instead of scoring zero at the gate.
const shotsDir = join(here, 'screenshots');
const shotFiles = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => /\.(png|jpe?g)$/i.test(name)).sort()
  : [];
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`NEON COAST: expected 3 or 4 screenshots, found ${shotFiles.length}: ${shotFiles.join(', ')}`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the
// others refuse an entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files in app/ or 48 MiB of app files, in all, or a path under
// app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
