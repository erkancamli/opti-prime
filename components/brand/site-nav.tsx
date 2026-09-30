"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OptimumMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Relay" },
  { href: "/academy", label: "RLNC" },
  { href: "/play", label: "Ops" },
  { href: "/manual", label: "Altyapı" },
];

export function SiteNav({ ghost = false }: { ghost?: boolean }) {
  const path = usePathname();
  return (
    <header
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-5 sm:pt-7",
        ghost && "mix-blend-difference"
      )}
    >
      <nav className="pointer-events-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-white/10 bg-black/40 px-3 py-2 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-5">
        <Link href="/" className="flex items-center gap-2.5 pr-2">
          <OptimumMark className="h-4 w-8" />
          <span className="text-[11px] tracking-[0.28em] uppercase text-white/80">
            Optimum Relay
          </span>
        </Link>
        <div className="hidden items-center gap-1 sm:flex">
          {LINKS.map((link) => {
            const active = path === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] tracking-[0.18em] uppercase transition-colors",
                  active ? "bg-white text-black" : "text-white/70 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <Link
          href="/play"
          className="rounded-full bg-white px-3 py-1.5 text-[11px] tracking-[0.2em] text-black uppercase sm:px-4"
        >
          Sidecar
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black px-6 py-16 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div>
          <OptimumMark className="h-6 w-12" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
            Transmit less. Deliver more. Optimum Relay, mump2p ve RLNC altyapısını
            operatör masasına çeviren resmi olmayan bir simülasyon.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-[11px] tracking-[0.2em] uppercase text-white/50">
          <a href="https://www.getoptimum.xyz/" target="_blank" rel="noreferrer">
            getoptimum.xyz
          </a>
          <a href="https://x.com/get_optimum" target="_blank" rel="noreferrer">
            @get_optimum
          </a>
          <a href="https://docs.getoptimum.xyz/" target="_blank" rel="noreferrer">
            Docs
          </a>
          <Link href="/manual">Field manual</Link>
        </div>
      </div>
    </footer>
  );
}
