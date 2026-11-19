// Fixed scenes for screenshots, driven by ?shot= URL parameters.
// ?shot=cover renders ONLY the cover at the requested pixel size; ?shot=editor
// preloads the editor with both sample photos and a strong cover configured.
// Recognised params: layout, grade, size, w, h, caption (the title),
// subtitle, stars. window.__shotReady is set once the scene has painted.

import { defaultPanels } from './cover.js';

export const SAMPLES = [
  { src: 'samples/boulevard.jpg', name: 'Boulevard sample' },
  { src: 'samples/pier.jpg', name: 'Pier sample' },
];

export function shotState(query, photoCount) {
  const layout = query.get('layout') || 'grid6';
  return {
    layout,
    grade: query.get('grade') || 'vice',
    title: query.get('caption') || 'NEON COAST',
    subtitle: query.get('subtitle') ?? 'Sunset Heist',
    stars: Number(query.get('stars') ?? 5),
    panels: defaultPanels(layout, photoCount),
  };
}

// Per-layout photo assignments that make the sample photos look varied:
// the same two photos, but different panels, crops and zooms per layout.
export function tunePanelsForShot(state, query) {
  const named = query.get('panels');
  if (!named) return state;
  const picks = named.split(',').map((n) => Number(n) || 0);
  state.panels = state.panels.map((panel, i) => ({ ...panel, photo: picks[i % picks.length] }));
  return state;
}
