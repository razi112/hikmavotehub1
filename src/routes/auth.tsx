import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { adminStatus, adminUnlock } from "@/lib/admin-gate.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin sign in — Hikma Vote" },
      {
        name: "description",
        content: "Election committee PIN sign in for managing candidates, students and live analytics.",
      },
      { property: "og:title", content: "Admin sign in — Hikma Vote" },
      { property: "og:description", content: "Restricted access for the election committee." },
    ],
  }),
  component: AuthPage,
});

const LENGTH = 4;

function AuthPage() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [busy, setBusy] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    adminStatus().then(({ unlocked }) => {
      if (unlocked) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function submit(pin: string) {
    setBusy(true);
    try {
      const { ok } = await adminUnlock({ data: { pin } });
      if (!ok) {
        toast.error("Incorrect PIN");
        setDigits(Array(LENGTH).fill(""));
        inputs.current[0]?.focus();
        return;
      }
      navigate({ to: "/admin" });
    } catch {
      toast.error("Sign in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function applyDigits(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    const next = [...digits];
    if (!clean) {
      next[index] = "";
      setDigits(next);
      return;
    }
    let cursor = index;
    for (const ch of clean) {
      if (cursor >= LENGTH) break;
      next[cursor] = ch;
      cursor += 1;
    }
    setDigits(next);
    // keep the DOM in sync: each box always shows exactly one digit
    inputs.current.forEach((el, i) => {
      if (el) el.value = next[i] ?? "";
    });
    inputs.current[Math.min(cursor, LENGTH - 1)]?.focus();
    if (next.every((d) => d !== "")) void submit(next.join(""));
  }

  function setDigit(index: number, value: string) {
    // a single box only ever holds one character; extra chars spill forward
    applyDigits(index, value.slice(-LENGTH));
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="hero-surface">
        <div className="mx-auto flex max-w-md flex-col px-4 pb-24 pt-16 sm:px-6">
          <div className="glass animate-rise rounded-3xl p-6 shadow-lift sm:p-8">
            <span className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary text-primary-foreground">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold">Committee sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the 4-digit admin PIN. Students vote by selecting their name.
            </p>

            <form
              className="mt-7"
              onSubmit={(e) => {
                e.preventDefault();
                const pin = digits.join("");
                if (pin.length === LENGTH) void submit(pin);
              }}
            >
              <div className="flex justify-center gap-3">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputs.current[index] = el;
                    }}
                    value={digit}
                    onChange={(e) => setDigit(index, e.target.value)}
                    onKeyDown={(e) => onKeyDown(index, e)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    type="password"
                    maxLength={LENGTH}
                    aria-label={`PIN digit ${index + 1}`}
                    disabled={busy}
                    className="h-16 w-14 rounded-2xl border border-border bg-background/70 text-center font-display text-2xl font-bold outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                  />
                ))}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="mt-7 w-full"
                disabled={busy || digits.some((d) => !d)}
              >
                {busy ? "Checking…" : "Unlock dashboard"}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
