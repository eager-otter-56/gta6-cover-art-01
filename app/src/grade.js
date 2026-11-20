// grade.js — colour grades for VICE FRAME covers.
//
// A grade is two layers the renderer (cover.js) applies:
//   1. `filter` — a CSS filter string used as the canvas filter while
//      each panel photo is drawn (saturation, contrast, warmth...).
//   2. a full-cover gradient wash (`top` colour fading through clear
//      to `bottom`), composited with `mode`, plus a soft sky glow.
// The four looks are original recipes: hot sunset, teal-and-magenta
// neon, warm golden hour, and a high-contrast noir that keeps one
// pink accent in the wash.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset Heat',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.04) sepia(0.22) hue-rotate(-6deg)',
    top: 'rgba(255, 94, 58, 0.55)',
    bottom: 'rgba(122, 0, 102, 0.60)',
    mode: 'soft-light',
    glow: 'rgba(255, 170, 60, 0.20)',
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    filter: 'saturate(1.5) contrast(1.16) brightness(0.99) hue-rotate(4deg)',
    top: 'rgba(0, 229, 255, 0.50)',
    bottom: 'rgba(255, 0, 128, 0.55)',
    mode: 'soft-light',
    glow: 'rgba(0, 229, 255, 0.16)',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'saturate(1.22) contrast(1.05) brightness(1.1) sepia(0.38)',
    top: 'rgba(255, 196, 64, 0.50)',
    bottom: 'rgba(146, 64, 0, 0.55)',
    mode: 'soft-light',
    glow: 'rgba(255, 214, 120, 0.22)',
  },
  {
    id: 'dusk',
    name: 'Chrome Dusk',
    filter: 'saturate(1.28) contrast(1.12) brightness(0.97) hue-rotate(-12deg)',
    top: 'rgba(64, 0, 128, 0.52)',
    bottom: 'rgba(255, 110, 40, 0.55)',
    mode: 'soft-light',
    glow: 'rgba(150, 80, 255, 0.16)',
  },
  {
    id: 'noir',
    name: 'Vice Noir',
    filter: 'grayscale(1) contrast(1.32) brightness(1.06)',
    top: 'rgba(30, 30, 46, 0.45)',
    bottom: 'rgba(255, 45, 149, 0.42)',
    mode: 'soft-light',
    glow: 'rgba(255, 45, 149, 0.10)',
  },
];

export function gradeById(id) {
  return GRADES.find((grade) => grade.id === id) || GRADES[0];
}
