// Menú oficial de Ricos Tacos — generado a partir de
// "Ricos_Tacos_-_Menu_Optimizado_FINAL_v5_con_fotos.csv".
// Los pedidos online van a order.store (ver src/config/ordering.ts).

import aguasFrescas from "@/assets/menu-nuevo/aguas-frescas.jpg";
import arrachera from "@/assets/menu-nuevo/arrachera.jpg";
import licuados from "@/assets/menu-nuevo/licuados.jpg";
import bistecEncebollado from "@/assets/menu-nuevo/bistec-encebollado.jpg";
import burritos from "@/assets/menu-nuevo/burritos.jpg";
import caldoDeRes from "@/assets/menu-nuevo/caldo-de-res.jpg";
import camarones from "@/assets/menu-nuevo/camarones.jpg";
import carneAsadaEnchilada from "@/assets/menu-nuevo/carne-asada-enchilada.jpg";
import cecinaNopales from "@/assets/menu-nuevo/cecina-nopales.jpg";
import cemitas from "@/assets/menu-nuevo/cemitas.jpg";
import chalupas from "@/assets/menu-nuevo/chalupas.jpg";
import chilaquiles from "@/assets/menu-nuevo/chilaquiles.jpg";
import chilesRellenos from "@/assets/menu-nuevo/chiles-rellenos.jpg";
import chuletaFrita from "@/assets/menu-nuevo/chuleta-frita.jpg";
import postres from "@/assets/menu-nuevo/postres.jpg";
import enchiladas from "@/assets/menu-nuevo/enchiladas.jpg";
import fajitas from "@/assets/menu-nuevo/fajitas.jpg";
import fileteAsado from "@/assets/menu-nuevo/filete-asado.jpg";
import flautas from "@/assets/menu-nuevo/flautas.jpg";
import hamburguesas from "@/assets/menu-nuevo/hamburguesas.jpg";
import huarache from "@/assets/menu-nuevo/huarache.jpg";
import kidsMeal from "@/assets/menu-nuevo/kids-meal.jpg";
import milanesa from "@/assets/menu-nuevo/milanesa.jpg";
import mojarraFrita from "@/assets/menu-nuevo/mojarra-frita.jpg";
import molcajete from "@/assets/menu-nuevo/molcajete.jpg";
import molePoblano from "@/assets/menu-nuevo/mole-poblano.jpg";
import nachos from "@/assets/menu-nuevo/nachos.jpg";
import pancita from "@/assets/menu-nuevo/pancita.jpg";
import pechuga from "@/assets/menu-nuevo/pechuga.jpg";
import pozole from "@/assets/menu-nuevo/pozole.jpg";
import quesadillas from "@/assets/menu-nuevo/quesadillas.jpg";
import acompanantes from "@/assets/menu-nuevo/acompanantes.jpg";
import sopes from "@/assets/menu-nuevo/sopes.jpg";
import quesadillaMachete from "@/assets/menu-nuevo/quesadilla-machete.jpg";
import tacosOrientales from "@/assets/menu-nuevo/tacos-orientales.jpg";
import tacosPlaceros from "@/assets/menu-nuevo/tacos-placeros.jpg";
import tacos from "@/assets/menu-nuevo/tacos.jpg";
import tacosArabes from "@/assets/menu-nuevo/tacos-arabes.jpg";
import taquitos from "@/assets/menu-nuevo/taquitos.jpg";
import tortaCubana from "@/assets/menu-nuevo/torta-cubana.jpg";
import tortas from "@/assets/menu-nuevo/tortas.jpg";
import tostadas from "@/assets/menu-nuevo/tostadas.jpg";

export interface ModifierOption {
  name: string;
  price: number;
}

export interface ModifierGroup {
  name: string;
  required: boolean;
  min: number;
  max: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  groups: ModifierGroup[];
  /** Compatibilidad con el panel 86 de cocina */
  isVariant?: boolean;
}

export const menuCategories = [
  "Desayunos / Breakfast",
  "Tacos",
  "Mexican Corner",
  "Platillos Principales / Main Dishes",
  "Mariscos / Seafood",
  "Sopas / Soups",
  "Acompañantes / Sides",
  "Bebidas / Drinks",
];

// ---------- Grupos reutilizados ----------

const opt = (name: string, price = 0): ModifierOption => ({ name, price });

const group = (
  name: string,
  required: boolean,
  min: number,
  max: number,
  options: ModifierOption[],
): ModifierGroup => ({ name, required, min, max, options });

