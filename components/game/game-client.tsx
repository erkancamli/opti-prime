"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MeshCanvas } from "@/components/game/mesh-canvas";
import { OperatorHud } from "@/components/game/operator-hud";
import { formatKb, formatMs } from "@/lib/format";
import { saveScore } from "@/lib/progress";
import { gradeFrom, Simulation } from "@/lib/simulation";
import type { DebriefScore, Mission, ProtocolConfig, SimSnapshot } from "@/lib/types";

export function GameClient({ mission }: { mission: Mission }) {
  const [mounted, setMounted] = useState(false);
  const [engine, setEngine] = useState(
    () => new Simulation(mission, (Date.now() ^ mission.index * 7919) >>> 0)
  );
  const [phase, setPhase] = useState<"brief" | "live" | "debrief">("brief");
  const [snapshot, setSnapshot] = useState<SimSnapshot>(() => engine.snapshot());
  const [score, setScore] = useState<DebriefScore | null>(null);

  const restart = () => {
    const next = new Simulation(mission, (Date.now() ^ mission.index * 7919) >>> 0);
    setEngine(next);
    setSnapshot(next.snapshot());
    setScore(null);
    setPhase("brief");
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (phase !== "live") return;
    engine.start();
    let last = performance.now();
    let hudAcc = 0;
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      engine.tick(dt);
      hudAcc += dt;
      if (hudAcc > 80 || engine.finished) {
        hudAcc = 0;
        setSnapshot(engine.snapshot());
      }
      if (engine.finished) {
        const snap = engine.snapshot();
        const player = snap.nodes.find((n) => n.id === snap.playerId);
        const result: DebriefScore = {
          missionId: mission.id,
          won: snap.won,
          coverageMump: snap.coverageMump,
          coverageGossip: snap.coverageGossip,
          playerDecodeMs: player?.decodeAtMump ?? null,
          gossipDecodeMs: player?.decodeAtGossip ?? null,
          speedup:
            player?.decodeAtGossip && player.decodeAtMump
              ? player.decodeAtGossip / Math.max(1, player.decodeAtMump)
              : null,
          bandwidthSaved: Math.max(0, snap.bandwidthGossip - snap.bandwidthMump),
          attested: snap.attested,
          mevCaptured: snap.mevCaptured,
          grade: gradeFrom(snap),
          at: Date.now(),
        };
        saveScore(result);
        setScore(result);
        setPhase("debrief");
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, engine, mission.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "live") return;
      if (e.code === "Space") {
        e.preventDefault();
        engine.recodeBurst();
        setSnapshot(engine.snapshot());
      }
      if (e.key === "q" || e.key === "Q") {
        engine.quarantine(engine.selectedId ?? "");
        setSnapshot(engine.snapshot());
      }
      if (e.key === "w" || e.key === "W") {
        engine.iwant();
        setSnapshot(engine.snapshot());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, engine]);

  const world = engine.nodes;
  const tips = useMemo(() => mission.tips, [mission]);

  const onConfig = (partial: Partial<ProtocolConfig>) => {
    engine.setConfig(partial);
    setSnapshot(engine.snapshot());
  };

  const select = (id: string | null) => {
    engine.select(id);
    setSnapshot(engine.snapshot());
  };

  const act = (fn: () => void) => {
    fn();
    setSnapshot(engine.snapshot());
  };

  if (!mounted) {
    return (
      <div className="min-h-dvh bg-black pt-24 text-white">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-[11px] tracking-[0.28em] text-white/40 uppercase">{mission.code}</p>
          <h1 className="mt-3 font-heading text-4xl tracking-tight">{mission.title}</h1>
          <p className="mt-4 max-w-xl text-sm text-white/50">{mission.subtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-black pt-20 text-white">
      <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative min-h-[42vh] md:min-h-0">
          <MeshCanvas snapshot={snapshot} world={world} onSelect={select} />
          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-white/60 uppercase backdrop-blur">
            {mission.network}
          </div>
        </div>
        <OperatorHud
          snapshot={snapshot}
          world={world}
          onConfig={onConfig}
          onRecode={() => act(() => engine.recodeBurst())}
          onIwant={() => act(() => engine.iwant())}
          onQuarantine={() =>
            act(() => {
              if (engine.selectedId) engine.quarantine(engine.selectedId);
            })
          }
          onGraft={() => act(() => engine.graftSelected())}
          onPrune={() => act(() => engine.pruneSelected())}
        />
      </div>

      {phase === "brief" && (
        <Overlay
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="rounded-full px-6 tracking-[0.18em] uppercase"
                onClick={() => setPhase("live")}
              >
                Sidecar’ı başlat
              </Button>
              <Link
                href="/play"
                className="inline-flex h-9 items-center rounded-full border border-white/20 px-6 text-sm tracking-[0.18em] text-white uppercase"
              >
                Görevler
              </Link>
              <p className="hidden font-mono text-[11px] text-white/35 sm:ml-auto sm:block">
                Space recode · W IWANT · Q karantina · peer seç
              </p>
            </div>
          }
        >
          <p className="text-[11px] tracking-[0.28em] uppercase text-white/40">
            {mission.code} · briefing
          </p>
          <h1 className="mt-3 font-heading text-4xl leading-[1.05] tracking-tight md:text-5xl">
            <span className="font-light text-white/55">{mission.subtitle}.</span>
            <br />
            {mission.title}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
            {mission.briefing}
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/50">
            {tips.map((tip) => (
              <li key={tip} className="border-l border-white/20 pl-3">
                {tip}
              </li>
            ))}
          </ul>
        </Overlay>
      )}

      {phase === "debrief" && score && (
        <Overlay
          actions={
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="rounded-full px-6 tracking-[0.18em] uppercase" onClick={restart}>
                Slot’u tekrarla
              </Button>
              <Link
                href="/play"
                className="inline-flex h-9 items-center rounded-full border border-white/20 px-6 text-sm tracking-[0.18em] text-white uppercase"
              >
                Sonraki görev
              </Link>
            </div>
          }
        >
          <p className="text-[11px] tracking-[0.28em] uppercase text-white/40">slot kapanışı</p>
          <h1 className="mt-3 font-heading text-5xl tracking-tight">
            {score.won ? "Attestation landed." : "Pencere kaçtı."}
          </h1>
          <p className="mt-2 font-mono text-sm text-white/50">grade {score.grade}</p>
          <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
            <Mini k="mump2p" v={formatMs(score.playerDecodeMs)} />
            <Mini k="gossipsub" v={formatMs(score.gossipDecodeMs)} />
            <Mini k="speedup" v={score.speedup ? `${score.speedup.toFixed(1)}×` : "—"} />
            <Mini k="coverage" v={`${Math.round(score.coverageMump * 100)}%`} />
            <Mini k="bandwidth saved" v={formatKb(score.bandwidthSaved)} />
            <Mini k="MEV" v={score.mevCaptured ? "captured" : "missed"} />
          </div>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/55">
            {score.won
              ? score.speedup && score.speedup >= 1
                ? "Coded shards bu slotta tam-blok kopyalarından önce ağı doldurdu. Masadaki çarpan, Hoodi’nin yayımlanan 6–20× rakamı değil; bu mesh’in kendi saatidir."
                : "Kapsama tuttu. Bu slotta GossipSub daha erken decode oldu — yayımlanan Hoodi çarpanı bu masanın skoru değildir."
              : "Rank k’ye ulaşmadı veya kapsama hedefi kaçtı. ShredFactor, mesh ve recode eşiğini bir sonraki slotta yeniden dengeleyin."}
          </p>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-black/72 backdrop-blur-md">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-24 sm:px-12">
        <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-end pb-6">{children}</div>
      </div>
      {actions ? (
        <div className="shrink-0 border-t border-white/10 bg-black/80 px-6 py-4 sm:px-12">
          <div className="mx-auto max-w-5xl">{actions}</div>
        </div>
      ) : null}
    </div>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
      <div className="text-[10px] tracking-[0.18em] text-white/40 uppercase">{k}</div>
      <div className="mt-1 font-mono text-lg">{v}</div>
    </div>
  );
}
