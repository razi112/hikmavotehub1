import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Crown, RefreshCw, Trophy } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getGeneratedResults } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/results")({
  head: () => ({
    meta: [
      { title: "Final results — Hikma Vote" },
      {
        name: "description",
        content: "Generated election results with winners, vote counts and turnout.",
      },
      { property: "og:title", content: "Final results — Hikma Vote" },
      { property: "og:description", content: "Winners and vote counts for every position." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const resultsFn = useServerFn(getGeneratedResults);
  const q = useQuery({ queryKey: ["generated-results"], queryFn: () => resultsFn({}) });

  const data = q.data;

  const stats = data
    ? [
        { label: "Total voters", value: data.totals.totalVoters },
        { label: "Votes received", value: data.totals.totalVotes },
        { label: "Voters who voted", value: data.totals.votedCount },
        { label: "Did not vote", value: data.totals.notVotedCount },
      ]
    : [];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="hero-surface">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4" /> Dashboard
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => q.refetch()}
              disabled={q.isFetching}
            >
              <RefreshCw className={q.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              {q.isFetching ? "Generating…" : "Regenerate"}
            </Button>
          </div>

          <header className="mt-6 text-center">
            <span className="inline-grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-soft">
              <Trophy className="h-7 w-7" />
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Election results</h1>
            {data && (
              <p className="mt-2 text-sm text-muted-foreground">
                Generated {new Date(data.generatedAt).toLocaleString()} · Voting is{" "}
                <strong className="text-foreground">{data.electionStatus}</strong> · Turnout{" "}
                {data.totals.turnout}%
              </p>
            )}
          </header>

          {q.isLoading && <Skeleton className="mt-8 h-72 rounded-3xl" />}
          {q.isError && (
            <div className="glass mt-8 rounded-3xl px-6 py-10 text-center text-sm text-destructive">
              {q.error instanceof Error ? q.error.message : "Could not generate results"}
            </div>
          )}

          {data && (
            <>
              <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="lift glass rounded-3xl p-5 text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold text-gradient">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-6">
                {data.results.map((r) => (
                  <section key={r.positionId} className="glass rounded-3xl p-5 sm:p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="font-display text-xl font-bold">{r.title}</h2>
                      <span className="text-xs text-muted-foreground">
                        {r.totalVotes} vote{r.totalVotes === 1 ? "" : "s"}
                        {r.tie ? " · tie" : ""}
                      </span>
                    </div>

                    <ul className="mt-5 space-y-4">
                      {r.candidates.map((c) => (
                        <li
                          key={c.id}
                          className={
                            c.isWinner
                              ? "rounded-2xl border-2 border-primary/60 bg-primary/5 p-4"
                              : "rounded-2xl border border-border p-4"
                          }
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              {c.isWinner && (
                                <Crown className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                              )}
                              <span className="truncate font-medium">{c.name}</span>
                              {c.isWinner && (
                                <span className="rounded-full gradient-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                                  {r.tie ? "Tied lead" : "Winner"}
                                </span>
                              )}
                            </div>
                            <span className="tabular-nums text-sm text-muted-foreground">
                              {c.votes} · {c.percentage}%
                            </span>
                          </div>
                          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={
                                c.isWinner
                                  ? "h-full gradient-primary transition-all duration-700"
                                  : "h-full bg-muted-foreground/40 transition-all duration-700"
                              }
                              style={{ width: `${c.percentage}%` }}
                            />
                          </div>
                        </li>
                      ))}
                      {r.candidates.length === 0 && (
                        <li className="text-sm text-muted-foreground">No candidates.</li>
                      )}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
