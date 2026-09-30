export function ChromeField({
  className = "",
  variant = "hero",
}: {
  className?: string;
  variant?: "hero" | "edge";
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute -left-[20%] top-[-30%] h-[70%] w-[70%] rounded-full bg-[radial-gradient(circle,rgba(214,214,210,0.22),transparent_62%)] blur-2xl" />
      <div className="absolute right-[-10%] top-[10%] h-[50%] w-[50%] rounded-full bg-[radial-gradient(circle,rgba(160,160,168,0.18),transparent_60%)] blur-3xl" />
      <div className="absolute bottom-[-20%] left-[30%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle,rgba(90,90,98,0.35),transparent_64%)] blur-3xl" />
      {variant === "hero" ? (
        <>
          <div className="chrome-orb absolute left-[8%] top-[14%] h-36 w-36 sm:h-56 sm:w-56" />
          <div className="chrome-orb delay-2 absolute right-[8%] top-[28%] h-20 w-20 sm:h-36 sm:w-36" />
          <div className="chrome-orb delay-3 absolute bottom-[8%] left-[38%] h-14 w-14 sm:h-24 sm:w-24" />
        </>
      ) : (
        <>
          <div className="chrome-orb absolute -left-16 top-24 h-28 w-28 opacity-80 sm:h-40 sm:w-40" />
          <div className="chrome-orb delay-2 absolute -right-10 top-[46%] h-24 w-24 opacity-70 sm:h-32 sm:w-32" />
          <div className="chrome-orb delay-3 absolute bottom-6 left-[18%] h-12 w-12 opacity-60" />
        </>
      )}
      <div
        className={
          variant === "edge"
            ? "absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.55),rgba(0,0,0,0.82))]"
            : "absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.15),rgba(0,0,0,0.72))]"
        }
      />
    </div>
  );
}
