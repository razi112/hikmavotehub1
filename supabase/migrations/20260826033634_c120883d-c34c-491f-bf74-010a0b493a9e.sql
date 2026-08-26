ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS voter_token text;
CREATE UNIQUE INDEX IF NOT EXISTS votes_token_position_unique ON public.votes (voter_token, position_id) WHERE voter_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS votes_student_position_unique ON public.votes (student_id, position_id) WHERE student_id IS NOT NULL;