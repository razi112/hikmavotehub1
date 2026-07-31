import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const studentLogin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ admissionNumber: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { loginStudent } = await import("./election.server");
    return loginStudent(data.admissionNumber);
  });

export const studentRefresh = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ studentId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { refreshStudent } = await import("./election.server");
    return refreshStudent(data.studentId);
  });

export const castVote = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ studentId: z.string().uuid(), candidateId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { submitVote } = await import("./election.server");
    return submitVote(data);
  });

export const getTally = createServerFn({ method: "GET" }).handler(async () => {
  const { buildTally } = await import("./election.server");
  return buildTally();
});

export const getVoters = createServerFn({ method: "GET" }).handler(async () => {
  const { listVoters } = await import("./election.server");
  return listVoters();
});

export const studentLoginById = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ studentId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { loginStudentById } = await import("./election.server");
    return loginStudentById(data.studentId);
  });
