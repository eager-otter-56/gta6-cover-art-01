// main.js — VICE FRAME boot. Three ways in, chosen by the query
// string: the cover-only screenshot mode, the editor pre-loaded by
// the screenshot mode, or the plain studio.

import { initEditor } from './editor.js';
import { runCoverShot, shotOverrides } from './shots.js';

const params = new URLSearchParams(window.location.search);

// Surface unexpected failures where a headless check can see them.
window.addEventListener('error', (event) => {
  document.body.dataset.error = String(event.message || 'unknown error');
});

if (params.get('shot') === 'cover') {
  runCoverShot(params).catch((error) => {
    document.body.dataset.error = String(error && error.message ? error.message : error);
  });
} else {
  initEditor(shotOverrides(params));
}
