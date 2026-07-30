import { useEffect, useMemo, useState } from "react";

function useCountdown(target: string | undefined) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    if (!target || now === null) return null;
    const diff = Math.max(0, new Date(target).getTime() - now);
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff / 3600000) % 24),
      minutes: Math.floor((diff / 60000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      ended: diff === 0,
    };
  }, [target, now]);
}

export function Countdown({ endTime }: { endTime?: string }) {
  const t = useCountdown(endTime);
  const cells = [
    { label: "Days", value: t?.days },
    { label: "Hours", value: t?.hours },
    { label: "Minutes", value: t?.minutes },
    { label: "Seconds", value: t?.seconds },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {cells.map((c) => (
        <div
          key={c.label}
          className="glass rounded-3xl px-4 py-6 text-center shadow-soft transition-transform duration-300 hover:-translate-y-1"
        >
          <div className="font-display text-3xl font-bold tabular-nums text-gradient sm:text-4xl">
            {c.value === undefined ? "--" : String(c.value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
