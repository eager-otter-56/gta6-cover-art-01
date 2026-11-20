// cover.js — the VICE FRAME cover renderer.
//
// drawCover() paints a complete poster onto a 2D context at any
// pixel size: graded photos clipped into the layout's panels, white
// poster borders, a sky glow, film grain, a vignette, and the big
// stacked Anton lettering with its caption bar. The editor preview,
// the PNG exports and the screenshot modes all call this one
// function, so what you see is exactly what you export.

import { panelsFor, aspectFamily } from './layouts.js';
import { gradeById } from './grade.js';

// Lettering colourways: gradient stops for the fill plus the dark
// outline colour that makes the type pop off the photo.
export const TITLE_STYLES = [
  { id: 'sunset', name: 'Sunset Pop', stops: ['#fff7ae', '#ffb347', '#ff5e8a'], stroke: '#1a0b2e' },
  { id: 'neon', name: 'Neon Duo', stops: ['#aefcff', '#38e1ff', '#ff71ce'], stroke: '#0b1035' },
  { id: 'clean', name: 'Clean White', stops: ['#ffffff', '#f2f5f8', '#c9d4de'], stroke: '#101014' },
  { id: 'gold', name: 'Gold Leaf', stops: ['#fff6c4', '#ffd94d', '#e79b1e'], stroke: '#2a1503' },
];

export function titleStyleById(id) {
  return TITLE_STYLES.find((style) => style.id === id) || TITLE_STYLES[0];
}

// A small tile of random grey noise, generated once and reused as a
// pattern for the film-grain pass.
let noiseTile = null;
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const tile = document.createElement('canvas');
  tile.width = 256;
  tile.height = 256;
  const tctx = tile.getContext('2d');
  const image = tctx.createImageData(256, 256);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 96);
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  tctx.putImageData(image, 0, 0);
  noiseTile = tile;
  return tile;
}

// Draw one photo into a panel rectangle with cover-fit scaling,
// the panel's own zoom, and its drag offset (dx/dy in panel units).
function drawPanelPhoto(ctx, img, rect, view, filter) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const zoom = Math.max(1, view.zoom || 1);
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const cx = rect.x + rect.w / 2 + (view.dx || 0) * rect.w;
  const cy = rect.y + rect.h / 2 + (view.dy || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = filter;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

// Placeholder art for a panel with no photo yet: a dusk gradient
// with a soft sun disc, so an empty cover still reads as a poster.
function drawPanelPlaceholder(ctx, rect, index) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, '#2b1055');
  grad.addColorStop(0.55, '#7597de');
  grad.addColorStop(1, '#ff7e5f');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const sunR = Math.min(rect.w, rect.h) * 0.22;
  const sun = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h * 0.62, 0,
    rect.x + rect.w / 2, rect.y + rect.h * 0.62, sunR,
  );
  sun.addColorStop(0, 'rgba(255, 214, 140, 0.95)');
  sun.addColorStop(1, 'rgba(255, 140, 90, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `${Math.max(13, Math.round(rect.h * 0.055))}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`PANEL ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h * 0.9);
}

