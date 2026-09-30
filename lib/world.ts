import type { Region, WorldNode } from "@/lib/types";

const CATALOG: Omit<WorldNode, "kind">[] = [
  { id: "iad", name: "Ashburn", operator: "Everstake", region: "US-E", x: 0.27, y: 0.36 },
  { id: "chi", name: "Chicago", operator: "Blockdaemon", region: "US-E", x: 0.24, y: 0.34 },
  { id: "sfo", name: "Fremont", operator: "Kiln", region: "US-W", x: 0.12, y: 0.38 },
  { id: "lon", name: "London", operator: "P2P.org", region: "EU", x: 0.48, y: 0.3 },
  { id: "fra", name: "Frankfurt", operator: "Luganodes", region: "EU", x: 0.53, y: 0.32 },
  { id: "ams", name: "Amsterdam", operator: "Ebunker", region: "EU", x: 0.51, y: 0.29 },
  { id: "hel", name: "Helsinki", operator: "Allnodes", region: "EU", x: 0.57, y: 0.2 },
  { id: "sin", name: "Singapore", operator: "InfStones", region: "APAC", x: 0.78, y: 0.56 },
  { id: "tyo", name: "Tokyo", operator: "HashKey", region: "APAC", x: 0.88, y: 0.38 },
  { id: "sel", name: "Seoul", operator: "FP Validated", region: "APAC", x: 0.84, y: 0.36 },
  { id: "bom", name: "Mumbai", operator: "Stakely", region: "APAC", x: 0.69, y: 0.48 },
  { id: "syd", name: "Sydney", operator: "Chorus One", region: "ANZ", x: 0.91, y: 0.74 },
  { id: "gru", name: "São Paulo", operator: "Pier Two", region: "LATAM", x: 0.36, y: 0.7 },
  { id: "cpt", name: "Cape Town", operator: "Flexnode CPT", region: "AFR", x: 0.54, y: 0.74 },
  { id: "dub", name: "Dubai", operator: "Flexnode DXB", region: "APAC", x: 0.63, y: 0.44 },
  { id: "irl", name: "Dublin", operator: "Attestant", region: "EU", x: 0.45, y: 0.28 },
  { id: "waw", name: "Warsaw", operator: "Nethermind", region: "EU", x: 0.56, y: 0.3 },
  { id: "sgp2", name: "Johor", operator: "Flexnode SEA", region: "APAC", x: 0.76, y: 0.58 },
  { id: "nyc", name: "Secaucus", operator: "Figment", region: "US-E", x: 0.29, y: 0.34 },
  { id: "lax", name: "Los Angeles", operator: "Flexnode LAX", region: "US-W", x: 0.1, y: 0.42 },
];

export const REGION_LATENCY: Record<Region, Partial<Record<Region, number>>> = {
  "US-E": { "US-E": 12, "US-W": 62, EU: 78, APAC: 210, LATAM: 120, AFR: 190, ANZ: 230 },
  "US-W": { "US-E": 62, "US-W": 14, EU: 140, APAC: 130, LATAM: 150, AFR: 240, ANZ: 180 },
  EU: { "US-E": 78, "US-W": 140, EU: 18, APAC: 170, LATAM: 200, AFR: 140, ANZ: 260 },
  APAC: { "US-E": 210, "US-W": 130, EU: 170, APAC: 28, LATAM: 300, AFR: 220, ANZ: 95 },
  LATAM: { "US-E": 120, "US-W": 150, EU: 200, APAC: 300, LATAM: 22, AFR: 280, ANZ: 310 },
  AFR: { "US-E": 190, "US-W": 240, EU: 140, APAC: 220, LATAM: 280, AFR: 20, ANZ: 340 },
  ANZ: { "US-E": 230, "US-W": 180, EU: 260, APAC: 95, LATAM: 310, AFR: 340, ANZ: 16 },
};

export function buildWorld(count: number, playerRegion: Region = "EU"): WorldNode[] {
  const n = Math.max(8, Math.min(count, CATALOG.length));
  const nodes: WorldNode[] = CATALOG.slice(0, n).map((node) => ({
    ...node,
    kind: "validator" as const,
  }));
  const player =
    nodes.find((node) => node.region === playerRegion) ?? nodes[Math.floor(nodes.length / 2)];
  player.kind = "player";
  player.name = `${player.name} · sidecar`;
  return nodes;
}

export function rttMs(a: WorldNode, b: WorldNode): number {
  if (a.id === b.id) return 1;
  const table = REGION_LATENCY[a.region][b.region] ?? 160;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const geo = Math.hypot(dx, dy) * 90;
  return table * 0.72 + geo;
}
