import { useSession } from "@tanstack/react-start/server";
import { randomUUID } from "node:crypto";

type BallotSession = { token?: string };

function sessionConfig() {
  const isProd = process.env["NODE_ENV"] === "production";
  return {
    password: process.env["ADMIN_SESSION_SECRET"]!,
    name: "hikma-ballot",
    maxAge: 60 * 60 * 24 * 30,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? ("none" as const) : ("lax" as const),
      path: "/",
    },
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
