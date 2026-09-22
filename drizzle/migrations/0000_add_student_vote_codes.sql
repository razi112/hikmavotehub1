ALTER TABLE public.students ADD COLUMN IF NOT EXISTS vote_code text;

CREATE UNIQUE INDEX IF NOT EXISTS students_vote_code_unique ON public.students (vote_code) WHERE vote_code IS NOT NULL;

UPDATE public.students
SET vote_code = upper(substr(md5(id::text || 'hikma-vote'), 1, 6))
WHERE vote_code IS NULL;