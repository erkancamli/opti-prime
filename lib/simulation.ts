import { encodeShards, gaussianRank, isIndependent, recode } from "@/lib/rlnc";
import { mulberry32, pick } from "@/lib/rng";
import type {
  Flight,
  Mission,
  NodeState,
  ProtocolConfig,
  SimEvent,
  SimSnapshot,
  WorldNode,
} from "@/lib/types";
import { buildWorld, rttMs } from "@/lib/world";

function nearestMesh(self: WorldNode, all: WorldNode[], degree: number): string[] {
  return all
    .filter((n) => n.id !== self.id)
    .sort((a, b) => rttMs(self, a) - rttMs(self, b))
    .slice(0, degree)
    .map((n) => n.id);
}

export class Simulation {
  readonly mission: Mission;
  readonly nodes: WorldNode[];
  readonly byId: Map<string, WorldNode>;
  readonly playerId: string;
  readonly publisherId: string;
  readonly k: number;
  readonly rng: () => number;

  t = 0;
  running = false;
  finished = false;
  won = false;
  selectedId: string | null = null;
  config: ProtocolConfig;
  flightId = 1;
  flights: Flight[] = [];
  events: SimEvent[] = [];
  state: Map<string, NodeState>;
  gossipInFlight = new Set<string>();
  polluterId: string | null = null;
  lastAutoRecode = new Map<string, number>();

  constructor(mission: Mission, seed = 0xc0de915) {
    this.mission = mission;
    this.rng = mulberry32(seed ^ mission.index * 9973);
    const playerRegion = mission.asiaBias ? "APAC" : "EU";
    this.nodes = buildWorld(mission.nodeCount, playerRegion);
    this.byId = new Map(this.nodes.map((n) => [n.id, n]));
    this.playerId = this.nodes.find((n) => n.kind === "player")?.id ?? this.nodes[0].id;
    const pubPool = this.nodes.filter((n) => n.id !== this.playerId);
    this.publisherId = mission.asiaBias
      ? (this.nodes.find((n) => n.region === "EU" && n.id !== this.playerId)?.id ?? pubPool[0].id)
      : pick(pubPool, this.rng).id;
    const pub = this.byId.get(this.publisherId);
    if (pub) pub.kind = "publisher";

    this.k = mission.shredFactor;
    this.config = {
      shredFactor: mission.shredFactor,
      publisherMultiplier: mission.publisherMultiplier,
      meshDegree: mission.meshDegree,
      forwardThreshold: mission.forwardThreshold,
    };

    if (mission.pollution) {
      this.polluterId =
        this.nodes.find((n) => n.id !== this.playerId && n.id !== this.publisherId && n.region === "US-W")
          ?.id ?? pubPool[pubPool.length - 1].id;
    }

    this.state = new Map();
    for (const node of this.nodes) {
      this.state.set(node.id, {
        id: node.id,
        shards: [],
        rank: 0,
        decodedMump: false,
        decodedGossip: false,
        decodeAtMump: null,
        decodeAtGossip: null,
        bandwidthKb: 0,
        polluted: false,
        quarantined: false,
        mesh: nearestMesh(node, this.nodes, this.config.meshDegree),
        lastEvent: "idle",
      });
    }

    const pubState = this.state.get(this.publisherId);
    const playerState = this.state.get(this.playerId);
    if (pubState && playerState) {
      if (!pubState.mesh.includes(this.playerId)) pubState.mesh.unshift(this.playerId);
      if (!playerState.mesh.includes(this.publisherId)) playerState.mesh.unshift(this.publisherId);
    }
  }

  start() {
    this.running = true;
    this.pushEvent("slot", `Slot açıldı · publisher ${this.publisherName()}`, this.publisherId);
    this.publish();
  }

  publisherName() {
    return this.byId.get(this.publisherId)?.operator ?? "proposer";
  }

  setConfig(partial: Partial<ProtocolConfig>) {
    this.config = { ...this.config, ...partial };
    if (partial.meshDegree) {
      for (const node of this.nodes) {
        const st = this.state.get(node.id);
        if (!st || st.quarantined) continue;
        st.mesh = nearestMesh(node, this.nodes, this.config.meshDegree);
      }
    }
  }

  select(id: string | null) {
    this.selectedId = id;
  }

