// VICE FRAME — make.fun entry point for gta6-cover-art-01.
//
// The product is the static web app in app/ (open app/index.html in a
// desktop browser; it runs fully offline). This program is only the
// hand-in step: it stages app/ and screenshots/ into the output
// directory and writes the dossier the judge reads, using the
// vendored make.fun library in vendor/makefun-app.ts.
//
// Run it the way the grader does (Node 22, standard library only):
//   node main.ts                          → writes to /output
//   MAKEFUN_OUTPUT_DIR=out node main.ts   → writes to ./out locally
// Running it twice produces identical bytes.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own limits, handed to the dossier builder so an entry
// the scorer would refuse is refused here first.
const GATE_LIMITS = {
  text_max_bytes: 163_840,
  screenshots: { max: 4, max_bytes: 262_144 },
  app_max_files: 993,
  app_max_bytes: 50_331_648,
  app_path_max_bytes: 1000,
};

// Copy one top-level folder of the repo into the output directory.
function stageFolder(name: string): void {
  const from = join(repoRoot, name);
  const to = join(outputDir, name);
  mkdirSync(to, { recursive: true });
  if (existsSync(from)) {
    cpSync(from, to, { recursive: true });
  }
}

mkdirSync(outputDir, { recursive: true });
stageFolder('app');
stageFolder('screenshots');

// Fail loudly here rather than at the gate: an entry needs 3 or 4
// screenshots, the first by name being the cover.
const shotNames = readdirSync(join(outputDir, 'screenshots'))
  .filter((name) => /\.(png|jpe?g)$/i.test(name))
  .sort();
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(`vice-frame: expected 3-4 screenshots, found ${shotNames.length}`);
}

const dossierJson = buildDossier(outputDir, GATE_LIMITS);
writeFileSync(join(outputDir, 'dossier.json'), dossierJson);

console.log(`vice-frame: staged app/ and screenshots/ into ${outputDir}`);
console.log(`vice-frame: dossier.json is ${Buffer.byteLength(dossierJson)} bytes`);
