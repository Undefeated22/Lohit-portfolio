// Tiny mutable bridge between the DOM and the WebGL cluster.
// Read every frame inside useFrame — no React state, no re-renders.
export const world = {
  facet: -1, // hovered About facet → its shard quadrant lights up (-1 = none)
  hoverTile: -1, // tile under the pointer (for the "hold to kill" caption)
  holdProgress: 0, // 0..1 while the pointer is held on a tile
  project: null as string | null, // open case-study slug → camera dives to its workflow
  replaying: false, // a logged visit is being re-enacted
};
