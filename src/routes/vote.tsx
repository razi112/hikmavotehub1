import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { CandidateCard } from "@/components/candidate-card";
import { Confetti } from "@/components/confetti";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { castVote, getVoters, studentLoginById, studentRefresh } from "@/lib/election.functions";
import { candidatesQuery, positionsQuery, settingsQuery } from "@/lib/queries";
import { useStudentSession } from "@/lib/student-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vote")({
  head: () => ({
    meta: [
      { title: "Cast your vote — Hikma Vote" },
      {
        name: "description",
        content:
          "Select your name from the voter list and cast one secure vote for each executive committee position.",
      },
      { property: "og:title", content: "Cast your vote — Hikma Vote" },
      {
        property: "og:description",
        content: "Three simple steps: choose a position, select a candidate, confirm.",
      },
    ],
  }),
  component: VotePage,
});

function VotePage() {
  const { session, ready, save } = useStudentSession();
  const settings = useQuery(settingsQuery());
  const positions = useQuery(positionsQuery());
  const candidates = useQuery(candidatesQuery());

  const login = useServerFn(studentLoginById);
  const loadVoters = useServerFn(getVoters);
  const voters = useQuery({ queryKey: ["voters"], queryFn: () => loadVoters({}) });
  const refresh = useServerFn(studentRefresh);
  const vote = useServerFn(castVote);

  const [voterSearch, setVoterSearch] = useState("");
  const [selectedVoter, setSelectedVoter] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!session) return;
    refresh({ data: { studentId: session.studentId } })
      .then((fresh) => save(fresh))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.studentId]);


  const filteredVoters = useMemo(() => {
    const list = voters.data ?? [];
    const q = voterSearch.trim().toLowerCase();
    return q
      ? list.filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            (v.positionTitle ?? "").toLowerCase().includes(q),
        )
      : list;
  }, [voters.data, voterSearch]);

  const voterSections = useMemo(() => {
    const order = (positions.data ?? []).map((p) => p.title);
    const groups = new Map<string, typeof filteredVoters>();
    for (const v of filteredVoters) {
      const key = v.positionTitle ?? "Other";
      const arr = groups.get(key) ?? [];
      arr.push(v);
      groups.set(key, arr);
    }
    return Array.from(groups.entries()).sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [filteredVoters, positions.data]);


  const voted = useMemo(() => new Set(session?.votedPositionIds ?? []), [session]);
  const closed = settings.data ? settings.data.election_status !== "open" : false;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (!selectedVoter) return;
      const result = await login({ data: { studentId: selectedVoter } });
      save(result);
      toast.success(`Welcome, ${result.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  function hasCandidates(positionId: string) {
    return (candidates.data ?? []).some((c) => c.position_id === positionId && c.is_active);
  }

  const openPositions = useMemo(
    () => (positions.data ?? []).filter((p) => !voted.has(p.id) && hasCandidates(p.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positions.data, candidates.data, voted],
  );

  const allSelected =
    openPositions.length > 0 && openPositions.every((p) => !!selections[p.id]);

  async function confirmVote() {
    if (!session || !allSelected) return;
    setBusy(true);
    try {
      let votedIds = session.votedPositionIds;
      for (const p of openPositions) {
        const result = await vote({
          data: { studentId: session.studentId, candidateId: selections[p.id] },
        });
        votedIds = result.votedPositionIds;
      }
      save({ ...session, votedPositionIds: votedIds });
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

  const allDone =
    !!positions.data?.length && positions.data.every((p) => voted.has(p.id) || !hasCandidates(p.id));


  return (
    <div className="min-h-screen">
      <SiteHeader />
      {celebrate && <Confetti />}

      <main className="hero-surface">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6">
          <header className="animate-rise max-w-2xl">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Cast your vote</h1>
            <p className="mt-3 text-muted-foreground">
              One vote per position. Your choice is final once confirmed.
            </p>
          </header>

          {!ready && <Skeleton className="mt-8 h-64 rounded-3xl" />}

          {ready && !session && (
            <form
              onSubmit={handleLogin}
              className="glass animate-rise mt-8 max-w-md rounded-3xl p-6 shadow-soft sm:p-8"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold">Student sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Find and select your name from the voter list.
              </p>
              <div className="mt-5 space-y-3">
                <Input
                  value={voterSearch}
                  onChange={(e) => setVoterSearch(e.target.value)}
                  placeholder="Search your name…"
                  autoComplete="off"
                  className="h-12 rounded-xl text-base"
                />
                <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-2xl border border-border/60 p-2">
                  {voters.isLoading && <Skeleton className="h-12 rounded-xl" />}
                  {!voters.isLoading && filteredVoters.length === 0 && (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No matching voter found.
                    </p>
                  )}
                  {voterSections.map(([title, list]) => (
                    <div key={title} className="pt-1">
                      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {title}
                      </p>
                      <div className="space-y-1.5">
                        {list.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVoter(v.id)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all duration-200",
                              v.id === selectedVoter
                                ? "gradient-primary text-primary-foreground shadow-soft"
                                : "hover:bg-muted/60",
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{v.name}</span>
                              {v.className && (
                                <span className="block truncate text-xs opacity-70">
                                  {v.className}
                                </span>
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}



                </div>
              </div>
              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="mt-5 w-full"
                disabled={busy || !selectedVoter}
              >
                {busy ? "Checking…" : "Continue"}
              </Button>
            </form>
          )}

          {ready && session && (
            <>
              <div className="glass mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-3xl px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold">{session.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session.className ? `${session.className} · ` : ""}
                    {voted.size} of {positions.data?.length ?? 0} positions voted
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => save(null)}>
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </div>

              {closed && (
                <div className="glass mt-4 rounded-2xl border-destructive/30 px-5 py-4 text-sm text-destructive">
                  Voting is currently closed by the election committee.
                </div>
              )}

              {allDone && (
                <div className="glass animate-pop mt-6 rounded-3xl px-6 py-10 text-center">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
                  <h2 className="mt-4 font-display text-2xl font-bold">Thank you for voting!</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You have completed every available position.
                  </p>
                </div>
              )}

              <section className="mt-8 space-y-10">
                {(positions.data ?? []).map((p) => {
                  const list = (candidates.data ?? []).filter(
                    (c) => c.position_id === p.id && c.is_active,
                  );
                  return (
                    <div key={p.id}>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-display text-xl font-semibold">{p.title}</h2>
                        {voted.has(p.id) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Voted
                          </span>
                        )}
                      </div>

                      {voted.has(p.id) ? (
                        <div className="glass mt-4 rounded-3xl px-6 py-8 text-center">
                          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
                          <p className="mt-3 font-medium">Your vote for {p.title} is locked in.</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Votes cannot be changed after submission.
                          </p>
                        </div>
                      ) : list.length === 0 ? (
                        <div className="glass mt-4 rounded-3xl px-6 py-8 text-center text-sm text-muted-foreground">
                          No candidates have been announced for this position yet.
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                          {list.map((c) => (
                            <CandidateCard
                              key={c.id}
                              candidate={c}
                              positionTitle={p.title}
                              disabled={closed}
                              disabledLabel="Voting closed"
                              onVote={() =>
                                setPending({ id: c.id, name: c.name, position: p.title })
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            </>
          )}
        </div>
      </main>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Confirm your vote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to vote for <strong>{pending?.name}</strong> as{" "}
              {pending?.position}? This action cannot be undone.
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
