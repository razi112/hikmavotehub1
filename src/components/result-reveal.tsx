"use client";

/**
 * ResultReveal — cinematic election result reveal sequence.
 *
 * Stage machine:
 *   idle       → user clicks "Generate Results"
 *   analyzing  → full-screen loading animation (~3 s)
 *   suspense   → animated preview with shuffling ranks (5 s)
 *   revealed   → final verified results with winner spotlight
 *
 * Theme: light / white
 */

import { useEffect, useRef, useState } from "react";
import { Crown, Trophy, Users, BarChart3, Zap, Star } from "lucide-react";
import { Confetti } from "@/components/confetti";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */

export type RevealCandidate = {
  id: string;
  name: string;
  class: string | null;
  image_url: string | null;
  votes: number;
  percentage: number;
  isWinner: boolean;
};

export type RevealPosition = {
  positionId: string;
  title: string;
  totalVotes: number;
  tie: boolean;
  candidates: RevealCandidate[];
};

export type RevealData = {
  generatedAt: string;
  electionStatus: string;
  websiteName: string;
  totals: {
    totalVoters: number;
    totalVotes: number;
    votedCount: number;
    notVotedCount: number;
    turnout: number;
  };
  results: RevealPosition[];
};

type Stage = "idle" | "analyzing" | "suspense" | "revealed";

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

/** Smooth animated counter */
function CountUp({
  target,
  duration = 1200,
  suffix = "",
}: {
  target: number;
  duration?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    start.current = null;
    function tick(ts: number) {
      if (start.current === null) start.current = ts;
      const elapsed = ts - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return <>{display}{suffix}</>;
}

/** Floating decorative particle */
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute rounded-full opacity-0"
      style={style}
    />
  );
}