/** Carnes estándar con sus recargos (lengua, cabeza y tripa +$2). */
const BASE_MEATS: [string, number][] = [
  ["Lengua / Beef Tongue", 2],
  ["Birria", 0],
  ["Al Pastor / Marinated Pork", 0],
  ["Pollo Asado / Grilled Chicken", 0],
  ["Cecina / Salty Beef", 0],
  ["Cabeza / Beef Head", 2],
  ["Carne Asada / Grilled Beef", 0],
  ["Carnitas / Fried Pork", 0],
  ["Tinga / Spicy Chicken", 0],
  ["Tripa / Beef Tripe", 2],
  ["Pollo / Chicken", 0],
  ["Cochinita Pibil", 0],
  ["Suadero / Beef & Trimmed Mix", 0],
  ["Buche / Pork", 0],
  ["Bistec / Steak", 0],
  ["Camarones / Shrimp", 0],
  ["Enchilada / Spicy Pork", 0],
  ["Longaniza / Pork Sausage", 0],
  ["Cueritos / Pork Skin", 0],
  ["Oreja / Ear Pork", 0],
  ["Chuleta / Pork", 0],
  ["Vegetariana / Veggie", 0],
  ["Pata de Res / Beef Feet", 0],
];

/** Lista completa de carnes (precio incluido en el plato). */
const meats = (opts: { noBirria?: boolean } = {}) =>
  BASE_MEATS.filter(([n]) => !(opts.noBirria && n === "Birria")).map(([n, p]) => opt(n, p));

/**
 * Carnes como recargo: "Vegetariana"/"Regular" sin costo primero,
 * luego cada carne cuesta `surcharge` (+$2 extra en lengua, cabeza y tripa).
 */
const meatsWithSurcharge = (firstOption: string, surcharge: number) => [
  opt(firstOption, 0),
  ...BASE_MEATS.filter(([n]) => n !== "Vegetariana / Veggie").map(([n, p]) => opt(n, p + surcharge)),
];

const MILANESAS = [
  "Milanesa de Res / Breaded Beef",
  "Milanesa de Puerco / Breaded Pork",
  "Milanesa de Pollo / Breaded Chicken",
];

const ADD_MEAT = group("Agrega Carne / Add Meat", false, 0, 1, [
  opt("Pollo / Chicken", 5),
  opt("Bistec / Steak", 5),
  opt("Cecina / Salty Beef", 5),
]);

const TWO_SIDES = group("Elige 2 Acompañantes / Choose 2 Sides", true, 2, 2, [
  opt("Arroz / Rice"),
  opt("Frijoles / Beans"),
  opt("Ensalada / Salad"),
  opt("Papas Fritas / French Fries"),
]);

const EXTRA_OPTIONS = {
  horchata: opt("Horchata (20 oz)", 5),
  flan: opt("Flan Regular", 5),
  guac: opt("Guacamole & Chips", 7),
  riceBeans: opt("Rice & Beans", 7),
};

const EXTRAS = group("Ricos Extras / Extras", false, 0, 4, Object.values(EXTRA_OPTIONS));

const extrasWithout = (key: keyof typeof EXTRA_OPTIONS) => {
  const { [key]: removed, ...rest } = EXTRA_OPTIONS;
  return group(`Ricos Extras sin ${removed.name} / Extras`, false, 0, 3, Object.values(rest));
};

const SOUP_SIZE = group("Tamaño de Sopa / Soup Size", true, 1, 1, [
  opt("Pequeño / Small"),
  opt("Grande / Large", 6),
]);

const SPECIAL_FLAVORS = group("Sabores Especiales / Special Flavors", false, 0, 3, [
  opt("Huitlacoche / Corn Truffle", 2),
  opt("Flor de Calabaza / Squash Blossom", 2),
  opt("Hongos / Mushrooms", 2),
]);

// ---------- Menú ----------

const BREAKFAST = "Desayunos / Breakfast";
const TACOS = "Tacos";
const CORNER = "Mexican Corner";
const MAINS = "Platillos Principales / Main Dishes";
const SEAFOOD = "Mariscos / Seafood";
const SOUPS = "Sopas / Soups";
const SIDES = "Acompañantes / Sides";
const DRINKS = "Bebidas / Drinks";

