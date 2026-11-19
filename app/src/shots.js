// NEON COAST — Vice Cover Studio: the sample library and the fixed scenes
// behind the ?shot= screenshot modes.
// The library holds four sample photos; the starter pair (boulevard, pier)
// ships with the kit's samples and the v2 pair (rooftop, friends) lives in
// app/assets. ?shot=cover / ?shot=portrait / ?shot=square render ONLY a cover
// at a fixed size with a fixed caption, so screenshots are deterministic.
// window.__shotReady is set once the scene has painted.

import { defaultPanels } from './cover.js';

export const SAMPLES = [
  { src: 'samples/boulevard.jpg', name: 'Boulevard sample' },
  { src: 'samples/pier.jpg', name: 'Pier sample' },
  { src: 'assets/rooftop.jpg', name: 'Rooftop sample' },
  { src: 'assets/friends.jpg', name: 'Friends sample' },
];

// Each scene pins layout, grade, caption and canvas size. Panels cycle the
// whole library in order, so a nine-panel scene shows all four photos before
// any repeats (counts 3/2/2/2 across the nine panels).
export const SHOT_SCENES = {
  cover: {
    layout: 'mosaic9', grade: 'posterInk',
    title: 'NEON COAST', subtitle: 'Sunset Heist', stars: 5,
    w: 1920, h: 1080,
  },
  portrait: {
    layout: 'mosaic9', grade: 'neon',
    title: 'Boulevard Queen', subtitle: 'Neon Nights', stars: 4,
    w: 1080, h: 1350,
  },
  square: {
    layout: 'tiltedShots', grade: 'golden',
    title: 'Pier Pressure', subtitle: 'Golden Hour', stars: 5,
    w: 1080, h: 1080,
  },
};

export function shotState(query, photoCount) {
  const scene = SHOT_SCENES[query.get('shot')] || SHOT_SCENES.cover;
  const layout = query.get('layout') || scene.layout;
  return {
    layout,
    grade: query.get('grade') || scene.grade,
    title: query.get('caption') || scene.title,
    subtitle: query.get('subtitle') ?? scene.subtitle,
    stars: Number(query.get('stars') ?? scene.stars),
    panels: defaultPanels(layout, photoCount),
  };
}

export function shotSize(query) {
  const scene = SHOT_SCENES[query.get('shot')] || SHOT_SCENES.cover;
  return {
    id: 'shot', label: 'shot',
    w: Number(query.get('w') || scene.w),
    h: Number(query.get('h') || scene.h),
  };
}

// Optional explicit per-panel photo picks (?panels=0,1,2,...) for one-off
// captures; the fixed scenes above need none.
export function tunePanelsForShot(state, query) {
  const named = query.get('panels');
  if (!named) return state;
  const picks = named.split(',').map((n) => Number(n) || 0);
  state.panels = state.panels.map((panel, i) => ({ ...panel, photo: picks[i % picks.length] }));
  return state;
}
