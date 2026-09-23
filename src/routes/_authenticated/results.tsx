import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { ResultReveal, RevealStyles } from "@/components/result-reveal";
import type { RevealData } from "@/components/result-reveal";
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

  const q = useQuery({
    queryKey: ["generated-results"],
    queryFn: () => resultsFn({}),
    // Don't auto-fetch on mount — the reveal system triggers it manually via refetch()
    enabled: false,
  });

  return (
    <>
      {/* inject reveal keyframes once */}
      <RevealStyles />

      <div className="min-h-screen bg-white">
        <SiteHeader />

        {/* back nav — always visible */}
        <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
          </Button>
        </div>

        <main>
          <ResultReveal
            data={q.data as RevealData | undefined}
            isLoading={q.isFetching}
            isError={q.isError}
            errorMessage={
              q.error instanceof Error ? q.error.message : "Could not generate results"
            }
            onRegenerate={() => q.refetch()}
          />
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