// The stacked title, subtitle and optional caption bar.
function drawLettering(ctx, W, H, state) {
  const style = titleStyleById(state.titleStyle);
  const lines = (state.titleLines || []).map((line) => (line || '').toUpperCase()).filter(Boolean);
  const subtitle = (state.subtitle || '').toUpperCase();
  const barH = state.captionBar ? Math.round(H * 0.088) : 0;

  // Legibility scrim behind the lettering zone.
  const scrim = ctx.createLinearGradient(0, H * 0.42, 0, H);
  scrim.addColorStop(0, 'rgba(6, 0, 16, 0)');
  scrim.addColorStop(1, 'rgba(6, 0, 16, 0.58)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.42, W, H * 0.58);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Fit the title: start from a poster-sized font and shrink until
  // the widest line fits 92% of the cover width.
  let fs = Math.min(H * 0.128, W * 0.17);
  ctx.font = `${fs}px Anton, 'Arial Black', sans-serif`;
  let widest = 0;
  for (const line of lines) widest = Math.max(widest, ctx.measureText(line).width);
  if (widest > W * 0.92) {
    fs = Math.floor(fs * ((W * 0.92) / widest));
    ctx.font = `${fs}px Anton, 'Arial Black', sans-serif`;
  }
  const lineHeight = fs * 1.04;
  const blockBottom = H - barH - H * 0.038;
  const blockTop = blockBottom - lineHeight * lines.length;

  // Subtitle rides just above the title block when there is no bar.
  if (subtitle && !state.captionBar) {
    const subFs = Math.max(15, Math.round(H * 0.03));
    ctx.font = `${subFs}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subFs * 0.32)}px`; } catch { /* older canvas */ }
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = subFs * 0.3;
    ctx.shadowOffsetY = subFs * 0.08;
    ctx.fillStyle = '#ffd94d';
    ctx.fillText(subtitle, W / 2, blockTop - subFs * 0.55);
    ctx.shadowColor = 'transparent';
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }

  // Title lines with a slight italic shear, heavy outline, gradient
  // fill and a soft drop shadow.
  ctx.font = `${fs}px Anton, 'Arial Black', sans-serif`;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  lines.forEach((line, i) => {
    const baseline = blockTop + lineHeight * (i + 1) - (lineHeight - fs) / 2;
    ctx.save();
    ctx.translate(W / 2, 0);
    ctx.transform(1, 0, -0.055, 1, 0, 0);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = fs * 0.1;
    ctx.shadowOffsetY = fs * 0.05;
    ctx.lineWidth = fs * 0.17;
    ctx.strokeStyle = style.stroke;
    ctx.strokeText(line, 0, baseline);
    ctx.shadowColor = 'transparent';
    const fill = ctx.createLinearGradient(0, baseline - fs, 0, baseline);
    fill.addColorStop(0, style.stops[0]);
    fill.addColorStop(0.55, style.stops[1]);
    fill.addColorStop(1, style.stops[2]);
    ctx.fillStyle = fill;
    ctx.fillText(line, 0, baseline);
    ctx.restore();
  });
  ctx.restore();

  // Caption bar: dark strip with the subtitle left and the studio
  // tag right, topped by a thin accent rule.
  if (state.captionBar) {
    const barY = H - barH;
    ctx.fillStyle = 'rgba(8, 6, 18, 0.92)';
    ctx.fillRect(0, barY, W, barH);
    ctx.fillStyle = '#ff71ce';
    ctx.fillRect(0, barY, W, Math.max(3, Math.round(H * 0.006)));
    const barFs = Math.max(15, Math.round(barH * 0.44));
    ctx.font = `${barFs}px Anton, sans-serif`;
    ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = `${Math.round(barFs * 0.18)}px`; } catch { /* older canvas */ }
    if (subtitle) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(subtitle, W * 0.035, barY + barH / 2 + 1);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = '#7df9ff';
    ctx.fillText('VICE FRAME', W * 0.965, barY + barH / 2 + 1);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    ctx.textBaseline = 'alphabetic';
  }
}

// Paint the whole cover. `state.panels` must already be resolved
// for the target aspect family (see resolvePanels in editor.js):
// one { img, dx, dy, zoom } entry per panel of the layout.
export function drawCover(ctx, W, H, state, opts = {}) {
  const family = aspectFamily(W, H);
  const rects = panelsFor(state.layoutId, family);
  const grade = gradeById(state.gradeId);
  const border = Math.max(4, Math.round(W * 0.0075));
  const half = border / 2;

  // Poster paper behind everything.
  ctx.filter = 'none';
  ctx.fillStyle = '#f5f1e8';
  ctx.fillRect(0, 0, W, H);

  rects.forEach((r, i) => {
    const px = {
      x: r.x * W + half,
      y: r.y * H + half,
      w: r.w * W - border,
      h: r.h * H - border,
    };
    const panel = state.panels[i];
    if (panel && panel.img) {
      drawPanelPhoto(ctx, panel.img, px, panel, grade.filter);
    } else {
      drawPanelPlaceholder(ctx, px, i);
    }
    if (opts.preview && opts.selected === i) {
      ctx.save();
      ctx.strokeStyle = '#ff71ce';
      ctx.lineWidth = Math.max(2, Math.round(W * 0.004));
      ctx.setLineDash([14, 10]);
      ctx.strokeRect(px.x, px.y, px.w, px.h);
      ctx.restore();
    }
  });

  // Grade wash: top colour melting into the bottom colour.
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.45, 'rgba(0,0,0,0)');
  wash.addColorStop(1, grade.bottom);
  ctx.save();
  ctx.globalCompositeOperation = grade.mode;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Sky glow pooled at the top centre.
  const glow = ctx.createRadialGradient(W / 2, -H * 0.1, 0, W / 2, -H * 0.1, W * 0.75);
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H * 0.55);
  ctx.restore();

  drawLettering(ctx, W, H, state);

  // Film grain over everything, very light.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = ctx.createPattern(getNoiseTile(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Vignette to seat the edges.
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Outer poster frame.
  ctx.strokeStyle = '#f5f1e8';
  ctx.lineWidth = border;
  ctx.strokeRect(border / 2, border / 2, W - border, H - border);
}

// Render a cover state onto a fresh canvas at an exact size.
export function makeCoverCanvas(state, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  drawCover(canvas.getContext('2d'), W, H, state);
  return canvas;
}

export function coverToBlob(state, W, H) {
  return new Promise((resolve) => {
    makeCoverCanvas(state, W, H).toBlob((blob) => resolve(blob), 'image/png');
  });
}
