import { useEffect, useState } from "react";

const COLORS = ["var(--primary)", "var(--gold)", "var(--primary-glow)", "var(--chart-3)"];

export function Confetti({ count = 60 }: { count?: number }) {
  const [pieces, setPieces] = useState<
    { left: number; delay: number; duration: number; color: string; size: number }[]
  >([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.4 + Math.random() * 1.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
      })),
    );
  }, [count]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
          }}
          className="absolute top-0 rounded-[2px]"
        />
      ))}
    </div>
  );
}
