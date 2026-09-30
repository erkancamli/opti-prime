import Link from "next/link";
import { ChromeField } from "@/components/brand/chrome-field";
import { OptimumMark } from "@/components/brand/logo";
import { SiteFooter } from "@/components/brand/site-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATS = [
  { k: "6–20×", v: "daha hızlı blok ve blob teslimi", s: "vs. GossipSub" },
  { k: "~90–95%", v: "bandwidth düşüşü", s: "vs. GossipSub" },
  { k: "~150ms", v: "Hoodi ağ-çapı teslimat", s: "mump2p testnet" },
];

const STACK = [
  {
    code: "01",
    title: "mump2p",
    body: "Data Propagation katmanı. libp2p GossipSub mesh’inin üzerine RLNC — Galois Gossip. Sidecar, consensus client’ın yanında durur; key’lere dokunmaz.",
  },
  {
    code: "02",
    title: "DeRAM",
    body: "Decentralized Random Access Memory. Latency-sensitive uygulamalar için yüksek hızlı state okuma/yazma — Web3’ün eksik bellek katmanı.",
  },
  {
    code: "03",
    title: "DeROM",
    body: "Decentralized Read-Only Memory. Değiştirilemez, küresel sıralı arşiv. Propagation’dan sonra kalıcı katman.",
  },
  {
    code: "04",
    title: "Flexnodes",
    body: "Latency economy. Bandwidth’inizi coded mesh’e verin; validator’lar hız satın alır, siz ödül kazanırsınız.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-black text-white">
      <section className="relative min-h-dvh overflow-hidden">
        <ChromeField />
        <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col justify-end px-6 pb-16 pt-36 sm:pb-24">
          <OptimumMark className="h-7 w-14 text-white/80" />
          <h1 className="mt-8 max-w-4xl font-heading text-5xl leading-[1.02] tracking-tight sm:text-7xl">
            <span className="font-light text-white/55">Veri hareketi tavanı belirler.</span>
            <br />
            Siz tavanı kaldırırsınız.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
            Optimum, blokzincirler için Universal Data Acceleration Network. En mantıklı oyun
            da bu altyapının kendisi: bir mump2p sidecar operatörü olarak coded shard’ları
            recode edin, GossipSub’ı geçin, attestation penceresini kaçırmayın.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/play"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6 tracking-[0.2em] uppercase")}
            >
              Sidecar’ı başlat
            </Link>
            <Link
              href="/academy"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-full border-white/20 bg-transparent px-6 tracking-[0.2em] text-white uppercase"
              )}
            >
              RLNC akademisi
            </Link>
          </div>
          <p className="mt-8 text-[11px] tracking-[0.22em] text-white/35 uppercase">
            Resmi olmayan simülasyon · getoptimum.xyz · @get_optimum
          </p>
        </div>
      </section>

      <section className="bg-[#f4f4f1] py-24 text-black">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-[11px] tracking-[0.32em] uppercase text-black/40">Neden bu oyun</p>
          <h2 className="mt-3 max-w-3xl font-heading text-4xl leading-[1.08] tracking-tight md:text-5xl">
            <span className="font-light text-black/40">Clicker değil.</span> Bir propagation masası.
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <Why
              t="Ürünle birebir"
              d="Optimum bir L1 değil; sidecar. Oyun da validator key’lerine, consensus’a, leader selection’a dokunmaz. Sadece verinin nasıl hareket ettiğini oynarsınız."
            />
            <Why
              t="Gerçek matematik"
              d="Shard’lar GF(2) üzerinde rastgele doğrusal kombinasyon. Decode, k bağımsız vektörde Gaussian elimination. Recode, ara düğümde composability."
            />
            <Why
              t="Aynı rakip"
              d="Her slotta GossipSub paralel koşar — Optimum’un production iddiası: additive, 6–20× daha hızlı, %90–95 daha az bandwidth."
            />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.k} className="rounded-[28px] border border-white/10 p-8">
              <div className="font-heading text-5xl tracking-tight">{stat.k}</div>
              <div className="mt-3 text-sm tracking-[0.14em] uppercase text-white/70">{stat.v}</div>
              <div className="mt-2 text-xs text-white/40">{stat.s}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-heading text-4xl tracking-tight md:text-5xl">
            <span className="font-light text-white/45">Altyapı.</span> Dört katman.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {STACK.map((item) => (
              <article key={item.code} className="rounded-[28px] border border-white/10 p-8">
                <p className="font-mono text-[11px] tracking-[0.22em] text-white/40">{item.code}</p>
                <h3 className="mt-3 text-2xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f4f1] py-24 text-black">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="max-w-3xl font-heading text-4xl tracking-tight md:text-5xl">
            Hoodi’den tavanına yedi slot.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-black/55">
            Everstake, P2P.org, Blockdaemon, InfStones, Luganodes, Ebunker, Kiln, FP Validated —
            mesh’te gerçek operator isimleri. Sen sidecar’sın.
          </p>
          <Link
            href="/play"
            className={cn(buttonVariants({ size: "lg" }), "mt-8 rounded-full px-6 tracking-[0.2em] uppercase")}
          >
            Görev kuyruğu
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Why({ t, d }: { t: string; d: string }) {
  return (
    <div>
      <h3 className="text-lg">{t}</h3>
      <p className="mt-3 text-sm leading-relaxed text-black/55">{d}</p>
    </div>
  );
}
