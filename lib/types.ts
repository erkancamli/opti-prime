export type Protocol = "mump2p" | "gossipsub";

export type Region = "US-E" | "US-W" | "EU" | "APAC" | "LATAM" | "AFR" | "ANZ";

export type OperatorKind = "validator" | "flexnode" | "player" | "publisher";

export interface WorldNode {
  id: string;
  name: string;
  operator: string;
  region: Region;
  x: number;
  y: number;
  kind: OperatorKind;
}

export interface Mission {
  id: string;
  index: number;
  code: string;
  title: string;
  subtitle: string;
  briefing: string;
  objective: string;
  network: string;
  durationMs: number;
  nodeCount: number;
  loss: number;
  congestion: number;
  asiaBias: boolean;
  blobScale: number;
  pollution: boolean;
  flexEconomy: boolean;
  targetCoverage: number;
  goldMs: number;
  shredFactor: number;
  publisherMultiplier: number;
  meshDegree: number;
  forwardThreshold: number;
  tips: string[];
}

export interface ProtocolConfig {
  shredFactor: number;
  publisherMultiplier: number;
  meshDegree: number;
  forwardThreshold: number;
}

export interface Flight {
  id: number;
  from: string;
  to: string;
  protocol: Protocol;
  coeff: number;
  polluted: boolean;
  t: number;
  duration: number;
  sizeKb: number;
}

export interface NodeState {
  id: string;
  shards: number[];
  rank: number;
  decodedMump: boolean;
  decodedGossip: boolean;
  decodeAtMump: number | null;
  decodeAtGossip: number | null;
  bandwidthKb: number;
  polluted: boolean;
  quarantined: boolean;
  mesh: string[];
  lastEvent: string;
}

export interface SimEvent {
  t: number;
  kind: "decode" | "pollution" | "loss" | "recode" | "iwant" | "idontwant" | "slot";
  node?: string;
  text: string;
}

export interface SimSnapshot {
  t: number;
  slotMs: number;
  remainingMs: number;
  running: boolean;
  finished: boolean;
  won: boolean;
  publisherId: string;
  playerId: string;
  k: number;
  nodes: NodeState[];
  positions: Record<string, { x: number; y: number }>;
  flights: Flight[];
  events: SimEvent[];
  selectedId: string | null;
  coverageMump: number;
  coverageGossip: number;
  playerRank: number;
  playerDecoded: boolean;
  gossipPlayerDecoded: boolean;
  bandwidthMump: number;
  bandwidthGossip: number;
  attested: boolean;
  mevCaptured: boolean;
  pollutionDetected: boolean;
  config: ProtocolConfig;
  mission: Mission;
}

export interface DebriefScore {
  missionId: string;
  won: boolean;
  coverageMump: number;
  coverageGossip: number;
  playerDecodeMs: number | null;
  gossipDecodeMs: number | null;
  speedup: number | null;
  bandwidthSaved: number;
  attested: boolean;
  mevCaptured: boolean;
  grade: "S" | "A" | "B" | "C" | "F";
  at: number;
}
