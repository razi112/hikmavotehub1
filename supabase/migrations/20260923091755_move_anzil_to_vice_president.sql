-- Move Hafiz Muhammad Anzil from President to Vice President
UPDATE public.candidates
SET position_id = (SELECT id FROM public.positions WHERE title = 'Vice President')
WHERE name = 'Hafiz Muhammad Anzil'
  AND position_id = (SELECT id FROM public.positions WHERE title = 'President');
