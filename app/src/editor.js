// editor.js — the VICE FRAME studio: state, controls and exports.
//
// One state object drives everything. Photos the user drops in live
// only in the browser (object URLs and <img> elements — nothing is
// uploaded), each panel remembers which photo it shows plus its own
// drag offset and zoom, and every change repaints the preview with
// the same drawCover() the exports use.

import { ASPECTS, LAYOUTS, MAX_PANELS, panelsFor, panelCount, aspectFamily } from './layouts.js';
import { GRADES } from './grade.js';
import { TITLE_STYLES, drawCover, coverToBlob } from './cover.js';

// Built-in photos (AI-made for this app, free to use) so anyone can
// make a cover in one click before adding their own.
export const SAMPLES = [
  { file: 'woman.jpg', label: 'Boulevard' },
  { file: 'car.jpg', label: 'Beach Ride' },
  { file: 'friends.jpg', label: 'Pier Night' },
  { file: 'boulevard.jpg', label: 'Palms' },
  { file: 'pier.jpg', label: 'The Pier' },
];

const PREVIEW_WIDTH = 920;

export function createState() {
  return {
    layoutId: 'classic',
    aspectId: 'wide',
    gradeId: 'sunset',
    titleStyle: 'sunset',
    titleLines: ['SUNSET', 'HEAT'],
    subtitle: 'PALM CITY STORIES',
    captionBar: true,
    photos: [],
    photoSeq: 0,
    panelPhoto: new Array(MAX_PANELS).fill(null),
    panelView: Array.from({ length: MAX_PANELS }, () => ({ dx: 0, dy: 0, zoom: 1 })),
    selectedPanel: 0,
    applyAll: true,
  };
}

function photoById(state, id) {
  return state.photos.find((photo) => photo.id === id) || null;
}

// The photo a panel effectively shows: its own assignment, else the
// first photo in the tray, else nothing (placeholder art).
export function effectivePhoto(state, index) {
  const assigned = photoById(state, state.panelPhoto[index]);
  if (assigned) return assigned;
  return state.photos[0] || null;
}

// Build the renderer-ready state for a target pixel size: resolve
// each panel of that size's layout to { img, dx, dy, zoom }.
export function resolveState(state, w, h) {
  const family = aspectFamily(w, h);
  const rects = panelsFor(state.layoutId, family);
  return {
    layoutId: state.layoutId,
    gradeId: state.gradeId,
    titleStyle: state.titleStyle,
    titleLines: state.titleLines,
    subtitle: state.subtitle,
    captionBar: state.captionBar,
    panels: rects.map((_, i) => {
      const photo = effectivePhoto(state, i);
      const view = state.panelView[i] || { dx: 0, dy: 0, zoom: 1 };
      return { img: photo ? photo.img : null, dx: view.dx, dy: view.dy, zoom: view.zoom };
    }),
  };
}

function el(id) {
  return document.getElementById(id);
}

