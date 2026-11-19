// NEON COAST — Vice Cover Studio: the cover renderer (v2).
// Data-driven panel layouts, real per-pixel colour grades on an offscreen
// canvas, the Poster Ink illustrated grade (gradient-map + posterize + Sobel
// edge darkening + saturation lift), and an original hand-drawn title block
// with a halftone band, heat-star meter and round badge. No borrowed art,
// logos or fonts anywhere.

export const SIZES = [
  { id: 'square', label: '1080 x 1080 · Square post', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 x 1350 · Portrait post', w: 1080, h: 1350 },
  { id: 'story', label: '1080 x 1920 · Story', w: 1080, h: 1920 },
  { id: 'landscape', label: '1920 x 1080 · Landscape', w: 1920, h: 1080 },
];

export const GRADES = [
  { id: 'posterInk', label: 'Poster Ink' },
  { id: 'vice', label: 'Vice Sunset' },
  { id: 'neon', label: 'Neon Nights' },
  { id: 'golden', label: 'Golden Hour' },
  { id: 'teal', label: 'Teal Heat' },
  { id: 'ink', label: 'Noir Ink' },
  { id: 'pastel', label: 'Pastel Vice' },
];

// Panel rectangles for a layout, in canvas pixels. `titleH` is the reserved
// title band at the top for the stacked layouts; full-bleed layouts ignore it
// and the title is drawn over a scrim instead.
export function panelRects(layout, w, h) {
  const t = Math.round(h * (h >= w ? 0.17 : 0.21));
  const area = { x: 0, y: t, w, h: h - t };
  const cell = (cols, rows, i) => {
    const cw = area.w / cols, ch = area.h / rows;
    return { x: area.x + (i % cols) * cw, y: area.y + Math.floor(i / cols) * ch, w: cw, h: ch, rot: 0 };
  };
  switch (layout) {
    case 'mosaic9':
      return Array.from({ length: 9 }, (_, i) => cell(3, 3, i));
    case 'duoSplit':
      return [cell(2, 1, 0), cell(2, 1, 1)];
    case 'heroStrip': {
      const heroH = area.h * 0.66;
      const rects = [{ x: 0, y: area.y, w, h: heroH, rot: 0 }];
      for (let i = 0; i < 3; i++) {
        rects.push({ x: (w / 3) * i, y: area.y + heroH, w: w / 3, h: area.h - heroH, rot: 0 });
      }
      return rects;
    }
    case 'fullBleed': {
      const iw = w * 0.34, ih = h * 0.30;
      return [
        { x: 0, y: 0, w, h, rot: 0 },
        { x: w * 0.045, y: h - ih - h * 0.045, w: iw, h: ih, rot: 0 },
        { x: w - iw - w * 0.045, y: h - ih - h * 0.045, w: iw, h: ih, rot: 0 },
      ];
    }
    case 'tiltedShots': {
      const pw = w * 0.44, ph = h * 0.52;
      return [
        { x: 0, y: 0, w, h, rot: 0 },
        { x: w * 0.04, y: h * 0.34, w: pw, h: ph, rot: -7 },
        { x: w * 0.36, y: h * 0.42, w: pw, h: ph, rot: 4 },
        { x: w * 0.62, y: h * 0.30, w: pw * 0.82, h: ph, rot: -3 },
      ];
    }
    case 'grid6':
    default:
      return Array.from({ length: 6 }, (_, i) => cell(3, 2, i));
  }
}

export const LAYOUTS = [
  { id: 'mosaic9', label: 'Mosaic 9 — nine-panel cover' },
  { id: 'grid6', label: 'Grid 6 — classic cover' },
  { id: 'heroStrip', label: 'Hero + strip' },
  { id: 'duoSplit', label: 'Duo split' },
  { id: 'fullBleed', label: 'Full bleed + insets' },
  { id: 'tiltedShots', label: 'Tilted snapshots' },
];

// ---- colour grades: real pixel work -------------------------------------

function lerp(a, b, t) { return a + (b - a) * t; }

function gradientMap(r, g, b, stops, mix) {
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (lum >= stops[i][0] && lum <= stops[i + 1][0]) { lo = stops[i]; hi = stops[i + 1]; break; }
  }
  const span = Math.max(0.0001, hi[0] - lo[0]);
  const t = Math.min(1, Math.max(0, (lum - lo[0]) / span));
  return [
    lerp(r, lerp(lo[1][0], hi[1][0], t), mix),
    lerp(g, lerp(lo[1][1], hi[1][1], t), mix),
    lerp(b, lerp(lo[1][2], hi[1][2], t), mix),
  ];
}

