import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Download, ImageIcon, RefreshCw, Trophy, X } from "lucide-react";
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

    // Photo fills top 62% (0–744px of 1200px height) with object-top alignment
    const photoH = 744;
    const image = winner.image_url
      ? `<image href="${escapeXml(winner.image_url)}" x="0" y="0" width="900" height="${photoH}" preserveAspectRatio="xMidYMin slice" clip-path="url(#photo)"/>`
      : `<rect x="0" y="0" width="900" height="${photoH}" fill="#134d38"/><text x="450" y="420" text-anchor="middle" font-family="Arial,sans-serif" font-size="320" font-weight="900" fill="#ffffff22">${escapeXml(winner.name.charAt(0).toUpperCase())}</text>`;
    const logo = data.logoUrl
      ? `<image href="${escapeXml(data.logoUrl)}" x="50" y="1110" width="60" height="60" preserveAspectRatio="xMidYMid meet" opacity="0.6"/>`
      : "";

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
  <defs>
    <linearGradient id="bgBot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0c3b2e"/>
      <stop offset="1" stop-color="#061f18"/>
    </linearGradient>
    <linearGradient id="fadeUp" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0c3b2e" stop-opacity="0"/>
      <stop offset="1" stop-color="#0c3b2e" stop-opacity="1"/>
    </linearGradient>
    <clipPath id="photo"><rect x="0" y="0" width="900" height="${photoH}" rx="0"/></clipPath>
  </defs>

  <!-- background -->
  <rect width="900" height="1200" fill="url(#bgBot)"/>

  <!-- full-bleed photo -->
  ${image}

  <!-- gradient fade from photo into info panel -->
  <rect x="0" y="${photoH - 180}" width="900" height="220" fill="url(#fadeUp)"/>

  <!-- info panel bg -->
  <rect x="0" y="${photoH}" width="900" height="${1200 - photoH}" fill="#0c3b2e"/>

  <!-- winner badge -->
  <rect x="300" y="762" width="300" height="44" rx="22" fill="none" stroke="#f4d27b" stroke-width="1.5" opacity="0.7"/>
  <text x="450" y="790" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700" letter-spacing="5" fill="#f4d27b">WINNER</text>

  <!-- name -->
  <text x="450" y="880" text-anchor="middle" font-family="Arial,sans-serif" font-size="58" font-weight="900" fill="#ffffff">${escapeXml(winner.name)}</text>

  <!-- position -->
  <text x="450" y="930" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="#f4d27b">${escapeXml(selectedPosition.title.toUpperCase())}</text>

  <!-- divider -->
  <line x1="200" y1="965" x2="700" y2="965" stroke="#ffffff" stroke-width="1" opacity="0.15"/>

  <!-- votes strip -->
  <rect x="250" y="985" width="400" height="60" rx="16" fill="#ffffff" fill-opacity="0.07"/>
  <text x="450" y="1024" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="#ffffff">${winner.votes} votes · ${winner.percentage}%</text>

  <!-- congrats -->
  <text x="450" y="1095" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#d7eee4" opacity="0.7">Congratulations on this achievement</text>

  <!-- footer -->
  ${logo}
  <text x="450" y="1155" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="600" letter-spacing="3" fill="#ffffff" opacity="0.35">${escapeXml(data.websiteName.toUpperCase())}</text>
  <text x="850" y="1155" text-anchor="end" font-family="Arial,sans-serif" font-size="14" fill="#ffffff" opacity="0.25">${new Date(data.generatedAt).toLocaleDateString()}</text>
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
    <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-[#0c3b2e] text-white shadow-lift">

      {/* ── full-bleed photo top 62% ── */}
      <div className="absolute inset-x-0 top-0 h-[62%]">
        {winner.image_url ? (
          <img
            src={winner.image_url}
            alt={winner.name}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="grid h-full place-items-center bg-primary/20">
            <span className="font-display text-[8rem] font-black text-white/30">
              {winner.name.charAt(0)}
            </span>
          </div>
        )}
        {/* gradient fade into bottom panel */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0c3b2e] to-transparent" />
      </div>

      {/* ── bottom info panel ── */}
      <div className="absolute inset-x-0 bottom-0 h-[42%] flex flex-col items-center justify-between px-6 pb-5 pt-4">
        {/* winner badge */}
        <div className="flex items-center gap-2 rounded-full border border-[#f4d27b]/60 bg-[#f4d27b]/10 px-4 py-1.5">
          <svg className="h-3.5 w-3.5 text-[#f4d27b]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z"/>
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f4d27b]">Winner</span>
        </div>

        {/* name */}
        <div className="text-center">
          <p className="font-display text-xl font-black leading-tight sm:text-2xl">{winner.name}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4d27b]">{position.title}</p>
        </div>

        {/* votes strip */}
        <div className="w-full rounded-xl bg-white/8 px-4 py-2 text-center backdrop-blur-sm">
          <p className="text-sm font-bold">{winner.votes} votes &nbsp;·&nbsp; {winner.percentage}%</p>
        </div>

        {/* footer */}
        <div className="flex w-full items-center justify-between">
          {logoUrl
            ? <img src={logoUrl} alt="logo" className="h-6 w-6 rounded object-contain opacity-70" />
            : <span className="text-[10px] text-white/40">🏫</span>
          }
          <span className="text-[9px] font-semibold uppercase tracking-widest text-white/40">{websiteName}</span>
          <span className="text-[9px] text-white/30">{new Date(generatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}