export function ChromeField({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute -left-[20%] top-[-30%] h-[70%] w-[70%] rounded-full bg-[radial-gradient(circle,rgba(214,214,210,0.22),transparent_62%)] blur-2xl" />
      <div className="absolute right-[-10%] top-[10%] h-[50%] w-[50%] rounded-full bg-[radial-gradient(circle,rgba(160,160,168,0.18),transparent_60%)] blur-3xl" />
      <div className="absolute bottom-[-20%] left-[30%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle,rgba(90,90,98,0.35),transparent_64%)] blur-3xl" />
      <div className="chrome-orb absolute left-[12%] top-[22%] h-40 w-40 sm:h-56 sm:w-56" />
      <div className="chrome-orb delay-2 absolute right-[14%] top-[38%] h-24 w-24 sm:h-36 sm:w-36" />
      <div className="chrome-orb delay-3 absolute bottom-[18%] left-[42%] h-16 w-16 sm:h-24 sm:w-24" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.15),rgba(0,0,0,0.72))]" />
    </div>
  );
}
