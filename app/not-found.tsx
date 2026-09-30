import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-start justify-end bg-black px-8 pb-24 pt-32 text-white">
      <p className="text-[11px] tracking-[0.28em] uppercase text-white/40">404</p>
      <h1 className="mt-3 font-heading text-5xl">Bu peer mesh’te yok.</h1>
      <Link href="/" className="mt-8 rounded-full bg-white px-5 py-2 text-[11px] tracking-[0.2em] text-black uppercase">
        Relay
      </Link>
    </div>
  );
}
