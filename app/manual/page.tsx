import Link from "next/link";
import { SiteFooter } from "@/components/brand/site-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PARAMS = [
  ["ShredFactor", "Mesajın encode öncesi taban parça sayısı k. Yüksek k granülarite, yüksek compute."],
  ["PublisherShardMultiplier", "n = k · m. Publisher’ın ürettiği coded shard adedi."],
  ["ForwardShardThreshold", "Ara düğüm, shard sayısı k·eşik’i geçince recode edip forward eder."],
  ["MeshDegreeTarget", "GossipSub’dan miras mesh derecesi. libp2p varsayılanı ~6 (4–12)."],
  ["GRAFT / PRUNE", "Metadata-only peer’i full-message’e çevirmek veya tersi."],
  ["IHAVE / IWANT / IDONTWANT", "Kontrol mesajları: elinde shard var, eksik istiyorum, decode oldum dur."],
];

const MAP = [
  ["Oyun: krom parçacık", "Gerçek: RLNC coded shard, finite field kombinasyonu"],
  ["Oyun: amber kalın hat", "Gerçek: GossipSub tam blok / blob kopyası"],
  ["Oyun: rank halkası", "Gerçek: doğrusal bağımsızlık, k’ye ulaşınca decode"],
  ["Oyun: recode burst", "Gerçek: ara düğümde composable recoding, tam mesaj beklemeden"],
  ["Oyun: karantina", "Gerçek: pollution attack — decode sonrası hash/imza fail, peer reputation"],
  ["Oyun: Flexnode slotu", "Gerçek: latency economy, bandwidth satışı, validator hız satın alır"],
  ["Oyun: sidecar sizin düğümünüz", "Gerçek: Optimum Agent + Service, Ethereum client yanında, API call"],
];

export default function ManualPage() {
  return (
    <div className="bg-[#f4f4f1] pt-28 text-black">
      <article className="mx-auto max-w-3xl px-6 pb-24">
        <p className="text-[11px] tracking-[0.32em] uppercase text-black/40">Field manual</p>
        <h1 className="mt-3 font-heading text-5xl leading-[1.05] tracking-tight">
          Siteden sidecar’a, her katman.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-black/60">
          Optimum (@get_optimum) bir zincir değil. Universal Data Acceleration Network —
          MIT kaynaklı RLNC ile veriyi temelden hızlandırır. Bu sayfa, getoptimum.xyz,
          docs.getoptimum.xyz ve mump2p spesifikasyonunun oyuna nasıl oturduğunun haritası.
        </p>

        <h2 className="mt-16 font-heading text-3xl">Ne değil, ne.</h2>
        <p className="mt-4 leading-relaxed text-black/65">
          Consensus yok, execution yok, validator key yok. Sidecar, mevcut client’ın yanında
          durur; GossipSub her zaman paralel yedek olarak kalır. Servis düşerse attestasyon
          durmaz. Oyun da aynı kuralı taşır: mump2p additive’dir.
        </p>

        <h2 className="mt-14 font-heading text-3xl">mump2p nasıl yayınlar</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-black/65">
          <li>Optimum Agent, Ethereum client’tan bloğu okur.</li>
          <li>Optimum Service RLNC ile kodlar: fragment → coded shard.</li>
          <li>Farklı shard’lar farklı mesh peer’lere round-robin gider.</li>
          <li>Alan düğüm bağımsızlığı kontrol eder, redundant’ı atar.</li>
          <li>k bağımsız shard = decode. Ara düğüm recode edebilir.</li>
        </ol>

        <h2 className="mt-14 font-heading text-3xl">Parametreler</h2>
        <dl className="mt-6 divide-y divide-black/10 border-y border-black/10">
          {PARAMS.map(([k, v]) => (
            <div key={k} className="grid gap-2 py-4 sm:grid-cols-[200px_1fr]">
              <dt className="font-mono text-sm">{k}</dt>
              <dd className="text-sm leading-relaxed text-black/60">{v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-14 font-heading text-3xl">Oyun ↔ protokol</h2>
        <dl className="mt-6 divide-y divide-black/10 border-y border-black/10">
          {MAP.map(([k, v]) => (
            <div key={k} className="grid gap-2 py-4 sm:grid-cols-[200px_1fr]">
              <dt className="text-sm">{k}</dt>
              <dd className="text-sm leading-relaxed text-black/60">{v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-14 font-heading text-3xl">Rakamlar (kaynak: Optimum)</h2>
        <ul className="mt-4 space-y-2 text-black/65">
          <li>6–20× daha hızlı blok ve blob teslimi, GossipSub’a göre.</li>
          <li>~90–95% bandwidth azalması.</li>
          <li>Hoodi testnetinde ~150ms ortalama block propagation, en az 6× baseline.</li>
          <li>40+ testnet partner, ~$24B ETH stake bağlı.</li>
          <li>Co-founder Prof. Muriel Médard — RLNC mucidi, MIT EECS.</li>
        </ul>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/play" className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6 tracking-[0.18em] uppercase")}>
            Operatör masası
          </Link>
          <a
            href="https://docs.getoptimum.xyz/docs/learn/overview/p2p"
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-full px-6 tracking-[0.18em] uppercase"
            )}
          >
            mump2p docs
          </a>
        </div>
      </article>
      <div className="bg-black">
        <SiteFooter />
      </div>
    </div>
  );
}
