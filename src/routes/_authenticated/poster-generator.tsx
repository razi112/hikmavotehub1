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
    const PHOTO_H = 744;

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

      // background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0c3b2e");
      bg.addColorStop(1, "#061f18");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── photo area ───────────────────────────────────────────────────────
      ctx.save();
      ctx.rect(0, 0, W, PHOTO_H);
      ctx.clip();
      if (photoImg) {
        // Cover-fit with vertical offset
        const imgAspect = photoImg.width / photoImg.height;
        const areaAspect = W / PHOTO_H;
        let drawW: number, drawH: number, drawX: number, drawY: number;
        if (imgAspect > areaAspect) {
          // image wider than area — fit height, centre horizontally
          drawH = PHOTO_H;
          drawW = drawH * imgAspect;
          drawX = (W - drawW) / 2;
          drawY = -((PHOTO_H * offsetPct) / 100);
        } else {
          // image taller than area — fit width, shift by offset
          drawW = W;
          drawH = drawW / imgAspect;
          drawX = 0;
          const maxShift = drawH - PHOTO_H;
          drawY = -((maxShift * offsetPct) / 100);
        }
        ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
      } else {
        // fallback initials block
        ctx.fillStyle = "#134d38";
        ctx.fillRect(0, 0, W, PHOTO_H);
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.font = "900 320px Arial,sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(winner.name.charAt(0).toUpperCase(), W / 2, PHOTO_H / 2);
      }
      ctx.restore();

      // gradient fade from photo into panel
      const fade = ctx.createLinearGradient(0, PHOTO_H - 180, 0, PHOTO_H + 40);
      fade.addColorStop(0, "rgba(12,59,46,0)");
      fade.addColorStop(1, "rgba(12,59,46,1)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, PHOTO_H - 180, W, 220);

      // info panel
      ctx.fillStyle = "#0c3b2e";
      ctx.fillRect(0, PHOTO_H, W, H - PHOTO_H);

      // ── winner badge ─────────────────────────────────────────────────────
      ctx.save();
      roundRect(ctx, 300, 762, 300, 44, 22);
      ctx.strokeStyle = "rgba(244,210,123,0.7)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#f4d27b";
      ctx.font = "700 16px Arial,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = "5px";
      ctx.fillText("WINNER", W / 2, 784);
      ctx.letterSpacing = "0px";
      ctx.restore();

      // name
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 58px Arial,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(winner.name, W / 2, 880);

      // position title
      ctx.fillStyle = "#f4d27b";
      ctx.font = "700 22px Arial,sans-serif";
      ctx.fillText(selectedPosition.title.toUpperCase(), W / 2, 930);

      // divider
      ctx.beginPath();
      ctx.moveTo(200, 965);
      ctx.lineTo(700, 965);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // vote strip background
      ctx.save();
      roundRect(ctx, 250, 985, 400, 80, 16);
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fill();
      ctx.restore();

      // vote strip labels
      ctx.fillStyle = "rgba(215,238,228,0.6)";
      ctx.font = "600 13px Arial,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("VOTES", W / 2, 1018);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 32px Arial,sans-serif";
      ctx.fillText(String(winner.votes), W / 2, 1052);

      // congrats line
      ctx.fillStyle = "rgba(215,238,228,0.7)";
      ctx.font = "400 18px Arial,sans-serif";
      ctx.fillText("Congratulations on this achievement", W / 2, 1095);

      // ── logo ─────────────────────────────────────────────────────────────
      if (logoImg) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.drawImage(logoImg, 50, 1110, 60, 60);
        ctx.restore();
      }

      // website name
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "600 15px Arial,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(data.websiteName.toUpperCase(), W / 2, 1155);

      // date
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "400 14px Arial,sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(new Date(data.generatedAt).toLocaleDateString(), 850, 1155);

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
  // Parse optional vertical offset from image_url hash e.g. ashkar.jpg#offset=20
  const rawUrl = winner.image_url ?? "";
  const hashIdx = rawUrl.indexOf("#offset=");
  const cleanUrl = hashIdx !== -1 ? rawUrl.slice(0, hashIdx) : rawUrl;
  const offsetPct = hashIdx !== -1 ? parseInt(rawUrl.slice(hashIdx + 8), 10) : 0;
  // object-position: center <offsetPct>% — higher number = image shifts UP (face appears more)
  const objPosition = `center ${offsetPct}%`;
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-[#0c3b2e] text-white shadow-lift">

      {/* ── full-bleed photo top 62% ── */}
      <div className="absolute inset-x-0 top-0 h-[62%]">
        {winner.image_url ? (
          <img
            src={cleanUrl}
            alt={winner.name}
            className="h-full w-full object-cover"
            style={{ objectPosition: objPosition }}
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

        {/* vote strip */}
        <div className="w-full rounded-xl bg-white/[0.08] px-4 py-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">votes</p>
          <p className="text-2xl font-black text-white">{winner.votes}</p>
        </div>

        {/* footer */}
        <div className="flex w-full items-center justify-between">
          {logoUrl
            ? <img src={logoUrl} alt="logo" className="h-6 w-6 rounded object-contain opacity-70" />
            : <span className="text-[10px] text-white/40"></span>
          }
          <span className="text-[9px] font-semibold uppercase tracking-widest text-white/40">{websiteName}</span>
          <span className="text-[9px] text-white/30">{new Date(generatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}