  quarantine(id: string) {
    const st = this.state.get(id);
    if (!st || id === this.playerId || id === this.publisherId) return;
    st.quarantined = true;
    st.lastEvent = "quarantine";
    this.flights = this.flights.filter((f) => f.from !== id && f.to !== id);
    for (const other of this.state.values()) {
      other.mesh = other.mesh.filter((m) => m !== id);
    }
    this.pushEvent("pollution", `${this.byId.get(id)?.operator} karantinada`, id);
  }

  recodeBurst() {
    const st = this.state.get(this.playerId);
    const node = this.byId.get(this.playerId);
    if (!st || !node || st.shards.length === 0) return;
    const extra = Math.max(2, Math.ceil(st.mesh.length * 0.8));
    for (let i = 0; i < extra; i++) {
      const coeff = recode(st.shards, this.rng);
      const targetId = st.mesh[i % st.mesh.length];
      this.emitShard(node, targetId, coeff, st.polluted);
    }
    this.pushEvent("recode", "Recode burst · coded shards mesh’e basıldı", this.playerId);
  }

  iwant() {
    const targetId = this.selectedId;
    const player = this.state.get(this.playerId);
    const peer = targetId ? this.state.get(targetId) : null;
    const fromNode = targetId ? this.byId.get(targetId) : null;
    if (!player || !peer || !fromNode || peer.shards.length === 0) return;
    const coeff = pick(peer.shards, this.rng);
    this.emitShard(fromNode, this.playerId, coeff, peer.polluted);
    this.pushEvent("iwant", `IWANT → ${fromNode.operator}`, this.playerId);
  }

  graftSelected() {
    const id = this.selectedId;
    const player = this.state.get(this.playerId);
    if (!id || !player || id === this.playerId) return;
    if (!player.mesh.includes(id)) player.mesh.push(id);
    const peer = this.state.get(id);
    if (peer && !peer.mesh.includes(this.playerId)) peer.mesh.push(this.playerId);
    this.pushEvent("slot", `GRAFT ${this.byId.get(id)?.operator}`, id);
  }

  pruneSelected() {
    const id = this.selectedId;
    const player = this.state.get(this.playerId);
    if (!id || !player) return;
    player.mesh = player.mesh.filter((m) => m !== id);
    this.pushEvent("slot", `PRUNE ${this.byId.get(id)?.operator}`, id);
  }

  tick(dt: number) {
    if (!this.running || this.finished) return;
    this.t += dt;
    this.advanceFlights(dt);
    this.maybeAutoRecode();
    if (this.t >= this.mission.durationMs) this.finish();
  }

  private publish() {
    const pub = this.byId.get(this.publisherId)!;
    const st = this.state.get(this.publisherId)!;
    st.decodedMump = true;
    st.decodedGossip = true;
    st.decodeAtMump = 0;
    st.decodeAtGossip = 0;
    st.rank = this.k;
    st.shards = Array.from({ length: this.k }, (_, i) => 1 << i);
    st.lastEvent = "propose";

    const n = this.k * this.config.publisherMultiplier;
    const encoded = encodeShards(this.k, n, this.rng);
    const peers = st.mesh.length ? st.mesh : nearestMesh(pub, this.nodes, this.config.meshDegree);
    encoded.forEach((coeff, i) => {
      this.emitShard(pub, peers[i % peers.length], coeff, false);
    });

    for (const peerId of peers) {
      this.emitGossip(pub, peerId);
    }
  }

  private emitShard(from: WorldNode, toId: string, coeff: number, polluted: boolean) {
    const to = this.byId.get(toId);
    const toState = this.state.get(toId);
    const fromState = this.state.get(from.id);
    if (!to || !toState || !fromState) return;
    if (toState.quarantined || fromState.quarantined) return;
    if (toState.decodedMump) return;

    const loss = this.lossFor(from, to);
    if (this.rng() < loss) {
      this.pushEvent("loss", `shard kaybı ${from.region}→${to.region}`, toId);
      return;
    }

    const rtt = rttMs(from, to) * (1 + this.mission.congestion * 0.8 + this.rng() * 0.15);
    const sizeKb = (1.8 * this.mission.blobScale) / Math.max(2, this.k);
    fromState.bandwidthKb += sizeKb;
    this.flights.push({
      id: this.flightId++,
      from: from.id,
      to: toId,
      protocol: "mump2p",
      coeff,
      polluted: polluted || (this.polluterId === from.id && this.rng() < 0.55),
      t: 0,
      duration: Math.max(90, rtt),
      sizeKb,
    });
  }

