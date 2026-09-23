"use client";

/**
 * ResultReveal — premium cinematic election result reveal.
 *
 * Stages:
 *   idle       → hero CTA
 *   analyzing  → dark full-screen loader with orbital rings + step list
 *   suspense   → shuffling preview cards on dark bg, 5-s countdown
 *   revealed   → glassmorphism result cards with winner spotlight + confetti
 */

import { useEffect, useRef, useState } from "react";
import { Crown, Trophy, Users, BarChart3, Star, Zap, CheckCircle2, ChevronRight } from "lucide-react";
import { Confetti } from "@/components/confetti";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */
export type RevealCandidate = {
  id: string; name: string; class: string | null;
  image_url: string | null; votes: number; percentage: number; isWinner: boolean;
};
export type RevealPosition = {
  positionId: string; title: string; totalVotes: number; tie: boolean;
  candidates: RevealCandidate[];
};
export type RevealData = {
  generatedAt: string; electionStatus: string; websiteName: string;
  totals: { totalVoters: number; totalVotes: number; votedCount: number; notVotedCount: number; turnout: number; };
  results: RevealPosition[];
};
type Stage = "idle" | "analyzing" | "suspense" | "revealed";

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
function CountUp({ target, duration = 1400, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const raf = useRef<number | null>(null);
  const t0 = useRef<number | null>(null);
  useEffect(() => {
    t0.current = null;
    const tick = (ts: number) => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / duration, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return <>{n}{suffix}</>;
}

function useParticles(n: number) {
  const ref = useRef<{ x: number; y: number; s: number; d: number; dur: number; c: string }[]>([]);
  if (!ref.current.length) {
    const cols = ["#22c55e", "#4ade80", "#86efac", "#f4d27b", "#fbbf24"];
    ref.current = Array.from({ length: n }, (_, i) => ({
      x: Math.sin(i * 2.39) * 45 + 50,
      y: Math.cos(i * 1.71) * 45 + 50,
      s: 3 + (i % 5),
      d: (i * 0.14) % 2.4,
      dur: 2.2 + (i % 3),
      c: cols[i % cols.length],
    }));
  }
  return ref.current;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stage 0 — Idle / Hero
───────────────────────────────────────────────────────────────────────────── */
function IdleScreen({ onStart }: { onStart: () => void }) {
  const pts = useParticles(22);
  return (
    <div className="relative flex min-h-[76vh] flex-col items-center justify-center gap-8 overflow-hidden px-4 text-center">
      {/* mesh gradient bg */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60" />
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-amber-300/10 blur-[100px]" />
        {pts.map((p, i) => (
          <span key={i} aria-hidden className="pointer-events-none absolute rounded-full opacity-0"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, background: p.c + "55",
              animation: `rv-float ${p.dur}s ease-in-out ${p.d}s infinite alternate` }} />
        ))}
      </div>

      {/* floating badge */}
      <span className="relative inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-700"
        style={{ animation: "rv-fadein 0.5s ease both" }}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Election · Official Results
      </span>

      {/* icon stack */}
      <div className="relative" style={{ animation: "rv-scalein 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}>
        <div className="relative flex h-36 w-36 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_20px_60px_rgba(34,197,94,0.4)]">
          <Trophy className="h-16 w-16 text-white drop-shadow-lg" />
          {/* orbit ring */}
          <svg aria-hidden className="absolute inset-[-14px] animate-[spin_8s_linear_infinite]" viewBox="0 0 164 164">
            <circle cx="82" cy="82" r="78" fill="none" stroke="rgba(34,197,94,0.2)" strokeWidth="1.5" strokeDasharray="6 10" />
          </svg>
          <svg aria-hidden className="absolute inset-[-28px] animate-[spin_14s_linear_infinite_reverse]" viewBox="0 0 192 192">
            <circle cx="96" cy="96" r="90" fill="none" stroke="rgba(34,197,94,0.1)" strokeWidth="1" strokeDasharray="4 16" />
          </svg>
        </div>
        {/* glow dot */}
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-400 border-2 border-white shadow-md animate-bounce" />
      </div>

      <div style={{ animation: "rv-fadein 0.5s ease 0.25s both" }}>
        <h1 className="font-display text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
          Ready to Reveal
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-500">
          Start the cinematic sequence to generate and reveal the official election results, fetched live from the verified database.
        </p>
      </div>

      <Button variant="hero" size="lg"
        className="relative gap-3 overflow-hidden rounded-2xl px-10 py-5 text-base font-bold shadow-[0_8px_32px_rgba(34,197,94,0.35)] transition-all hover:shadow-[0_12px_40px_rgba(34,197,94,0.5)] hover:-translate-y-0.5"
        onClick={onStart}
        style={{ animation: "rv-fadein 0.5s ease 0.35s both" }}>
        <Trophy className="h-5 w-5" />
        Generate Results
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stage 1 — Analyzing (dark cinematic)
───────────────────────────────────────────────────────────────────────────── */
const STEPS = [
  { label: "Connecting to database",     sub: "Establishing secure connection…",    pct: 15 },
  { label: "Fetching vote records",       sub: "Retrieving all ballot entries…",     pct: 35 },
  { label: "Verifying ballot integrity",  sub: "Running cryptographic checks…",      pct: 58 },
  { label: "Tallying verified votes",     sub: "Counting position by position…",     pct: 80 },
  { label: "Calculating final results",   sub: "Ranking and determining winners…",   pct: 100 },
];

function AnalyzingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep]     = useState(0);
  const [barPct, setBarPct] = useState(0);
  const [done, setDone]     = useState<number[]>([]);

  useEffect(() => {
    let i = 0;
    function go() {
      if (i >= STEPS.length) { setTimeout(onDone, 500); return; }
      setStep(i);
      const target = STEPS[i].pct;
      let cur = i === 0 ? 0 : STEPS[i - 1].pct;
      const id = setInterval(() => {
        cur++;
        setBarPct(cur);
        if (cur >= target) {
          clearInterval(id);
          setDone(prev => [...prev, i]);
          i++;
          setTimeout(go, 500);
        }
      }, 12);
    }
    go();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cur = STEPS[step];
  /* orbital progress ring */
  const R = 52, C = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#080f0c]">
      {/* background glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-emerald-400/5 blur-[100px]" />
        {/* grid lines */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#22c55e" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* orbital rings + icon */}
      <div className="relative mb-10 flex h-40 w-40 items-center justify-center">
        <svg aria-hidden className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(34,197,94,0.1)" strokeWidth="3" />
          <circle cx="60" cy="60" r={R} fill="none" stroke="url(#arcGrad)" strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(barPct / 100) * C} ${C}`}
            className="transition-all duration-150" />
          <defs>
            <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
        </svg>
        {/* inner spinning dashes */}
        <svg aria-hidden className="absolute inset-4 animate-[spin_4s_linear_infinite]" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth="1" strokeDasharray="4 8" />
        </svg>
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-sm border border-emerald-500/20">
          <span className="text-3xl" style={{ animation: "rv-fadein 0.3s ease" }} key={step}>
            {["🔗","📥","🔐","📊","✅"][step]}
          </span>
        </div>
        {/* pct label */}
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 font-mono text-xs font-bold text-emerald-400 tabular-nums">
          {barPct}%
        </span>
      </div>

      {/* title */}
      <h1 className="mt-6 font-display text-3xl font-black text-white sm:text-4xl"
        style={{ animation: "rv-fadein 0.5s ease both" }}>
        Generating Results
      </h1>
      <p className="mt-2 text-sm font-medium text-emerald-400" key={step}
        style={{ animation: "rv-fadein 0.3s ease" }}>
        {cur.label}
      </p>
      <p className="mt-1 text-xs text-white/30" key={`sub-${step}`}
        style={{ animation: "rv-fadein 0.3s ease 0.1s both" }}>
        {cur.sub}
      </p>

      {/* progress bar */}
      <div className="relative mt-8 h-1.5 w-64 overflow-hidden rounded-full bg-white/5 sm:w-80">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] transition-all duration-150"
          style={{ width: `${barPct}%` }} />
      </div>

      {/* step list */}
      <ul className="mt-8 w-64 space-y-2 sm:w-72">
        {STEPS.map((s, i) => {
          const isDone = done.includes(i);
          const isActive = i === step && !isDone;
          return (
            <li key={i} className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all duration-300",
              isDone  ? "bg-emerald-500/10 text-emerald-400" :
              isActive? "bg-white/5 text-white" :
                        "text-white/20"
            )}
              style={isActive || isDone ? { animation: "rv-fadein 0.3s ease" } : undefined}>
              <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                isDone   ? "bg-emerald-500 text-white" :
                isActive ? "bg-white/20 text-white" :
                           "bg-white/5 text-white/20")}>
                {isDone ? "✓" : i + 1}
              </span>
              {s.label}
              {isActive && (
                <span className="ml-auto flex gap-0.5">
                  {[0,1,2].map(d => (
                    <span key={d} className="h-1 w-1 rounded-full bg-emerald-400"
                      style={{ animation: `rv-dot 0.9s ease-in-out ${d * 0.18}s infinite` }} />
                  ))}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stage 2 — Suspense (dark, shuffling)
───────────────────────────────────────────────────────────────────────────── */
function SuspenseScreen({ data, onDone }: { data: RevealData; onDone: () => void }) {
  const [tick, setTick]           = useState(0);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 850);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (countdown <= 0) { onDone(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const R = 36, C = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto bg-[#080f0c] pb-24 pt-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-500/8 to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-2xl px-4">
        {/* header */}
        <div className="mb-4 flex flex-col items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-400">
            <Zap className="h-3 w-3" /> Preview · Not Final
          </span>
          <h1 className="font-display text-3xl font-black text-white sm:text-4xl">Result Preview</h1>
          <p className="text-sm text-white/40">
            Simulated — verified results in{" "}
            <strong className="tabular-nums text-emerald-400">{countdown}s</strong>
          </p>
        </div>

        {/* countdown ring */}
        <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
          <svg aria-hidden className="absolute inset-0 -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
            <circle cx="44" cy="44" r={R} fill="none" stroke="#22c55e" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(countdown / 5) * C} ${C}`}
              className="transition-all duration-[950ms]"
              style={{ filter: "drop-shadow(0 0 6px #22c55e)" }} />
          </svg>
          <span className="relative font-display text-4xl font-black text-white">{countdown}</span>
        </div>

        {/* position cards */}
        <div className="space-y-4">
          {data.results.map(pos => (
            <SuspenseCard key={pos.positionId} position={pos} tick={tick} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SuspenseCard({ position, tick }: { position: RevealPosition; tick: number }) {
  const shuffled = [...position.candidates].sort((a, b) => {
    const na = Math.sin(tick * 1.31 + a.id.charCodeAt(0)) * 0.6;
    const nb = Math.sin(tick * 1.31 + b.id.charCodeAt(0)) * 0.6;
    return b.votes + nb - (a.votes + na);
  });
  const tot = shuffled.reduce((s, c) => s + c.votes, 0) || 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <h2 className="font-display font-bold text-white">{position.title}</h2>
        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
          Preview
        </span>
      </div>
      <ul className="divide-y divide-white/[0.04]">
        {shuffled.map((c, rank) => {
          const pct = Math.round((c.votes / tot) * 100);
          return (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3 transition-all duration-700"
              style={{ animation: `rv-slidein 0.45s ease ${rank * 0.07}s both` }}>
              <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black",
                rank === 0 ? "bg-amber-400/20 text-amber-400" : "bg-white/8 text-white/30")}>
                {rank + 1}
              </span>
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-emerald-500/15">
                {c.image_url
                  ? <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                  : <div className="grid h-full w-full place-items-center text-xs font-black text-emerald-400">{c.name[0]}</div>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white/80">{c.name}</p>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/8">
                  <div className={cn("h-full rounded-full transition-all duration-700",
                    rank === 0 ? "bg-emerald-400" : "bg-white/20")}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-white/30 tabular-nums">≈{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stage 3 — Revealed (premium light cards)
───────────────────────────────────────────────────────────────────────────── */
function RevealedResults({ data }: { data: RevealData }) {
  const [visIdx, setVisIdx]           = useState(-1);
  const [showStats, setShowStats]     = useState(false);
  const [showConfetti, setConfetti]   = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => setShowStats(true), 150);
    const tc = setTimeout(() => setConfetti(true), 400);
    const ts = data.results.map((_, i) => setTimeout(() => setVisIdx(i), 600 + i * 650));
    return () => { clearTimeout(t0); clearTimeout(tc); ts.forEach(clearTimeout); };
  }, [data.results]);

  const stats = [
    { label: "Total voters",      value: data.totals.totalVoters,  icon: Users },
    { label: "Votes cast",        value: data.totals.totalVotes,   icon: BarChart3 },
    { label: "Participated",      value: data.totals.votedCount,   icon: Star },
    { label: "Turnout",           value: data.totals.turnout,      icon: Trophy, suffix: "%" },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      {showConfetti && <Confetti count={100} />}

      {/* top hero bar */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-emerald-500/6 to-transparent" />

      <div className="relative mx-auto max-w-5xl px-4 pb-28 pt-10 sm:px-6">

        {/* header */}
        <div className="mb-10 text-center" style={{ animation: "rv-fadein 0.6s ease both" }}>
          <div className="relative mx-auto mb-5 inline-flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-15 blur-lg" />
            <div className="relative flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_12px_40px_rgba(34,197,94,0.4)]">
              <Trophy className="h-11 w-11 text-white" />
            </div>
            {/* orbit */}
            <svg aria-hidden className="absolute inset-[-12px] animate-[spin_10s_linear_infinite]" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(34,197,94,0.2)" strokeWidth="1.5" strokeDasharray="5 9" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-black text-gray-900 sm:text-5xl">
            Official Results
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Verified · {new Date(data.generatedAt).toLocaleString()} ·{" "}
            <span className={cn("font-semibold", data.electionStatus === "open" ? "text-emerald-600" : "text-gray-600")}>
              Voting {data.electionStatus}
            </span>
          </p>
        </div>

        {/* stat cards */}
        {showStats && (
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
            style={{ animation: "rv-slidein 0.5s ease both" }}>
            {stats.map((s, i) => (
              <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md"
                style={{ animation: `rv-slidein 0.4s ease ${i * 0.08}s both` }}>
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500 opacity-0 transition-opacity group-hover:opacity-100" />
                <s.icon className="mx-auto mb-2 h-4 w-4 text-emerald-500" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-black text-gray-900">
                  <CountUp target={typeof s.value === "number" ? s.value : 0} suffix={s.suffix ?? ""} />
                </p>
              </div>
            ))}
          </div>
        )}

        {/* position result cards */}
        <div className="space-y-6">
          {data.results.map((pos, i) => (
            <ResultPositionCard key={pos.positionId} position={pos} visible={visIdx >= i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultPositionCard({ position, visible }: { position: RevealPosition; visible: boolean }) {
  const [spotlit, setSpotlit] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setSpotlit(true), 700);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md"
      style={{ animation: "rv-slidein 0.65s cubic-bezier(0.16,1,0.3,1) both" }}>

      {/* position header */}
      <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-4">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
        <div className="flex flex-wrap items-center justify-between gap-2 pl-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 shadow-sm">
              <Trophy className="h-3.5 w-3.5 text-white" />
            </span>
            <h2 className="font-display text-lg font-bold text-gray-900">{position.title}</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="tabular-nums">{position.totalVotes} vote{position.totalVotes !== 1 ? "s" : ""}</span>
            {position.tie && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">Tie</span>
            )}
          </div>
        </div>
      </div>

      {/* candidates */}
      <ul className="divide-y divide-gray-50/80">
        {position.candidates.map((c, rank) => {
          const isWinner = c.isWinner;
          return (
            <li key={c.id}
              className={cn(
                "relative overflow-hidden px-6 py-5 transition-all duration-500",
                isWinner && spotlit
                  ? "bg-gradient-to-r from-emerald-50/60 to-white"
                  : "bg-white hover:bg-gray-50/50",
              )}
              style={{ animation: `rv-slidein 0.45s ease ${rank * 0.13}s both` }}>

              {/* winner left accent */}
              {isWinner && spotlit && (
                <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-emerald-400 to-emerald-600"
                  style={{ animation: "rv-fadein 0.4s ease both" }} />
              )}

              <div className="flex flex-wrap items-center gap-4 pl-2">
                {/* rank */}
                <span className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black transition-all duration-500",
                  isWinner && spotlit
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_4px_14px_rgba(34,197,94,0.4)]"
                    : rank === 0
                    ? "bg-amber-100 text-amber-600"
                    : "bg-gray-100 text-gray-400",
                )}>
                  {isWinner && spotlit ? <Crown className="h-4 w-4" /> : rank + 1}
                </span>

                {/* avatar */}
                <div className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl transition-all duration-500",
                  isWinner && spotlit
                    ? "ring-2 ring-emerald-400 ring-offset-2 shadow-[0_4px_20px_rgba(34,197,94,0.25)]"
                    : "ring-1 ring-gray-200",
                )}>
                  {c.image_url
                    ? <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                    : (
                      <div className={cn("grid h-full w-full place-items-center font-display text-2xl font-black",
                        isWinner ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500")}>
                        {c.name[0]}
                      </div>
                    )
                  }
                  {isWinner && spotlit && (
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent" />
                  )}
                </div>

                {/* name + bar */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("font-display text-base font-bold",
                      isWinner && spotlit ? "text-gray-900" : "text-gray-700")}>
                      {c.name}
                    </span>
                    {c.class && <span className="text-xs text-gray-400">{c.class}</span>}
                    {isWinner && spotlit && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm"
                        style={{ animation: "rv-scalein 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {position.tie ? "Tied" : "Winner"}
                      </span>
                    )}
                  </div>

                  {/* bar */}
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className={cn(
                      "h-full rounded-full transition-all duration-[1300ms] ease-out",
                      isWinner
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                        : "bg-gray-300",
                    )}
                      style={{ width: visible ? `${c.percentage}%` : "0%" }} />
                  </div>
                </div>

                {/* vote count */}
                <div className="shrink-0 text-right">
                  <p className={cn("font-display text-2xl font-black tabular-nums",
                    isWinner && spotlit ? "text-emerald-600" : "text-gray-700")}>
                    {visible ? <CountUp target={c.votes} duration={1100} /> : 0}
                  </p>
                  <p className="text-[11px] text-gray-400">votes · {c.percentage}%</p>
                </div>
              </div>
            </li>
          );
        })}
        {position.candidates.length === 0 && (
          <li className="px-6 py-6 text-sm text-gray-400">No candidates registered.</li>
        )}
      </ul>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Orchestrator
───────────────────────────────────────────────────────────────────────────── */
export function ResultReveal({ data, isLoading, isError, errorMessage, onRegenerate }:
  { data: RevealData | undefined; isLoading: boolean; isError: boolean; errorMessage: string; onRegenerate: () => void; }) {
  const [stage, setStage]           = useState<Stage>("idle");
  const [analyzerDone, setADone]    = useState(false);

  useEffect(() => {
    if (stage === "analyzing" && analyzerDone && data && !isLoading) setStage("suspense");
  }, [stage, analyzerDone, data, isLoading]);

  useEffect(() => {
    if (stage === "analyzing" && analyzerDone && isError) setStage("revealed");
  }, [stage, analyzerDone, isError]);

  function startReveal() { setADone(false); setStage("analyzing"); onRegenerate(); }

  if (stage === "idle")      return <IdleScreen onStart={startReveal} />;
  if (stage === "analyzing") return (
    <AnalyzingScreen onDone={() => {
      setADone(true);
      if (data && !isLoading) setStage("suspense");
    }} />
  );
  if (stage === "suspense") {
    if (!data) return <AnalyzingScreen onDone={() => setADone(true)} />;
    return <SuspenseScreen data={data} onDone={() => setStage("revealed")} />;
  }
  if (stage === "revealed") {
    if (isError) return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="rounded-3xl border border-red-100 bg-red-50 px-8 py-10 text-center max-w-sm shadow-sm">
          <p className="text-sm text-red-600">{errorMessage || "Could not generate results"}</p>
          <Button variant="outline" className="mt-4 w-full" onClick={startReveal}>Try again</Button>
        </div>
      </div>
    );
    if (!data) return null;
    return (
      <>
        <RevealedResults data={data} />
        <div className="fixed bottom-6 right-6 z-40">
          <Button variant="outline" size="sm"
            className="rounded-xl border-gray-200 bg-white/80 text-gray-600 shadow-md backdrop-blur-sm hover:bg-white"
            onClick={startReveal}>
            ↺ Regenerate
          </Button>
        </div>
      </>
    );
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Keyframes
───────────────────────────────────────────────────────────────────────────── */
export function RevealStyles() {
  return (
    <style>{`
      @keyframes rv-fadein  { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:translateY(0)} }
      @keyframes rv-slidein { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
      @keyframes rv-scalein { from{opacity:0;transform:scale(0.8)}       to{opacity:1;transform:scale(1)}      }
      @keyframes rv-float   {
        from { opacity:.18; transform:translateY(0) scale(1);     }
        to   { opacity:.5;  transform:translateY(-11px) scale(1.1); }
      }
      @keyframes rv-dot {
        0%,80%,100% { transform:scale(0.6); opacity:.3 }
        40%         { transform:scale(1.1); opacity:1  }
      }
    `}</style>
  );
}