/** Stable particle config generated once per mount */
function useParticles(count: number) {
  const ref = useRef<
    { x: number; y: number; size: number; delay: number; dur: number; color: string }[]
  >([]);
  if (ref.current.length === 0) {
    const colors = ["#22c55e40", "#16a34a30", "#4ade8040", "#86efac50", "#bbf7d040"];
    ref.current = Array.from({ length: count }, (_, i) => ({
      x: Math.sin(i * 2.4) * 50 + 50,
      y: Math.cos(i * 1.7) * 50 + 50,
      size: 4 + (i % 6),
      delay: (i * 0.13) % 2.5,
      dur: 2.5 + (i % 3),
      color: colors[i % colors.length],
    }));
  }
  return ref.current;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stage 1 — Analyzing / Loading screen
───────────────────────────────────────────────────────────────────────────── */

const LOADING_STEPS = [
  { label: "Connecting to database…",    icon: "🔗", pct: 18 },
  { label: "Fetching vote records…",     icon: "📥", pct: 38 },
  { label: "Verifying ballot integrity…",icon: "🔐", pct: 58 },
  { label: "Tallying verified votes…",   icon: "📊", pct: 78 },
  { label: "Calculating final results…", icon: "✅", pct: 100 },
];

function AnalyzingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [barPct, setBarPct] = useState(0);
  const particles = useParticles(20);

  useEffect(() => {
    let i = 0;
    function advance() {
      if (i >= LOADING_STEPS.length) { setTimeout(onDone, 400); return; }
      setStep(i);
      const target = LOADING_STEPS[i].pct;
      let cur = i === 0 ? 0 : LOADING_STEPS[i - 1].pct;
      const id = setInterval(() => {
        cur += 1;
        setBarPct(cur);
        if (cur >= target) { clearInterval(id); i++; setTimeout(advance, 420); }
      }, 14);
    }
    advance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = LOADING_STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-white">
      {/* soft green glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-80 w-80 translate-x-1/2 translate-y-1/2 rounded-full bg-primary/6 blur-[100px]" />
      </div>

      {/* floating particles */}
      {particles.map((p, i) => (
        <Particle key={i} style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          background: p.color,
          animation: `reveal-float ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
        }} />
      ))}

      {/* spinning ring */}
      <div className="relative mb-10">
        <svg
          className="h-32 w-32 animate-[spin_3s_linear_infinite]"
          viewBox="0 0 100 100"
          aria-hidden
        >
          <circle cx="50" cy="50" r="44" fill="none" strokeWidth="2" stroke="#e5e7eb" />
          <circle
            cx="50" cy="50" r="44" fill="none" strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="80 196"
            className="stroke-primary drop-shadow-[0_0_6px_var(--primary)]"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl animate-pulse">{current.icon}</span>
        </div>
      </div>

      {/* headline */}
      <h1 className="font-display text-3xl font-black text-gray-900 sm:text-4xl">
        Generating Results
      </h1>
      <p
        key={step}
        className="mt-3 text-base text-primary font-medium"
        style={{ animation: "reveal-fadein 0.35s ease" }}
      >
        {current.label}
      </p>

      {/* progress bar */}
      <div className="relative mt-8 h-2.5 w-64 overflow-hidden rounded-full bg-gray-100 sm:w-80">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary shadow-[0_0_10px_var(--primary)] transition-all duration-150"
          style={{ width: `${barPct}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-xs text-gray-400">{barPct}%</p>

      {/* completed steps */}
      <ul className="mt-8 space-y-1.5">
        {LOADING_STEPS.slice(0, step + 1).map((s, i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-xs text-gray-500"
            style={{ animation: "reveal-fadein 0.3s ease" }}
          >
            <span className="text-primary font-bold">✓</span>
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stage 2 — Suspense preview
───────────────────────────────────────────────────────────────────────────── */

function SuspenseScreen({ data, onDone }: { data: RevealData; onDone: () => void }) {
  const [tick, setTick] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const particles = useParticles(16);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 900);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (countdown <= 0) { onDone(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-50 pb-20 pt-10">
      {/* soft top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/5 to-transparent" />
      {particles.map((p, i) => (
        <Particle key={i} style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          background: p.color,
          animation: `reveal-float ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
        }} />
      ))}

      <div className="relative mx-auto max-w-3xl px-4">
        {/* badge */}
        <div className="mb-3 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-600">
            <Zap className="h-3 w-3" /> Preview · Not Final
          </span>
        </div>

        <h1 className="text-center font-display text-3xl font-black text-gray-900 sm:text-4xl">
          Result Preview
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Simulated for suspense — verified results in{" "}
          <strong className="tabular-nums text-primary">{countdown}s</strong>
        </p>

        {/* countdown ring */}
        <div className="relative mx-auto mt-6 mb-8 flex h-20 w-20 items-center justify-center">
          <svg className="absolute h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden>
            <circle cx="40" cy="40" r="34" fill="none" strokeWidth="3" stroke="#e5e7eb" />
            <circle
              cx="40" cy="40" r="34" fill="none" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(countdown / 5) * 213.6} 213.6`}
              className="stroke-primary transition-all duration-[950ms]"
            />
          </svg>
          <span className="relative font-display text-3xl font-black text-gray-900">{countdown}</span>
        </div>

        {/* position cards */}
        <div className="space-y-5">
          {data.results.map((pos) => (
            <SuspensePositionCard key={pos.positionId} position={pos} tick={tick} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SuspensePositionCard({ position, tick }: { position: RevealPosition; tick: number }) {
  const shuffled = [...position.candidates].sort((a, b) => {
    const noise  = Math.sin(tick * 1.3 + a.id.charCodeAt(0)) * 0.5;
    const noise2 = Math.sin(tick * 1.3 + b.id.charCodeAt(0)) * 0.5;
    return b.votes + noise - (a.votes + noise2);
  });
  const fakeTotal = shuffled.reduce((s, c) => s + c.votes, 0) || 1;

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <h2 className="font-display font-bold text-gray-900">{position.title}</h2>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
          Preview Only
        </span>
      </div>
      <ul className="divide-y divide-gray-50">
        {shuffled.map((c, rank) => {
          const fakePct = Math.round((c.votes / fakeTotal) * 100);
          return (
            <li
              key={c.id}
              className="flex items-center gap-3 px-5 py-3 transition-all duration-700"
              style={{ animation: `reveal-slidein 0.5s ease ${rank * 0.08}s both` }}
            >
              <span className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black",
                rank === 0 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400",
              )}>
                {rank + 1}
              </span>
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10">
                {c.image_url ? (
                  <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-sm font-black text-primary">
                    {c.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800">{c.name}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      rank === 0 ? "bg-primary" : "bg-gray-300",
                    )}
                    style={{ width: `${fakePct}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-xs font-mono text-gray-400 tabular-nums">
                ≈{fakePct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stage 3 — Final verified results
───────────────────────────────────────────────────────────────────────────── */

function RevealedResults({ data }: { data: RevealData }) {
  const [visibleIdx, setVisibleIdx] = useState(-1);
  const [showStats, setShowStats] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const stats = [
    { label: "Total voters",     value: data.totals.totalVoters,  icon: Users },
    { label: "Votes received",   value: data.totals.totalVotes,   icon: BarChart3 },
    { label: "Voters who voted", value: data.totals.votedCount,   icon: Star },
    { label: "Turnout",          value: data.totals.turnout,      icon: Trophy, suffix: "%" },
  ];

  useEffect(() => {
    const t0 = setTimeout(() => setShowStats(true), 200);
    const timers = data.results.map((_, i) =>
      setTimeout(() => setVisibleIdx(i), 800 + i * 700),
    );
    const tc = setTimeout(() => setShowConfetti(true), 600);
    return () => { clearTimeout(t0); clearTimeout(tc); timers.forEach(clearTimeout); };
  }, [data.results]);

  return (
    <div className="relative min-h-screen bg-gray-50">
      {showConfetti && <Confetti count={90} />}

      {/* subtle top gradient */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/6 to-transparent" />

      <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-12 sm:px-6">

        {/* hero header */}
        <div className="mb-10 text-center" style={{ animation: "reveal-fadein 0.6s ease both" }}>
          <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 ring-4 ring-primary/20 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-black text-gray-900 sm:text-5xl">
            Official Results
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Verified · {new Date(data.generatedAt).toLocaleString()} · Voting{" "}
            <strong className="text-gray-700">{data.electionStatus}</strong>
          </p>
        </div>

        {/* summary stats */}
        {showStats && (
          <div
            className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
            style={{ animation: "reveal-slidein 0.5s ease both" }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm"
              >
                <s.icon className="mx-auto mb-1.5 h-4 w-4 text-primary" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {s.label}
                </p>
                <p className="mt-1 font-display text-2xl font-black text-gray-900">
                  <CountUp target={typeof s.value === "number" ? s.value : 0} suffix={s.suffix ?? ""} />
                </p>
              </div>
            ))}
          </div>
        )}

        {/* positions */}
        <div className="space-y-8">
          {data.results.map((pos, i) => (
            <VerifiedPositionCard
              key={pos.positionId}
              position={pos}
              visible={visibleIdx >= i}
              delay={0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function VerifiedPositionCard({
  position,
  visible,
  delay,
}: {
  position: RevealPosition;
  visible: boolean;
  delay: number;
}) {
  const [winnerSpotlit, setWinnerSpotlit] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setWinnerSpotlit(true), delay + 800);
    return () => clearTimeout(t);
  }, [visible, delay]);

  if (!visible) return null;

  return (
    <section
      className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
      style={{ animation: "reveal-slidein 0.6s cubic-bezier(0.16,1,0.3,1) both" }}
    >
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-6 py-4">
        <h2 className="font-display text-xl font-bold text-gray-900">{position.title}</h2>
        <span className="text-xs text-gray-400">
          {position.totalVotes} vote{position.totalVotes !== 1 ? "s" : ""}
          {position.tie ? " · tie" : ""}
        </span>
      </div>

      <ul className="divide-y divide-gray-50">
        {position.candidates.map((c, rank) => {
          const isWinner = c.isWinner;
          return (
            <li
              key={c.id}
              className={cn(
                "relative px-5 py-4 transition-all duration-700",
                isWinner && winnerSpotlit ? "bg-primary/[0.04]" : "bg-white",
              )}
              style={{ animation: `reveal-slidein 0.5s ease ${rank * 0.12}s both` }}
            >
              {/* winner glow overlay */}
              {isWinner && winnerSpotlit && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(34,197,94,0.07) 0%, transparent 70%)",
                    animation: "reveal-glow-pulse 2.5s ease-in-out infinite",
                  }}
                />
              )}

              <div className="relative flex flex-wrap items-center gap-4">
                {/* rank badge */}
                <span className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black",
                  isWinner && winnerSpotlit
                    ? "bg-primary text-white shadow-[0_0_14px_rgba(34,197,94,0.4)]"
                    : rank === 0
                    ? "bg-amber-100 text-amber-600"
                    : "bg-gray-100 text-gray-400",
                )}>
                  {isWinner && winnerSpotlit ? <Crown className="h-4 w-4" /> : rank + 1}
                </span>

                {/* avatar */}
                <div className={cn(
                  "relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl",
                  isWinner && winnerSpotlit
                    ? "ring-2 ring-primary shadow-[0_0_16px_rgba(34,197,94,0.3)]"
                    : "ring-1 ring-gray-200",
                )}>
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-primary/10 font-display text-xl font-black text-primary">
                      {c.name.charAt(0)}
                    </div>
                  )}
                  {isWinner && winnerSpotlit && (
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                  )}
                </div>

                {/* name + bar */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "truncate font-display text-base font-bold",
                      isWinner && winnerSpotlit ? "text-gray-900" : "text-gray-700",
                    )}>
                      {c.name}
                    </span>
                    {c.class && (
                      <span className="text-xs text-gray-400">{c.class}</span>
                    )}
                    {isWinner && winnerSpotlit && (
                      <span
                        className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_10px_rgba(34,197,94,0.35)]"
                        style={{ animation: "reveal-fadein 0.4s ease both" }}
                      >
                        {position.tie ? "Tied Lead" : "Winner"}
                      </span>
                    )}
                  </div>

                  {/* vote bar */}
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-[1200ms] ease-out",
                        isWinner ? "bg-primary shadow-[0_0_6px_rgba(34,197,94,0.4)]" : "bg-gray-300",
                      )}
                      style={{ width: visible ? `${c.percentage}%` : "0%" }}
                    />
                  </div>
                </div>

                {/* vote count */}
                <div className="shrink-0 text-right">
                  <p className={cn(
                    "font-display text-xl font-black tabular-nums",
                    isWinner && winnerSpotlit ? "text-primary" : "text-gray-700",
                  )}>
                    {visible ? <CountUp target={c.votes} duration={1000} /> : 0}
                  </p>
                  <p className="text-xs text-gray-400">votes</p>
                  <p className="text-xs font-mono text-gray-400 tabular-nums">{c.percentage}%</p>
                </div>
              </div>
            </li>
          );
        })}
        {position.candidates.length === 0 && (
          <li className="px-6 py-5 text-sm text-gray-400">No candidates.</li>
        )}
      </ul>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main export — ResultReveal orchestrator
───────────────────────────────────────────────────────────────────────────── */

export function ResultReveal({
  data,
  isLoading,
  isError,
  errorMessage,
  onRegenerate,
}: {
  data: RevealData | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  onRegenerate: () => void;
}) {
  const [stage, setStage] = useState<Stage>("idle");
  // Track whether the animation sequence has finished its own timer so we
  // know to advance as soon as data actually lands.
  const [analyzerDone, setAnalyzerDone] = useState(false);

  // Reactive: advance to suspense whenever BOTH the analyzer animation has
  // finished AND real data has arrived. This avoids the stale-closure bug of
  // polling with setInterval (which captured data=undefined forever).
  useEffect(() => {
    if (stage === "analyzing" && analyzerDone && data && !isLoading) {
      setStage("suspense");
    }
  }, [stage, analyzerDone, data, isLoading]);

  // Also handle error while analyzing
  useEffect(() => {
    if (stage === "analyzing" && analyzerDone && isError) {
      setStage("revealed"); // will show error state
    }
  }, [stage, analyzerDone, isError]);

  function startReveal() {
    setAnalyzerDone(false);
    setStage("analyzing");
    onRegenerate();
  }

  if (stage === "idle") return <IdleScreen onStart={startReveal} />;

  if (stage === "analyzing") {
    return (
      <AnalyzingScreen
        onDone={() => {
          setAnalyzerDone(true);
          // If data already arrived by the time animation finishes, advance immediately.
          // Otherwise the useEffect above will fire when data arrives.
          if (data && !isLoading) setStage("suspense");
        }}
      />
    );
  }

  if (stage === "suspense") {
    if (!data) return <AnalyzingScreen onDone={() => setAnalyzerDone(true)} />;
    return <SuspenseScreen data={data} onDone={() => setStage("revealed")} />;
  }

  if (stage === "revealed") {
    if (isError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-3xl border border-red-200 bg-red-50 px-8 py-10 text-center text-sm text-red-600 max-w-sm shadow-sm">
            {errorMessage || "Could not generate results"}
            <Button variant="outline" className="mt-4 w-full" onClick={startReveal}>
              Try again
            </Button>
          </div>
        </div>
      );
    }
    if (!data) return null;
    return (
      <>
        <RevealedResults data={data} />
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900"
            onClick={startReveal}
          >
            Regenerate
          </Button>
        </div>
      </>
    );
  }

  return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Idle screen
───────────────────────────────────────────────────────────────────────────── */

function IdleScreen({ onStart }: { onStart: () => void }) {
  const particles = useParticles(18);
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p, i) => (
          <Particle key={i} style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: p.color,
            animation: `reveal-float ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
          }} />
        ))}
      </div>

      {/* icon */}
      <div
        className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-primary/10 ring-4 ring-primary/15 shadow-[0_0_40px_rgba(34,197,94,0.12)]"
        style={{ animation: "reveal-glow-pulse 3s ease-in-out infinite" }}
      >
        <Trophy className="h-14 w-14 text-primary" />
      </div>

      <div>
        <h2 className="font-display text-3xl font-black text-gray-900 sm:text-4xl">
          Ready to Reveal
        </h2>
        <p className="mt-3 max-w-md text-sm text-gray-500 leading-relaxed">
          Click below to begin the cinematic result generation sequence. Final results
          are fetched directly from the verified database — nothing is fabricated.
        </p>
      </div>

      <Button
        variant="hero"
        size="lg"
        className="px-10 py-4 text-base"
        onClick={onStart}
      >
        <Trophy className="h-5 w-5" />
        Generate Results
      </Button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CSS keyframes (injected once)
───────────────────────────────────────────────────────────────────────────── */

export function RevealStyles() {
  return (
    <style>{`
      @keyframes reveal-fadein {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0);   }
      }
      @keyframes reveal-slidein {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0);    }
      }
      @keyframes reveal-float {
        from { opacity: 0.2;  transform: translateY(0px)   scale(1);   }
        to   { opacity: 0.55; transform: translateY(-12px) scale(1.15); }
      }
      @keyframes reveal-glow-pulse {
        0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.12); }
        50%       { box-shadow: 0 0 40px rgba(34,197,94,0.25); }
      }
    `}</style>
  );
}
