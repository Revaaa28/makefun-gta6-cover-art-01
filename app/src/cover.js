// NEON COAST — Vice Cover Studio: the cover renderer.
// Data-driven panel layouts, real per-pixel colour grades on an offscreen
// canvas, and an original hand-drawn title block (no borrowed art or fonts).

export const SIZES = [
  { id: 'square', label: '1080 x 1080 · Square post', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 x 1350 · Portrait post', w: 1080, h: 1350 },
  { id: 'story', label: '1080 x 1920 · Story', w: 1080, h: 1920 },
  { id: 'landscape', label: '1920 x 1080 · Landscape', w: 1920, h: 1080 },
];

export const GRADES = [
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
  { id: 'grid6', label: 'Grid 6 — classic cover' },
  { id: 'heroStrip', label: 'Hero + strip' },
  { id: 'mosaic9', label: 'Mosaic 9' },
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
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const out = gradePixel(grade, d[i], d[i + 1], d[i + 2]);
    d[i] = out[0]; d[i + 1] = out[1]; d[i + 2] = out[2];
  }
  x.putImageData(img, 0, 0);
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

function drawBadge(ctx, w, h) {
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

// The title block: halftone dots, squeezed gradient title, neon script
// subtitle and a five-star heat meter.
export function drawTitleBlock(ctx, w, h, state, reserved) {
  const t = Math.round(h * (h >= w ? 0.17 : 0.21));
  ctx.save();
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
  // halftone dots, denser toward the right
  const dotGap = Math.max(9, w * 0.011);
  for (let y = dotGap * 0.6; y < t * 0.92; y += dotGap) {
    for (let x = dotGap * 0.6; x < w; x += dotGap) {
      const rr = (x / w) * dotGap * 0.30 + 0.6;
      ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,80,150,0.20)'; ctx.fill();
    }
  }
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
  const starR = t * 0.085, cy = t * 0.90, total = starR * 2 * 5 + starR * 1.4;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, w / 2 - total / 2 + starR + i * starR * 2.35, cy, starR, i < (state.stars ?? 5) ? '#ffc93c' : 'rgba(255,255,255,0.25)');
  }
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

export function renderCover(canvas, state, photos, highlight = -1) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = '#160a26';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  const overlayLayout = state.layout === 'fullBleed' || state.layout === 'tiltedShots';
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
  drawTitleBlock(ctx, w, h, state, !overlayLayout);
  drawBadge(ctx, w, h);
  drawGrain(ctx, w, h, Math.round((w * h) / 900));
  drawVignette(ctx, w, h);
}
