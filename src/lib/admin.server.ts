import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertAdmin(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("Could not verify admin access");
  if (!data) throw new Error("Admin access required");
  return true;
}

export async function adminOverview() {
  const [positions, candidates, students, votes, settings] = await Promise.all([
    supabaseAdmin.from("positions").select("*").order("display_order"),
    supabaseAdmin.from("candidates").select("*").order("display_order"),
    supabaseAdmin.from("students").select("*").order("admission_number"),
    supabaseAdmin.from("votes").select("candidate_id, position_id, student_id"),
    supabaseAdmin.from("settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  return {
    positions: positions.data ?? [],
    candidates: candidates.data ?? [],
    students: students.data ?? [],
    votes: votes.data ?? [],
    settings: settings.data ?? null,
  };
}

export async function upsertCandidateRow(input: {
  id?: string;
  position_id: string;
  name: string;
  class: string | null;
  bio: string | null;
  image_url: string | null;
  is_active: boolean;
}) {
  const payload = { ...input };
  const { error } = input.id
    ? await supabaseAdmin.from("candidates").update(payload).eq("id", input.id)
    : await supabaseAdmin.from("candidates").insert(payload);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteCandidateRow(id: string) {
  const { error } = await supabaseAdmin.from("candidates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function updateSettingsRow(input: {
  website_name?: string;
  election_status?: string;
  start_time?: string;
  end_time?: string;
}) {
  const { error } = await supabaseAdmin.from("settings").update(input).eq("id", 1);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function setStudentBlocked(id: string, blocked: boolean) {
  const { error } = await supabaseAdmin.from("students").update({ is_blocked: blocked }).eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
