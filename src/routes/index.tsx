import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  CheckCircle2,
  Vote,
  Lock,
  BarChart3,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/countdown";
import { Reveal } from "@/components/reveal";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { candidatesQuery, positionsQuery, settingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hikma Vote — Class Union Committee Election 2026" },
      {
        name: "description",
        content:
          "Choose your leaders with confidence. Secure, one-vote-per-position online balloting for the Hikma Class Union Committee Election 2026.",
      },
      { property: "og:title", content: "Hikma Vote — Election 2026" },
      {
        property: "og:description",
        content: "Every vote shapes the future of our class. Vote securely online.",
      },
    ],
  }),
  component: Home,
});

/* ── stat card ── */
function StatCard({
  value,
  label,
  icon: Icon,
  accent = false,
}: {
  value: string | number;
  label: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-2xl p-5 ${
      accent
        ? "bg-gradient-to-br from-primary to-primary-glow text-white shadow-[0_8px_30px_rgba(34,197,94,0.35)]"
        : "bg-white border border-gray-100 shadow-sm text-foreground"
    }`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
        accent ? "bg-white/20" : "bg-primary/10"
      }`}>
        <Icon className={`h-4.5 w-4.5 ${accent ? "text-white" : "text-primary"}`} />
      </div>
      <div>
        <p className={`font-display text-2xl font-black leading-none ${accent ? "text-white" : "text-gray-900"}`}>
          {value}
        </p>
        <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-widest ${
          accent ? "text-white/70" : "text-gray-400"
        }`}>{label}</p>
      </div>
    </div>
  );
}

/* ── feature card ── */
function FeatureCard({
  icon: Icon,
  title,
  body,
  index,
  gradient,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  index: number;
  gradient: string;
}) {
  return (
    <Reveal delay={index * 100}>
      <div className="group relative h-full overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        {/* colour top accent */}
        <div className={`absolute inset-x-0 top-0 h-1 ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${gradient} shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <h3 className="mt-5 font-display text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{body}</p>
      </div>
    </Reveal>
  );
}

/* ── numbered step ── */
function Step({ number, label, index }: { number: number; label: string; index: number }) {
  return (
    <Reveal delay={index * 90}>
      <div className="flex items-center gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow font-display text-sm font-black text-white shadow-[0_4px_14px_rgba(34,197,94,0.35)]">
          {number}
        </span>
        <p className="text-sm font-medium text-gray-700">{label}</p>
      </div>
    </Reveal>
  );
}

