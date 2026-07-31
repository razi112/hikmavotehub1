import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CandidateCard } from "@/components/candidate-card";
import { Reveal } from "@/components/reveal";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Skeleton } from "@/components/ui/skeleton";
import { candidatesQuery, positionsQuery } from "@/lib/queries";

export const Route = createFileRoute("/candidates")({
  head: () => ({
    meta: [
      { title: "Candidates — Hikma Class Union Election 2026" },
      {
        name: "description",
        content:
          "Meet every candidate standing for President, Secretary and Treasurer.",
      },
      { property: "og:title", content: "Meet the candidates — Hikma Vote" },
      {
        property: "og:description",
        content: "Browse candidates by position before you cast your vote.",
      },
    ],
  }),
  component: CandidatesPage,
});

function CandidatesPage() {
  const positions = useQuery(positionsQuery());
  const candidates = useQuery(candidatesQuery());
  const loading = positions.isLoading || candidates.isLoading;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="hero-surface">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6">
          <header className="animate-rise max-w-2xl">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">The candidates</h1>
            <p className="mt-3 text-muted-foreground">
              Three executive positions. Read each manifesto, then head to the voting page.
            </p>
          </header>

          {loading && (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-3xl" />
              ))}
            </div>
          )}

          {!loading &&
            (positions.data ?? []).map((position, pi) => {
              const list = (candidates.data ?? []).filter(
                (c) => c.position_id === position.id && c.is_active,
              );
              return (
                <section key={position.id} className="mt-12">
                  <Reveal delay={pi * 60}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="font-display text-2xl font-semibold">{position.title}</h2>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        {list.length} candidate{list.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </Reveal>

                  {list.length === 0 ? (
                    <Reveal delay={pi * 60 + 60}>
                      <div className="glass mt-4 rounded-3xl px-6 py-10 text-center text-sm text-muted-foreground">
                        Candidates for this position will be announced soon.
                      </div>
                    </Reveal>
                  ) : (
                    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((c, i) => (
                        <Reveal key={c.id} delay={i * 80}>
                          <CandidateCard candidate={c} positionTitle={position.title} />
                        </Reveal>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