export const menuItems: MenuItem[] = [
  // Desayunos / Breakfast
  {
    id: "huevos-al-gusto",
    name: "Huevos al Gusto / Eggs Your Way",
    description: "Huevos con arroz, frijoles y tortillas. / Eggs with rice, beans and tortillas.",
    price: 12,
    category: BREAKFAST,
    groups: [
      group("Estilo de Huevos / Egg Style", true, 1, 1, [
        opt("Con Jamón / With Ham"),
        opt("Con Chorizo / With Chorizo"),
        opt("A la Mexicana / Jalapeños, Onions & Tomato"),
        opt("Con Salchicha / With sausage"),
        opt("Rancheros / Over Tortillas with Salsa"),
      ]),
      ADD_MEAT,
      EXTRAS,
    ],
  },
  {
    id: "chilaquiles",
    name: "Chilaquiles",
    description: "Totopos en salsa con crema, cebolla y queso. / Tortilla chips in salsa with cream, onions and cheese.",
    price: 11.95,
    category: BREAKFAST,
    image: chilaquiles,
    groups: [
      group("Salsa de Chilaquiles / Chilaquiles Sauce", true, 1, 1, [opt("Verdes / Green"), opt("Rojos / Red")]),
      group("Estilo de Chilaquiles / Chilaquiles Style", true, 1, 1, [
        opt("Regulares / Plain"),
        opt("Con Huevos / With Eggs", 3),
      ]),
      ADD_MEAT,
      EXTRAS,
    ],
  },

  // Tacos
  {
    id: "tacos",
    name: "Tacos",
    description: "Taco en tortilla de maíz con cebolla y cilantro. Salsa aparte. Elige tu carne. / Corn tortilla taco with onions and cilantro. Salsa on the side. Choose your meat.",
    price: 5,
    category: TACOS,
    image: tacos,
    groups: [group("Elige tu Carne / Choose your Meat", true, 1, 1, meats()), EXTRAS],
  },
  {
    id: "tacos-arabes",
    name: "Tacos Árabes / Arab Tacos",
    description: "Taco estilo árabe en tortilla de harina con salsa de chipotle. Elige tu carne. / Arab-style taco on a flour tortilla with chipotle sauce. Choose your meat.",
    price: 5,
    category: TACOS,
    image: tacosArabes,
    groups: [group("Elige tu Carne / Choose your Meat", true, 1, 1, meats()), EXTRAS],
  },
  {
    id: "tacos-orientales",
    name: "Tacos Orientales / Oriental Tacos",
    description: "Taco estilo oriental de carne de puerco sazonada, en tortilla de maíz con salsa de chipotle. / Oriental-style seasoned pork taco on a corn tortilla with chipotle sauce.",
    price: 5,
    category: TACOS,
    image: tacosOrientales,
    groups: [
      group("Carne Oriental / Oriental Meat", true, 1, 1, [opt("Carne de Puerco Sazonada / Seasoned Pork")]),
      EXTRAS,
    ],
  },
  {
    id: "taquitos",
    name: "Taquitos (Orden de 2) / Small Tacos (Order of 2)",
    description: "Orden de 2 taquitos con cebolla y cilantro. Elige tu carne. / Order of 2 small tacos with onions and cilantro. Choose your meat.",
    price: 6,
    category: TACOS,
    image: taquitos,
    groups: [
      group("Elige tu Carne sin Birria / Choose your Meat (no Birria)", true, 1, 1, meats({ noBirria: true })),
      EXTRAS,
    ],
  },
  {
    id: "tacos-placeros",
    name: "Tacos Placeros",
    description: "Taco en tortilla hecha a mano con arroz, cebolla y rajas. Huevo opcional. De chile relleno, huevo o milanesa de pollo. / Taco on a handmade tortilla with rice, onions and poblano strips. Optional egg. Stuffed pepper, egg or breaded chicken.",
    price: 12,
    category: TACOS,
    image: tacosPlaceros,
    groups: [
      group("Relleno del Placero / Placero Filling", true, 1, 1, [
        opt("Chile Relleno / Stuffed Pepper"),
        opt("Huevo / Egg"),
        opt("Milanesa de Pollo / Breaded Chicken"),
      ]),
      group("¿Con Huevo? / Add Egg?", true, 1, 1, [opt("Sin Huevo / No Egg"), opt("Con Huevo / With Egg")]),
      EXTRAS,
    ],
  },

  // Mexican Corner
  {
    id: "burritos",
    name: "Burritos",
    description: "Tortilla de harina con arroz, frijoles y queso. Incluye ensalada aparte con lechuga, tomate, cebolla, aguacate y rábano. Elige tu carne. / Flour tortilla with rice, beans and cheese. Comes with a side salad of lettuce, tomato, onion, avocado and radish. Choose your meat.",
    price: 16,
    category: CORNER,
    image: burritos,
    groups: [group("Elige tu Carne / Choose your Meat", true, 1, 1, meats()), EXTRAS],
  },
  {
    id: "sopes",
    name: "Sopes",
    description: "Sope con lechuga, tomate, aguacate, crema y queso. Regular $5 o con carne por $1.50 más. / Sope with lettuce, tomato, avocado, sour cream and cheese. Plain $5 or with meat for $1.50 more.",
    price: 5,
    category: CORNER,
    image: sopes,
    groups: [
      group("Agrega Carne +$1.50 / Add Meat +$1.50", true, 1, 1, meatsWithSurcharge("Vegetariana / Veggie", 1.5)),
      EXTRAS,
    ],
  },
  {
    id: "quesadillas",
    name: "Quesadillas",
    description: "Tortilla de maíz hecha a mano con quesillo y tu carne. Regular o con todo (+$2): lechuga, aguacate, queso y crema. / Handmade corn tortilla with Oaxacan cheese and your choice of meat. Regular or loaded (+$2): lettuce, avocado, cheese and sour cream.",
    price: 10,
    category: CORNER,
    image: quesadillas,
    groups: [
      group("Estilo de Quesadilla / Quesadilla Style", true, 1, 1, [
        opt("Regular"),
        opt("Con Todo (lechuga, aguacate, queso, crema) / Loaded", 2),
      ]),
      group("Elige tu Carne / Choose your Meat", true, 1, 1, meats()),
      SPECIAL_FLAVORS,
      EXTRAS,
    ],
  },
  {
    id: "quesadilla-machete",
    name: "Quesadilla Super Big (Machete)",
    description: "Quesadilla gigante tipo machete, foot long (tamaño de un pie de largo), con quesillo y guacamole. Elige tu carne. / Foot-long machete quesadilla with Oaxacan cheese and guacamole. Choose your meat.",
    price: 16,
    category: CORNER,
    image: quesadillaMachete,
    groups: [group("Elige tu Carne / Choose your Meat", true, 1, 1, meats()), SPECIAL_FLAVORS, EXTRAS],
  },
  {
    id: "nachos",
    name: "Nachos",
    description: "Totopos con queso, frijoles, crema, pico de gallo, jalapeños y lechuga. Elige tu carne. / Tortilla chips with cheese, beans, sour cream, pico de gallo, jalapeños and lettuce. Choose your meat.",
    price: 12,
    category: CORNER,
    image: nachos,
    groups: [
      group("Agrega Carne +$1 / Add Meat +$1", true, 1, 1, meatsWithSurcharge("Vegetariana / Veggie", 1)),
      EXTRAS,
    ],
  },
  {
    id: "tostadas",
    name: "Tostadas",
    description: "Tostada con frijoles, lechuga, tomate, aguacate, crema y queso seco. Vegetariana o con carne. / Crispy tostada with beans, lettuce, tomato, avocado, sour cream and queso seco (dry cheese). Veggie or with meat.",
    price: 5,
    category: CORNER,
    image: tostadas,
    groups: [
      group("Agrega Carne +$1 / Add Meat +$1", true, 1, 1, meatsWithSurcharge("Vegetariana / Veggie", 1)),
      EXTRAS,
    ],
  },
  {
    id: "torta-cubana",
    name: "Torta Cubana",
    description: "Pan telera con frijoles, mayonesa, quesillo, tomate, cebolla, aguacate, jalapeño, salchicha, huevo, milanesa de res y jamón. / Telera roll with beans, mayo, Oaxacan cheese, tomato, onion, avocado, jalapeño peppers, hot dog, egg, breaded beef and ham.",
    price: 15,
    category: CORNER,
    image: tortaCubana,
    groups: [
      group("Agrega Milanesa Extra / Add Extra Milanesa", false, 0, 3, MILANESAS.map((n) => opt(n, 3))),
      group("¿Con Pápalo? / Add Papalo?", true, 1, 1, [opt("Sin Pápalo / No Papalo"), opt("Con Pápalo / With Papalo")]),
      EXTRAS,
    ],
  },
  {
    id: "tortas",
    name: "Tortas / Mexican Sandwiches",
    description: "Pan telera con frijoles, mayonesa, quesillo, tomate, aguacate, cebolla y picante. Elige tu carne o milanesa de pollo, res o puerco. / Telera roll with beans, mayo, Oaxacan cheese, tomato, avocado, onion and hot peppers. Choose your meat or a breaded chicken, beef or pork cutlet.",
    price: 12,
    category: CORNER,
    image: tortas,
    groups: [
      group("Elige tu Carne o Milanesa / Choose Meat or Milanesa", true, 1, 1, [
        ...meats(),
        ...MILANESAS.map((n) => opt(n)),
      ]),
      group("Agrega Milanesa Extra / Add Extra Milanesa", false, 0, 3, MILANESAS.map((n) => opt(n, 3))),
      EXTRAS,
    ],
  },
  {
    id: "cemitas",
    name: "Cemitas",
    description: "Pan de cemita con milanesa de pollo, milanesa de res o puerco, frijoles, mayonesa, cebolla, pápalo, aguacate y quesillo. La Cubana (+$3) lleva chorizo, huevo, milanesa, jamón, salchicha, frijoles, mayonesa, tomate, aguacate, chipotle y cebolla. / Cemita roll with breaded chicken, breaded beef or pork, beans, mayo, onion, papalo, avocado and Oaxacan cheese. Cubana (+$3) comes with chorizo, egg, breaded cutlet, ham, hot dog, beans, mayo, tomato, avocado, chipotle and onion.",
    price: 12,
    category: CORNER,
    image: cemitas,
    groups: [
      group("Elige tu Cemita / Choose", true, 1, 1, [
        opt("Milanesa de Pollo / Breaded Chicken"),
        opt("Milanesa de Res / Breaded Beef"),
        opt("De Puerco / Pork"),
        opt("Cubana", 3),
      ]),
      EXTRAS,
    ],
  },
  {
    id: "flautas",
    name: "Flautas (Orden de 3)",
    description: "Orden de 3 flautas de pollo o queso con lechuga, crema, queso, aguacate y tomate. / Order of 3 chicken or cheese flautas with lettuce, sour cream, cheese, avocado and tomato.",
    price: 10,
    category: CORNER,
    image: flautas,
    groups: [
      group("Elige tu Relleno / Choose Filling", true, 1, 1, [opt("Pollo / Chicken"), opt("Queso / Cheese")]),
      EXTRAS,
    ],
  },
  {
    id: "chalupas",
    name: "Chalupas (3 piezas)",
    description: "3 chalupas con salsa roja, verde o ambas, cebolla y queso. Solas o con carne. / 3 chalupas with red, green or both salsas, onion and cheese. Plain or with meat.",
    price: 10,
    category: CORNER,
    image: chalupas,
    groups: [
      group("Agrega Carne +$2 / Add Meat +$2", true, 1, 1, meatsWithSurcharge("Regular (sin carne) / Plain (no meat)", 2)),
      group("Salsa de Chalupas / Chalupa Salsa", true, 1, 1, [
        opt("Roja / Red"),
        opt("Verde / Green"),
        opt("Ambas / Both"),
      ]),
      EXTRAS,
    ],
  },
  {
    id: "huarache",
    name: "Huarache",
    description: "Huarache hecho a mano con frijoles, lechuga, crema, aguacate y queso. Elige tu carne. / Handmade huarache with beans, lettuce, sour cream, avocado and cheese. Choose your meat.",
    price: 10,
    category: CORNER,
    image: huarache,
    groups: [
      group("Agrega Carne +$2 / Add Meat +$2", true, 1, 1, meatsWithSurcharge("Regular (sin carne) / Plain (no meat)", 2)),
      EXTRAS,
    ],
  },
  {
    id: "alambre",
    name: "Alambre",
    description: "Cualquiera de las tres carnes: bistec, al pastor o pollo, con tocino, pimientos, cebolla y queso. Con 2 acompañantes. / Any of the three meats: steak, al pastor or chicken, with bacon, peppers, onions and cheese. With 2 sides.",
    price: 25,
    category: CORNER,
    groups: [
      group("Carne del Alambre / Alambre Meat", true, 1, 1, [
        opt("Bistec / Steak"),
        opt("Al Pastor / Marinated Pork"),
        opt("Pollo / Chicken"),
      ]),
      TWO_SIDES,
      EXTRAS,
    ],
  },
  {
    id: "molcajete",
    name: "Molcajete",
    description: "Pollo, res, chorizo, chuleta, camarón, nopales, queso y guacamole en molcajete. Viene con arroz y frijoles. / Chicken, beef, chorizo, pork chop, shrimp, cactus, cheese and guacamole in a molcajete. Comes with rice and beans.",
    price: 35,
    category: CORNER,
    image: molcajete,
    groups: [EXTRAS],
  },
  {
    id: "hamburguesas",
    name: "Hamburguesas / Burgers",
    description: "Pan, carne, queso cheddar, mayonesa, tomate y lechuga. Regular, Hawaiana (jamón y piña), Ranchera (chorizo y huevo) o Mexicana (jalapeño y cebolla). La Big trae papas y soda en lata. / Bun, beef patty, cheddar, mayo, tomato and lettuce. Regular, Hawaiian (ham & pineapple), Ranch (chorizo & egg) or Mexican (jalapeño & onion). Big comes with fries and a canned soda.",
    price: 15,
    category: CORNER,
    image: hamburguesas,
    groups: [
      group("Sabor de Hamburguesa / Burger Style", true, 1, 1, [
        opt("Regular"),
        opt("Hawaiana / Hawaiian"),
        opt("Ranchera / Ranch Style"),
        opt("Mexicana / Mexican (jalapeño y cebolla)"),
      ]),
      group("Tamaño de Hamburguesa / Burger Size", true, 1, 1, [opt("Regular"), opt("Big", 3)]),
      EXTRAS,
    ],
  },
  {
    id: "enchiladas",
    name: "Enchiladas (Rojas, Verdes o Poblanas)",
    description: "Enchiladas en salsa roja, verde o poblana con crema y queso. Con arroz y ensalada. / Enchiladas in red, green or mole sauce with sour cream and cheese. Served with rice and salad.",
    price: 17,
    category: CORNER,
    image: enchiladas,
    groups: [
      group("Salsa de Enchiladas / Enchilada Sauce", true, 1, 1, [
        opt("Rojas / Red"),
        opt("Verdes / Green"),
        opt("Poblanas / Mole"),
      ]),
      group("Elige tu Relleno / Choose Filling", true, 1, 1, [opt("Pollo / Chicken"), opt("Queso / Cheese")]),
      EXTRAS,
    ],
  },

  // Platillos Principales / Main Dishes
  {
    id: "mole-poblano",
    name: "Mole Poblano",
    description: "Pollo bañado en mole poblano con arroz, frijoles y tortillas. / Chicken topped with mole poblano sauce, served with rice, beans and tortillas.",
    price: 19,
    category: MAINS,
    image: molePoblano,
    groups: [EXTRAS],
  },
  {
    id: "fajitas",
    name: "Fajitas",
    description: "Pollo, carne, camarón o mix con pimientos y cebolla a la plancha. Con tortillas y 2 acompañantes. / Chicken, beef, shrimp or mix with grilled peppers and onions. Served with tortillas and 2 sides.",
    price: 26,
    category: MAINS,
    image: fajitas,
    groups: [
      group("Carne de Fajitas / Fajita Meat", true, 1, 1, [
        opt("Pollo / Chicken"),
        opt("Carne / Beef"),
        opt("Camarones / Shrimp"),
        opt("Mix (Pollo, Carne y Camarón) / Mix (Chicken, Beef & Shrimp)", 5),
      ]),
      TWO_SIDES,
      EXTRAS,
    ],
  },
  {
    id: "bistec",
    name: "Bistec Encebollado o a la Mexicana",
    description: "Bistec de res encebollado, o a la mexicana con cebolla, tomate y chile. Con 2 acompañantes. / Beef steak with onions, or Mexican style with onions, tomato and hot peppers. With 2 sides.",
    price: 17,
    category: MAINS,
    image: bistecEncebollado,
    groups: [
      group("Estilo del Bistec / Steak Style", true, 1, 1, [
        opt("Encebollado (cebolla) / With Onions"),
        opt("A la Mexicana (cebolla, tomate y chile) / Mexican Style"),
      ]),
      TWO_SIDES,
      EXTRAS,
    ],
  },
  {
    id: "pechuga",
    name: "Pechuga Asada, Encebollada o a la Mexicana",
    description: "Pechuga de pollo asada, encebollada o a la mexicana (tomate, chile y cebolla). Con 2 acompañantes. / Grilled chicken breast, with onions, or Mexican style (tomato, peppers and onions). With 2 sides.",
    price: 17,
    category: MAINS,
    image: pechuga,
    groups: [
      group("Estilo de Pechuga / Chicken Breast Style", true, 1, 1, [
        opt("Asada / Grilled"),
        opt("Encebollada / With Onions", 1),
        opt("A la Mexicana (tomate, chile y cebolla) / Mexican Style"),
      ]),
      TWO_SIDES,
      EXTRAS,
    ],
  },
  {
    id: "carne-enchilada",
    name: "Carne Enchilada / Spicy Pork",
    description: "Cerdo enchilado a la parrilla. Con 2 acompañantes. / Grilled chile-marinated pork. With 2 sides.",
    price: 17,
    category: MAINS,
    image: carneAsadaEnchilada,
    groups: [TWO_SIDES, EXTRAS],
  },
  {
    id: "cecina-nopales",
    name: "Cecina con Nopales",
    description: "Cecina de res con nopales asados. Con 2 acompañantes. / Salted beef with grilled cactus. With 2 sides.",
    price: 18,
    category: MAINS,
    image: cecinaNopales,
    groups: [TWO_SIDES, EXTRAS],
  },
  {
    id: "milanesa",
    name: "Milanesa (Pollo, Res o Puerco)",
    description: "Milanesa empanizada de pollo, res o puerco. Con 2 acompañantes. / Breaded chicken, beef or pork cutlet. With 2 sides.",
    price: 17,
    category: MAINS,
    image: milanesa,
    groups: [
      group("Milanesa del Platillo / Cutlet Choice", true, 1, 1, [
        opt("Pollo / Chicken"),
        opt("Res / Beef"),
        opt("Puerco / Pork"),
      ]),
      TWO_SIDES,
      EXTRAS,
    ],
  },
  {
    id: "chuleta-frita",
    name: "Chuleta Frita / Fried Pork Chop",
    description: "Chuleta de cerdo frita. Con 2 acompañantes. / Fried pork chop. With 2 sides.",
    price: 17,
    category: MAINS,
    image: chuletaFrita,
    groups: [TWO_SIDES, EXTRAS],
  },
  {
    id: "carnitas",
    name: "Carnitas / Fried Pork",
    description: "Carnitas de cerdo. Con 2 acompañantes. / Fried pork. With 2 sides.",
    price: 17,
    category: MAINS,
    groups: [TWO_SIDES, EXTRAS],
  },
  {
    id: "chiles-rellenos",
    name: "Chiles Rellenos / Stuffed Peppers",
    description: "Chiles poblanos rellenos de queso. Con 2 acompañantes. / Cheese-stuffed poblano peppers. With 2 sides.",
    price: 19,
    category: MAINS,
    image: chilesRellenos,
    groups: [TWO_SIDES, EXTRAS],
  },
  {
    id: "arrachera",
    name: "Arrachera / Skirt Steak",
    description: "Arrachera a la parrilla. Con 2 acompañantes. / Grilled skirt steak. With 2 sides.",
    price: 29,
    category: MAINS,
    image: arrachera,
    groups: [TWO_SIDES, EXTRAS],
  },
  {
    id: "cochinita-pibil",
    name: "Cochinita Pibil",
    description: "Cerdo en achiote con cebolla morada encurtida y tortillas. Con 2 acompañantes. / Achiote-marinated pork with pickled red onion and tortillas. With 2 sides.",
    price: 25,
    category: MAINS,
    groups: [TWO_SIDES, EXTRAS],
  },

  // Mariscos / Seafood
  {
    id: "camarones",
    name: "Camarones al Gusto / Shrimp Any Style",
    description: "Camarones preparados a tu gusto: a la diabla, al mojo de ajo o empanizados. Con 2 acompañantes. / Shrimp your way: deviled, garlic or breaded. With 2 sides.",
    price: 26,
    category: SEAFOOD,
    image: camarones,
    groups: [
      group("Estilo de Camarones / Shrimp Style", true, 1, 1, [
        opt("A la Diabla / Deviled"),
        opt("Al Mojo de Ajo / Garlic"),
        opt("Empanizados / Breaded"),
      ]),
      TWO_SIDES,
      EXTRAS,
    ],
  },
  {
    id: "filete-pescado",
    name: "Filete de Pescado (Asado o Empanizado)",
    description: "Filete de pescado a la plancha o empanizado. Con 2 acompañantes. / Grilled or breaded fish fillet. With 2 sides.",
    price: 26,
    category: SEAFOOD,
    image: fileteAsado,
    groups: [
      group("Estilo del Filete / Fillet Style", true, 1, 1, [opt("Asado / Grilled"), opt("Empanizado / Breaded")]),
      TWO_SIDES,
      EXTRAS,
    ],
  },
  {
    id: "mojarra-frita",
    name: "Mojarra Frita / Fried Porgie",
    description: "Mojarra entera frita. Con 2 acompañantes. / Whole fried porgie. With 2 sides.",
    price: 26,
    category: SEAFOOD,
    image: mojarraFrita,
    groups: [TWO_SIDES, EXTRAS],
  },
  {
    id: "coctel-camarones",
    name: "Cóctel de Camarones / Shrimp Cocktail",
    description: "Camarones en salsa de cóctel con aguacate, cebolla, cilantro y galletas. Sin acompañantes. / Shrimp cocktail with avocado, onion, cilantro and crackers. No sides included.",
    price: 19,
    category: SEAFOOD,
    groups: [EXTRAS],
  },

  // Sopas / Soups
  {
    id: "pozole",
    name: "Pozole",
    description: "Pozole blanco de maíz con cerdo. Pequeño o grande. / White hominy soup with pork. Small or large.",
    price: 9,
    category: SOUPS,
    image: pozole,
    groups: [SOUP_SIZE, EXTRAS],
  },
  {
    id: "pancita",
    name: "Pancita",
    description: "Pancita de res en caldo de guajillo. Pequeña o grande. / Beef tripe in guajillo broth. Small or large.",
    price: 9,
    category: SOUPS,
    image: pancita,
    groups: [SOUP_SIZE, EXTRAS],
  },
  {
    id: "birria-sopa",
    name: "Birria",
    description: "Birria de res en su consomé, con tortillas. / Beef birria in its consommé, served with tortillas.",
    price: 17,
    category: SOUPS,
    groups: [EXTRAS],
  },
  {
    id: "caldo-de-res",
    name: "Caldo de Res / Beef Soup",
    description: "Caldo de res tradicional con calabaza, ejote, elote y papa. Tamaño grande. / Traditional beef soup with squash, green beans, corn and potato. Large.",
    price: 17,
    category: SOUPS,
    image: caldoDeRes,
    groups: [EXTRAS],
  },
  {
    id: "mole-de-olla",
    name: "Mole de Olla / Spicy Beef Stew",
    description: "Mole de olla de res con chile guajillo o costeño, calabaza, ejote, elote y papa. Tamaño grande. / Beef stew in guajillo or costeño chile broth with squash, green beans, corn and potato. Large.",
    price: 17,
    category: SOUPS,
    groups: [EXTRAS],
  },

  // Acompañantes / Sides
  {
    id: "acompanantes",
    name: "Acompañantes / Sides",
    description: "Orden de tortillas de maíz (5 piezas), nopales asados, pico de gallo (8 oz), guacamole con chips, arroz, frijoles (8 oz), pan tostado, queso fresco, crema o cebolla cambray. / Order of corn tortillas (5 pieces), grilled cactus, pico de gallo (8 oz), guacamole & chips, rice, beans (8 oz), toasted bread, queso fresco, sour cream or cambray onions.",
    price: 2,
    category: SIDES,
    image: acompanantes,
    groups: [
      group("Elige tu Acompañante / Choose Side", true, 1, 6, [
        opt("Tortillas de Maíz (5 piezas) / Corn Tortillas (5 pieces)"),
        opt("Nopales / Grilled Cactus", 2),
        opt("Pico de Gallo (8 oz)", 2),
        opt("Guacamole con Chips / Guacamole & Chips", 5),
        opt("Arroz / Rice", 2),
        opt("Frijoles (8 oz) / Beans (8 oz)", 2),
        opt("Pan Tostado / Toasted Bread", 2),
        opt("Queso Fresco / Fresh Cheese", 2),
        opt("Crema / Sour Cream", 2),
        opt("Cebolla Cambray / Cambray Onions", 2),
      ]),
      extrasWithout("guac"),
    ],
  },
  {
    id: "postres",
    name: "Postres / Desserts",
    description: "Gelatina de agua, flan casero, flan regular, pastel de tres leches o gelatina mosaico. / Water jello, homemade flan, regular flan, tres leches cake or mosaic jello.",
    price: 3,
    category: SIDES,
    image: postres,
    groups: [
      group("Elige tu Postre / Choose Dessert", true, 1, 1, [
        opt("Gelatina de Agua / Water Jello"),
        opt("Flan Casero / Homemade Flan", 2),
        opt("Flan Regular", 2),
        opt("Tres Leches", 2),
        opt("Gelatina Mosaico / Mosaic Jello", 2),
      ]),
      extrasWithout("flan"),
    ],
  },
  {
    id: "kids-meal",
    name: "Kids Meal",
    description: "Combo infantil con papas fritas: 5 tenders, quesadilla de pollo, 7 nuggets, salchipapas o 5 alitas. / Kids meal with fries: 5 chicken tenders, chicken quesadilla, 7 nuggets, salchipapas or 5 wings.",
    price: 12,
    category: SIDES,
    image: kidsMeal,
    groups: [
      group("Elige tu Combo / Choose Meal", true, 1, 1, [
        opt("5 Tenders & Fries"),
        opt("Chicken Quesadilla & Fries"),
        opt("7 Nuggets & Fries"),
        opt("Salchi-Papas"),
        opt("5 Wings & Fries"),
      ]),
      group("Sabor de Alitas / Wing Flavor (solo alitas / wings only)", false, 0, 1, [
        opt("BBQ"),
        opt("Buffalo"),
        opt("Mango Habanero"),
        opt("Pork Rib BBQ"),
      ]),
      EXTRAS,
    ],
  },

  // Bebidas / Drinks
  {
    id: "mangonadas",
    name: "Mangonadas",
    description: "Helado de mango con chamoy y chile en polvo. Small o Large. / Mango ice cream with chamoy and chili powder. Small or Large.",
    price: 12,
    category: DRINKS,
    groups: [group("Tamaño de Mangonada / Mangonada Size", true, 1, 1, [opt("Small"), opt("Large", 3)]), EXTRAS],
  },
  {
    id: "licuados",
    name: "Licuados / Smoothies",
    description: "Licuado con leche. Chocomilk, Mamey-Fresa, Plátano o Mango-Papaya. Grande (20 oz) o Extra Grande. / Milk smoothie. Chocomilk, Mamey-Strawberry, Banana or Mango-Papaya. Large (20 oz) or Extra Large.",
    price: 7,
    category: DRINKS,
    image: licuados,
    groups: [
      group("Sabor de Licuado / Smoothie Flavor", true, 1, 1, [
        opt("Chocomilk"),
        opt("Mamey-Fresa"),
        opt("Plátano / Banana"),
        opt("Mango-Papaya"),
      ]),
      group("Tamaño de Licuado / Smoothie Size", true, 1, 1, [
        opt("Grande (20 oz) / Large (20 oz)"),
        opt("Extra Grande / Extra Large"),
      ]),
      EXTRAS,
    ],
  },
  {
    id: "aguas-frescas",
    name: "Aguas Frescas",
    description: "Agua fresca de horchata, jamaica, tamarindo o limonada. Regular o Grande. / Horchata, hibiscus, tamarind or lemonade agua fresca. Regular or Large.",
    price: 5,
    category: DRINKS,
    image: aguasFrescas,
    groups: [
      group("Sabor de Agua Fresca / Agua Fresca Flavor", true, 1, 1, [
        opt("Horchata"),
        opt("Jamaica / Hibiscus"),
        opt("Tamarindo / Tamarind"),
        opt("Limonada / Lemonade"),
      ]),
      group("Tamaño de Agua Fresca / Agua Fresca Size", true, 1, 1, [opt("Regular"), opt("Grande / Large", 1)]),
      extrasWithout("horchata"),
    ],
  },
  {
    id: "refrescos",
    name: "Refrescos / Sodas",
    description: "Refresco de lata o refresco mexicano. / Canned soda or Mexican soda.",
    price: 2,
    category: DRINKS,
    groups: [
      group("Elige tu Refresco / Choose Soda", true, 1, 1, [
        opt("Coca-Cola (lata / can)"),
        opt("Pepsi (lata / can)"),
        opt("Sprite (lata / can)"),
        opt("Coca-Cola Mexicana (vidrio / glass)", 1),
        opt("Sangría Señorial", 1),
        opt("Sidral Mundet", 1),
        opt("Squirt", 1),
        opt("Boing de Mango / Mango Boing", 1),
      ]),
      EXTRAS,
    ],
  },
  {
    id: "jarritos",
    name: "Jarritos",
    description: "Refresco mexicano Jarritos. Varios sabores. / Jarritos Mexican soda. Several flavors.",
    price: 3,
    category: DRINKS,
    groups: [
      group("Sabor de Jarritos / Jarritos Flavor", true, 1, 1, [
        opt("Mandarina / Tangerine"),
        opt("Tamarindo / Tamarind"),
        opt("Fruit Punch / Ponche de Frutas"),
        opt("Limón / Lime"),
        opt("Toronja / Grapefruit"),
        opt("Piña / Pineapple"),
      ]),
      EXTRAS,
    ],
  },
];
