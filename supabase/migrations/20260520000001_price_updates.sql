-- Price updates effective 2026-05-20
-- Burritos: $14 → $16 (all variants)
UPDATE public.menu_items SET price = 16.00
WHERE id IN ('burrito-combo','b1','b2','b3','b4','b5','b6','b7','b8','b9','b10','b11','b12');

-- Quesadillas Regular: $10 → $12
UPDATE public.menu_items SET price = 12.00 WHERE id = 'a3';

-- Quesadillas Toda (super big): $10 → $16
UPDATE public.menu_items SET price = 16.00 WHERE id = 'a4';

-- Nachos: $11 → $15
UPDATE public.menu_items SET price = 15.00 WHERE id = 'a7';

-- Sopes: $4 → $6
UPDATE public.menu_items SET price = 6.00 WHERE id = 'a5';

-- Molcajete: $25 → $35
UPDATE public.menu_items SET price = 35.00 WHERE id = 'p1';

-- Cecina con Nopales (platillo): $16 → $18
UPDATE public.menu_items SET price = 18.00 WHERE id = 'p13';
