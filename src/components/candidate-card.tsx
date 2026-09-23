import { User } from "lucide-react";
import type { Candidate } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CandidateCard({
  candidate,
  positionTitle,
  onVote,
  selected,
  disabled,
  disabledLabel,
}: {
  candidate: Candidate;
  positionTitle?: string;
  onVote?: () => void;
  selected?: boolean;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  return (
    <article
      className={cn(
        "group lift glass flex flex-col overflow-hidden rounded-3xl",
        selected && "ring-2 ring-primary shadow-lift",
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-accent">
        {candidate.image_url ? (
          <img
            src={candidate.image_url}
            alt={`Portrait of ${candidate.name}`}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-accent-foreground/50">
            <User className="h-16 w-16" strokeWidth={1.2} />
          </div>
        )}
        {positionTitle && (
          <span className="absolute left-3 top-3 rounded-full bg-card/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary backdrop-blur-sm">
            {positionTitle}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold leading-tight">{candidate.name}</h3>
        {candidate.class && <p className="text-xs text-muted-foreground">{candidate.class}</p>}
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {candidate.bio ?? "Manifesto coming soon."}
        </p>

        {onVote && (
          <Button
            variant={selected ? "hero" : "outline"}
            size="lg"
            className="mt-4 w-full"
            onClick={onVote}
            disabled={disabled}
          >
            {disabled ? (disabledLabel ?? "Unavailable") : selected ? "Selected" : "Select"}
          </Button>
        )}
      </div>
    </article>
  );
}
