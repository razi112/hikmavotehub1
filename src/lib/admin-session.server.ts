import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type AdminSession = { unlocked?: boolean };

function sessionConfig() {
  const secret = process.env["ADMIN_SESSION_SECRET"];
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set in environment variables");
  const isProd = process.env["NODE_ENV"] === "production";
  return {
    password: secret,
    name: "hikma-admin",
    maxAge: 60 * 60 * 8,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? ("none" as const) : ("lax" as const),
      path: "/",
    },
  };
}

function pinMatches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function unlockAdmin(pin: string) {
  const expected = process.env["ADMIN_PIN"];
  if (!expected) throw new Error("Admin PIN is not configured");
  if (!pinMatches(pin, expected)) return { ok: false as const };
  const session = await useSession<AdminSession>(sessionConfig());
  await session.update({ unlocked: true });
  return { ok: true as const };
}

export async function lockAdmin() {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
}

export async function isAdminUnlocked() {
  const session = await useSession<AdminSession>(sessionConfig());
  return session.data.unlocked === true;
}

export async function requireAdminSession() {
  if (!(await isAdminUnlocked())) throw new Error("Admin access required");
  return true;
}
