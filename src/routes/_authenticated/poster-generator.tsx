import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Download, ImageIcon, RefreshCw, Trophy, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getGeneratedResults } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/poster-generator")({
  head: () => ({
    meta: [
      { title: "Winner poster generator — Hikma Vote" },
      {
        name: "description",
        content: "Create downloadable winner posters from the latest election vote counts.",
      },
      { property: "og:title", content: "Winner poster generator — Hikma Vote" },
      { property: "og:description", content: "Generate official winner posters for each position." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PosterGeneratorPage,
});

type ResultCandidate = {
  id: string;
  name: string;
  class: string | null;
  image_url: string | null;
  votes: number;
  percentage: number;
  isWinner: boolean;
};

type PositionResult = {
  positionId: string;
  title: string;
  totalVotes: number;
  tie: boolean;
  candidates: ResultCandidate[];
};

function PosterGeneratorPage() {
  const resultsFn = useServerFn(getGeneratedResults);
  const resultsQuery = useQuery({
    queryKey: ["generated-results", "poster-generator"],
    queryFn: () => resultsFn({}),
    refetchInterval: 3000,
  });
  const data = resultsQuery.data;
  const positions = (data?.results ?? []) as PositionResult[];
  const [selectedPositionId, setSelectedPositionId] = useState("");
  const [generatedPositionId, setGeneratedPositionId] = useState<string | null>(null);

  const selectedPosition = useMemo(
    () => positions.find((position) => position.positionId === (selectedPositionId || positions[0]?.positionId)),
    [positions, selectedPositionId],
  );
  const leaders = selectedPosition?.candidates.filter((candidate) => candidate.isWinner) ?? [];
  const hasWinner = leaders.length === 1 && !selectedPosition?.tie;
  const posterReady = generatedPositionId === selectedPosition?.positionId && hasWinner;

  function generatePoster() {
    if (!selectedPosition || !hasWinner) return;
    setGeneratedPositionId(selectedPosition.positionId);
    toast.success(`${leaders[0]?.name} poster is ready`);
  }

  function downloadPoster() {
    const winner = leaders[0];
    if (!selectedPosition || !winner || !data) return;

    const escapeXml = (value: string) =>
      value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const image = winner.image_url
      ? `<image href="${escapeXml(winner.image_url)}" x="150" y="260" width="600" height="750" preserveAspectRatio="xMidYMin slice" clip-path="url(#portrait)"/>`
      : `<circle cx="450" cy="660" r="280" fill="url(#gold)"/><text x="450" y="710" text-anchor="middle" font-family="Arial, sans-serif" font-size="200" font-weight="700" fill="#fff">${escapeXml(winner.name.charAt(0).toUpperCase())}</text>`;
    const logo = data.logoUrl
      ? `<image href="${escapeXml(data.logoUrl)}" x="90" y="90" width="96" height="96" preserveAspectRatio="xMidYMid meet"/>`
      : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0c3b2e"/><stop offset="1" stop-color="#176b4d"/></linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4d27b"/><stop offset="1" stop-color="#c58b27"/></linearGradient>
        <clipPath id="portrait"><circle cx="450" cy="660" r="280"/></clipPath>
      </defs>
      <rect width="900" height="1200" fill="url(#bg)"/>
      <circle cx="450" cy="660" r="300" fill="none" stroke="#f4d27b" stroke-width="10" opacity=".9"/>
      <circle cx="450" cy="660" r="316" fill="none" stroke="#f4d27b" stroke-width="2" opacity=".5"/>
      ${logo}
      <text x="810" y="132" text-anchor="end" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#f4d27b">${escapeXml(data.websiteName)}</text>
      <text x="450" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="7" fill="#f4d27b">WINNER</text>
      <text x="450" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" letter-spacing="4" fill="#fff">OFFICIAL ELECTION RESULT</text>
      ${image}
      <text x="450" y="1020" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#fff">${escapeXml(winner.name)}</text>
      <text x="450" y="1070" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="3" fill="#f4d27b">${escapeXml(selectedPosition.title.toUpperCase())}</text>
      <text x="450" y="1115" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#fff">${winner.votes} votes · ${winner.percentage}%</text>
      <text x="450" y="1160" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#d7eee4">Congratulations on this achievement</text>
    </svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedPosition.title.toLowerCase().replace(/\s+/g, "-")}-winner.svg`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Poster downloaded");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="hero-surface">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">← Dashboard</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => resultsQuery.refetch()} disabled={resultsQuery.isFetching}>
              <RefreshCw className={resultsQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh live results
            </Button>
          </div>

          <header className="mt-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-foreground">
              <ImageIcon className="h-3.5 w-3.5" /> Official result artwork
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold sm:text-5xl">Winner poster generator</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Choose a position to see the current leader from the stored votes and create an official poster.
              Results refresh automatically while the election is running.
            </p>
          </header>

          {resultsQuery.isLoading && <Skeleton className="mt-8 h-96 rounded-3xl" />}
          {resultsQuery.isError && (
            <div className="glass mt-8 rounded-3xl px-6 py-10 text-center text-sm text-destructive">
              {resultsQuery.error instanceof Error ? resultsQuery.error.message : "Could not load vote data"}
            </div>
          )}

          {data && (
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] lg:items-start">
              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select position</p>
                    <p className="mt-1 text-sm text-muted-foreground">Leaders are calculated from the latest database totals.</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"><span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Live</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {positions.map((position) => {
                    const positionLeaders = position.candidates.filter((candidate) => candidate.isWinner);
                    const isSelected = position.positionId === (selectedPositionId || positions[0]?.positionId);
                    return (
                      <Button
                        key={position.positionId}
                        variant={isSelected ? "hero" : "outline"}
                        className="h-auto min-h-28 justify-start rounded-2xl p-4 text-left"
                        onClick={() => { setSelectedPositionId(position.positionId); setGeneratedPositionId(null); }}
                      >
                        <span className="block min-w-0">
                          <span className="block text-xs uppercase tracking-wider opacity-75">{position.title}</span>
                          <span className="mt-2 block truncate text-base font-semibold">
                            {position.tie ? "Tie" : positionLeaders[0]?.name ?? "No votes yet"}
                          </span>
                          <span className="mt-1 block text-xs opacity-75">{position.totalVotes} total votes</span>
                        </span>
                      </Button>
                    );
                  })}
                </div>

                {selectedPosition && (
                  <div className="glass mt-6 rounded-3xl p-5 sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{selectedPosition.title}</p>
                        <h2 className="mt-1 font-display text-2xl font-bold">Automatic winner detection</h2>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {selectedPosition.totalVotes} votes cast
                      </span>
                    </div>

                    {selectedPosition.tie ? (
                      <div className="mt-6 rounded-2xl border border-gold/50 bg-gold/10 p-5">
                        <div className="flex items-start gap-3">
                          <X className="mt-0.5 h-5 w-5 shrink-0 text-gold-foreground" />
                          <div>
                            <p className="font-semibold">Tie — no automatic winner</p>
                            <p className="mt-1 text-sm text-muted-foreground">The following candidates share the highest vote count. Resolve the result according to the election rules.</p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {leaders.map((candidate) => <div key={candidate.id} className="rounded-xl bg-card/70 px-3 py-2 text-sm font-medium">{candidate.name} <span className="text-muted-foreground">· {candidate.votes} votes</span></div>)}
                        </div>
                      </div>
                    ) : hasWinner ? (
                      <div className="mt-6 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-accent">
                            {leaders[0].image_url ? <img src={leaders[0].image_url} alt={leaders[0].name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center font-display text-3xl font-bold text-primary">{leaders[0].name.charAt(0)}</div>}
                          </div>
                          <div className="min-w-0">
                            <span className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground"><Trophy className="h-3 w-3" /> Winner detected</span>
                            <h3 className="mt-2 truncate font-display text-xl font-bold">{leaders[0].name}</h3>
                            <p className="text-sm text-muted-foreground">{leaders[0].votes} votes · {leaders[0].percentage}% of this position</p>
                          </div>
                        </div>
                        <Button variant="hero" size="lg" className="mt-5 w-full sm:w-auto" onClick={generatePoster}>
                          <ImageIcon className="h-4 w-4" /> Generate winner poster
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">No votes have been recorded for this position yet. A poster will be available once a leader exists.</div>
                    )}

                    <div className="mt-6 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current vote breakdown</p>
                      {selectedPosition.candidates.map((candidate) => (
                        <div key={candidate.id} className="rounded-2xl border border-border bg-card/45 p-3">
                          <div className="flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2 truncate font-medium">{candidate.isWinner && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}{candidate.name}</span><span className="shrink-0 tabular-nums text-muted-foreground">{candidate.votes} · {candidate.percentage}%</span></div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={candidate.isWinner ? "h-full gradient-primary" : "h-full bg-muted-foreground/40"} style={{ width: `${candidate.percentage}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="lg:sticky lg:top-24">
                <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live preview</p><p className="mt-1 text-sm text-muted-foreground">{posterReady ? "Ready to download" : "Generate a poster to preview it"}</p></div>{posterReady && <Button variant="outline" size="sm" onClick={downloadPoster}><Download className="h-4 w-4" /> Download</Button>}</div>
                <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-lift">
                  {posterReady && selectedPosition ? <PosterPreview position={selectedPosition} winner={leaders[0]} websiteName={data.websiteName} logoUrl={data.logoUrl} generatedAt={data.generatedAt} /> : <div className="grid aspect-[4/5] place-items-center bg-muted/50 p-8 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><ImageIcon className="h-8 w-8" /></span><p className="mt-4 font-display text-lg font-semibold">Your poster preview will appear here</p><p className="mt-2 text-sm text-muted-foreground">The winner photo, name, position, vote total, percentage and organization branding will be included.</p></div></div>}
                </div>
                {posterReady && <Button variant="hero" size="lg" className="mt-4 w-full" onClick={downloadPoster}><Download className="h-4 w-4" /> Download winner poster</Button>}
              </section>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PosterPreview({ position, winner, websiteName, logoUrl, generatedAt }: { position: PositionResult; winner: ResultCandidate; websiteName: string; logoUrl: string | null; generatedAt: string }) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-foreground px-7 py-8 text-center text-primary-foreground sm:px-10 sm:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,color-mix(in_oklab,var(--gold)_24%,transparent),transparent_32%),linear-gradient(135deg,var(--ink),color-mix(in_oklab,var(--primary)_72%,var(--ink)))]" />
      <div className="relative flex h-full flex-col items-center">
        <div className="flex w-full items-center justify-between gap-3">
          {logoUrl ? <img src={logoUrl} alt="Organization logo" className="h-10 w-10 rounded-xl object-contain" /> : <span className="grid h-10 w-10 place-items-center rounded-xl gradient-gold text-gold-foreground"><Users className="h-5 w-5" /></span>}
          <span className="max-w-[65%] truncate text-xs font-semibold uppercase tracking-wider text-gold">{websiteName}</span>
        </div>
        <div className="mt-4 rounded-full border border-gold/50 bg-gold/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-gold">Winner</div>
        <div className="relative mt-4 w-[70%] max-w-[260px] aspect-square overflow-hidden rounded-full border-4 border-gold bg-accent shadow-glow">
          {winner.image_url ? <img src={winner.image_url} alt={winner.name} className="h-full w-full object-cover object-top" /> : <div className="grid h-full place-items-center font-display text-6xl font-bold text-primary">{winner.name.charAt(0)}</div>}
        </div>
        <p className="mt-4 font-display text-2xl font-bold sm:text-3xl">{winner.name}</p>
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-gold">{position.title}</p>
        <div className="mt-auto w-full border-t border-primary-foreground/20 pt-5"><p className="text-lg font-semibold">{winner.votes} votes · {winner.percentage}%</p><p className="mt-3 text-xs text-primary-foreground/70">Congratulations on this achievement</p><p className="mt-2 text-[10px] text-primary-foreground/50">Result announced {new Date(generatedAt).toLocaleDateString()}</p></div>
      </div>
    </div>
  );
}