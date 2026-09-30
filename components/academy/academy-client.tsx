"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { coeffLabel, encodeShards, gaussianRank, recode } from "@/lib/rlnc";
import { mulberry32 } from "@/lib/rng";

const STEPS = [
  {
    title: "Bloğu parçala",
    body: "Optimum bir zincir değil. Sidecar, Ethereum client’tan bloğu okur ve k taban parçasına böler. Decode için tam k bağımsız kombinasyon gerekir — GossipSub’daki gibi bütün bloğun tek parça gelmesi değil.",
  },
  {
    title: "RLNC encode",
    body: "Her coded shard, taban parçaların rastgele doğrusal kombinasyonudur (Galois Gossip). n = ShredFactor × PublisherShardMultiplier kadar shard üretilir ve mesh peer’lere round-robin basılır.",
  },
  {
    title: "Kayıp",
    body: "Hatlar shard düşürür. GossipSub tam bloğu kaybedince baştan yollar. mump2p’de hangi k bağımsız kombinasyonun geldiği fark etmez — matrix inversiyon ile orijinal iner.",
  },
  {
    title: "Recode",
    body: "Ara düğüm, tam mesajı beklemeden elindeki shard setinden yeni bir kombinasyon üretir. Bu, RLNC’nin composability özelliği ve ~150ms ağ-çapı teslimatın nedeni.",
  },
  {
    title: "Decode",
    body: "Rank k’ye ulaşınca sidecar bloğu doğrular (hash + publisher imzası). Kirli shard varsa verify fail. Consensus, key’ler, leader selection — hiçbiri bu katmanda değil.",
  },
];

export function AcademyClient() {
  const [step, setStep] = useState(0);
  const [seed, setSeed] = useState(7);
  const k = 4;
  const rng = useMemo(() => mulberry32(seed + step * 13), [seed, step]);
  const encoded = useMemo(() => encodeShards(k, 8, rng), [k, rng]);
  const dropped = step >= 2 ? encoded.filter((_, i) => i % 3 !== 1) : encoded;
  const held = dropped.slice(0, step >= 3 ? 3 : dropped.length);
  const recoded = step >= 3 ? recode(held, mulberry32(seed + 99)) : 0;
  const pool = step >= 3 ? [...held, recoded] : held;
  const rank = gaussianRank(pool, k);

  return (
    <div className="min-h-dvh bg-[#f4f4f1] pt-28 text-black">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-[11px] tracking-[0.32em] uppercase text-black/40">
            Academy · Galois Gossip
          </p>
          <h1 className="mt-3 font-heading text-5xl leading-[1.05] tracking-tight md:text-6xl">
            <span className="font-light text-black/45">Transmit less.</span>
            <br />
            Deliver more.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-black/60">
            Prof. Muriel Médard’ın MIT’de geliştirdiği Random Linear Network Coding,
            mump2p’nin kalbi. Bu beş adım, sidecar’ın bir slotta yaptığı işin sadeleştirilmiş hali.
          </p>
          <ol className="mt-10 space-y-3">
            {STEPS.map((item, index) => (
              <li key={item.title}>
                <button
                  type="button"
                  onClick={() => setStep(index)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    step === index ? "border-black bg-black text-white" : "border-black/10 bg-white"
                  }`}
                >
                  <div className="text-[10px] tracking-[0.22em] uppercase opacity-50">
                    0{index + 1}
                  </div>
                  <div className="text-lg">{item.title}</div>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
          <p className="text-[11px] tracking-[0.22em] uppercase text-black/40">
            {STEPS[step].title}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-black/65">{STEPS[step].body}</p>

          <div className="mt-6">
            <p className="text-[10px] tracking-[0.18em] uppercase text-black/40">taban parçalar k=4</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["f0", "f1", "f2", "f3"].map((f) => (
                <span key={f} className="rounded-full bg-black px-3 py-1 font-mono text-xs text-white">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[10px] tracking-[0.18em] uppercase text-black/40">coded shards</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {encoded.map((c, i) => {
                const lost = step >= 2 && i % 3 === 1;
                return (
                  <span
                    key={`${c}-${i}`}
                    className={`rounded-full px-3 py-1 font-mono text-xs ${
                      lost ? "bg-black/10 text-black/30 line-through" : "bg-[#ecece6] text-black"
                    }`}
                  >
                    {coeffLabel(c, k)}
                  </span>
                );
              })}
            </div>
          </div>

          {step >= 3 && (
            <div className="mt-6 rounded-2xl bg-black p-4 text-white">
              <p className="text-[10px] tracking-[0.18em] uppercase text-white/40">recode</p>
              <p className="mt-1 font-mono text-sm">{coeffLabel(recoded, k)}</p>
              <p className="mt-2 text-xs text-white/50">
                Ara düğüm, orijinali beklemeden yeni bir doğrusal kombinasyon üretti.
              </p>
            </div>
          )}

          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase text-black/40">rank</p>
              <p className="font-mono text-3xl">
                {Math.min(rank, k)}/{k}
              </p>
            </div>
            <p className="text-sm text-black/50">
              {rank >= k ? "Decode mümkün. Bloğu geri kur." : "Bağımsız shard bekleniyor."}
            </p>
          </div>

          <div className="mt-8 flex gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Geri
            </Button>
            <Button
              className="rounded-full"
              onClick={() => {
                if (step === STEPS.length - 1) setSeed((s) => s + 1);
                setStep((s) => Math.min(STEPS.length - 1, s + 1));
              }}
            >
              {step === STEPS.length - 1 ? "Yeni seed" : "İleri"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
