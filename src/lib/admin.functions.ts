import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, adminOverview } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    return adminOverview();
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
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => candidateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin, upsertCandidateRow } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    return upsertCandidateRow(data);
  });

export const removeCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin, deleteCandidateRow } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    return deleteCandidateRow(data.id);
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
  .handler(async ({ data, context }) => {
    const { assertAdmin, updateSettingsRow } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    return updateSettingsRow(data);
  });

export const toggleStudentBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), blocked: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin, setStudentBlocked } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    return setStudentBlocked(data.id, data.blocked);
  });