const VICE_STOPS = [[0, [43, 10, 74]], [0.45, [214, 51, 132]], [0.72, [255, 110, 64]], [1, [255, 215, 106]]];
const NEON_STOPS = [[0, [4, 32, 46]], [0.4, [0, 128, 160]], [0.75, [255, 47, 150]], [1, [255, 236, 170]]];
const TEAL_STOPS = [[0, [6, 44, 54]], [0.5, [38, 150, 150]], [0.8, [255, 138, 61]], [1, [255, 224, 138]]];
const PASTEL_STOPS = [[0, [86, 64, 140]], [0.5, [240, 130, 170]], [1, [190, 245, 235]]];

export function gradePixel(grade, r, g, b) {
  switch (grade) {
    case 'neon': return gradientMap(r, g, b, NEON_STOPS, 0.55);
    case 'teal': return gradientMap(r, g, b, TEAL_STOPS, 0.5);
    case 'pastel': {
      const out = gradientMap(r, g, b, PASTEL_STOPS, 0.38);
      return [lerp(out[0], 255, 0.08), lerp(out[1], 255, 0.08), lerp(out[2], 255, 0.10)];
    }
    case 'golden': {
      const lift = 14;
      return [Math.min(255, r * 1.13 + lift), Math.min(255, g * 1.04 + lift * 0.6), b * 0.86];
    }
    case 'ink': {
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const poster = Math.round(lum / 51) * 51;
      const inked = Math.min(255, Math.max(0, (poster - 128) * 1.35 + 128));
      return [lerp(inked, r, 0.28), lerp(inked, g, 0.28), lerp(inked, b, 0.34)];
    }
    case 'vice':
    default: return gradientMap(r, g, b, VICE_STOPS, 0.48);
  }
}

// ---- Poster Ink: the illustrated grade ------------------------------------
// A panel-wide treatment (it needs each pixel's neighbours, so it cannot live
// in gradePixel): gradient-map toward the Vice palette, lift saturation,
// posterize every channel to flat ink bands, then multiply Sobel edges back
// in as dark ink lines. The result reads as printed poster art, not a tint.

function liftSaturation(r, g, b, amount) {
  const grey = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return [
    Math.min(255, Math.max(0, grey + (r - grey) * amount)),
    Math.min(255, Math.max(0, grey + (g - grey) * amount)),
    Math.min(255, Math.max(0, grey + (b - grey) * amount)),
  ];
}

function posterizeChannel(value, levels) {
  const step = 255 / (levels - 1);
  return Math.round(value / step) * step;
}

export function inkPosterizePanel(imageData) {
  const d = imageData.data;
  const levels = 6;
  for (let i = 0; i < d.length; i += 4) {
    const mapped = gradientMap(d[i], d[i + 1], d[i + 2], VICE_STOPS, 0.42);
    const lifted = liftSaturation(mapped[0], mapped[1], mapped[2], 1.28);
    d[i] = posterizeChannel(lifted[0], levels);
    d[i + 1] = posterizeChannel(lifted[1], levels);
    d[i + 2] = posterizeChannel(lifted[2], levels);
  }
  return imageData;
}

