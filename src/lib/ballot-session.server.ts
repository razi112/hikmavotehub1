import { useSession } from "@tanstack/react-start/server";
import { randomUUID } from "node:crypto";

type BallotSession = { token?: string };

function sessionConfig() {
  return {
    password: process.env["ADMIN_SESSION_SECRET"]!,
    name: "hikma-ballot",
    maxAge: 60 * 60 * 24 * 30,
    cookie: { httpOnly: true, secure: true, sameSite: "none" as const, path: "/" },
  };
}

/** Stable per-browser ballot token, created on first use. */
export async function getBallotToken(): Promise<string> {
  const session = await useSession<BallotSession>(sessionConfig());
  if (session.data.token) return session.data.token;
  const token = randomUUID();
  await session.update({ token });
  return token;
}
