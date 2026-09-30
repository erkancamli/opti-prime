"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ChromeField } from "@/components/brand/chrome-field";
import { MISSIONS } from "@/lib/missions";
import { loadProgress, type ProgressState } from "@/lib/progress";
import { formatMs } from "@/lib/format";

const emptyProgress: ProgressState = { cleared: [], best: {} };

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function MissionSelect() {
  const progress = useSyncExternalStore(subscribe, loadProgress, () => emptyProgress);

  return (
    <div className="relative min-h-dvh bg-black pt-28 text-white">
      <ChromeField subtle />
      <div className="relative mx-auto max-w-6xl px-6 pb-24">
        <p className="text-[11px] tracking-[0.32em] uppercase text-white/40">Operator queue</p>
        <h1 className="mt-3 max-w-3xl font-heading text-5xl leading-[1.05] tracking-tight md:text-6xl">
          <span className="font-light text-white/50">Fix the foundation.</span>
          <br />
          Slot’u kazanın.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
          Yedi görev, Hoodi testnetinden simulated mainnet tavanına. Her slotta mump2p ve
          GossipSub aynı anda koşar — tıpkı gerçek sidecar gibi.
        </p>
        <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {MISSIONS.map((mission, index) => {
            const locked = index > 0 && !progress.cleared.includes(MISSIONS[index - 1].id);
            const best = progress.best[mission.id];
            return (
              <div
                key={mission.id}
                className="grid gap-4 py-7 md:grid-cols-[90px_1fr_auto] md:items-center"
              >
                <div className="font-mono text-sm text-white/35">{mission.code}</div>
                <div>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h2 className="text-2xl tracking-tight">{mission.title}</h2>
                    <span className="text-sm text-white/40">{mission.subtitle}</span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
                    {mission.objective}
                  </p>
                  {best && (
                    <p className="mt-2 font-mono text-[11px] text-white/40">
                      best {best.grade} · {formatMs(best.playerDecodeMs)} ·{" "}
                      {Math.round(best.coverageMump * 100)}% kapsama
                    </p>
                  )}
                </div>
                {locked ? (
                  <span className="text-[11px] tracking-[0.2em] text-white/30 uppercase">
                    kilitli
                  </span>
                ) : (
                  <Link
                    href={`/play/${mission.id}`}
                    className="inline-flex h-8 items-center rounded-full bg-white px-4 text-[11px] tracking-[0.18em] text-black uppercase"
                  >
                    Giriş
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
