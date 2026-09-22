import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getAdminOverview = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminSession } = await import("./admin-session.server");
  const { adminOverview } = await import("./admin.server");
  await requireAdminSession();
  return adminOverview();
});

export const getGeneratedResults = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminSession } = await import("./admin-session.server");
  const { generateResults } = await import("./admin.server");
  await requireAdminSession();
  return generateResults();
});

const candidateSchema = z.object({
  id: z.string().uuid().optional(),
  position_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  class: z.string().max(80).nullable(),
  bio: z.string().max(2000).nullable(),
  image_url: z.string().max(1000).nullable(),
  is_active: z.boolean(),
});

export const saveCandidate = createServerFn({ method: "POST" })
  .inputValidator((d) => candidateSchema.parse(d))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    const { upsertCandidateRow } = await import("./admin.server");
    await requireAdminSession();
    return upsertCandidateRow(data);
  });

export const removeCandidate = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    const { deleteCandidateRow } = await import("./admin.server");
    await requireAdminSession();
    return deleteCandidateRow(data.id);
  });

export const saveSettings = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        website_name: z.string().min(1).max(120).optional(),
        election_status: z.enum(["open", "closed"]).optional(),
        start_time: z.string().optional(),
        end_time: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    const { updateSettingsRow } = await import("./admin.server");
    await requireAdminSession();
    return updateSettingsRow(data);
  });

export const toggleStudentBlock = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), blocked: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    const { setStudentBlocked } = await import("./admin.server");
    await requireAdminSession();
    return setStudentBlocked(data.id, data.blocked);
  });
