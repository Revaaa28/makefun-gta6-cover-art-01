// NEON COAST — Vice Cover Studio: editor wiring (v2).
// Live preview, local-only photo loading, per-panel editing with drag and
// zoom, undo/redo history, single-size and export-all PNG export, and the
// ?shot= screenshot modes. The editor opens on the flagship scene: the
// nine-panel Mosaic 9 layout in the Poster Ink grade at 1920x1080, with the
// four sample photos cycled distinctly across the panels.
import { GRADES, LAYOUTS, SIZES, defaultPanels, panelRects, renderCover } from './cover.js';
import { SAMPLES, shotSize, shotState, tunePanelsForShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
const COVER_SHOTS = ['cover', 'portrait', 'square'];

let photos = []; // [{ img, name }]
let size = SIZES[3]; // landscape 1920x1080 by default
let selected = 0;
let history = [];
let historyAt = -1;

let state = {
  layout: 'mosaic9',
  grade: 'posterInk',
  title: 'NEON COAST',
  subtitle: 'Sunset Heist',
  stars: 5,
  panels: defaultPanels('mosaic9', SAMPLES.length),
};

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function images() { return photos.map((p) => p.img); }

function redraw() {
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas, state, images(), COVER_SHOTS.includes(shot) ? -1 : selected);
  const label = document.getElementById('size-label');
  if (label) label.textContent = `${size.w} x ${size.h}`;
}

function snapshot() {
  history = history.slice(0, historyAt + 1);
  history.push(JSON.stringify(state));
  if (history.length > 60) history.shift();
  historyAt = history.length - 1;
}

function restore(json) {
  state = JSON.parse(json);
  selected = Math.min(selected, state.panels.length - 1);
  syncControls();
  redraw();
}

function commit() { snapshot(); redraw(); refreshPanelControls(); }

// ---- controls --------------------------------------------------------------

function chipGroup(el, items, current, onPick) {
  el.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.label;
    if (item.id === current) b.classList.add('active');
    b.addEventListener('click', () => onPick(item.id));
    el.appendChild(b);
  });
}