// Small helper: a row of toggle chips.
function buildChips(container, items, isActive, onPick) {
  container.innerHTML = '';
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chip${isActive(item) ? ' active' : ''}`;
    button.textContent = item.label || item.name;
    button.addEventListener('click', () => onPick(item));
    container.appendChild(button);
  }
}

export function initEditor(overrides = null) {
  const state = createState();
  if (overrides) applyOverrides(state, overrides);

  const canvas = el('preview');
  const ctx = canvas.getContext('2d');
  const status = el('status');

  function say(message) {
    if (status) status.textContent = message;
  }

  function render() {
    const aspect = ASPECTS[state.aspectId];
    canvas.width = PREVIEW_WIDTH;
    canvas.height = Math.round((PREVIEW_WIDTH * aspect.h) / aspect.w);
    const resolved = resolveState(state, aspect.w, aspect.h);
    drawCover(ctx, canvas.width, canvas.height, resolved, {
      preview: true,
      selected: state.selectedPanel,
    });
    syncPanelControls();
  }

  // --- photos -----------------------------------------------------

  function assignPhoto(photoId) {
    if (state.applyAll) {
      state.panelPhoto.fill(photoId);
    } else {
      state.panelPhoto[state.selectedPanel] = photoId;
    }
    renderTray();
    render();
  }

  function addPhoto(img, label) {
    state.photoSeq += 1;
    const photo = { id: state.photoSeq, img, label };
    state.photos.push(photo);
    assignPhoto(photo.id);
    say(`Added “${label}” — drag on the cover to frame it.`);
    return photo;
  }

  function loadSample(sample) {
    const existing = state.photos.find((photo) => photo.label === sample.label);
    if (existing) {
      assignPhoto(existing.id);
      return;
    }
    const img = new Image();
    img.onload = () => addPhoto(img, sample.label);
    img.onerror = () => say(`Could not load sample ${sample.file}.`);
    img.src = `samples/${sample.file}`;
  }

  function loadFile(file) {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => addPhoto(img, file.name.replace(/\.[^.]+$/, ''));
    img.onerror = () => say(`Could not read ${file.name}.`);
    img.src = url;
  }

  function renderTray() {
    const tray = el('tray');
    tray.innerHTML = '';
    for (const photo of state.photos) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'tray-item';
      const assignedHere = effectivePhoto(state, state.selectedPanel);
      if (assignedHere && assignedHere.id === photo.id) item.classList.add('active');
      const thumb = document.createElement('img');
      thumb.src = photo.img.src;
      thumb.alt = photo.label;
      const caption = document.createElement('span');
      caption.textContent = photo.label;
      item.append(thumb, caption);
      item.title = state.applyAll ? 'Fill every panel with this photo' : 'Put this photo in the selected panel';
      item.addEventListener('click', () => assignPhoto(photo.id));
      tray.appendChild(item);
    }
  }

  // --- panel selection, drag and zoom ------------------------------

  function panelAt(clientX, clientY) {
    const box = canvas.getBoundingClientRect();
    const nx = (clientX - box.left) / box.width;
    const ny = (clientY - box.top) / box.height;
    const rects = panelsFor(state.layoutId, aspectFamily(canvas.width, canvas.height));
    const index = rects.findIndex((r) => nx >= r.x && nx <= r.x + r.w && ny >= r.y && ny <= r.y + r.h);
    return { index, box };
  }

  function syncPanelControls() {
    const info = el('panelInfo');
    if (info) info.textContent = `Panel ${state.selectedPanel + 1} selected — drag on the cover to reposition its photo.`;
    const zoom = el('zoom');
    if (zoom) zoom.value = String(state.panelView[state.selectedPanel].zoom);
  }

  let drag = null;
  canvas.addEventListener('pointerdown', (event) => {
    const { index, box } = panelAt(event.clientX, event.clientY);
    if (index < 0) return;
    state.selectedPanel = index;
    const rects = panelsFor(state.layoutId, aspectFamily(canvas.width, canvas.height));
    const rect = rects[index];
    drag = {
      startX: event.clientX,
      startY: event.clientY,
      dx: state.panelView[index].dx,
      dy: state.panelView[index].dy,
      panelCssW: rect.w * box.width,
      panelCssH: rect.h * box.height,
    };
    canvas.setPointerCapture(event.pointerId);
    render();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const view = state.panelView[state.selectedPanel];
    view.dx = drag.dx + (event.clientX - drag.startX) / drag.panelCssW;
    view.dy = drag.dy + (event.clientY - drag.startY) / drag.panelCssH;
    render();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const { index } = panelAt(event.clientX, event.clientY);
    if (index < 0) return;
    state.selectedPanel = index;
    const view = state.panelView[index];
    view.zoom = Math.min(4, Math.max(1, view.zoom * (event.deltaY < 0 ? 1.07 : 0.93)));
    render();
  }, { passive: false });

  // --- controls -----------------------------------------------------

  function refreshChips() {
    buildChips(el('layoutRow'), LAYOUTS, (l) => l.id === state.layoutId, (l) => {
      state.layoutId = l.id;
      const count = panelCount(l.id, aspectFamily(canvas.width, canvas.height));
      if (state.selectedPanel >= count) state.selectedPanel = 0;
      refreshChips();
      render();
    });
    buildChips(el('aspectRow'),
      Object.values(ASPECTS).map((a) => ({ id: a.id, label: a.label })),
      (a) => a.id === state.aspectId,
      (a) => { state.aspectId = a.id; refreshChips(); render(); });
    buildChips(el('gradeRow'), GRADES, (g) => g.id === state.gradeId, (g) => {
      state.gradeId = g.id;
      refreshChips();
      render();
    });
  }

  function buildSamples() {
    const row = el('sampleRow');
    row.innerHTML = '';
    for (const sample of SAMPLES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip sample';
      button.textContent = sample.label;
      button.addEventListener('click', () => loadSample(sample));
      row.appendChild(button);
    }
  }

  function wireControls() {
    el('fileInput').addEventListener('change', (event) => {
      for (const file of event.target.files) loadFile(file);
      event.target.value = '';
    });
    el('applyAll').addEventListener('change', (event) => {
      state.applyAll = event.target.checked;
      renderTray();
    });
    el('zoom').addEventListener('input', (event) => {
      state.panelView[state.selectedPanel].zoom = Number(event.target.value);
      render();
    });
    el('resetView').addEventListener('click', () => {
      state.panelView[state.selectedPanel] = { dx: 0, dy: 0, zoom: 1 };
      render();
    });
    el('title1').addEventListener('input', (event) => { state.titleLines[0] = event.target.value; render(); });
    el('title2').addEventListener('input', (event) => { state.titleLines[1] = event.target.value; render(); });
    el('subtitle').addEventListener('input', (event) => { state.subtitle = event.target.value; render(); });
    el('styleSelect').addEventListener('change', (event) => { state.titleStyle = event.target.value; render(); });
    el('captionBar').addEventListener('change', (event) => { state.captionBar = event.target.checked; render(); });

    const stage = el('stage');
    stage.addEventListener('dragover', (event) => { event.preventDefault(); stage.classList.add('dragging'); });
    stage.addEventListener('dragleave', () => stage.classList.remove('dragging'));
    stage.addEventListener('drop', (event) => {
      event.preventDefault();
      stage.classList.remove('dragging');
      for (const file of event.dataTransfer.files) loadFile(file);
    });

    for (const [buttonId, aspectId] of [['expSquare', 'square'], ['expPortrait', 'portrait'], ['expWide', 'wide']]) {
      el(buttonId).addEventListener('click', () => exportPng(aspectId));
    }
  }

  async function exportPng(aspectId) {
    const aspect = ASPECTS[aspectId];
    say(`Rendering ${aspect.w} × ${aspect.h} PNG…`);
    const blob = await coverToBlob(resolveState(state, aspect.w, aspect.h), aspect.w, aspect.h);
    if (!blob) { say('Export failed in this browser.'); return; }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vice-frame-${aspect.w}x${aspect.h}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    say(`Exported vice-frame-${aspect.w}x${aspect.h}.png — post it anywhere.`);
  }

  // --- boot -----------------------------------------------------------

  const styleSelect = el('styleSelect');
  for (const style of TITLE_STYLES) {
    const option = document.createElement('option');
    option.value = style.id;
    option.textContent = style.name;
    styleSelect.appendChild(option);
  }
  styleSelect.value = state.titleStyle;
  el('title1').value = state.titleLines[0];
  el('title2').value = state.titleLines[1];
  el('subtitle').value = state.subtitle;
  el('captionBar').checked = state.captionBar;
  el('applyAll').checked = state.applyAll;

  buildSamples();
  refreshChips();
  wireControls();
  render();
  if (document.fonts && document.fonts.ready) {
    document.fonts.load('64px Anton').catch(() => {});
    document.fonts.ready.then(() => render());
  }

  // Start with a sample already framed so the first paint is a cover:
  // the override's photo when the screenshot mode names one, else the
  // first sample in the list.
  const startSample = SAMPLES.find((s) => s.file === (overrides && overrides.photo)) || SAMPLES[0];
  loadSample(startSample);
  say('Pick a sample or drop your own photo — one click exports a poster.');
  return state;
}

// Query-string overrides used by the screenshot mode (?shot=editor).
function applyOverrides(state, overrides) {
  if (overrides.layout) state.layoutId = overrides.layout;
  if (overrides.grade) state.gradeId = overrides.grade;
  if (overrides.aspect) state.aspectId = overrides.aspect;
  if (overrides.style) state.titleStyle = overrides.style;
  if (overrides.title !== undefined) state.titleLines[0] = overrides.title;
  if (overrides.title2 !== undefined) state.titleLines[1] = overrides.title2;
  if (overrides.subtitle !== undefined) state.subtitle = overrides.subtitle;
  if (overrides.captionBar !== undefined) state.captionBar = overrides.captionBar;
}
