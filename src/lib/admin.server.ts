import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertAdmin(supabase: SupabaseClient, userId: string) {
  // Reads the caller's own role row under RLS ("own roles readable").
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
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

export async function generateResults() {
  const [positionsRes, candidatesRes, votesRes, studentsRes, settingsRes] = await Promise.all([
    supabaseAdmin.from("positions").select("id, title, display_order").order("display_order"),
    supabaseAdmin.from("candidates").select("id, name, class, image_url, position_id, is_active"),
    supabaseAdmin.from("votes").select("candidate_id, position_id, student_id, voter_token"),
    supabaseAdmin.from("students").select("id"),
    supabaseAdmin.from("settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const positions = positionsRes.data ?? [];
  const candidates = candidatesRes.data ?? [];
  const votes = votesRes.data ?? [];
  const students = studentsRes.data ?? [];

  const voterIds = new Set(
    votes.map((v) => v.student_id ?? v.voter_token ?? "").filter((v) => v !== ""),
  );
  const totalVoters = students.length;
  const votedCount = voterIds.size;

  const results = positions.map((p) => {
    const list = candidates
      .filter((c) => c.position_id === p.id)
      .map((c) => ({
        id: c.id,
        name: c.name,
        class: c.class,
        image_url: c.image_url,
        is_active: c.is_active,
        votes: votes.filter((v) => v.candidate_id === c.id).length,
      }))
      .sort((a, b) => b.votes - a.votes);

    const total = list.reduce((s, c) => s + c.votes, 0);
    const top = list[0]?.votes ?? 0;
    const leaders = list.filter((c) => c.votes === top && top > 0);

    return {
      positionId: p.id,
      title: p.title,
      totalVotes: total,
      tie: leaders.length > 1,
      winnerIds: leaders.map((c) => c.id),
      candidates: list.map((c) => ({
        ...c,
        percentage: total > 0 ? Math.round((c.votes / total) * 1000) / 10 : 0,
        isWinner: top > 0 && c.votes === top,
      })),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    electionStatus: settingsRes.data?.election_status ?? "open",
    websiteName: settingsRes.data?.website_name ?? "Hikma Vote",
    logoUrl: settingsRes.data?.logo_url ?? null,
    totals: {
      totalVoters,
      totalVotes: votes.length,
      votedCount,
      notVotedCount: Math.max(totalVoters - votedCount, 0),
      turnout: totalVoters ? Math.round((votedCount / totalVoters) * 1000) / 10 : 0,
    },
    results,
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
