import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, Sparkles, Users } from "lucide-react";
import heroImage from "@/assets/hero-vote.jpg";
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

function Home() {
  const settings = useQuery(settingsQuery());
  const positions = useQuery(positionsQuery());
  const candidates = useQuery(candidatesQuery());

  const stats = [
    { label: "Positions", value: positions.data?.length ?? "—" },
    { label: "Candidates", value: candidates.data?.filter((c) => c.is_active).length ?? "—" },
    {
      label: "Status",
      value: settings.data?.election_status === "open" ? "Voting open" : "Voting closed",
    },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="hero-surface relative overflow-hidden">
          <div
            aria-hidden
            className="animate-float pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden
            className="animate-float pointer-events-none absolute -right-16 top-40 h-80 w-80 rounded-full bg-gold/20 blur-3xl"
            style={{ animationDelay: "3s" }}
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:pb-28 lg:pt-20">
            <div className="animate-rise">
              <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Every Vote Matters
              </span>
              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
                Hikma Class Union Committee{" "}
                <span className="text-gradient">Election 2026</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Choose your leaders with confidence. Every vote shapes the future of our class.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="hero" size="xl" className="w-full sm:w-auto">
                  <Link to="/vote">
                    Vote Now <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="xl" className="w-full sm:w-auto">
                  <Link to="/candidates">View Candidates</Link>
                </Button>
              </div>

              <dl className="mt-10 grid grid-cols-3 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="glass rounded-2xl px-3 py-4 text-center">
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </dt>
                    <dd className="mt-1 font-display text-sm font-semibold sm:text-base">
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="animate-rise" style={{ animationDelay: "150ms" }}>
              <div className="glass overflow-hidden rounded-[2rem] p-2 shadow-lift">
                <img
                  src={heroImage}
                  alt="Emerald glass ballot box with a golden ballot slip"
                  width={1200}
                  height={912}
                  className="w-full rounded-[1.6rem] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Voting closes in</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cast your ballot before the countdown reaches zero.
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-8">
            <Countdown endTime={settings.data?.end_time} />
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
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
              <Reveal key={f.title} delay={i * 120}>
                <div className="lift glass h-full rounded-3xl p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-soft">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <div className="glass relative overflow-hidden rounded-[2rem] px-6 py-12 text-center shadow-soft sm:px-12">
              <div
                aria-hidden
                className="animate-float pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/25 blur-3xl"
              />
              <h2 className="relative font-display text-2xl font-bold sm:text-3xl">
                Ready to make your voice count?
              </h2>
              <p className="relative mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
                Voting takes less than a minute. Just find your name on the voter list.
              </p>
              <Button asChild variant="gold" size="xl" className="relative mt-7 w-full sm:w-auto">
                <Link to="/vote">Start voting</Link>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
