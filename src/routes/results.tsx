import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crown, Trophy } from "lucide-react";
import { Confetti } from "@/components/confetti";
import { Reveal } from "@/components/reveal";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Skeleton } from "@/components/ui/skeleton";
import { getTally } from "@/lib/election.functions";
import { candidatesQuery, positionsQuery, settingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Live results — Hikma Class Union Election 2026" },
      {
        name: "description",
        content:
          "Live vote counts, percentages and winning margins for every Hikma Class Union Committee position.",
      },
      { property: "og:title", content: "Election results — Hikma Vote" },
      {
        property: "og:description",
        content: "See who is leading each executive committee position in real time.",
      },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const tallyFn = useServerFn(getTally);
  const positions = useQuery(positionsQuery());
  const candidates = useQuery(candidatesQuery());
  const settings = useQuery(settingsQuery());
  const tally = useQuery({
    queryKey: ["tally"],
    queryFn: () => tallyFn({}),
    refetchInterval: 10000,
  });

  const closed = settings.data?.election_status !== "open";
  const loading = positions.isLoading || candidates.isLoading || tally.isLoading;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      {closed && !loading && <Confetti count={40} />}

      <main className="hero-surface">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6">
          <header className="animate-rise max-w-2xl">
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Trophy className="h-3.5 w-3.5" /> {closed ? "Final results" : "Live tally"}
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
              {closed ? "Election results" : "Results so far"}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {tally.data?.totalVotes ?? 0} votes cast by {tally.data?.votedStudents ?? 0} students.
              {closed ? "" : " Updating every 10 seconds."}
            </p>
          </header>

          {loading && (
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-3xl" />
              ))}
            </div>
          )}

          {!loading && (
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {(positions.data ?? []).map((position, pi) => {
                const list = (candidates.data ?? [])
                  .filter((c) => c.position_id === position.id && c.is_active)
                  .map((c) => ({ ...c, votes: tally.data?.perCandidate[c.id] ?? 0 }))
                  .sort((a, b) => b.votes - a.votes);
                const total = list.reduce((sum, c) => sum + c.votes, 0);
                const margin = list.length > 1 ? list[0].votes - list[1].votes : list[0]?.votes ?? 0;
                const hasWinner = total > 0 && list.length > 0;

                return (
                  <Reveal key={position.id} delay={pi * 80}>
                    <section className="lift glass h-full rounded-3xl p-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="font-display text-xl font-semibold">{position.title}</h2>
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                          {total} vote{total === 1 ? "" : "s"}
                        </span>
                      </div>

                      {!hasWinner ? (
                        <p className="mt-6 text-sm text-muted-foreground">
                          No votes recorded for this position yet.
                        </p>
                      ) : (
                        <>
                          <div className="mt-5 flex items-center gap-3 rounded-2xl gradient-gold px-4 py-3 text-gold-foreground">
                            <Crown className="h-5 w-5 shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate font-display font-semibold">{list[0].name}</p>
                              <p className="text-xs opacity-80">
                                Leading by {margin} vote{margin === 1 ? "" : "s"}
                              </p>
                            </div>
                          </div>

                          <ul className="mt-5 space-y-4">
                            {list.map((c) => {
                              const pct = total ? Math.round((c.votes / total) * 100) : 0;
                              return (
                                <li key={c.id}>
                                  <div className="flex items-baseline justify-between gap-3 text-sm">
                                    <span className="truncate font-medium">{c.name}</span>
                                    <span className="shrink-0 tabular-nums text-muted-foreground">
                                      {c.votes} · {pct}%
                                    </span>
                                  </div>
                                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className="h-full rounded-full gradient-primary transition-all duration-700"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </section>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
