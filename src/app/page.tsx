const strands = [
  "M-50 120 C 250 40, 450 260, 750 160 S 1150 60, 1500 220",
  "M-50 180 C 280 100, 430 330, 760 220 S 1180 120, 1500 290",
  "M-50 250 C 300 170, 420 400, 770 290 S 1200 190, 1500 360",
  "M-50 330 C 320 250, 410 470, 780 360 S 1220 270, 1500 430",
];

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      {/* Soft glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      {/* Flowing strands */}
      <svg
        aria-hidden
        viewBox="0 0 1440 500"
        preserveAspectRatio="xMidYMid slice"
        className="sway pointer-events-none absolute inset-x-0 top-[18%] h-[28rem] w-full opacity-40"
      >
        {strands.map((d, i) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1}
            className="strand"
            style={{ animationDelay: `${i * 0.35}s` }}
          />
        ))}
      </svg>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <span className="font-display text-2xl tracking-wide">HairCraft</span>
        <span className="text-xs uppercase tracking-[0.3em] text-muted">
          Est. 2026
        </span>
      </header>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p
          className="rise mb-6 text-[0.65rem] uppercase tracking-[0.25em] text-accent sm:text-xs sm:tracking-[0.4em]"
          style={{ animationDelay: "0.2s" }}
        >
          Something beautiful is on its way
        </p>
        <h1
          className="rise font-display text-6xl font-light leading-none sm:text-8xl md:text-9xl"
          style={{ animationDelay: "0.5s" }}
        >
          Coming <em className="italic text-accent">soon</em>
        </h1>
        <p
          className="rise mt-8 max-w-md text-base leading-relaxed text-muted sm:text-lg"
          style={{ animationDelay: "0.9s" }}
        >
          Premium hair extensions, thoughtfully crafted for length, volume and
          confidence. Our store opens its doors very soon.
        </p>
        <div
          className="rise mt-12 flex items-center gap-4 whitespace-nowrap text-[0.65rem] uppercase tracking-[0.2em] text-muted sm:text-xs sm:tracking-[0.3em]"
          style={{ animationDelay: "1.3s" }}
        >
          <span className="h-px w-6 bg-accent/60 sm:w-10" />
          Length · Volume · Confidence
          <span className="h-px w-6 bg-accent/60 sm:w-10" />
        </div>
      </section>

      <footer className="relative z-10 px-6 py-6 text-center text-xs text-muted/70 sm:px-10">
        © {new Date().getFullYear()} HairCraft. All rights reserved.
      </footer>
    </main>
  );
}
