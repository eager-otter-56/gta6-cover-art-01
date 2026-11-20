// layouts.js — panel templates for VICE FRAME covers.
//
// Every layout describes its panels as normalized rectangles
// ({ x, y, w, h } in 0..1 cover space) for each aspect family, so the
// same design works for square, portrait and wide exports. The
// renderer (cover.js) turns the rectangles into pixels, clips each
// photo into its panel and strokes the white poster borders.

export const ASPECTS = {
  square: { id: 'square', label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { id: 'portrait', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  wide: { id: 'wide', label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

// Which family a pixel size belongs to.
export function aspectFamily(w, h) {
  const ratio = w / h;
  if (ratio > 1.2) return 'wide';
  if (ratio < 0.92) return 'portrait';
  return 'square';
}

const T = 1 / 3; // one third, reused by the strip and grid layouts

export const LAYOUTS = [
  {
    id: 'classic',
    name: 'Classic Five',
    families: {
      // Tall hero on the left, three stacked scenes on the right,
      // the bottom one split into two close-ups.
      square: [
        { x: 0, y: 0, w: 0.52, h: 1 },
        { x: 0.52, y: 0, w: 0.48, h: 0.34 },
        { x: 0.52, y: 0.34, w: 0.48, h: 0.33 },
        { x: 0.52, y: 0.67, w: 0.24, h: 0.33 },
        { x: 0.76, y: 0.67, w: 0.24, h: 0.33 },
      ],
      // Hero across the top, two rows of pairs underneath.
      portrait: [
        { x: 0, y: 0, w: 1, h: 0.44 },
        { x: 0, y: 0.44, w: 0.5, h: 0.28 },
        { x: 0.5, y: 0.44, w: 0.5, h: 0.28 },
        { x: 0, y: 0.72, w: 0.5, h: 0.28 },
        { x: 0.5, y: 0.72, w: 0.5, h: 0.28 },
      ],
      // Hero in the middle, two scenes stacked on each side.
      wide: [
        { x: 0, y: 0, w: 0.28, h: 0.5 },
        { x: 0, y: 0.5, w: 0.28, h: 0.5 },
        { x: 0.28, y: 0, w: 0.44, h: 1 },
        { x: 0.72, y: 0, w: 0.28, h: 0.5 },
        { x: 0.72, y: 0.5, w: 0.28, h: 0.5 },
      ],
    },
  },
  {
    id: 'duo',
    name: 'Duo Split',
    families: {
      square: [
        { x: 0, y: 0, w: 0.5, h: 1 },
        { x: 0.5, y: 0, w: 0.5, h: 1 },
      ],
      portrait: [
        { x: 0, y: 0, w: 1, h: 0.5 },
        { x: 0, y: 0.5, w: 1, h: 0.5 },
      ],
      wide: [
        { x: 0, y: 0, w: 0.5, h: 1 },
        { x: 0.5, y: 0, w: 0.5, h: 1 },
      ],
    },
  },
  {
    id: 'trio',
    name: 'Trio Strip',
    families: {
      square: [
        { x: 0, y: 0, w: T, h: 1 },
        { x: T, y: 0, w: T, h: 1 },
        { x: 2 * T, y: 0, w: T, h: 1 },
      ],
      portrait: [
        { x: 0, y: 0, w: 1, h: T },
        { x: 0, y: T, w: 1, h: T },
        { x: 0, y: 2 * T, w: 1, h: T },
      ],
      wide: [
        { x: 0, y: 0, w: T, h: 1 },
        { x: T, y: 0, w: T, h: 1 },
        { x: 2 * T, y: 0, w: T, h: 1 },
      ],
    },
  },
  {
    id: 'grid',
    name: 'Grid Six',
    families: {
      square: gridRects(3, 2),
      portrait: gridRects(2, 3),
      wide: gridRects(3, 2),
    },
  },
  {
    id: 'banner',
    name: 'Banner Hero',
    families: {
      square: [
        { x: 0, y: 0, w: 1, h: 0.7 },
        { x: 0, y: 0.7, w: T, h: 0.3 },
        { x: T, y: 0.7, w: T, h: 0.3 },
        { x: 2 * T, y: 0.7, w: T, h: 0.3 },
      ],
      portrait: [
        { x: 0, y: 0, w: 1, h: 0.62 },
        { x: 0, y: 0.62, w: 0.5, h: 0.19 },
        { x: 0.5, y: 0.62, w: 0.5, h: 0.19 },
        { x: 0, y: 0.81, w: 1, h: 0.19 },
      ],
      wide: [
        { x: 0, y: 0, w: 0.68, h: 1 },
        { x: 0.68, y: 0, w: 0.32, h: 0.5 },
        { x: 0.68, y: 0.5, w: 0.32, h: 0.5 },
      ],
    },
  },
];

// Even grid of cols × rows panels, used by the Grid Six layout.
function gridRects(cols, rows) {
  const rects = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      rects.push({ x: c / cols, y: r / rows, w: 1 / cols, h: 1 / rows });
    }
  }
  return rects;
}

export function layoutById(id) {
  return LAYOUTS.find((layout) => layout.id === id) || LAYOUTS[0];
}

// Panels for one layout in one aspect family.
export function panelsFor(layoutId, family) {
  const layout = layoutById(layoutId);
  return layout.families[family] || layout.families.square;
}

// How many panels a layout shows in a family — the editor uses this
// to keep the selected-panel index in range when layouts change.
export function panelCount(layoutId, family) {
  return panelsFor(layoutId, family).length;
}

// Largest panel count any family of any layout can ask for; the
// editor keeps per-panel state arrays at this size.
export const MAX_PANELS = 6;