function refreshThumbs() {
  const box = document.getElementById('thumbs');
  box.innerHTML = '';
  photos.forEach((p, i) => {
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.src = p.img.src;
    img.alt = p.name;
    const cap = document.createElement('figcaption');
    cap.textContent = `${i + 1}. ${p.name}`;
    fig.append(img, cap);
    box.appendChild(fig);
  });
  const sel = document.getElementById('panel-photo');
  sel.innerHTML = '';
  photos.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${i + 1}. ${p.name}`;
    sel.appendChild(opt);
  });
  refreshPanelControls();
}

function refreshPanelControls() {
  const panel = state.panels[selected];
  if (!panel) return;
  document.getElementById('panel-label').textContent =
    `Panel ${selected + 1} of ${state.panels.length} — click a panel on the cover, drag it to reposition.`;
  document.getElementById('panel-photo').value = String(Math.min(panel.photo, Math.max(0, photos.length - 1)));
  const zoom = document.getElementById('zoom');
  zoom.value = String(panel.zoom || 1);
  document.getElementById('zoom-label').textContent = `${Math.round((panel.zoom || 1) * 100)}%`;
}

function syncControls() {
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('stars').value = String(state.stars);
  document.getElementById('stars-label').textContent = `${state.stars} star${state.stars === 1 ? '' : 's'}`;
  chipGroup(document.getElementById('layouts'), LAYOUTS, state.layout, (id) => {
    state.layout = id;
    state.panels = defaultPanels(id, photos.length);
    selected = 0;
    commit();
    syncControls();
  });
  chipGroup(document.getElementById('grades'), GRADES, state.grade, (id) => { state.grade = id; commit(); syncControls(); });
  refreshPanelControls();
}

function setSizeById(id) {
  size = SIZES.find((s) => s.id === id) || SIZES[0];
  redraw();
}

// ---- export ------------------------------------------------------------------

function downloadCover(w, h) {
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  renderCover(out, state, images(), -1);
  return new Promise((resolve) => {
    out.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-coast-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      resolve();
    }, 'image/png');
  });
}

async function exportAllSizes() {
  statusEl.textContent = 'Exporting all four sizes…';
  for (const s of SIZES) {
    await downloadCover(s.w, s.h);
    // Browsers throttle rapid-fire downloads; a short pause keeps all four.
    await new Promise((r) => setTimeout(r, 450));
  }
  statusEl.textContent = 'Saved all four sizes: 1080x1080, 1080x1350, 1080x1920 and 1920x1080 PNG.';
}

// ---- photo loading -----------------------------------------------------------

async function addPhoto(url, name) {
  const img = await loadImage(url);
  photos.push({ img, name });
  refreshThumbs();
  redraw();
}

async function loadSamples() {
  photos = [];
  for (const sample of SAMPLES) await addPhoto(sample.src, sample.name);
}

async function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    await addPhoto(URL.createObjectURL(file), file.name.replace(/\.[^.]+$/, ''));
  }
  // Give any new panels a photo to show, then record the change.
  state.panels = state.panels.map((p, i) => ({ ...p, photo: p.photo < photos.length ? p.photo : i % photos.length }));
  commit();
  statusEl.textContent = `${photos.length} photo${photos.length === 1 ? '' : 's'} loaded — all local, nothing uploaded.`;
}

// ---- wiring ------------------------------------------------------------------

function wireEditor() {
  const sizeSel = document.getElementById('size');
  SIZES.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.id; opt.textContent = s.label;
    sizeSel.appendChild(opt);
  });
  sizeSel.value = size.id;
  sizeSel.addEventListener('change', () => setSizeById(sizeSel.value));

  document.getElementById('photo').addEventListener('change', async (e) => {
    await addFiles([...e.target.files]);
    e.target.value = '';
  });
  const drop = document.getElementById('drop');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', async (e) => {
    e.preventDefault(); drop.classList.remove('over');
    await addFiles([...e.dataTransfer.files]);
  });

  document.getElementById('sample-lib').addEventListener('click', async () => { await loadSamples(); commit(); });
  document.getElementById('spread').addEventListener('click', () => {
    const panel = state.panels[selected];
    const photo = panel ? panel.photo : 0;
    state.panels = state.panels.map((p) => ({ ...p, photo }));
    commit();
    statusEl.textContent = 'One photo now fills every panel — vary zoom per panel for the poster look.';
  });
  document.getElementById('shuffle').addEventListener('click', () => {
    state.panels = state.panels.map((p, i) => ({ ...p, photo: photos.length ? (i + 1) % photos.length : 0, zoom: 1 + ((i * 37) % 30) / 100 }));
    commit();
  });

  document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; commit(); });
  document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; commit(); });
  document.getElementById('stars').addEventListener('input', (e) => {
    state.stars = Number(e.target.value);
    document.getElementById('stars-label').textContent = `${state.stars} star${state.stars === 1 ? '' : 's'}`;
    commit();
  });
  document.getElementById('panel-photo').addEventListener('change', (e) => {
    state.panels[selected].photo = Number(e.target.value);
    commit();
  });
  document.getElementById('zoom').addEventListener('input', (e) => {
    state.panels[selected].zoom = Number(e.target.value);
    document.getElementById('zoom-label').textContent = `${Math.round(Number(e.target.value) * 100)}%`;
    redraw();
  });
  document.getElementById('zoom').addEventListener('change', () => snapshot());

  document.getElementById('undo').addEventListener('click', () => {
    if (historyAt > 0) { historyAt--; restore(history[historyAt]); }
  });
  document.getElementById('redo').addEventListener('click', () => {
    if (historyAt < history.length - 1) { historyAt++; restore(history[historyAt]); }
  });

  document.getElementById('export').addEventListener('click', async () => {
    await downloadCover(size.w, size.h);
    statusEl.textContent = `Saved neon-coast-${size.w}x${size.h}.png`;
  });
  document.getElementById('export-all').addEventListener('click', exportAllSizes);

  // Panel picking + dragging on the preview.
  let drag = null;
  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const pt = toCanvas(e);
    const rects = panelRects(state.layout, canvas.width, canvas.height);
    const hit = rects.findIndex((rc) => pt.x >= rc.x && pt.x <= rc.x + rc.w && pt.y >= rc.y && pt.y <= rc.y + rc.h);
    if (hit >= 0) { selected = hit; refreshPanelControls(); redraw(); }
    drag = { x: pt.x, y: pt.y };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const pt = toCanvas(e);
    const rect = panelRects(state.layout, canvas.width, canvas.height)[selected];
    if (!rect) return;
    const panel = state.panels[selected];
    panel.ox = Math.max(-1, Math.min(1, (panel.ox || 0) + (pt.x - drag.x) / (rect.w * 0.35)));
    panel.oy = Math.max(-1, Math.min(1, (panel.oy || 0) + (pt.y - drag.y) / (rect.h * 0.35)));
    drag = pt;
    redraw();
  });
  canvas.addEventListener('pointerup', () => { if (drag) { drag = null; snapshot(); } });
}

// ---- boot ----------------------------------------------------------------------

async function boot() {
  await loadSamples();
  if (COVER_SHOTS.includes(shot)) {
    document.body.classList.add('shot-cover');
    state = tunePanelsForShot(shotState(query, photos.length), query);
    size = shotSize(query);
    redraw();
  } else if (shot === 'editor') {
    document.body.classList.add('shot-editor');
    wireEditor();
    state = tunePanelsForShot(shotState(query, photos.length), query);
    setSizeById(query.get('size') || 'landscape');
    syncControls();
    snapshot();
    redraw();
  } else {
    wireEditor();
    syncControls();
    snapshot();
    redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

boot();
