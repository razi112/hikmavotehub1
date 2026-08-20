import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const adminUnlock = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ pin: z.string().min(4).max(12) }).parse(d))
  .handler(async ({ data }) => {
    const { unlockAdmin } = await import("./admin-session.server");
    return unlockAdmin(data.pin);
  });

export const adminLock = createServerFn({ method: "POST" }).handler(async () => {
  const { lockAdmin } = await import("./admin-session.server");
  return lockAdmin();
});

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isAdminUnlocked } = await import("./admin-session.server");
  return { unlocked: await isAdminUnlocked() };
});
