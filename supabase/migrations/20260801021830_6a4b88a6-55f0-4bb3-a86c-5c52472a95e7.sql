INSERT INTO public.students (name, admission_number, class) VALUES
('Hafiz Muhammed Ziyad','HKP01',NULL),
('Hafiz Muhammad Anzil','HKP02',NULL),
('Hafiz Muhammed Fawaz','HKS01',NULL),
('Hafiz Muhammed Ashkar','HKS02',NULL),
('Hafiz Muhammed Munfis','HKS03',NULL),
('Hafiz Muhammed Shadi','HKT01',NULL),
('Hafiz Muhammed Midlaj','HKT02',NULL)
ON CONFLICT DO NOTHING;