  private emitGossip(from: WorldNode, toId: string) {
    const key = `${from.id}->${toId}`;
    if (this.gossipInFlight.has(key)) return;
    const to = this.byId.get(toId);
    const toState = this.state.get(toId);
    const fromState = this.state.get(from.id);
    if (!to || !toState || !fromState || toState.decodedGossip) return;
    if (toState.quarantined || fromState.quarantined) return;

    const loss = this.lossFor(from, to) * 1.35;
    if (this.rng() < loss) {
      this.pushEvent("loss", `gossip drop ${from.region}→${to.region}`, toId);
      return;
    }

    this.gossipInFlight.add(key);
    const rtt = rttMs(from, to);
    const sizeKb = 92 * this.mission.blobScale;
    const duration = Math.max(220, rtt * 2.4 * (1 + this.mission.congestion) + sizeKb * 1.6);
    fromState.bandwidthKb += sizeKb;
    this.flights.push({
      id: this.flightId++,
      from: from.id,
      to: toId,
      protocol: "gossipsub",
      coeff: 0,
      polluted: false,
      t: 0,
      duration,
      sizeKb,
    });
  }

  private lossFor(a: WorldNode, b: WorldNode) {
    let loss = this.mission.loss;
    if (this.mission.asiaBias && (a.region === "APAC" || b.region === "APAC")) loss += 0.08;
    const longHaul = rttMs(a, b) > 160;
    if (longHaul) loss += 0.05;
    return Math.min(0.55, loss);
  }

  private advanceFlights(dt: number) {
    const remain: Flight[] = [];
    for (const flight of this.flights) {
      flight.t += dt;
      if (flight.t >= flight.duration) this.deliver(flight);
      else remain.push(flight);
    }
    this.flights = remain;
  }

  private deliver(flight: Flight) {
    if (flight.protocol === "gossipsub") {
      this.gossipInFlight.delete(`${flight.from}->${flight.to}`);
      this.deliverGossip(flight);
      return;
    }
    this.deliverShard(flight);
  }

  private deliverShard(flight: Flight) {
    const st = this.state.get(flight.to);
    if (!st || st.decodedMump || st.quarantined) return;
    if (flight.polluted) st.polluted = true;
    if (!isIndependent(st.shards, flight.coeff, this.k)) {
      st.lastEvent = "redundant";
      return;
    }
    st.shards.push(flight.coeff);
    st.rank = gaussianRank(st.shards, this.k);
    st.lastEvent = `rank ${st.rank}/${this.k}`;
    const node = this.byId.get(st.id);
    const fromNode = this.byId.get(flight.from);
    if (node && fromNode && flight.from === this.publisherId && !st.decodedMump) {
      for (const peerId of st.mesh) {
        if (peerId === flight.from) continue;
        this.emitShard(node, peerId, flight.coeff, flight.polluted);
      }
    }

    if (st.rank >= this.k) {
      if (st.polluted && this.mission.pollution) {
        st.lastEvent = "verify fail";
        this.pushEvent("pollution", `imza uyuşmadı · ${this.byId.get(st.id)?.operator}`, st.id);
        st.shards = [];
        st.rank = 0;
        st.polluted = false;
        return;
      }
      st.decodedMump = true;
      st.decodeAtMump = this.t;
      st.lastEvent = "decoded";
      this.pushEvent("decode", `mump2p decode · ${this.byId.get(st.id)?.operator}`, st.id);
      this.pushEvent("idontwant", `IDONTWANT · ${this.byId.get(st.id)?.name}`, st.id);
      if (node) {
        for (const peerId of st.mesh) {
          const peer = this.state.get(peerId);
          if (peer && !peer.decodedMump) {
            this.emitShard(node, peerId, recode(st.shards, this.rng), false);
          }
        }
      }
      this.fanoutGossipFrom(st.id);
    }
  }

  private deliverGossip(flight: Flight) {
    const st = this.state.get(flight.to);
    if (!st || st.decodedGossip || st.quarantined) return;
    st.decodedGossip = true;
    st.decodeAtGossip = this.t;
    st.lastEvent = st.lastEvent === "decoded" ? "decoded" : "gossip";
    this.fanoutGossipFrom(st.id);
  }

  private fanoutGossipFrom(id: string) {
    const node = this.byId.get(id);
    const st = this.state.get(id);
    if (!node || !st || !st.decodedGossip) return;
    for (const peerId of st.mesh) {
      const peer = this.state.get(peerId);
      if (peer && !peer.decodedGossip) this.emitGossip(node, peerId);
    }
  }

