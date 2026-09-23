-- Add PRO position to the election
INSERT INTO public.positions (title, display_order)
VALUES ('PRO', 7)
ON CONFLICT (title) DO NOTHING;
