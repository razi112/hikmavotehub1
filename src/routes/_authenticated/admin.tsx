import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, BarChart3, LogOut, Plus, Trash2, Trophy, Users } from "lucide-react";
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
    { label: "Students voted", value: new Set(votes.map((v) => v.student_id)).size },
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
                  <div className="grid gap-5 md:grid-cols-2">
                    {positions.map((p) => {
                      const list = candidates
                        .filter((c) => c.position_id === p.id)
                        .map((c) => ({
                          ...c,
                          count: votes.filter((v) => v.candidate_id === c.id).length,
                        }))
                        .sort((a, b) => b.count - a.count);
                      const total = list.reduce((s, c) => s + c.count, 0);
                      return (
                        <div key={p.id} className="glass rounded-3xl p-5">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="font-display font-semibold">{p.title}</h3>
                            <span className="text-xs text-muted-foreground">{total} votes</span>
                          </div>
                          <ul className="mt-4 space-y-3">
                            {list.map((c) => {
                              const pct = total ? Math.round((c.count / total) * 100) : 0;
                              return (
                                <li key={c.id}>
                                  <div className="flex justify-between text-sm">
                                    <span className="truncate">{c.name}</span>
                                    <span className="tabular-nums text-muted-foreground">
                                      {c.count} · {pct}%
                                    </span>
                                  </div>
                                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className="h-full gradient-primary transition-all duration-700"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
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