  private maybeAutoRecode() {
    const threshold = this.k * this.config.forwardThreshold;
    for (const node of this.nodes) {
      const st = this.state.get(node.id);
      if (!st || st.quarantined || st.shards.length === 0) continue;
      const ready = st.decodedMump || st.shards.length >= Math.max(1, threshold);
      if (!ready) continue;
      const last = this.lastAutoRecode.get(node.id) ?? -9999;
      if (this.t - last < 420) continue;
      this.lastAutoRecode.set(node.id, this.t);
      const coeff = recode(st.shards, this.rng);
      const target = pick(st.mesh, this.rng);
      this.emitShard(node, target, coeff, st.polluted);
    }
  }

  private finish() {
    this.running = false;
    this.finished = true;
    const snap = this.snapshot();
    const player = this.state.get(this.playerId)!;
    const coverageOk = snap.coverageMump >= this.mission.targetCoverage;
    const decoded = player.decodedMump;
    const bandwidthOk =
      this.mission.id !== "blob-surge" ||
      snap.bandwidthMump < snap.bandwidthGossip * 0.4;
    const speedupOk =
      this.mission.id !== "mainnet-ceiling" ||
      (snap.playerDecoded &&
        player.decodeAtGossip &&
        player.decodeAtMump !== null &&
        player.decodeAtGossip / Math.max(1, player.decodeAtMump) >= 6);
    const pollutionOk =
      !this.mission.pollution ||
      (this.polluterId ? this.state.get(this.polluterId)?.quarantined === true : true) ||
      decoded;
    this.won = Boolean(decoded && coverageOk && bandwidthOk && (speedupOk || this.mission.id !== "mainnet-ceiling") && pollutionOk);
  }

  private pushEvent(kind: SimEvent["kind"], text: string, node?: string) {
    this.events.unshift({ t: this.t, kind, text, node });
    if (this.events.length > 40) this.events.pop();
  }

  snapshot(): SimSnapshot {
    const nodeStates = this.nodes.map((n) => this.state.get(n.id)!);
    const live = nodeStates.filter((n) => !n.quarantined);
    const coverageMump = live.filter((n) => n.decodedMump).length / Math.max(1, live.length);
    const coverageGossip = live.filter((n) => n.decodedGossip).length / Math.max(1, live.length);
    const player = this.state.get(this.playerId)!;
    const mumpBw = this.flights.filter((f) => f.protocol === "mump2p").reduce((s, f) => s + f.sizeKb, 0);
    const gossipBw = nodeStates.reduce((s, n) => s + n.bandwidthKb, 0);
    const attested = player.decodedMump && (player.decodeAtMump ?? 99999) < this.mission.goldMs * 1.35;
    const mevCaptured = attested && coverageMump > 0.6;
    return {
      t: this.t,
      slotMs: this.mission.durationMs,
      remainingMs: Math.max(0, this.mission.durationMs - this.t),
      running: this.running,
      finished: this.finished,
      won: this.won,
      publisherId: this.publisherId,
      playerId: this.playerId,
      k: this.k,
      nodes: nodeStates,
      positions: Object.fromEntries(this.nodes.map((n) => [n.id, { x: n.x, y: n.y }])),
      flights: this.flights,
      events: this.events,
      selectedId: this.selectedId,
      coverageMump,
      coverageGossip,
      playerRank: player.rank,
      playerDecoded: player.decodedMump,
      gossipPlayerDecoded: player.decodedGossip,
      bandwidthMump: mumpBw + nodeStates.reduce((s, n) => s + n.bandwidthKb * 0.15, 0),
      bandwidthGossip: gossipBw,
      attested,
      mevCaptured,
      pollutionDetected: nodeStates.some((n) => n.quarantined || n.lastEvent === "verify fail"),
      config: this.config,
      mission: this.mission,
    };
  }
}

export function gradeFrom(snapshot: SimSnapshot): "S" | "A" | "B" | "C" | "F" {
  if (!snapshot.playerDecoded) return "F";
  const player = snapshot.nodes.find((n) => n.id === snapshot.playerId);
  const speed =
    player?.decodeAtGossip && player.decodeAtMump
      ? player.decodeAtGossip / Math.max(1, player.decodeAtMump)
      : 1;
  if (snapshot.won && snapshot.coverageMump >= 0.9 && speed >= 6) return "S";
  if (snapshot.won && snapshot.coverageMump >= snapshot.mission.targetCoverage) return "A";
  if (snapshot.playerDecoded && snapshot.coverageMump >= 0.5) return "B";
  if (snapshot.playerDecoded) return "C";
  return "F";
}