export function darkenInkEdges(imageData) {
  const { width, height } = imageData;
  const d = imageData.data;
  const lum = new Float32Array(width * height);
  for (let p = 0, i = 0; p < lum.length; p++, i += 4) {
    lum[p] = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  }
  const strength = 0.62;
  const out = new Uint8ClampedArray(d);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      const gx = -lum[p - width - 1] - 2 * lum[p - 1] - lum[p + width - 1]
        + lum[p - width + 1] + 2 * lum[p + 1] + lum[p + width + 1];
      const gy = -lum[p - width - 1] - 2 * lum[p - width] - lum[p - width + 1]
        + lum[p + width - 1] + 2 * lum[p + width] + lum[p + width + 1];
      const edge = Math.min(1, Math.sqrt(gx * gx + gy * gy) / 720);
      const keep = 1 - edge * strength;
      const i = p * 4;
      out[i] = d[i] * keep;
      out[i + 1] = d[i + 1] * keep;
      out[i + 2] = d[i + 2] * keep;
    }
  }
  imageData.data.set(out);
  return imageData;
}

function applyPosterInk(imageData) {
  inkPosterizePanel(imageData);
  darkenInkEdges(imageData);
  return imageData;
}

// Draws one photo into a panel rect on an offscreen canvas, grades its
// pixels, and returns the finished panel canvas.
function renderPanel(photo, rect, panel, grade) {
  const pw = Math.max(2, Math.round(rect.w));
  const ph = Math.max(2, Math.round(rect.h));
  const c = document.createElement('canvas');
  c.width = pw; c.height = ph;
  const x = c.getContext('2d');
  x.fillStyle = '#241233';
  x.fillRect(0, 0, pw, ph);
  if (photo) {
    const zoom = panel.zoom || 1;
    const scale = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight) * zoom;
    const dw = photo.naturalWidth * scale, dh = photo.naturalHeight * scale;
    const dxRaw = (pw - dw) / 2 + (panel.ox || 0) * pw * 0.35;
    const dyRaw = (ph - dh) / 2 + (panel.oy || 0) * ph * 0.35;
    // Clamp so the photo always covers the panel: an offset can slide the
    // crop window, never expose an empty band at an edge.
    const dx = Math.max(pw - dw, Math.min(0, dxRaw));
    const dy = Math.max(ph - dh, Math.min(0, dyRaw));
    x.drawImage(photo, dx, dy, dw, dh);
  } else {
    const grad = x.createLinearGradient(0, 0, pw, ph);
    grad.addColorStop(0, '#ff7a3c'); grad.addColorStop(0.55, '#d63384'); grad.addColorStop(1, '#2b0a4a');
    x.fillStyle = grad; x.fillRect(0, 0, pw, ph);
  }
  const img = x.getImageData(0, 0, pw, ph);
  if (grade === 'posterInk') {
    x.putImageData(applyPosterInk(img), 0, 0);
  } else {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const out = gradePixel(grade, d[i], d[i + 1], d[i + 2]);
      d[i] = out[0]; d[i + 1] = out[1]; d[i + 2] = out[2];
    }
    x.putImageData(img, 0, 0);
  }
  return c;
}

// ---- overlays ------------------------------------------------------------

function drawGrain(ctx, w, h, amount) {
  let seed = 1234567;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  ctx.save();
  for (let i = 0; i < amount; i++) {
    const gx = rand() * w, gy = rand() * h, s = rand() * 2.2 + 0.4;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(gx, gy, s, s);
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const rad = Math.max(w, h) * 0.72;
  const g = ctx.createRadialGradient(w / 2, h / 2, rad * 0.45, w / 2, h / 2, rad);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,2,24,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawStar(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.46;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = r * 0.14;
  ctx.strokeStyle = '#160a26';
  ctx.stroke();
}

export function drawHeatStarMeter(ctx, cx, cy, r, stars) {
  const total = r * 2 * 5 + r * 1.4;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, cx - total / 2 + r + i * r * 2.35, cy, r, i < stars ? '#ffc93c' : 'rgba(255,255,255,0.25)');
  }
}

