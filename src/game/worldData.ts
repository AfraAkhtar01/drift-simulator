export interface BuildingData {
  x: number; z: number;
  w: number; h: number; d: number;
}
export interface TreeData {
  x: number; z: number;
}

const ROAD_SPACING = 50;
const ROAD_WIDTH = 12;
const GRID = 10;

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export function generateWorld() {
  const buildings: BuildingData[] = [];
  const trees: TreeData[] = [];

  for (let bx = -GRID; bx < GRID; bx++) {
    for (let bz = -GRID; bz < GRID; bz++) {
      const cx = (bx + 0.5) * ROAD_SPACING;
      const cz = (bz + 0.5) * ROAD_SPACING;
      if (Math.abs(cx) < 30 && Math.abs(cz) < 30) continue; // clear spawn area
      const r = seeded(bx * 1000 + bz + 42);
      const n = 2 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const w = 5 + r() * 10;
        const d = 5 + r() * 10;
        const h = 8 + r() * 30;
        const maxOff = (ROAD_SPACING - ROAD_WIDTH) / 2 - 8;
        const ox = (r() - 0.5) * maxOff * 2;
        const oz = (r() - 0.5) * maxOff * 2;
        buildings.push({ x: cx + ox, z: cz + oz, w, h, d });
      }
    }
  }

  // Trees along road edges
  for (let i = -GRID; i <= GRID; i++) {
    const roadPos = i * ROAD_SPACING;
    for (let j = -GRID * ROAD_SPACING; j <= GRID * ROAD_SPACING; j += 25) {
      // Check not on intersection
      const isOnCrossRoad = Array.from({ length: 2 * GRID + 1 }, (_, k) => (k - GRID) * ROAD_SPACING)
        .some(rp => Math.abs(j - rp) < ROAD_WIDTH / 2 + 3);
      if (isOnCrossRoad) continue;

      const offsets = [ROAD_WIDTH / 2 + 2.5, -(ROAD_WIDTH / 2 + 2.5)];
      for (const off of offsets) {
        const tx = roadPos + off;
        const tz = j;
        // Skip if overlaps building
        const overlaps = buildings.some(b =>
          Math.abs(tx - b.x) < b.w / 2 + 2 && Math.abs(tz - b.z) < b.d / 2 + 2
        );
        if (!overlaps) trees.push({ x: tx, z: tz });
      }
    }
  }

  return { buildings, trees };
}

export const WORLD = generateWorld();
export const ROAD_CONFIG = { spacing: ROAD_SPACING, width: ROAD_WIDTH, grid: GRID };
