// Tiny mutable bridge between the DOM world and the 3D core.
// Read every frame inside useFrame — no React state, no re-renders.
export const world = {
  scroll: 0, // overall page progress 0..1
  facet: -1, // hovered About facet index, -1 = none
  cursorEnergy: 0, // 0..1, spikes with pointer velocity
  pointerX: 0, // normalized -1..1 (canvas is pointer-events-none, so we feed it)
  pointerY: 0,
  hue: 18, // hue of the project currently centered in the work gallery
  crash: 0, // signature interaction: 1 while the user holds the crash button
};