export function stampRoundBadge(ctx, w, h) {
  const r = Math.min(w, h) * 0.085;
  const cx = w - r - Math.min(w, h) * 0.035, cy = h - r - Math.min(w, h) * 0.035;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(18,6,36,0.88)'; ctx.fill();
  ctx.lineWidth = r * 0.09; ctx.strokeStyle = '#ffc93c'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.lineWidth = r * 0.035; ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.stroke();
  ctx.fillStyle = '#ffc93c';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `900 ${r * 0.30}px 'Arial Black', Arial, sans-serif`;
  ctx.fillText('NEON', cx, cy - r * 0.34);
  ctx.fillText('COAST', cx, cy - r * 0.02);
  ctx.fillStyle = '#7df9ff';
  ctx.font = `700 ${r * 0.21}px Arial, sans-serif`;
  ctx.fillText('EST. 2026', cx, cy + r * 0.32);
  ctx.restore();
}

// The title band's ground: a deep gradient (or a scrim over full-bleed art)
// plus the halftone dot field. The flagship nine-panel cover gets the strong
// treatment — a denser, larger dot band with a second offset row of dots in
// cyan, so the title sits on a printed-poster dot screen.
export function paintHalftoneTitleBlock(ctx, w, t, reserved, strong) {
  if (reserved) {
    const bg = ctx.createLinearGradient(0, 0, 0, t);
    bg.addColorStop(0, '#12041f'); bg.addColorStop(1, '#2b0a4a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, t);
  } else {
    const scrim = ctx.createLinearGradient(0, 0, 0, t * 1.25);
    scrim.addColorStop(0, 'rgba(10,2,24,0.88)');
    scrim.addColorStop(1, 'rgba(10,2,24,0)');
    ctx.fillStyle = scrim; ctx.fillRect(0, 0, w, t * 1.25);
  }
  const dotGap = Math.max(9, w * (strong ? 0.009 : 0.011));
  const dotScale = strong ? 0.42 : 0.30;
  const dotAlpha = strong ? 0.34 : 0.20;
  for (let y = dotGap * 0.6; y < t * 0.96; y += dotGap) {
    for (let x = dotGap * 0.6; x < w; x += dotGap) {
      const rr = (x / w) * dotGap * dotScale + 0.6;
      ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,80,150,${dotAlpha})`; ctx.fill();
      if (strong) {
        ctx.beginPath(); ctx.arc(x + dotGap * 0.5, y + dotGap * 0.5, rr * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,229,255,0.16)'; ctx.fill();
      }
    }
  }
}

// The title block: halftone ground, squeezed gradient title, neon script
// subtitle and the five-star heat meter.
export function drawTitleBlock(ctx, w, h, state, reserved) {
  const t = Math.round(h * (h >= w ? 0.17 : 0.21));
  const strong = state.layout === 'mosaic9';
  ctx.save();
  paintHalftoneTitleBlock(ctx, w, t, reserved, strong);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, reserved ? t - Math.max(3, h * 0.005) : t, w, Math.max(3, h * 0.005));

  const title = (state.title || 'NEON COAST').trim().toUpperCase() || 'NEON COAST';
  let size = t * 0.52;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const setFont = () => { ctx.font = `900 ${size}px 'Arial Black', Arial, sans-serif`; };
  setFont();
  ctx.save();
  ctx.translate(w / 2, t * 0.40);
  ctx.scale(0.82, 1);
  while (ctx.measureText(title).width > (w * 0.92) / 0.82 && size > 14) { size -= 3; setFont(); }
  const grad = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
  grad.addColorStop(0, '#ffe259'); grad.addColorStop(0.5, '#ff7a3c'); grad.addColorStop(1, '#ff2e88');
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = size * 0.16; ctx.shadowOffsetY = size * 0.07;
  ctx.lineWidth = size * 0.20; ctx.strokeStyle = '#0d0218';
  ctx.strokeText(title, 0, 0);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, 0);
  ctx.lineWidth = size * 0.028; ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.strokeText(title, 0, 0);
  ctx.restore();

  const subtitle = (state.subtitle || '').trim();
  if (subtitle) {
    ctx.save();
    ctx.font = `italic 700 ${t * 0.185}px 'Segoe Script', 'Brush Script MT', cursive`;
    ctx.fillStyle = '#7df9ff';
    ctx.shadowColor = '#00c2ff'; ctx.shadowBlur = t * 0.07;
    ctx.fillText(subtitle, w / 2, t * 0.755);
    ctx.restore();
  }
  drawHeatStarMeter(ctx, w / 2, t * 0.90, t * 0.085, state.stars ?? 5);
  ctx.restore();
}

// ---- the whole cover -------------------------------------------------------

export function defaultPanels(layout, photoCount) {
  const count = panelRects(layout, 100, 100).length;
  const zooms = [1.0, 1.06, 1.0, 1.12, 1.0, 1.08, 1.0, 1.1, 1.02];
  const offs = [[0, 0.26], [0.2, 0.24], [-0.2, 0.28], [0.1, 0.22], [-0.12, 0.27], [0.25, 0.24], [0, 0.25], [-0.22, 0.26], [0.16, 0.23]];
  return Array.from({ length: count }, (_, i) => ({
    photo: photoCount > 0 ? i % photoCount : 0,
    zoom: zooms[i % zooms.length],
    ox: offs[i % offs.length][0],
    oy: offs[i % offs.length][1],
  }));
}

function paintPanels(ctx, w, h, state, photos, highlight) {
  const rects = panelRects(state.layout, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = photos[panel.photo] || photos[0] || null;
    const piece = renderPanel(photo, rect, panel, state.grade);
    ctx.save();
    if (rect.rot) {
      const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
      ctx.translate(cx, cy); ctx.rotate((rect.rot * Math.PI) / 180); ctx.translate(-cx, -cy);
    }
    ctx.drawImage(piece, rect.x, rect.y);
    const bw = Math.max(4, Math.round(w * 0.006));
    ctx.lineWidth = bw + 4; ctx.strokeStyle = '#0d0218';
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.lineWidth = bw; ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    if (i === highlight) {
      ctx.lineWidth = bw + 2; ctx.strokeStyle = '#00e5ff';
      ctx.strokeRect(rect.x + bw, rect.y + bw, rect.w - bw * 2, rect.h - bw * 2);
    }
    ctx.restore();
  });
  return rects;
}

function finishCover(ctx, w, h, state, overlayLayout) {
  drawTitleBlock(ctx, w, h, state, !overlayLayout);
  stampRoundBadge(ctx, w, h);
  drawGrain(ctx, w, h, Math.round((w * h) / 900));
  drawVignette(ctx, w, h);
}

// The flagship: nine inked panels under the strong halftone title block.
export function renderNinePanelCover(canvas, state, photos, highlight = -1) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = '#160a26';
  ctx.fillRect(0, 0, w, h);
  paintPanels(ctx, w, h, { ...state, layout: 'mosaic9' }, photos, highlight);
  finishCover(ctx, w, h, state, false);
}

export function renderCover(canvas, state, photos, highlight = -1) {
  if (state.layout === 'mosaic9') {
    renderNinePanelCover(canvas, state, photos, highlight);
    return;
  }
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = '#160a26';
  ctx.fillRect(0, 0, w, h);
  paintPanels(ctx, w, h, state, photos, highlight);
  const overlayLayout = state.layout === 'fullBleed' || state.layout === 'tiltedShots';
  finishCover(ctx, w, h, state, overlayLayout);
}
