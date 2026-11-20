// shots.js — deterministic screenshot modes for VICE FRAME.
//
//   ?shot=cover&photo=woman.jpg&photos=woman.jpg,car.jpg,friends.jpg
//     &layout=classic&grade=sunset&title=SUNSET&title2=HEAT
//     &subtitle=PALM%20CITY%20STORIES&style=sunset&bar=1&w=1280&h=720
// renders ONLY the cover, filling the window at exactly w × h, so a
// headless browser can photograph exports at their true aspect.
// `photo` fills every panel; `photos` (comma list) fills panels in
// order and wins when both are given.
//
//   ?shot=editor&photo=car.jpg&title=NEON&title2=DRIFT&grade=neon
// boots the normal editor with those choices already made; main.js
// reads them through shotOverrides().

import { createState, resolveState, SAMPLES } from './editor.js';
import { drawCover } from './cover.js';

function loadSampleImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`sample failed: ${file}`));
    img.src = `samples/${file}`;
  });
}

export async function runCoverShot(params) {
  document.body.classList.add('shot-cover');
  const app = document.getElementById('app');
  if (app) app.style.display = 'none';

  const W = Number(params.get('w')) || window.innerWidth;
  const H = Number(params.get('h')) || window.innerHeight;
  const canvas = document.createElement('canvas');
  canvas.id = 'shotCanvas';
  canvas.width = W;
  canvas.height = H;
  document.body.appendChild(canvas);

  const state = createState();
  state.layoutId = params.get('layout') || 'classic';
  state.gradeId = params.get('grade') || 'sunset';
  state.titleStyle = params.get('style') || 'sunset';
  state.titleLines = [params.get('title') || 'SUNSET', params.get('title2') || 'HEAT'];
  state.subtitle = params.get('subtitle') ?? 'PALM CITY STORIES';
  state.captionBar = params.get('bar') !== '0';

  // Resolve the panel photos: an ordered list, or one photo for all.
  const listParam = params.get('photos') || params.get('photo') || SAMPLES[0].file;
  const files = listParam.split(',').map((name) => name.trim()).filter(Boolean);
  const images = [];
  for (const file of files) images.push(await loadSampleImage(file));
  state.photos = images.map((img, i) => ({ id: i + 1, img, label: files[i] }));
  state.panelPhoto = state.panelPhoto.map((_, i) => (images.length ? (i % images.length) + 1 : null));
  // Give a couple of panels a gentle push-in for a composed feel.
  state.panelView = state.panelView.map((view, i) => (i === 1 ? { ...view, zoom: 1.15 } : view));

  if (document.fonts && document.fonts.ready) {
    await document.fonts.load('64px Anton');
    await document.fonts.ready;
  }
  drawCover(canvas.getContext('2d'), W, H, resolveState(state, W, H));
  document.body.dataset.ready = '1';
  document.title = 'VICE FRAME — cover shot ready';
}

// Overrides for ?shot=editor, or null for a plain editor boot.
export function shotOverrides(params) {
  if (params.get('shot') !== 'editor') return null;
  const overrides = {};
  if (params.get('photo')) overrides.photo = params.get('photo');
  if (params.get('layout')) overrides.layout = params.get('layout');
  if (params.get('grade')) overrides.grade = params.get('grade');
  if (params.get('aspect')) overrides.aspect = params.get('aspect');
  if (params.get('style')) overrides.style = params.get('style');
  if (params.get('title') !== null) overrides.title = params.get('title');
  if (params.get('title2') !== null) overrides.title2 = params.get('title2');
  if (params.get('subtitle') !== null) overrides.subtitle = params.get('subtitle');
  if (params.get('bar') !== null) overrides.captionBar = params.get('bar') !== '0';
  return overrides;
}
