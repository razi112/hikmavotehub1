import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, BarChart3, Crown, ImageIcon, LogOut, Medal, Plus, Trash2, Trophy, TrendingUp, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { adminLock } from "@/lib/admin-gate.functions";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getAdminOverview,
  removeCandidate,
  saveCandidate,
  saveSettings,
  toggleStudentBlock,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — Hikma Vote" },
      {
        name: "description",
        content: "Manage candidates, students, election status and live voting analytics.",
      },
      { property: "og:title", content: "Admin dashboard — Hikma Vote" },
      { property: "og:description", content: "Election committee control centre." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type CandidateForm = {
  id?: string;
  position_id: string;
  name: string;
  class: string;
  bio: string;
  image_url: string;
  is_active: boolean;
};

const emptyForm = (positionId = ""): CandidateForm => ({
  position_id: positionId,
  name: "",
  class: "",
  bio: "",
  image_url: "",
  is_active: true,
});

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const overviewFn = useServerFn(getAdminOverview);
  const saveCandidateFn = useServerFn(saveCandidate);
  const removeCandidateFn = useServerFn(removeCandidate);
  const saveSettingsFn = useServerFn(saveSettings);
  const toggleBlockFn = useServerFn(toggleStudentBlock);

  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => overviewFn({}),
    refetchInterval: (query) =>
      query.state.data?.settings?.election_status === "open" ? 3000 : false,
  });

  const [form, setForm] = useState<CandidateForm>(emptyForm());
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const data = overview.data;
  const positions = data?.positions ?? [];
  const candidates = data?.candidates ?? [];
  const students = data?.students ?? [];
  const votes = data?.votes ?? [];
  const settings = data?.settings;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-overview"] });

  async function submitCandidate() {
    if (!form.position_id || !form.name.trim()) {
      toast.error("Name and position are required");
      return;
    }
    setBusy(true);
    try {
      await saveCandidateFn({
        data: {
          id: form.id,
          position_id: form.position_id,
          name: form.name.trim(),
          class: form.class.trim() || null,
          bio: form.bio.trim() || null,
          image_url: form.image_url.trim() || null,
          is_active: form.is_active,
        },
      });
      toast.success(form.id ? "Candidate updated" : "Candidate added");
      setOpen(false);
      setForm(emptyForm(positions[0]?.id));
      invalidate();
      qc.invalidateQueries({ queryKey: ["candidates"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(next: "open" | "closed") {
    try {
      await saveSettingsFn({ data: { election_status: next } });
      toast.success(`Election ${next}`);
      invalidate();
      qc.invalidateQueries({ queryKey: ["settings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  const stats = [
    { label: "Total votes", value: votes.length },
    {
      label: "Students voted",
      value: new Set(votes.map((v) => v.student_id ?? (v as any).voter_token)).size,
    },
    { label: "Candidates", value: candidates.length },
    { label: "Registered students", value: students.length },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="hero-surface">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <h1 className="truncate font-display text-3xl font-bold sm:text-4xl">
                Admin dashboard
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Election is{" "}
                <strong className="text-foreground">{settings?.election_status ?? "—"}</strong>
              </p>
              {settings?.election_status === "open" && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                  Live vote counts
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/poster-generator">
                  <ImageIcon className="h-4 w-4" /> Poster generator
                </Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/results">
                  <Trophy className="h-4 w-4" /> Generate results
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await adminLock();
                  navigate({ to: "/auth" });
                }}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </div>
          </header>

          {overview.isLoading && <Skeleton className="mt-8 h-72 rounded-3xl" />}
          {overview.isError && (
            <div className="glass mt-8 rounded-3xl px-6 py-10 text-center text-sm text-destructive">
              {overview.error instanceof Error ? overview.error.message : "Access denied"}
            </div>
          )}

          {data && (
            <>
              <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="lift glass rounded-3xl p-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold text-gradient">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="glass mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl px-5 py-4">
                <div className="min-w-0">
                  <p className="font-display font-semibold">Voting status</p>
                  <p className="text-xs text-muted-foreground">
                    Turn voting off to freeze the ballot and publish final results.
                  </p>
                </div>
                <Switch
                  checked={settings?.election_status === "open"}
                  onCheckedChange={(v) => updateStatus(v ? "open" : "closed")}
                />
              </div>

              <Tabs defaultValue="candidates" className="mt-8">
                <TabsList className="glass rounded-full p-1">
                  <TabsTrigger value="candidates" className="rounded-full">
                    Candidates
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="rounded-full">
                    <BarChart3 className="mr-1.5 h-4 w-4" /> Analytics
                  </TabsTrigger>
                  <TabsTrigger value="results" className="rounded-full">
                    <Trophy className="mr-1.5 h-4 w-4" /> Results
                  </TabsTrigger>
                  <TabsTrigger value="students" className="rounded-full">
                    <Users className="mr-1.5 h-4 w-4" /> Students
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="candidates" className="mt-5">
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="hero"
                        onClick={() => setForm(emptyForm(positions[0]?.id))}
                      >
                        <Plus className="h-4 w-4" /> Add candidate
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="font-display">
                          {form.id ? "Edit candidate" : "New candidate"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="position">Position</Label>
                          <select
                            id="position"
                            value={form.position_id}
                            onChange={(e) => setForm({ ...form, position_id: e.target.value })}
                            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                          >
                            {positions.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="class">Class</Label>
                          <Input
                            id="class"
                            value={form.class}
                            onChange={(e) => setForm({ ...form, class: e.target.value })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="image">Photo URL</Label>
                          <Input
                            id="image"
                            value={form.image_url}
                            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Manifesto</Label>
                          <Textarea
                            id="bio"
                            rows={4}
                            value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="active">Visible on ballot</Label>
                          <Switch
                            id="active"
                            checked={form.is_active}
                            onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                          />
                        </div>
                        <Button
                          variant="hero"
                          size="lg"
                          className="w-full"
                          disabled={busy}
                          onClick={submitCandidate}
                        >
                          {busy ? "Saving…" : "Save candidate"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="mt-5 space-y-3">
                    {candidates.map((c) => {
                      const count = votes.filter((v) => v.candidate_id === c.id).length;
                      const position = positions.find((p) => p.id === c.position_id);
                      return (
                        <div
                          key={c.id}
                          className="glass grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{c.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {position?.title} · {count} vote{count === 1 ? "" : "s"}
                              {c.is_active ? "" : " · hidden"}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setForm({
                                  id: c.id,
                                  position_id: c.position_id,
                                  name: c.name,
                                  class: c.class ?? "",
                                  bio: c.bio ?? "",
                                  image_url: c.image_url ?? "",
                                  is_active: c.is_active,
                                });
                                setOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${c.name}`}
                              onClick={async () => {
                                try {
                                  await removeCandidateFn({ data: { id: c.id } });
                                  toast.success("Candidate removed");
                                  invalidate();
                                  qc.invalidateQueries({ queryKey: ["candidates"] });
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error ? err.message : "Delete failed",
                                  );
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-5">
                  <AnalyticsPanel
                    positions={positions}
                    candidates={candidates}
                    votes={votes}
                    students={students}
                    settings={settings ?? null}
                  />
                </TabsContent>

                <TabsContent value="results" className="mt-5">
                  <ElectionResultsPanel
                    positions={positions}
                    candidates={candidates}
                    votes={votes}
                  />
                </TabsContent>

                <TabsContent value="students" className="mt-5">
                  <div className="space-y-3">
                    {students.map((s) => {
                      const cast = votes.filter((v) => v.student_id === s.id).length;
                      return (
                        <div
                          key={s.id}
                          className="glass grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{s.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {s.admission_number} · {cast} vote{cast === 1 ? "" : "s"}
                              {s.is_blocked ? " · blocked" : ""}
                            </p>
                          </div>
                          <Switch
                            checked={!s.is_blocked}
                            aria-label={`Allow ${s.name} to vote`}
                            onCheckedChange={async (v) => {
                              try {
                                await toggleBlockFn({ data: { id: s.id, blocked: !v } });
                                invalidate();
                              } catch {
                                toast.error("Update failed");
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                    {students.length === 0 && (
                      <p className="text-sm text-muted-foreground">No students registered yet.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANALYTICS PANEL
═══════════════════════════════════════════════════════════ */

type AnalyticsProps = {
  positions: { id: string; title: string; display_order: number }[];
  candidates: {
    id: string;
    name: string;
    position_id: string;
    is_active: boolean;
    class?: string | null;
  }[];
  votes: { candidate_id: string; position_id: string; student_id: string | null }[];
  students: { id: string }[];
  settings: { election_status: string; end_time?: string } | null;
};

/* Circular turnout ring */
function TurnoutRing({
  voted,
  total,
}: {
  voted: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((voted / total) * 100) : 0;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="glass flex flex-col items-center justify-center rounded-3xl p-6 gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Voter Turnout
      </p>
      <div className="relative h-28 w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            className="stroke-primary transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-gradient">{pct}%</span>
        </div>
      </div>
      <div className="flex gap-6 text-center text-sm">
        <div>
          <p className="font-bold text-foreground">{voted}</p>
          <p className="text-xs text-muted-foreground">Voted</p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="font-bold text-foreground">{total - voted}</p>
          <p className="text-xs text-muted-foreground">Remaining</p>
        </div>
        <div className="w-px bg-border" />
        <div>
          <p className="font-bold text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>
    </div>
  );
}

/* Summary stat mini card */
function MiniStat({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className={`glass flex items-center gap-3 rounded-2xl p-4 ${accent ? "border border-primary/25 bg-primary/5" : ""}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

/* Per-position bar chart card */
function PositionChart({
  title,
  totalVotes,
  list,
}: {
  title: string;
  totalVotes: number;
  list: { id: string; name: string; count: number; pct: number; isLeader: boolean }[];
}) {
  return (
    <div className="glass rounded-3xl p-5">
      {/* header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3 mb-4">
        <h3 className="font-display font-semibold">{title}</h3>
      </div>

      {list.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No votes yet</p>
      ) : (
        <ul className="space-y-4">
          {list.map((c, i) => (
            <li key={c.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {/* rank badge */}
                  {i === 0 && totalVotes > 0 ? (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-400/20">
                      <Crown className="h-3 w-3 text-amber-500" />
                    </span>
                  ) : (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                  )}
                  <span className={`truncate text-sm font-medium ${c.isLeader && totalVotes > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                    {c.name}
                  </span>
                </div>
                <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{c.count} vote{c.count === 1 ? "" : "s"}</span>
                </span>
              </div>
              {/* bar */}
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    c.isLeader && totalVotes > 0
                      ? "gradient-primary"
                      : "bg-muted-foreground/30"
                  }`}
                  style={{ width: `${Math.min(c.pct, 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* Hourly vote timeline bar chart */
function VoteTimeline({
  votes,
}: {
  votes: { candidate_id: string; position_id: string; student_id: string | null }[];
}) {
  // Build hourly buckets from created_at if available; otherwise show by index
  const total = votes.length;
  if (total === 0) {
    return (
      <div className="glass flex items-center justify-center rounded-3xl p-8 text-sm text-muted-foreground">
        No votes cast yet — timeline will appear here.
      </div>
    );
  }

  // Group votes into 8 equal buckets to show distribution
  const buckets = 8;
  const bucketSize = Math.ceil(total / buckets);
  const counts = Array.from({ length: buckets }, (_, i) =>
    votes.slice(i * bucketSize, (i + 1) * bucketSize).length,
  );
  const max = Math.max(...counts, 1);

  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" />
          Vote Distribution
        </h3>
      </div>
      <div className="flex h-24 items-end gap-1.5">
        {counts.map((c, i) => {
          const heightPct = Math.round((c / max) * 100);
          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center gap-1">
              {/* tooltip */}
              {c > 0 && (
                <span className="pointer-events-none absolute -top-6 hidden rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background group-hover:block">
                  {c}
                </span>
              )}
              <div
                className="w-full rounded-t-md gradient-primary opacity-80 transition-all duration-700 group-hover:opacity-100"
                style={{ height: `${heightPct}%`, minHeight: c > 0 ? "4px" : "0" }}
              />
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Relative vote distribution across {buckets} equal segments
      </p>
    </div>
  );
}

/* Winner summary strip */
function WinnerStrip({
  positions,
  candidates,
  votes,
}: {
  positions: AnalyticsProps["positions"];
  candidates: AnalyticsProps["candidates"];
  votes: AnalyticsProps["votes"];
}) {
  const winners = positions.map((p) => {
    const list = candidates
      .filter((c) => c.position_id === p.id)
      .map((c) => ({ ...c, count: votes.filter((v) => v.candidate_id === c.id).length }))
      .sort((a, b) => b.count - a.count);
    const total = list.reduce((s, c) => s + c.count, 0);
    const top = list[0];
    const pct = total > 0 && top ? Math.round((top.count / total) * 1000) / 10 : 0;
    return { position: p.title, winner: top?.count > 0 ? top.name : null, pct };
  });

  const anyWinner = winners.some((w) => w.winner);
  if (!anyWinner) return null;

  return (
    <div className="glass rounded-3xl border border-amber-400/20 bg-amber-400/5 p-5">
      <h3 className="mb-3 flex items-center gap-2 font-display font-semibold text-amber-600">
        <Crown className="h-4 w-4" /> Current Leaders
      </h3>
      <div className="flex flex-wrap gap-3">
        {winners.map((w) =>
          w.winner ? (
            <div
              key={w.position}
              className="flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-background/80 px-4 py-2 text-sm"
            >
              <span className="text-xs text-muted-foreground">{w.position}</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
              <span className="font-semibold">{w.winner}</span>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

function AnalyticsPanel({ positions, candidates, votes, students, settings }: AnalyticsProps) {
  const totalStudents = students.length;
  const uniqueVoters = new Set(votes.map((v) => v.student_id ?? (v as any).voter_token)).size;
  const totalVotesCount = votes.length;
  const positionsWithVotes = positions.filter((p) =>
    votes.some((v) => v.position_id === p.id),
  ).length;

  const positionCharts = positions.map((p) => {
    const list = candidates
      .filter((c) => c.position_id === p.id)
      .map((c) => ({
        id: c.id,
        name: c.name,
        count: votes.filter((v) => v.candidate_id === c.id).length,
      }))
      .sort((a, b) => b.count - a.count);

    const total = list.reduce((s, c) => s + c.count, 0);
    const topCount = list[0]?.count ?? 0;

    return {
      id: p.id,
      title: p.title,
      totalVotes: total,
      list: list.map((c) => ({
        id: c.id,
        name: c.name,
        count: c.count,
        pct: total > 0 ? Math.round((c.count / total) * 1000) / 10 : 0,
        isLeader: total > 0 && topCount > 0 && c.count === topCount,
      })),
    };
  });

  return (
    <div className="flex flex-col gap-5">
      {/* ── summary row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Total votes cast" value={totalVotesCount} icon={BarChart3} accent />
        <MiniStat label="Unique voters" value={uniqueVoters} icon={Users} />
        <MiniStat label="Positions voted" value={`${positionsWithVotes}/${positions.length}`} icon={Trophy} />
        <MiniStat
          label="Election status"
          value={settings?.election_status === "open" ? "Live" : "Closed"}
          icon={Activity}
        />
      </div>

      {/* ── turnout ring + vote timeline ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <TurnoutRing voted={uniqueVoters} total={totalStudents} />
        <VoteTimeline votes={votes} />
      </div>

      {/* ── current leaders strip ── */}
      <WinnerStrip positions={positions} candidates={candidates} votes={votes} />

      {/* ── per-position charts ── */}
      <div className="grid gap-5 md:grid-cols-2">
        {positionCharts.map((p) => (
          <PositionChart
            key={p.id}
            title={p.title}
            totalVotes={p.totalVotes}
            list={p.list}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ELECTION RESULTS PANEL
   Live winner / loser breakdown per position.
   Derives everything from the votes array — nothing hardcoded.
═══════════════════════════════════════════════════════════ */

type ResultsProps = {
  positions: { id: string; title: string; display_order: number }[];
  candidates: {
    id: string;
    name: string;
    position_id: string;
    image_url?: string | null;
    class?: string | null;
    is_active: boolean;
  }[];
  votes: { candidate_id: string; position_id: string; student_id: string | null }[];
};

type CandidateResult = {
  id: string;
  name: string;
  image_url: string | null;
  class: string | null;
  votes: number;
  pct: number;
  isWinner: boolean;
  isTied: boolean;
};

type PositionResult = {
  id: string;
  title: string;
  totalVotes: number;
  hasTie: boolean;
  winner: CandidateResult | null;
  others: CandidateResult[];
};

/** Animated progress bar — fills from 0 on first render */
function ResultBar({ pct, winner }: { pct: number; winner: boolean }) {
  const [width, setWidth] = useState(0);
  // Trigger fill after mount so CSS transition plays
  useState(() => { setTimeout(() => setWidth(pct), 80); });

  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${winner ? "gradient-primary" : "bg-muted-foreground/30"}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/** Single candidate row used inside the loser list */
function LoserRow({ c }: { c: CandidateResult }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
      {/* avatar */}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
        {c.image_url ? (
          <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm font-black text-muted-foreground">
            {c.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
          {c.class && <span className="shrink-0 text-xs text-muted-foreground">{c.class}</span>}
          <span className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <XCircle className="h-3 w-3" /> Lost
          </span>
        </div>
        <ResultBar pct={c.pct} winner={false} />
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-base font-bold tabular-nums text-foreground">{c.votes}</p>
        <p className="text-[10px] text-muted-foreground">{c.pct}%</p>
      </div>
    </div>
  );
}

/** Full position result block — winner card + loser list */
function PositionResultCard({ result }: { result: PositionResult }) {
  const w = result.winner;

  return (
    <section className="glass overflow-hidden rounded-3xl">
      {/* ── header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-primary/5 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl gradient-primary text-primary-foreground">
            <Trophy className="h-4 w-4" />
          </span>
          <h3 className="font-display text-lg font-bold">{result.title}</h3>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="tabular-nums">
            {result.totalVotes} vote{result.totalVotes !== 1 ? "s" : ""}
          </span>
          {result.hasTie && (
            <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-600">
              Tie
            </span>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {result.totalVotes === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No votes recorded yet.</p>
        ) : (
          <div className="space-y-5">
            {/* ── winner card ── */}
            {w && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-primary/[0.05] p-5">
                {/* subtle spotlight */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(34,197,94,0.09) 0%, transparent 70%)",
                  }}
                />
                <div className="relative flex flex-wrap items-center gap-4">
                  {/* avatar */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-primary/50 shadow-[0_0_20px_rgba(34,197,94,0.25)]">
                    {w.image_url ? (
                      <img src={w.image_url} alt={w.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center gradient-primary font-display text-2xl font-black text-primary-foreground">
                        {w.name.charAt(0)}
                      </div>
                    )}
                    {/* gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                  </div>

                  {/* name + bar */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-xl font-black text-foreground">{w.name}</span>
                      {w.class && <span className="text-xs text-muted-foreground">{w.class}</span>}
                      <span className="inline-flex items-center gap-1 rounded-full gradient-primary px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-[0_0_10px_var(--primary)]">
                        <Crown className="h-3 w-3" />
                        {result.hasTie ? "Tied" : "Winner"}
                      </span>
                    </div>
                    <ResultBar pct={w.pct} winner />
                  </div>

                  {/* vote count */}
                  <div className="shrink-0 text-right">
                    <p className="font-display text-3xl font-black tabular-nums text-primary">{w.votes}</p>
                    <p className="text-xs text-muted-foreground">votes</p>
                    <p className="mt-0.5 text-xs font-mono text-primary/70">{w.pct}%</p>
                  </div>
                </div>

                {/* margin note */}
                {!result.hasTie && result.others.length > 0 && result.others[0].votes > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Winning margin:{" "}
                    <strong className="text-foreground">
                      +{w.votes - result.others[0].votes} vote{w.votes - result.others[0].votes !== 1 ? "s" : ""}
                    </strong>{" "}
                    over {result.others[0].name}
                  </p>
                )}
              </div>
            )}

            {/* ── losers ── */}
            {result.others.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Other candidates
                </p>
                <div className="space-y-2">
                  {result.others.map((c) => (
                    <LoserRow key={c.id} c={c} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ElectionResultsPanel({ positions, candidates, votes }: ResultsProps) {
  // Derive results purely from props — no hardcoding
  const positionResults: PositionResult[] = positions.map((p) => {
    const list = candidates
      .filter((c) => c.position_id === p.id)
      .map((c) => ({
        id: c.id,
        name: c.name,
        image_url: c.image_url ?? null,
        class: c.class ?? null,
        votes: votes.filter((v) => v.candidate_id === c.id).length,
        pct: 0,
        isWinner: false,
        isTied: false,
      }))
      .sort((a, b) => b.votes - a.votes);

    const total = list.reduce((s, c) => s + c.votes, 0);
    const topCount = list[0]?.votes ?? 0;
    const leaders = list.filter((c) => c.votes === topCount && topCount > 0);
    const hasTie = leaders.length > 1;

    const enriched: CandidateResult[] = list.map((c) => ({
      ...c,
      pct: total > 0 ? Math.round((c.votes / total) * 1000) / 10 : 0,
      isWinner: topCount > 0 && c.votes === topCount,
      isTied: hasTie && c.votes === topCount,
    }));

    // In a tie every top candidate is a "winner" — show the first as winner card,
    // rest in others (all marked tied). If no votes, winner is null.
    const winner = topCount > 0 ? enriched[0] : null;
    const others = topCount > 0 ? enriched.slice(1) : enriched;

    return {
      id: p.id,
      title: p.title,
      totalVotes: total,
      hasTie,
      winner,
      others,
    };
  });

  const totalVotes = votes.length;
  const anyVotes = totalVotes > 0;

  return (
    <div className="space-y-6">
      {/* summary banner */}
      <div className="glass flex flex-wrap items-center gap-4 rounded-3xl px-5 py-4">
        <Medal className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="font-display font-semibold">Election Results</p>
          <p className="text-xs text-muted-foreground">
            {anyVotes
              ? `Based on ${totalVotes} total vote${totalVotes !== 1 ? "s" : ""} — updates live every 3 seconds`
              : "No votes have been cast yet"}
          </p>
        </div>
        {anyVotes && (
          <div className="ml-auto flex flex-wrap gap-2">
            {positionResults.map((r) =>
              r.winner ? (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                >
                  <Crown className="h-3 w-3" />
                  {r.title}: {r.hasTie ? "Tie" : r.winner.name}
                </span>
              ) : null,
            )}
          </div>
        )}
      </div>

      {/* per-position cards */}
      {positionResults.map((result) => (
        <PositionResultCard key={result.id} result={result} />
      ))}
    </div>
  );
}
