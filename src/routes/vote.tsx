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

type Candidate = {
  id: string;
  name: string;
  class?: string | null;
  position_id: string;
  is_active: boolean;
};

type Position = {
  id: string;
  title: string;
};

function BallotPositions({
  positions,
  candidates,
  votedIds,
  selections,
  closed,
  onSelect,
}: {
  positions: Position[];
  candidates: Candidate[];
  votedIds: Set<string>;
  selections: Record<string, string>;
  closed: boolean;
  onSelect: (positionId: string, candidateId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (positions.length === 0) {
    return (
      <p className="mt-8 text-muted-foreground">
        No candidates have been announced yet. Please check back later.
      </p>
    );
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const container = e.currentTarget;
    const left = container.scrollLeft;
    const width = container.offsetWidth;
    const index = Math.round(left / (width * 0.85)) || 0;
    setActiveIndex(Math.min(index, positions.length - 1));
  }

  return (
    <section className="mt-8">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0"
      >
        {positions.map((p) => {
          const list = candidates.filter((c) => c.position_id === p.id && c.is_active);
          const done = votedIds.has(p.id);
          return (
            <PositionCard
              key={p.id}
              position={p}
              candidates={list}
              done={done}
              selectedId={selections[p.id]}
              closed={closed}
              onSelect={onSelect}
            />
          );
        })}
      </div>

      {/* Mobile pagination dots */}
      <div className="flex justify-center gap-2 md:hidden">
        {positions.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-label={`Go to ${p.title}`}
            onClick={() => {
              const container = scrollRef.current;
              if (!container) return;
              const cardWidth = container.offsetWidth * 0.85 + 16;
              container.scrollTo({ left: cardWidth * i, behavior: "smooth" });
            }}
            className={cn(
              "h-2 rounded-full transition-all duration-200",
              i === activeIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30",
            )}
          />
        ))}
      </div>
    </section>
  );
}

function PositionCard({
  position,
  candidates,
  done,
  selectedId,
  closed,
  onSelect,
}: {
  position: Position;
  candidates: Candidate[];
  done: boolean;
  selectedId?: string;
  closed: boolean;
  onSelect: (positionId: string, candidateId: string) => void;
}) {
  return (
    <div className="glass min-w-[85vw] snap-center rounded-3xl p-4 sm:min-w-[78vw] md:min-w-0 md:p-5">
      <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
        <h2 className="font-display text-lg font-semibold">{position.title}</h2>
        {done ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Lock className="h-3.5 w-3.5" /> Locked
          </span>
        ) : selectedId ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" /> Selected
          </span>
        ) : null}
      </div>

      {done ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="mt-4 text-sm font-medium">Vote locked</p>
          <p className="text-xs text-muted-foreground">Your vote for {position.title} is secure.</p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {candidates.map((c) => {
            const active = selectedId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                disabled={closed}
                onClick={() => onSelect(position.id, c.id)}
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
                    <span className="block truncate text-xs opacity-70">{c.class}</span>
                  )}
                </span>
                {active && <CheckCircle2 className="h-5 w-5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SubmitBar({
  openPositions,
  allSelected,
  closed,
  busy,
  onSubmit,
}: {
  openPositions: Position[];
  allSelected: boolean;
  closed: boolean;
  busy: boolean;
  onSubmit: () => void;
}) {
  if (openPositions.length === 0) {
    return (
      <div className="glass mt-8 flex items-center justify-center gap-3 rounded-3xl p-5 text-sm text-muted-foreground">
        <CheckCircle2 className="h-5 w-5 text-primary" />
        You have voted for every position. Thank you!
      </div>
    );
  }

  const selectedCount = openPositions.filter((p) => p.id in {}).length;
  const remaining = openPositions.length - selectedCount;

  return (
    <div className="glass fixed inset-x-0 bottom-0 z-40 flex flex-col gap-3 border-t border-border/50 p-4 sm:static sm:mt-8 sm:rounded-3xl sm:border-0 sm:p-5">
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Vote className="h-4 w-4 text-primary" />
          {selectedCount} / {openPositions.length} selected
        </span>
        <span className="text-xs text-muted-foreground sm:ml-auto">
          {remaining === 0
            ? "Ready to submit"
            : `${remaining} position${remaining === 1 ? "" : "s"} left`}
        </span>
      </div>
      <Button
        variant="hero"
        size="lg"
        disabled={!allSelected || closed || busy}
        onClick={onSubmit}
        className="w-full sm:w-auto"
      >
        {busy ? "Submitting…" : "Submit votes"}
      </Button>
    </div>
  );
}

function selectedCountFromProps(openPositions: Position[], selections: Record<string, string>) {
  return openPositions.filter((p) => selections[p.id]).length;
}
