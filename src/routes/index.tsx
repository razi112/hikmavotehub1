import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Vote,
  ChevronDown,
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

/* ── tiny helper: animated number chip ── */
function StatChip({
  value,
  label,
  accent = false,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl px-5 py-4 min-w-[90px] ${
        accent
          ? "gradient-gold text-[oklch(0.28_0.07_70)]"
          : "glass text-foreground"
      }`}
    >
      <span className="font-display text-2xl font-bold leading-none">{value}</span>
      <span className="mt-1 text-[11px] font-medium uppercase tracking-widest opacity-70">
        {label}
      </span>
    </div>
  );
}

/* ── feature card ── */
function FeatureCard({
  icon: Icon,
  title,
  body,
  index,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  index: number;
}) {
  return (
    <Reveal delay={index * 110}>
      <div className="lift glass group relative h-full overflow-hidden rounded-3xl border border-border/60 p-7 transition-all duration-300 hover:border-primary/40">
        {/* top accent line on hover */}
        <div className="absolute inset-x-0 top-0 h-[2px] scale-x-0 rounded-t-3xl bg-gradient-to-r from-primary to-[oklch(0.75_0.16_155)] transition-transform duration-300 group-hover:scale-x-100" />

        <span className="inline-grid h-12 w-12 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-soft">
          <Icon className="h-5 w-5" />
        </span>

        <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </Reveal>
  );
}

/* ── step badge ── */
function Step({
  number,
  label,
  index,
}: {
  number: number;
  label: string;
  index: number;
}) {
  return (
    <Reveal delay={index * 100}>
      <div className="flex items-center gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full gradient-primary font-display text-sm font-bold text-primary-foreground shadow-soft">
          {number}
        </span>
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
    </Reveal>
  );
}

function Home() {
  const settings = useQuery(settingsQuery());
  const positions = useQuery(positionsQuery());
  const candidates = useQuery(candidatesQuery());

  const isOpen = settings.data?.election_status === "open";
  const positionCount = positions.data?.length ?? "—";
  const candidateCount = candidates.data?.filter((c) => c.is_active).length ?? "—";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="flex flex-col gap-0">
        {/* ══════════════════════════════════════
            HERO — two-column split
        ══════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-background">
          {/* background mesh */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 10% -10%, oklch(0.75 0.16 155 / 0.22) 0%, transparent 60%),
                radial-gradient(ellipse 60% 50% at 95% 10%, oklch(0.786 0.153 78.3 / 0.18) 0%, transparent 55%)
              `,
            }}
          />

          <div className="relative mx-auto grid max-w-6xl items-stretch gap-0 px-4 sm:px-6 lg:grid-cols-2">
            {/* LEFT: text */}
            <div className="flex flex-col justify-center py-20 lg:py-28 lg:pr-14">
              {/* eyebrow pill */}
              <div className="animate-rise mb-6 flex items-center gap-2 self-start rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                  {isOpen ? "Voting is open" : "Election 2026"}
                </span>
              </div>

              {/* headline */}
              <h1
                className="animate-rise font-display text-[clamp(2.2rem,5vw,3.6rem)] font-bold leading-[1.08] tracking-tight"
                style={{ animationDelay: "60ms" }}
              >
                Elect Your{" "}
                <span className="relative whitespace-nowrap">
                  <span className="text-gradient">Leaders.</span>
                  {/* underline squiggle */}
                  <svg
                    aria-hidden
                    className="absolute -bottom-1 left-0 w-full"
                    viewBox="0 0 200 8"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 6 C30 2, 60 6, 100 4 S170 2, 198 5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="text-primary/40"
                    />
                  </svg>
                </span>
                <br />
                Shape Your Future.
              </h1>

              <p
                className="animate-rise mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
                style={{ animationDelay: "120ms" }}
              >
                Secure, one-vote-per-position balloting for the Hikma Class Union Committee Election 2026. Every vote counts.
              </p>

              {/* CTA buttons */}
              <div
                className="animate-rise mt-8 flex flex-wrap gap-3"
                style={{ animationDelay: "180ms" }}
              >
                <Button asChild variant="hero" size="xl">
                  <Link to="/vote" className="gap-2">
                    <Vote className="h-4 w-4" />
                    Vote Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="xl">
                  <Link to="/candidates">View Candidates</Link>
                </Button>
              </div>

              {/* trust row */}
              <div
                className="animate-rise mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
                style={{ animationDelay: "240ms" }}
              >
                {[
                  "One vote per position",
                  "Fully encrypted",
                  "Results announced live",
                ].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT: visual panel */}
            <div
              className="animate-rise relative hidden lg:flex lg:items-center lg:justify-center"
              style={{ animationDelay: "200ms" }}
            >
              {/* tall emerald strip */}
              <div className="absolute right-0 top-0 h-full w-1/2 rounded-bl-[4rem] gradient-primary opacity-[0.07]" />

              {/* floating stat chips */}
              <div className="relative flex flex-col items-center gap-5">
                {/* big circle badge */}
                <div className="relative flex h-56 w-56 flex-col items-center justify-center rounded-full border-4 border-primary/20 bg-primary/6 shadow-[0_0_60px_-10px_oklch(0.629_0.169_148.9/0.35)]">
                  <Vote className="mb-2 h-10 w-10 text-primary" />
                  <span className="font-display text-lg font-bold">Election</span>
                  <span className="font-display text-3xl font-extrabold text-gradient">2026</span>
                </div>

                {/* floating chips around */}
                <div className="absolute -left-16 top-6">
                  <StatChip value={positionCount} label="Positions" />
                </div>
                <div className="absolute -right-14 top-12">
                  <StatChip value={candidateCount} label="Candidates" accent />
                </div>
                <div className="absolute -left-14 bottom-4">
                  <StatChip
                    value={isOpen ? "Open" : "Closed"}
                    label="Status"
                  />
                </div>
                <div className="absolute -right-12 bottom-2">
                  <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">Live Countdown</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* mobile stats row */}
          <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-3 px-4 pb-10 sm:px-6 lg:hidden">
            <StatChip value={positionCount} label="Positions" />
            <StatChip value={candidateCount} label="Candidates" accent />
            <StatChip value={isOpen ? "Open" : "Closed"} label="Status" />
          </div>

          {/* scroll hint */}
          <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 animate-bounce lg:block">
            <ChevronDown className="h-5 w-5 text-muted-foreground/50" />
          </div>
        </section>

        {/* ══════════════════════════════════════
            COUNTDOWN
        ══════════════════════════════════════ */}
        <section className="relative overflow-hidden py-16 sm:py-20">
          {/* subtle wave divider top */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background to-transparent"
          />
          {/* section bg */}
          <div className="absolute inset-0 -z-10 bg-[oklch(0.968_0.007_247.896)]" />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="mx-auto max-w-xl text-center">
              <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                Deadline
              </span>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Voting closes in
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Cast your ballot before the countdown reaches zero.
              </p>
            </Reveal>

            <Reveal delay={120} className="mt-10">
              <Countdown endTime={settings.data?.end_time} />
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════
            FEATURES — 3 cards
        ══════════════════════════════════════ */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="mb-10 flex flex-col items-center gap-2 text-center">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                How it works
              </span>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Simple. Secure. Transparent.
              </h2>
            </Reveal>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: "Why it matters",
                  body: "The committee represents every student for the whole academic year. Your voice decides who leads.",
                },
                {
                  icon: ShieldCheck,
                  title: "Election rules",
                  body: "One vote per position, per student. Votes are final once confirmed and cannot be changed.",
                },
                {
                  icon: Sparkles,
                  title: "How it works",
                  body: "Select your name from the voter list, pick a candidate for each position, and confirm your vote.",
                },
              ].map((f, i) => (
                <FeatureCard key={f.title} {...f} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            HOW TO VOTE — steps strip
        ══════════════════════════════════════ */}
        <section className="relative overflow-hidden py-14 sm:py-16">
          <div className="absolute inset-0 -z-10 bg-[oklch(0.968_0.007_247.896)]" />

          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
            {/* left: steps */}
            <div className="flex flex-col gap-6">
              <Reveal>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                  Step by step
                </span>
                <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                  Vote in under a minute
                </h2>
              </Reveal>

              <div className="flex flex-col gap-4 mt-2">
                {[
                  "Find your name on the official voter list",
                  "Browse candidates for each position",
                  "Select one candidate per position",
                  "Confirm your ballot — done!",
                ].map((label, i) => (
                  <Step key={label} number={i + 1} label={label} index={i} />
                ))}
              </div>

              <Reveal delay={400}>
                <Button asChild variant="hero" size="lg" className="mt-2 self-start">
                  <Link to="/vote" className="gap-2">
                    Start voting <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Reveal>
            </div>

            {/* right: decorative card */}
            <Reveal delay={100}>
              <div className="glass relative overflow-hidden rounded-[2rem] border border-border/60 p-8 shadow-lift">
                {/* glow blob */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-[oklch(0.786_0.153_78.3/0.18)] blur-3xl"
                />

                <div className="relative flex flex-col gap-5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-soft">
                    <ShieldCheck className="h-6 w-6 text-primary-foreground" />
                  </span>
                  <h3 className="font-display text-xl font-bold">
                    Your vote is private & secure
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Ballots are encrypted end-to-end. Only the final tally is published — your individual choice stays completely private.
                  </p>

                  <ul className="flex flex-col gap-2 pt-1">
                    {[
                      "Duplicate votes are automatically rejected",
                      "Audit trail maintained by Supabase",
                      "Results announced publicly after voting closes",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════
            BOTTOM CTA BANNER
        ══════════════════════════════════════ */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal>
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-[oklch(0.75_0.16_155)] px-8 py-14 text-center text-primary-foreground shadow-lift sm:px-14">
                {/* decorative rings */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full border-2 border-white/10"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-12 -right-12 h-56 w-56 rounded-full border-2 border-white/10"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-0 h-full w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,_oklch(1_0_0/0.08)_0%,_transparent_70%)]"
                />

                <div className="relative">
                  <span className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.15em]">
                    Your voice matters
                  </span>
                  <h2 className="font-display text-2xl font-extrabold sm:text-4xl">
                    Ready to make your vote count?
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm text-primary-foreground/80 sm:text-base">
                    Voting takes less than a minute. Find your name and cast your ballot before time runs out.
                  </p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button
                      asChild
                      variant="gold"
                      size="xl"
                      className="w-full sm:w-auto"
                    >
                      <Link to="/vote" className="gap-2">
                        <Vote className="h-4 w-4" />
                        Start voting now
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="xl"
                      className="w-full border border-white/25 bg-white/10 text-primary-foreground hover:bg-white/20 sm:w-auto"
                    >
                      <Link to="/candidates">View all candidates</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
