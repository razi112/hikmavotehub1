import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type StudentSessionData = {
  studentId: string;
  name: string;
  admissionNumber: string;
  className: string | null;
  votedPositionIds: string[];
};

export type Tally = {
  totalStudents: number;
  totalCandidates: number;
  totalVotes: number;
  votedStudents: number;
  electionStatus: string;
  perCandidate: Record<string, number>;
  perPosition: Record<string, number>;
  hourly: { hour: string; votes: number }[];
};

async function votedPositions(studentId: string) {
  const { data } = await supabaseAdmin
    .from("votes")
    .select("position_id")
    .eq("student_id", studentId);
  return (data ?? []).map((v) => v.position_id);
}

export async function loginStudent(admissionNumber: string): Promise<StudentSessionData> {
  const { data: student, error } = await supabaseAdmin
    .from("students")
    .select("id, name, admission_number, class, is_blocked")
    .ilike("admission_number", admissionNumber.trim())
    .maybeSingle();

  if (error) throw new Error("Could not verify your admission number. Please try again.");
  if (!student) throw new Error("Admission number not found. Please contact the election committee.");
  if (student.is_blocked) throw new Error("This account has been blocked from voting.");

  return {
    studentId: student.id,
    name: student.name,
    admissionNumber: student.admission_number,
    className: student.class,
    votedPositionIds: await votedPositions(student.id),
  };
}

export async function refreshStudent(studentId: string): Promise<StudentSessionData | null> {
  const { data: student } = await supabaseAdmin
    .from("students")
    .select("id, name, admission_number, class, is_blocked")
    .eq("id", studentId)
    .maybeSingle();
  if (!student || student.is_blocked) return null;
  return {
    studentId: student.id,
    name: student.name,
    admissionNumber: student.admission_number,
    className: student.class,
    votedPositionIds: await votedPositions(student.id),
  };
}

export async function votedPositionsForBallot(): Promise<string[]> {
  const { getBallotToken } = await import("./ballot-session.server");
  const token = await getBallotToken();
  const { data } = await supabaseAdmin
    .from("votes")
    .select("position_id")
    .eq("voter_token", token);
  return (data ?? []).map((v) => v.position_id);
}

export async function submitVote(input: {
  candidateId: string;
}): Promise<{ ok: true }> {
  const { data: settings } = await supabaseAdmin
    .from("settings")
    .select("election_status, start_time, end_time")
    .eq("id", 1)
    .maybeSingle();

  const now = Date.now();
  if (!settings || settings.election_status !== "open") {
    throw new Error("Voting is currently closed.");
  }
  if (new Date(settings.start_time).getTime() > now) throw new Error("Voting has not started yet.");
  if (new Date(settings.end_time).getTime() < now) throw new Error("Voting has ended.");

  const { data: candidate } = await supabaseAdmin
    .from("candidates")
    .select("id, position_id, is_active")
    .eq("id", input.candidateId)
    .maybeSingle();
  if (!candidate || !candidate.is_active) throw new Error("This candidate is no longer available.");

  const { getBallotToken } = await import("./ballot-session.server");
  const token = await getBallotToken();

  // Server-side guard: one vote per position for this ballot.
  const { count } = await supabaseAdmin
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("voter_token", token)
    .eq("position_id", candidate.position_id);
  if ((count ?? 0) > 0) throw new Error("You have already voted for this position.");

  const { error } = await supabaseAdmin.from("votes").insert({
    student_id: null,
    candidate_id: candidate.id,
    position_id: candidate.position_id,
    voter_token: token,
  });

  if (error) {
    // Unique index catches races between concurrent submissions.
    if (error.code === "23505") throw new Error("You have already voted for this position.");
    throw new Error("Your vote could not be recorded. Please try again.");
  }

  return { ok: true };
}


export async function buildTally(): Promise<Tally> {
  const [votesRes, studentsRes, candidatesRes, settingsRes] = await Promise.all([
    supabaseAdmin.from("votes").select("candidate_id, position_id, student_id, created_at"),
    supabaseAdmin.from("students").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("candidates").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("settings").select("election_status").eq("id", 1).maybeSingle(),
  ]);

  const votes = votesRes.data ?? [];
  const perCandidate: Record<string, number> = {};
  const perPosition: Record<string, number> = {};
  const hourMap = new Map<string, number>();
  const voters = new Set<string>();

  for (const v of votes) {
    perCandidate[v.candidate_id] = (perCandidate[v.candidate_id] ?? 0) + 1;
    perPosition[v.position_id] = (perPosition[v.position_id] ?? 0) + 1;
    // count by student_id if present, otherwise by voter_token
    const voterId = v.student_id ?? (v as any).voter_token;
    if (voterId) voters.add(voterId);
    const hour = `${String(new Date(v.created_at).getHours()).padStart(2, "0")}:00`;
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
  }

  const hourly = Array.from({ length: 24 }, (_, i) => {
    const hour = `${String(i).padStart(2, "0")}:00`;
    return { hour, votes: hourMap.get(hour) ?? 0 };
  });

  return {
    totalStudents: studentsRes.count ?? 0,
    totalCandidates: candidatesRes.count ?? 0,
    totalVotes: votes.length,
    votedStudents: voters.size,
    electionStatus: settingsRes.data?.election_status ?? "open",
    perCandidate,
    perPosition,
    hourly,
  };
}

export type VoterOption = {
  id: string;
  name: string;
  className: string | null;
  positionTitle: string | null;
};

export async function listVoters(): Promise<VoterOption[]> {
  const [studentsRes, candidatesRes] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select("id, name, class")
      .eq("is_blocked", false)
      .order("name"),
    supabaseAdmin.from("candidates").select("name, is_active, positions(title)"),
  ]);

  if (studentsRes.error) throw new Error("Could not load the voter list.");

  const positionByName = new Map<string, string>();
  for (const c of candidatesRes.data ?? []) {
    const title = (c as { positions?: { title?: string } | null }).positions?.title;
    if (c.is_active && title) positionByName.set(c.name.trim().toLowerCase(), title);
  }

  return (studentsRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    className: s.class,
    positionTitle: positionByName.get(s.name.trim().toLowerCase()) ?? null,
  }));
}


export async function loginStudentById(studentId: string): Promise<StudentSessionData> {
  const session = await refreshStudent(studentId);
  if (!session) throw new Error("This voter is not eligible to vote.");
  return session;
}
