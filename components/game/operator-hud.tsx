"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatKb, formatMs } from "@/lib/format";
import type { ProtocolConfig, SimSnapshot, WorldNode } from "@/lib/types";

interface Props {
  snapshot: SimSnapshot;
  world: WorldNode[];
  onConfig: (partial: Partial<ProtocolConfig>) => void;
  onRecode: () => void;
  onIwant: () => void;
  onQuarantine: () => void;
  onGraft: () => void;
  onPrune: () => void;
}

function Meter({
  label,
  value,
  tone = "chrome",
}: {
  label: string;
  value: number;
  tone?: "chrome" | "amber";
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] tracking-[0.18em] uppercase text-white/45">
        <span>{label}</span>
        <span className="font-mono text-white/80">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={tone === "chrome" ? "h-full bg-[#ecece6]" : "h-full bg-[#c49660]"}
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function OperatorHud({
  snapshot,
  world,
  onConfig,
  onRecode,
  onIwant,
  onQuarantine,
  onGraft,
  onPrune,
}: Props) {
  const selected = world.find((n) => n.id === snapshot.selectedId);
  const selectedState = snapshot.nodes.find((n) => n.id === snapshot.selectedId);
  const player = snapshot.nodes.find((n) => n.id === snapshot.playerId);
  const gossipMs = player?.decodeAtGossip ?? null;
  const mumpMs = player?.decodeAtMump ?? null;
  const speedup =
    gossipMs && mumpMs ? Math.max(1, gossipMs / Math.max(1, mumpMs)) : null;

  return (
    <aside className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto border-white/10 bg-black/55 p-4 text-white backdrop-blur-xl md:border-l">
      <div>
        <p className="text-[10px] tracking-[0.28em] uppercase text-white/40">
          {snapshot.mission.code} · {snapshot.mission.network}
        </p>
        <h2 className="mt-1 font-heading text-2xl tracking-tight">{snapshot.mission.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/55">{snapshot.mission.objective}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat k="slot" v={formatMs(snapshot.remainingMs)} />
        <Stat k="rank" v={`${snapshot.playerRank}/${snapshot.k}`} />
        <Stat k="mump2p" v={formatMs(mumpMs)} />
        <Stat k="gossip" v={formatMs(gossipMs)} />
        <Stat k="speedup" v={speedup ? `${speedup.toFixed(1)}×` : "—"} />
        <Stat k="bw save" v={formatKb(Math.max(0, snapshot.bandwidthGossip - snapshot.bandwidthMump))} />
      </div>

      <div className="space-y-3">
        <Meter label="mump2p coverage" value={snapshot.coverageMump} />
        <Meter label="GossipSub coverage" value={snapshot.coverageGossip} tone="amber" />
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 p-3">
        <p className="text-[10px] tracking-[0.22em] uppercase text-white/40">Sidecar params</p>
        <Param
          label="ShredFactor"
          hint="k taban parça"
          value={snapshot.config.shredFactor}
          min={3}
          max={8}
          step={1}
          onChange={(v) => onConfig({ shredFactor: v })}
        />
        <Param
          label="MeshDegree"
          hint="hedef peer sayısı"
          value={snapshot.config.meshDegree}
          min={3}
          max={12}
          step={1}
          onChange={(v) => onConfig({ meshDegree: v })}
        />
        <Param
          label="ForwardThreshold"
          hint="recode eşiği"
          value={Math.round(snapshot.config.forwardThreshold * 100)}
          min={20}
          max={90}
          step={5}
          format={(v) => `${v}%`}
          onChange={(v) => onConfig({ forwardThreshold: v / 100 })}
        />
        <Param
          label="ShardMultiplier"
          hint="n = k · m"
          value={snapshot.config.publisherMultiplier}
          min={1}
          max={4}
          step={1}
          onChange={(v) => onConfig({ publisherMultiplier: v })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={onRecode} className="h-9 rounded-full tracking-[0.16em] uppercase">
          Recode
        </Button>
        <Button variant="outline" onClick={onIwant} className="h-9 rounded-full border-white/20 bg-transparent tracking-[0.16em] text-white uppercase">
          IWANT
        </Button>
        <Button variant="outline" onClick={onGraft} className="h-9 rounded-full border-white/20 bg-transparent tracking-[0.16em] text-white uppercase">
          GRAFT
        </Button>
        <Button variant="outline" onClick={onPrune} className="h-9 rounded-full border-white/20 bg-transparent tracking-[0.16em] text-white uppercase">
          PRUNE
        </Button>
        <Button
          variant="destructive"
          onClick={onQuarantine}
          className="col-span-2 h-9 rounded-full tracking-[0.16em] uppercase"
        >
          Karantina
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 p-3">
        <p className="text-[10px] tracking-[0.22em] uppercase text-white/40">Seçili peer</p>
        {selected ? (
          <div className="mt-2">
            <p className="text-sm">{selected.operator}</p>
            <p className="font-mono text-[11px] text-white/45">
              {selected.name} · {selected.region} · rank {selectedState?.rank ?? 0}/{snapshot.k}
            </p>
            <p className="mt-1 text-[11px] text-white/45">{selectedState?.lastEvent}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-white/40">Mesh üzerinde bir validator seçin.</p>
        )}
      </div>

      <div className="min-h-[140px] flex-1 rounded-2xl border border-white/10 p-3">
        <p className="text-[10px] tracking-[0.22em] uppercase text-white/40">Telemetry</p>
        <ul className="mt-2 space-y-1.5 font-mono text-[11px] text-white/55">
          {snapshot.events.slice(0, 8).map((event, i) => (
            <li key={`${event.t}-${i}`}>
              <span className="text-white/30">{formatMs(event.t)}</span> {event.text}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-white/10 px-3 py-2">
      <div className="text-[10px] tracking-[0.18em] text-white/40 uppercase">{k}</div>
      <div className="font-mono text-sm text-white">{v}</div>
    </div>
  );
}

function Param({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <div className="text-[11px] tracking-[0.14em] uppercase">{label}</div>
          <div className="text-[10px] text-white/40">{hint}</div>
        </div>
        <div className="font-mono text-sm">{format ? format(value) : value}</div>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(vals) => {
          const next = Array.isArray(vals) ? vals[0] : value;
          onChange(next);
        }}
      />
    </div>
  );
}
