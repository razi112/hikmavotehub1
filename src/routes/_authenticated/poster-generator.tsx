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

  async function downloadPoster() {
    const winner = leaders[0];
    if (!selectedPosition || !winner || !data) return;

    const W = 900;
    const H = 1200;

    // ── helpers ─────────────────────────────────────────────────────────────
    /**
     * Load an image for canvas drawing.
     * First tries crossOrigin="anonymous" (works when the server sends CORS headers).
     * If that fails (CORS denied), falls back to fetching through a data-URL so the
     * canvas doesn't get tainted.  As a last resort the image is skipped (null).
     */
    function loadCrossOriginImg(src: string): Promise<HTMLImageElement | null> {
      return new Promise((resolve) => {
        // Attempt 1 — native crossOrigin request
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => {
          // Attempt 2 — fetch as blob → object URL (works when CORS is allowed on fetch)
          fetch(src, { mode: "cors", cache: "force-cache" })
            .then(async (res) => {
              if (!res.ok) return resolve(null);
              const blob = await res.blob();
              const objectUrl = URL.createObjectURL(blob);
              const img2 = new Image();
              img2.onload = () => { URL.revokeObjectURL(objectUrl); resolve(img2); };
              img2.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
              img2.src = objectUrl;
            })
            .catch(() => resolve(null));
        };
        // Add cache-busting only on retry to avoid stale no-CORS cached response
        img.src = src;
      });
    }

    /** Rounded rectangle helper */
    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }

    toast.loading("Generating PNG…", { id: "dl" });

    try {
      // ── resolve images ───────────────────────────────────────────────────
      const rawUrl = winner.image_url ?? "";
      const hashIdx = rawUrl.indexOf("#offset=");
      const cleanPhotoUrl = hashIdx !== -1 ? rawUrl.slice(0, hashIdx) : rawUrl;
      const offsetPct = hashIdx !== -1 ? parseInt(rawUrl.slice(hashIdx + 8), 10) : 0;

      const [photoImg, logoImg] = await Promise.all([
        cleanPhotoUrl ? loadCrossOriginImg(cleanPhotoUrl) : Promise.resolve(null),
        data.logoUrl ? loadCrossOriginImg(data.logoUrl) : Promise.resolve(null),
      ]);

      // ── canvas setup ─────────────────────────────────────────────────────
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#050e09");
      bg.addColorStop(1, "#020805");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const PHOTO_H = Math.round(H * 0.68);

      // ── photo area ───────────────────────────────────────────────────────
      ctx.save();
      ctx.rect(0, 0, W, PHOTO_H);
      ctx.clip();
      if (photoImg) {
        const imgAspect = photoImg.width / photoImg.height;
        const areaAspect = W / PHOTO_H;
        let drawW: number, drawH: number, drawX: number, drawY: number;
        if (imgAspect > areaAspect) {
          drawH = PHOTO_H; drawW = drawH * imgAspect;
          drawX = (W - drawW) / 2; drawY = -((PHOTO_H * offsetPct) / 100);
        } else {
          drawW = W; drawH = drawW / imgAspect;
          drawX = 0;
          const maxShift = drawH - PHOTO_H;
          drawY = -((maxShift * offsetPct) / 100);
        }
        ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
      } else {
        const fbg = ctx.createLinearGradient(0, 0, W, PHOTO_H);
        fbg.addColorStop(0, "#0d3b22"); fbg.addColorStop(1, "#061a0f");
        ctx.fillStyle = fbg; ctx.fillRect(0, 0, W, PHOTO_H);
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.font = "900 300px Arial,sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(winner.name.charAt(0).toUpperCase(), W / 2, PHOTO_H / 2);
      }
      ctx.restore();

      // multi-stop photo fade
      const fade = ctx.createLinearGradient(0, PHOTO_H * 0.3, 0, PHOTO_H + 20);
      fade.addColorStop(0, "rgba(5,14,9,0)");
      fade.addColorStop(0.55, "rgba(5,14,9,0.55)");
      fade.addColorStop(1, "rgba(5,14,9,1)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, PHOTO_H + 20);

      // info panel bg
      ctx.fillStyle = "#050e09";
      ctx.fillRect(0, PHOTO_H, W, H - PHOTO_H);

      // top-left org badge pill
      ctx.save();
      roundRect(ctx, 36, 36, 220, 44, 22);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = "700 13px Arial,sans-serif";
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(data.websiteName.toUpperCase(), 56, 58);
      ctx.restore();

      // top-right election year pill
      ctx.save();
      roundRect(ctx, W - 210, 36, 174, 38, 19);
      ctx.fillStyle = "rgba(244,210,123,0.15)";
      ctx.fill();
      ctx.strokeStyle = "rgba(244,210,123,0.3)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "#f4d27b";
      ctx.font = "700 12px Arial,sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("", W - 123, 55);
      ctx.restore();

      const INFO_Y = PHOTO_H + 20;

      // winner gold badge
      ctx.save();
      const bw = 160, bh = 36, bx = 50, by = INFO_Y;
      roundRect(ctx, bx, by, bw, bh, 18);
      const goldGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
      goldGrad.addColorStop(0, "#f4d27b"); goldGrad.addColorStop(1, "#e8b84b");
      ctx.fillStyle = goldGrad; ctx.fill();
      ctx.fillStyle = "#3a2800";
      ctx.font = "900 13px Arial,sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("✦ WINNER", bx + bw / 2, by + bh / 2);
      ctx.restore();

      // name
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 64px Arial,sans-serif";
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      // wrap long names
      const nameWords = winner.name.split(" ");
      const line1 = nameWords.slice(0, Math.ceil(nameWords.length / 2)).join(" ");
      const line2 = nameWords.slice(Math.ceil(nameWords.length / 2)).join(" ");
      if (line2) {
        ctx.fillText(line1, 50, INFO_Y + 105);
        ctx.fillText(line2, 50, INFO_Y + 175);
      } else {
        ctx.font = "900 56px Arial,sans-serif";
        ctx.fillText(winner.name, 50, INFO_Y + 130);
      }

      // position title
      ctx.fillStyle = "#4ade80";
      ctx.font = "600 20px Arial,sans-serif";
      ctx.textAlign = "left";
      const nameEndY = line2 ? INFO_Y + 200 : INFO_Y + 155;
      ctx.fillText(selectedPosition.title.toUpperCase(), 50, nameEndY);

      // divider
      ctx.beginPath();
      ctx.moveTo(50, nameEndY + 24);
      ctx.lineTo(W - 50, nameEndY + 24);
      ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1; ctx.stroke();

      const STATS_Y = nameEndY + 50;

      // votes + percentage stat boxes
      ctx.save();
      roundRect(ctx, 50, STATS_Y, 340, 90, 16);
      ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "600 11px Arial,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("VOTES", 170, STATS_Y + 28);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 40px Arial,sans-serif";
      ctx.fillText(String(winner.votes), 170, STATS_Y + 72);

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "600 11px Arial,sans-serif";
      ctx.fillText("SHARE", 290, STATS_Y + 28);
      ctx.fillStyle = "#4ade80";
      ctx.font = "900 40px Arial,sans-serif";
      ctx.fillText(`${winner.percentage}%`, 290, STATS_Y + 72);

      // congrats + date footer
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.font = "400 16px Arial,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Congratulations on this achievement", W / 2, H - 40);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "400 13px Arial,sans-serif";
      ctx.fillText(new Date(data.generatedAt).toLocaleDateString(), W / 2, H - 20);

      // ── export ───────────────────────────────────────────────────────────
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${selectedPosition.title.toLowerCase().replace(/\s+/g, "-")}-winner.png`;
      link.click();

      toast.success("PNG downloaded", { id: "dl" });
    } catch (err) {
      console.error(err);
      toast.error("Download failed — check console for details", { id: "dl" });
    }
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
                          {leaders.map((candidate) => <div key={candidate.id} className="rounded-xl bg-card/70 px-3 py-2 text-sm font-medium">{candidate.name}</div>)}
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
                            <p className="text-sm text-muted-foreground">{leaders[0].votes} vote{leaders[0].votes === 1 ? "" : "s"}</p>
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
                          <div className="flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2 truncate font-medium">{candidate.isWinner && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}{candidate.name}</span><span className="shrink-0 tabular-nums text-muted-foreground">{candidate.votes} vote{candidate.votes === 1 ? "" : "s"}</span></div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={candidate.isWinner ? "h-full gradient-primary" : "h-full bg-muted-foreground/40"} style={{ width: `${Math.min(candidate.percentage, 100)}%` }} /></div>
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
  const rawUrl = winner.image_url ?? "";
  const hashIdx = rawUrl.indexOf("#offset=");
  const cleanUrl = hashIdx !== -1 ? rawUrl.slice(0, hashIdx) : rawUrl;
  const offsetPct = hashIdx !== -1 ? parseInt(rawUrl.slice(hashIdx + 8), 10) : 0;
  const objPosition = `center ${offsetPct}%`;

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-[#050e09] text-white select-none">

      {/* ── full-bleed photo — top 68% ── */}
      <div className="absolute inset-x-0 top-0 h-[68%]">
        {cleanUrl ? (
          <img src={cleanUrl} alt={winner.name} className="h-full w-full object-cover" style={{ objectPosition: objPosition }} />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-emerald-900 to-emerald-950 grid place-items-center">
            <span className="font-black text-[9rem] text-white/10">{winner.name.charAt(0)}</span>
          </div>
        )}
        {/* multi-stop fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050e09] via-[#050e09]/30 to-transparent" style={{ background: 'linear-gradient(to top, #050e09 0%, rgba(5,14,9,0.55) 40%, transparent 70%)' }} />
        {/* top-left org badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5">
          {logoUrl
            ? <img src={logoUrl} alt="" className="h-5 w-5 rounded-full object-contain" />
            : <div className="h-4 w-4 rounded-full bg-emerald-500/60" />
          }
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70">{websiteName}</span>
        </div>
        {/* top-right election year chip */}
        <div className="absolute top-4 right-4 rounded-full bg-[#f4d27b]/15 border border-[#f4d27b]/30 px-3 py-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#f4d27b]">Election 2026</span>
        </div>
      </div>

      {/* ── info card — bottom 36% ── */}
      <div className="absolute inset-x-0 bottom-0 h-[36%] flex flex-col px-5 pt-3 pb-4 gap-2">

        {/* winner crown badge */}
        <div className="flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-[#f4d27b] to-[#e8b84b] px-3 py-1 shadow-[0_2px_12px_rgba(244,210,123,0.4)]">
          <svg className="h-3 w-3 text-[#3a2800]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z"/>
          </svg>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#3a2800]">Winner</span>
        </div>

        {/* name + position */}
        <div className="flex-1 min-h-0">
          <p className="font-black leading-[1.1] text-white" style={{ fontSize: 'clamp(1.1rem, 4.5cqw, 1.5rem)' }}>
            {winner.name}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
            {position.title}
          </p>
        </div>

        {/* stats row */}
        <div className="flex items-center gap-2">
          {/* votes pill */}
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.07] border border-white/[0.08] backdrop-blur-sm px-3 py-2 flex-1">
            <div className="flex flex-col">
              <span className="text-[8px] font-semibold uppercase tracking-widest text-white/40">Votes</span>
              <span className="text-lg font-black text-white tabular-nums leading-none">{winner.votes}</span>
            </div>
            <div className="ml-auto h-8 w-[2px] rounded-full bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-semibold uppercase tracking-widest text-white/40">Share</span>
              <span className="text-lg font-black text-emerald-400 tabular-nums leading-none">{winner.percentage}%</span>
            </div>
          </div>

          {/* decorative ring */}
          <div className="relative h-12 w-12 shrink-0">
            <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="#22c55e" strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(winner.percentage / 100) * (2 * Math.PI * 20)} ${2 * Math.PI * 20}`}
                style={{ filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.7))' }} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white">{winner.percentage}%</span>
          </div>
        </div>

        {/* footer line */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.07]">
          <span className="text-[8px] text-white/25 tracking-wider">Congratulations on this achievement</span>
          <span className="text-[8px] text-white/25">{new Date(generatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* decorative corner accent */}
      <div className="pointer-events-none absolute bottom-[35%] right-4 h-16 w-16 rounded-full border border-emerald-500/20 blur-[1px]" />
      <div className="pointer-events-none absolute bottom-[36%] right-8 h-8 w-8 rounded-full border border-[#f4d27b]/15" />
    </div>
  );
}