
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL UNIQUE,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.positions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.positions TO authenticated;
GRANT ALL ON public.positions TO service_role;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "positions public read" ON public.positions FOR SELECT USING (true);
CREATE POLICY "positions admin write" ON public.positions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  name text NOT NULL,
  class text,
  bio text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.candidates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT ALL ON public.candidates TO service_role;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidates public read" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "candidates admin write" ON public.candidates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  admission_number text NOT NULL UNIQUE,
  class text,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students admin all" ON public.students FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  position_id uuid NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, position_id)
);
GRANT SELECT ON public.votes TO authenticated;
GRANT ALL ON public.votes TO service_role;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes admin read" ON public.votes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.settings (
  id int PRIMARY KEY DEFAULT 1,
  website_name text NOT NULL DEFAULT 'Hikma Vote',
  logo_url text,
  election_status text NOT NULL DEFAULT 'open',
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings admin write" ON public.settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.settings (id) VALUES (1);

INSERT INTO public.positions (title, display_order) VALUES
  ('President', 1),
  ('Vice President', 2),
  ('Secretary', 3),
  ('Joint Secretary', 4),
  ('Working Secretary', 5),
  ('Treasurer', 6);

INSERT INTO public.candidates (position_id, name, display_order, bio)
SELECT p.id, c.name, c.ord, c.bio FROM public.positions p
JOIN (VALUES
  ('President', 'Hafiz Muhammed Ziyad', 1, 'Committed to a united and active class union.'),
  ('President', 'Hafiz Muhammad Anzil', 2, 'Focused on transparency and student welfare.'),
  ('Secretary', 'Hafiz Muhammed Fawaz', 1, 'Organised, reliable and detail-oriented.'),
  ('Secretary', 'Hafiz Muhammed Ashkar', 2, 'Believes in clear communication for all.'),
  ('Secretary', 'Hafiz Muhammed Munfis', 3, 'Dedicated to keeping records and events on track.'),
  ('Treasurer', 'Hafiz Muhammed Shadi', 1, 'Careful and honest stewardship of union funds.'),
  ('Treasurer', 'Hafiz Muhammed Midlaj', 2, 'Transparent budgeting for every student.')
) AS c(pos, name, ord, bio) ON c.pos = p.title;

INSERT INTO public.students (name, admission_number, class) VALUES
  ('Demo Student One', 'HK001', 'Class A'),
  ('Demo Student Two', 'HK002', 'Class A'),
  ('Demo Student Three', 'HK003', 'Class B');
