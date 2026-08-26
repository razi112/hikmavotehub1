import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Confetti } from "@/components/confetti";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { castVote, getMyVotedPositions } from "@/lib/election.functions";
import { candidatesQuery, positionsQuery, settingsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vote")({
  head: () => ({
    meta: [
      { title: "Cast your vote — Hikma Vote" },
      {
        name: "description",
        content:
          "Cast your vote for President, Secretary and Treasurer in the Hikma Class Union Committee election.",
      },
      { property: "og:title", content: "Cast your vote — Hikma Vote" },
      {
        property: "og:description",
        content:
          "Select one candidate for each position and submit your ballot.",
      },
    ],
  }),
  component: VotePage,
});

function VotePage() {
  const settings = useQuery(settingsQuery());
  const positions = useQuery(positionsQuery());
  const candidates = useQuery(candidatesQuery());
  const vote = useServerFn(castVote);

  const [busy, setBusy] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const closed = settings.data ? settings.data.election_status !== "open" : false;

  function hasCandidates(positionId: string) {
    return (candidates.data ?? []).some((c) => c.position_id === positionId && c.is_active);
  }

  const votingPositions = useMemo(
    () => (positions.data ?? []).filter((p) => hasCandidates(p.id)),
    [positions.data, candidates.data],
  );

  const allSelected =
    votingPositions.length > 0 && votingPositions.every((p) => !!selections[p.id]);

  async function confirmVote() {
    if (!allSelected) return;
    setBusy(true);
    try {
      for (const p of votingPositions) {
        await vote({ data: { candidateId: selections[p.id] } });
      }
      setSelections({});
      setConfirmOpen(false);
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 4200);
      toast.success("Votes submitted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Vote failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      {celebrate && <Confetti />}

      <main className="hero-surface">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6">
          <header className="animate-rise max-w-2xl">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Cast your vote</h1>
            <p className="mt-3 text-muted-foreground">
              One vote per position. Select one candidate for every position to submit.
            </p>
          </header>

          {positions.isLoading || candidates.isLoading || settings.isLoading ? (
            <Skeleton className="mt-8 h-64 rounded-3xl" />
          ) : (
            <>
              {closed && (
                <div className="glass mt-8 rounded-2xl border-destructive/30 px-5 py-4 text-sm text-destructive">
                  Voting is currently closed by the election committee.
                </div>
              )}

              <section className="mt-8 space-y-6">
                {votingPositions.length === 0 && (
                  <p className="text-muted-foreground">
                    No candidates have been announced yet. Please check back later.
                  </p>
                )}

                {votingPositions.map((p) => {
                  const list = (candidates.data ?? []).filter(
                    (c) => c.position_id === p.id && c.is_active,
                  );
                  return (
                    <div key={p.id} className="glass rounded-3xl p-5">
                      <h2 className="font-display text-lg font-semibold">{p.title}</h2>

                      <div className="mt-4 space-y-2">
                        {list.map((c) => {
                          const active = selections[p.id] === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              disabled={closed}
                              onClick={() => setSelections((s) => ({ ...s, [p.id]: c.id }))}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 disabled:opacity-60",
                                active
                                  ? "border-transparent gradient-primary text-primary-foreground shadow-soft"
                                  : "border-border/60 hover:bg-muted/60",
                              )}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{c.name}</span>
                                {c.class && (
                                  <span className="block truncate text-xs opacity-70">
                                    {c.class}
                                  </span>
                                )}
                              </span>
                              {active && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </section>

              {votingPositions.length > 0 && (
                <div className="glass sticky bottom-4 mt-8 flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {votingPositions.filter((p) => selections[p.id]).length} of{" "}
                    {votingPositions.length} positions selected. Select one candidate for every
                    position to submit.
                  </p>
                  <Button
                    variant="hero"
                    size="lg"
                    disabled={!allSelected || closed || busy}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Submit votes
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !o && setConfirmOpen(false)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Confirm your votes</AlertDialogTitle>
            <AlertDialogDescription>
              You are voting for{" "}
              {votingPositions
                .map((p) => {
                  const c = (candidates.data ?? []).find((x) => x.id === selections[p.id]);
                  return `${c?.name ?? ""} (${p.title})`;
                })
                .join(", ")}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmVote();
              }}
              disabled={busy}
              className="rounded-full gradient-primary text-primary-foreground"
            >
              {busy ? "Submitting…" : "Confirm vote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SiteFooter />
    </div>
  );
}
