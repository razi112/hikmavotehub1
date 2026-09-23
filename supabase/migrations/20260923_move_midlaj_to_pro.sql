-- Move Hafiz Muhammed Midlaj from Treasurer to PRO
UPDATE public.candidates
SET position_id = (SELECT id FROM public.positions WHERE title = 'PRO')
WHERE name = 'Hafiz Muhammed Midlaj'
  AND position_id = (SELECT id FROM public.positions WHERE title = 'Treasurer');
