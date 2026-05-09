-- Canonical server-side menu price table.
-- create-payment-intent looks prices up here instead of trusting the client.
-- Prevents price manipulation: a crafted request with item.price = 0.01 no longer works.

CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Public read (edge functions + frontend can read the price list)
CREATE POLICY "Anyone can view active menu items"
  ON public.menu_items FOR SELECT
  USING (active = true);

-- Only service_role can modify (via migrations or admin tooling)

-- Seed all items. Prices must match menuData.ts exactly.
-- Run: grep through all menu items and confirm before each price change.
INSERT INTO public.menu_items (id, name, price) VALUES
  -- ── Breakfast ────────────────────────────────────────────────────────────────
  ('d01', 'Desayuno Ricos Tacos',               16.00),
  ('to7', 'Huevos con Jamon',                   12.00),
  ('to8', 'Huevos con Salchicha',               12.00),
  ('to9', 'Huevos con Chorizo',                 12.00),
  ('d02', 'Huevos a la Mexicana',               12.00),
  ('d03', 'Huevos Rancheros',                   12.00),
  ('d04', 'Chilaquiles Regulares con Huevos',   11.95),
  ('p12', 'Chilaquiles con Carne',              14.95),
  ('d05', 'Chilaquiles con Carne y Huevos',     17.95),
  ('b5',  'Burrito Chorizo',                    14.00),

  -- ── Meats / Proteins ─────────────────────────────────────────────────────────
  ('m1',  'Al Pastor',             5.00),
  ('m2',  'Bistec',                5.00),
  ('m3',  'Carnitas',              5.00),
  ('m4',  'Cecina',                5.00),
  ('m5',  'Pollo Asado',           5.00),
  ('m6',  'Lengua',                5.00),
  ('m7',  'Cabeza',                5.00),
  ('m8',  'Suadero',               5.00),
  ('m9',  'Tripa',                 5.00),
  ('m10', 'Buche',                 5.00),
  ('m11', 'Enchilada',             5.00),
  ('m12', 'Longaniza',             5.00),
  ('m13', 'Cueritos',              5.00),
  ('m14', 'Picadillo de Res',      5.00),
  ('m15', 'Oreja',                 5.00),

  -- ── Tacos (specialty) ────────────────────────────────────────────────────────
  ('t1',  'Cochinita Pibil',       5.00),
  ('t2',  'Birria',                5.00),
  ('t16', 'Tacos Arabes',          5.00),
  ('t18', 'Barbachera',            5.00),
  ('t19', 'Carne Azada',           5.00),
  ('t21', 'Chillo',                5.00),

  -- ── Taquitos ─────────────────────────────────────────────────────────────────
  ('tq1',  'Al Pastor',            3.00),
  ('tq2',  'Carnitas',             3.00),
  ('tq3',  'Suadero',              3.00),
  ('tq4',  'Enchilada',            3.00),
  ('tq5',  'Longaniza',            3.00),
  ('tq6',  'Buche',                3.00),
  ('tq7',  'Bistec',               3.00),
  ('tq8',  'Cueritos',             3.00),
  ('tq9',  'Pollo Asada',          3.00),
  ('tq10', 'Cecina',               3.00),

  -- ── Tostadas ─────────────────────────────────────────────────────────────────
  ('ts1',  'Birria',               4.00),
  ('ts2',  'Al Pastor',            4.00),
  ('ts3',  'Lengua',               4.00),
  ('ts4',  'Cabeza',               4.00),
  ('ts5',  'Carnitas',             4.00),
  ('ts6',  'Suadero',              4.00),
  ('ts7',  'Enchilada',            4.00),
  ('ts8',  'Longaniza',            4.00),
  ('ts9',  'Bistec',               4.00),
  ('ts10', 'Pollo',                4.00),
  ('ts11', 'Tinga',                4.00),
  ('ts12', 'Pata de Res',          4.00),
  ('ts13', 'Picadillo de Res',     4.00),
  ('ts14', 'Vegetariana',          4.00),
  ('ts15', 'De Camarones',         4.00),
  ('ts16', 'Cecina',               4.00),
  ('ts17', 'Arabe',                4.00),

  -- ── Tortas ───────────────────────────────────────────────────────────────────
  ('to1',  'Birria',               12.00),
  ('to2',  'Milaneza de Res',      12.00),
  ('to3',  'Milaneza de Pollo',    14.00),
  ('to4',  'Pierna Adobada',       12.00),
  ('to5',  'Pollo Asado',          14.00),
  ('to6',  'Chuleta / Haumada',    12.00),
  ('to10', 'Cubana',               12.00),
  ('to11', 'Tinga',                12.00),
  ('to12', 'Cecina',               12.00),
  ('to13', 'Arabe',                12.00),
  ('to14', 'Carnitas',             12.00),
  ('to15', 'Al Pastor',            12.00),

  -- ── Burritos ─────────────────────────────────────────────────────────────────
  ('burrito-combo', 'Burrito',     14.00),
  ('b1',  'Birria',                14.00),
  ('b2',  'Pollo',                 14.00),
  ('b3',  'Bistec Asado',          14.00),
  ('b4',  'Carnitas',              14.00),
  ('b6',  'Lengua',                14.00),
  ('b7',  'Al Pastor',             14.00),
  ('b8',  'Picadillo de Res',      14.00),
  ('b9',  'Vegetariano',           14.00),
  ('b10', 'Cecina',                14.00),
  ('b11', 'Arabe',                 14.00),
  ('b12', 'Mole',                  14.00),

  -- ── Soups ────────────────────────────────────────────────────────────────────
  ('s1',  'Pozole Chica',          7.00),
  ('s2',  'Pozole Grande',         10.00),
  ('s3',  'Pancita',               7.00),
  ('s5',  'Caldo de Camaron (Sopa de Mariscos)', 15.00),
  ('s6',  'Birria de Res (Consomé)', 13.99),

  -- ── Platillos (Plates) ───────────────────────────────────────────────────────
  ('p1',  'Molcajete',                              25.00),
  ('p2',  'Cochinita Pibil',                        25.00),
  ('p3',  'Birria',                                 13.99),
  ('p4',  'Ricos Chiles Rellenos',                  16.00),
  ('p5',  'Chuleta de Puerco',                      16.00),
  ('p6',  'Bistec Encebollado',                     17.00),
  ('p7',  'Bistec a la Mexicana',                   17.00),
  ('p8',  'Bistec de Pollo a la Mexicana',          16.00),
  ('p9',  'Enchilada Poblanas',                     15.00),
  ('p10', 'Enchiladas Rojas',                       15.00),
  ('p11', 'Enchiladas Verdes',                      15.00),
  ('p13', 'Cecina',                                 16.00),
  ('p14', 'Mojarra Frita',                          19.00),
  ('p15', 'Coctel de Camarones',                    15.00),
  ('p16', 'Mole Poblano',                           15.00),
  ('p17', 'Pechuga Asada',                          16.00),
  ('p18', 'Carne Azada',                            17.00),
  ('p19', 'Carne Enchilada',                        17.00),
  ('p20', 'Camarones a la Diabla',                  19.00),
  ('p21', 'Camarones al Mojo de Ajo',               19.00),
  ('p22', 'Camarones Empanizados',                  19.00),
  ('p23', 'Filete de Pescado Asado a la Plancha',   18.00),
  ('p24', 'Arrachera',                              22.00),
  ('p25', 'Fajitas',                                20.00),
  ('p26', 'Alambre',                                25.00),
  ('p27', 'Parrilladas',                            24.99),

  -- ── Kids Menu ────────────────────────────────────────────────────────────────
  ('k1',  'French Fries',                    4.00),
  ('k2',  'Chicken Nuggets',                 12.00),
  ('k3',  'Chicken Tenders & Fries',         12.00),
  ('k4',  'Nuggets & Fries Meal',            12.00),
  ('k5',  'Chicken Quesadilla & Fries',      12.00),
  ('k6',  'Salchipapas',                     12.00),
  ('k7',  'Fried Chicken & Fries',           12.00),

  -- ── Extras ───────────────────────────────────────────────────────────────────
  ('e1',  'Quesillo',              1.00),
  ('e2',  'Pico de Gallo',         1.00),
  ('e3',  'Guacamole',             1.00),
  ('e4',  'Nopales',               1.00),
  ('e5',  'Crema',                 1.00),

  -- ── Weekend Specials ─────────────────────────────────────────────────────────
  ('w1',  'Barbacoa',              18.00),

  -- ── Appetizers ───────────────────────────────────────────────────────────────
  ('a1',  'Especial Tacos Orientales', 5.00),
  ('a2',  'Cemitas de Milaneza',       12.00),
  ('a3',  'Quesadillas Regular',       10.00),
  ('a4',  'Quesadillas Toda',          10.00),
  ('a5',  'Sopas',                     4.00),
  ('a6',  'Haurache Grande',           10.00),
  ('a7',  'Nachos',                    11.00),
  ('a8',  'Guacamole w. Chips',        8.00),
  ('a9',  'Tacos Dorados',             10.00),
  ('a10', 'Tacos Plazeros',            7.00),
  ('a11', 'Chalupas',                  8.00),
  ('a13', 'Fajitas Arabe',             12.00),

  -- ── Drinks ───────────────────────────────────────────────────────────────────
  ('d1',  'Aguas Frescas Med',           3.00),
  ('d2',  'Aguas Frescas Gde',           4.00),
  ('d3',  'Licuados Chocomilk Reg',      4.99),
  ('d4',  'Licuados Chocomilk Large',    7.00),
  ('d5',  'Licuados Mamey Reg',          4.99),
  ('d6',  'Licuados Mamey Large',        7.00),
  ('d7',  'Licuados Fresa Reg',          4.99),
  ('d8',  'Licuados Fresa Large',        7.00),
  ('d9',  'Licuados Platano Reg',        4.99),
  ('d10', 'Licuados Platano Large',      7.00),
  ('d11', 'Licuados Mango Reg',          4.99),
  ('d12', 'Licuados Mango Large',        7.00),
  ('d13', 'Licuados Papaya Reg',         4.99),
  ('d14', 'Licuados Papaya Large',       7.00),
  ('d15', 'Jugo de Naranja',             4.00),
  ('d16', 'Limonada',                    4.00),
  ('d17', 'Piña Colada',                 8.00),
  ('d18', 'Refrescos Mexicanos',         3.00),
  ('d19', 'Sodas del Pais',              2.00),

  -- ── Desserts ─────────────────────────────────────────────────────────────────
  ('de1', 'Pastel de Tres Leches',   5.00),
  ('de2', 'Gelatinas',               3.00),
  ('de3', 'Flan Napolitano',         4.00),
  ('de4', 'Cremitas',                3.00)

ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      price = EXCLUDED.price;