function Home() {
  const settings   = useQuery(settingsQuery());
  const positions  = useQuery(positionsQuery());
  const candidates = useQuery(candidatesQuery());

  const isOpen         = settings.data?.election_status === "open";
  const positionCount  = positions.data?.length ?? "—";
  const candidateCount = candidates.data?.filter((c) => c.is_active).length ?? "—";

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <SiteHeader />

      <main>

        {/* ══════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-white">
          {/* background blobs */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[120px]" />
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-amber-300/10 blur-[100px]" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-300/8 blur-[80px]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-28 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:pt-28 lg:pb-32">

            {/* LEFT: copy */}
            <div className="flex flex-col items-start">
              {/* badge */}
              <div
                className="mb-7 flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5"
                style={{ animation: "home-fadein 0.5s ease both" }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                  {isOpen ? "Voting is live now" : "Election 2026"}
                </span>
              </div>

              {/* headline */}
              <h1
                className="font-display text-[clamp(2.4rem,5.5vw,4rem)] font-black leading-[1.06] tracking-tight text-gray-900"
                style={{ animation: "home-fadein 0.55s ease 0.07s both" }}
              >
                Elect Your{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent">
                    Leaders.
                  </span>
                  <svg aria-hidden className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                    <path d="M2 6C30 2 60 6 100 4S170 2 198 5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
                  </svg>
                </span>
                <br />Shape Your{" "}
                <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Future.
                </span>
              </h1>

              <p
                className="mt-5 max-w-lg text-base leading-relaxed text-gray-500 sm:text-lg"
                style={{ animation: "home-fadein 0.55s ease 0.14s both" }}
              >
                Secure, one-vote-per-position balloting for the Hikma Class Union Committee Election 2026. Every vote counts and results are announced live.
              </p>

              {/* CTAs */}
              <div
                className="mt-8 flex flex-wrap gap-3"
                style={{ animation: "home-fadein 0.55s ease 0.21s both" }}
              >
                <Button asChild variant="hero" size="xl"
                  className="gap-2 rounded-2xl shadow-[0_8px_30px_rgba(34,197,94,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(34,197,94,0.45)]">
                  <Link to="/vote">
                    <Vote className="h-4 w-4" /> Vote Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="xl"
                  className="rounded-2xl border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50">
                  <Link to="/candidates">View Candidates</Link>
                </Button>
              </div>

              {/* trust badges */}
              <div
                className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-400"
                style={{ animation: "home-fadein 0.55s ease 0.28s both" }}
              >
                {["One vote per position", "End-to-end encrypted", "Live results"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT: visual */}
            <div
              className="mt-16 hidden lg:block"
              style={{ animation: "home-fadein 0.7s ease 0.2s both" }}
            >
              <div className="relative">
                {/* main card */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 shadow-[0_32px_80px_rgba(34,197,94,0.3)]">
                  {/* inner glow */}
                  <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
                  {/* grid pattern */}
                  <div aria-hidden className="absolute inset-0 opacity-[0.07]"
                    style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

                  <div className="relative flex flex-col items-center py-6 text-center text-white">
                    {/* orbit icon */}
                    <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-white/15 backdrop-blur-sm" />
                      <svg aria-hidden className="absolute inset-[-10px] animate-[spin_10s_linear_infinite]" viewBox="0 0 108 108">
                        <circle cx="54" cy="54" r="50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="5 8" />
                      </svg>
                      <Vote className="relative h-11 w-11 text-white drop-shadow-lg" />
                    </div>

                    <span className="text-sm font-semibold uppercase tracking-widest text-white/70">
                      Class Union Committee
                    </span>
                    <h2 className="mt-1 font-display text-5xl font-black">2026</h2>
                    <p className="mt-1 text-sm text-white/70">Official Election</p>

                    {/* divider */}
                    <div className="my-6 h-px w-full bg-white/15" />

                    {/* mini stats row */}
                    <div className="flex w-full gap-3">
                      {[
                        { val: positionCount, lbl: "Positions" },
                        { val: candidateCount, lbl: "Candidates" },
                        { val: isOpen ? "Live" : "Closed", lbl: "Status" },
                      ].map((s) => (
                        <div key={s.lbl} className="flex flex-1 flex-col items-center rounded-2xl bg-white/10 px-3 py-3 backdrop-blur-sm">
                          <span className="font-display text-xl font-black text-white">{s.val}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">{s.lbl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* floating cards */}
                <div className="absolute -left-6 top-8 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-lg"
                  style={{ animation: "home-float 3s ease-in-out infinite" }}>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold text-gray-800">Secure Voting</p>
                      <p className="text-[10px] text-gray-400">Encrypted ballots</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-6 bottom-16 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-lg"
                  style={{ animation: "home-float 3.5s ease-in-out 0.5s infinite" }}>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                      <BarChart3 className="h-4 w-4 text-amber-600" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold text-gray-800">Live Results</p>
                      <p className="text-[10px] text-gray-400">Announced publicly</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-emerald-200 bg-white px-5 py-2 shadow-md"
                  style={{ animation: "home-float 4s ease-in-out 0.8s infinite" }}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-gray-700">
                      {isOpen ? "Voting open" : "Election 2026"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* mobile stat chips */}
          <div className="relative mx-auto grid max-w-sm grid-cols-3 gap-3 px-4 pb-14 sm:px-6 lg:hidden">
            <StatCard value={positionCount} label="Positions" icon={Star} />
            <StatCard value={candidateCount} label="Candidates" icon={Users} accent />
            <StatCard value={isOpen ? "Live" : "Closed"} label="Status" icon={Zap} />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            COUNTDOWN STRIP
        ══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#f8faf9] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="mb-10 text-center">
              <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
                Deadline
              </span>
              <h2 className="mt-3 font-display text-2xl font-black text-gray-900 sm:text-3xl">
                Time remaining to vote
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Cast your ballot before the countdown hits zero.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <Countdown endTime={settings.data?.end_time} />
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FEATURES — 3 cards
        ══════════════════════════════════════════════════════ */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="mb-12 text-center">
              <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
                Why it matters
              </span>
              <h2 className="mt-3 font-display text-2xl font-black text-gray-900 sm:text-3xl">
                Simple. Secure. Transparent.
              </h2>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Designed from the ground up to make democratic participation easy and trustworthy.
              </p>
            </Reveal>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: "Your Voice Matters",
                  body: "The committee represents every student for the whole academic year. Your vote decides who leads and shapes policy.",
                  gradient: "bg-gradient-to-r from-emerald-500 to-emerald-400",
                },
                {
                  icon: ShieldCheck,
                  title: "Fair & Binding Rules",
                  body: "One vote per position, per student. Votes are final once confirmed — no changes, no duplicates.",
                  gradient: "bg-gradient-to-r from-blue-500 to-blue-400",
                },
                {
                  icon: Sparkles,
                  title: "Done in 60 Seconds",
                  body: "Find your name, pick one candidate per position, confirm your ballot. Fast, intuitive, and mobile-friendly.",
                  gradient: "bg-gradient-to-r from-violet-500 to-violet-400",
                },
              ].map((f, i) => (
                <FeatureCard key={f.title} {...f} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            HOW TO VOTE — split layout
        ══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#f8faf9] py-16 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-emerald-300/8 blur-[100px]" />
          </div>

          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">

            {/* steps */}
            <div>
              <Reveal>
                <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
                  Step by step
                </span>
                <h2 className="mt-3 font-display text-2xl font-black text-gray-900 sm:text-3xl">
                  Vote in under a minute
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  No account needed. Just find your name and cast your vote.
                </p>
              </Reveal>

              <div className="mt-8 flex flex-col gap-4">
                {[
                  "Find your name on the official voter list",
                  "Browse candidates for each position",
                  "Select one candidate per position",
                  "Confirm your ballot — it's done!",
                ].map((label, i) => (
                  <Step key={label} number={i + 1} label={label} index={i} />
                ))}
              </div>

              <Reveal delay={360}>
                <Button asChild variant="hero" size="lg"
                  className="mt-8 gap-2 rounded-2xl shadow-[0_6px_24px_rgba(34,197,94,0.3)]">
                  <Link to="/vote">
                    Start voting <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Reveal>
            </div>

            {/* security card */}
            <Reveal delay={100}>
              <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-md">
                {/* top gradient bar */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_6px_20px_rgba(34,197,94,0.35)]">
                  <Lock className="h-7 w-7 text-white" />
                </div>

                <h3 className="mt-5 font-display text-xl font-black text-gray-900">
                  Your vote is private & secure
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Ballots are encrypted end-to-end. Only the final tally is published — your individual choice stays completely private.
                </p>

                <ul className="mt-6 space-y-3">
                  {[
                    "Duplicate votes are automatically rejected",
                    "Audit trail maintained by Supabase",
                    "Results announced publicly after voting closes",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      </span>
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            BOTTOM CTA
        ══════════════════════════════════════════════════════ */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal>
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-400 px-8 py-16 text-center shadow-[0_20px_80px_rgba(34,197,94,0.35)] sm:px-16">
                {/* dot grid */}
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]"
                  style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
                {/* glow */}
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,255,255,0.15),transparent)]" />
                {/* rings */}
                <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full border border-white/10" />
                <div aria-hidden className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full border border-white/10" />

                <div className="relative">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm">
                    <Star className="h-3 w-3" /> Your voice matters
                  </span>
                  <h2 className="mt-5 font-display text-3xl font-black text-white sm:text-5xl">
                    Ready to make your<br className="hidden sm:block" /> vote count?
                  </h2>
                  <p className="mx-auto mt-4 max-w-md text-sm text-white/80 sm:text-base">
                    Voting takes less than a minute. Find your name and cast your ballot before time runs out.
                  </p>
                  <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button asChild variant="gold" size="xl"
                      className="w-full gap-2 rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.2)] sm:w-auto">
                      <Link to="/vote">
                        <Vote className="h-4 w-4" /> Start voting now
                      </Link>
                    </Button>
                    <Button asChild size="xl"
                      className="w-full gap-2 rounded-2xl border border-white/25 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 sm:w-auto">
                      <Link to="/candidates">
                        View all candidates
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

      </main>

      <SiteFooter />

      {/* page-level keyframes */}
      <style>{`
        @keyframes home-fadein {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes home-float {
          0%, 100% { transform: translateY(0);    }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
