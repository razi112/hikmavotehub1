import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { CheckCircle2, Lock, Vote } from "lucide-react";
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
  const fetchVoted = useServerFn(getMyVotedPositions);
  const voted = useQuery({
    queryKey: ["my-voted-positions"],
    queryFn: () => fetchVoted({}),
  });

  const [busy, setBusy] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const closed = settings.data ? settings.data.election_status !== "open" : false;
  const votedIds = useMemo(() => new Set(voted.data ?? []), [voted.data]);

  function hasCandidates(positionId: string) {
    return (candidates.data ?? []).some((c) => c.position_id === positionId && c.is_active);
  }

  const votingPositions = useMemo(
    () => (positions.data ?? []).filter((p) => hasCandidates(p.id)),
    [positions.data, candidates.data],
  );

  const openPositions = useMemo(
    () => votingPositions.filter((p) => !votedIds.has(p.id)),
    [votingPositions, votedIds],
  );

  const allSelected =
    openPositions.length > 0 && openPositions.every((p) => !!selections[p.id]);

  async function confirmVote() {
    if (!allSelected) return;
    setBusy(true);
    try {
      for (const p of openPositions) {
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
      void voted.refetch();
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

              <BallotPositions
                positions={votingPositions}
                candidates={candidates.data ?? []}
                votedIds={votedIds}
                selections={selections}
                closed={closed}
                onSelect={(positionId, candidateId) =>
                  setSelections((s) => ({ ...s, [positionId]: candidateId }))
                }
              />

              <SubmitBar
                openPositions={openPositions}
                allSelected={allSelected}
                closed={closed}
                busy={busy}
                onSubmit={() => setConfirmOpen(true)}
              />
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
              {openPositions
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
