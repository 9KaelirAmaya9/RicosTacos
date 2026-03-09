// Translations for menu items
export const menuItemTranslations: Record<string, { 
  nameEn?: string; 
  descriptionEn?: string; 
  nameEs: string; 
  descriptionEs: string 
}> = {
  // Desayunos Mexicanos (Mexican Breakfasts)
  "d01": { 
    nameEn: "Ricos Tacos Breakfast", 
    descriptionEn: "Eggs any style with tortillas, rice, beans and your choice of meat",
    nameEs: "Desayuno Ricos Tacos", 
    descriptionEs: "Huevos al gusto con tortillas, arroz, frijoles y tu elección de carne" 
  },
  "to7": { 
    nameEn: "Ham and Eggs", 
    descriptionEn: "Ham and fluffy scrambled eggs with rice and beans",
    nameEs: "Huevos con Jamón", 
    descriptionEs: "Jamón y huevos revueltos esponjosos con arroz y frijoles" 
  },
  "to8": { 
    nameEn: "Sausage and Eggs", 
    descriptionEn: "Eggs with hot dogs, served with rice and beans",
    nameEs: "Huevos con Salchicha", 
    descriptionEs: "Huevos con salchichas, servidos con arroz y frijoles" 
  },
  "to9": { 
    nameEn: "Chorizo with Eggs", 
    descriptionEn: "Mexican sausage with eggs, rice and beans",
    nameEs: "Huevos con Chorizo", 
    descriptionEs: "Chorizo mexicano con huevos, arroz y frijoles" 
  },
  "d02": { 
    nameEn: "Mexican-Style Eggs", 
    descriptionEn: "Eggs with jalapeño, onions, and tomato, served with rice and beans",
    nameEs: "Huevos a la Mexicana", 
    descriptionEs: "Huevos con jalapeño, cebolla y tomate, servidos con arroz y frijoles" 
  },
  "d03": { 
    nameEn: "Ranchero Eggs", 
    descriptionEn: "Fried eggs over tortillas topped with salsa, served with rice and beans",
    nameEs: "Huevos Rancheros", 
    descriptionEs: "Huevos fritos sobre tortillas con salsa, servidos con arroz y frijoles" 
  },
  "d04": { 
    nameEn: "Regular Chilaquiles with Eggs", 
    descriptionEn: "Crispy tortilla chips in salsa with fried eggs, cream, onions and cheese",
    nameEs: "Chilaquiles Regulares con Huevos", 
    descriptionEs: "Totopos crujientes en salsa con huevos fritos, crema, cebolla y queso" 
  },
  "p12": { 
    nameEn: "Chilaquiles with Meat", 
    descriptionEn: "Crispy tortilla chips in salsa with grilled beef and fried eggs",
    nameEs: "Chilaquiles con Carne", 
    descriptionEs: "Totopos crujientes en salsa con carne asada y huevos fritos" 
  },
  "d05": { 
    nameEn: "Chilaquiles with Meat and Eggs", 
    descriptionEn: "Crispy tortilla chips in salsa with meat and fried eggs, cream, onions and cheese",
    nameEs: "Chilaquiles con Carne y Huevos", 
    descriptionEs: "Totopos crujientes en salsa con carne y huevos fritos, crema, cebolla y queso" 
  },
  "b5": { 
    nameEn: "Chorizo Burrito", 
    descriptionEn: "Spicy Mexican sausage with eggs, beans, and cheese",
    nameEs: "Burrito Chorizo", 
    descriptionEs: "Chorizo mexicano picante con huevos, frijoles y queso" 
  },

  // Carnes/Meats (for Tacos)
  "m1": { nameEs: "Al Pastor", descriptionEs: "Jugoso cerdo marinado con piña, asado a la perfección en el trompo" },
  "m2": { nameEs: "Bistec", descriptionEs: "Bistec de res a la parrilla, sazonado simplemente para resaltar el sabor" },
  "m3": { nameEs: "Carnitas", descriptionEs: "Cerdo frito con bordes crujientes que se deshace en la boca, el máximo confort" },
  "m4": { nameEs: "Cecina", descriptionEs: "Carne de res salada en rodajas finas, asada a la perfección ahumada" },
  "m5": { nameEs: "Pollo Asado", descriptionEs: "Pollo ahumado a la parrilla con perfección carbonizada" },
  "m6": { nameEs: "Lengua", descriptionEs: "Tierna lengua de res que se deshace en la boca, perfectamente sazonada" },
  "m7": { nameEs: "Cabeza", descriptionEs: "Suculenta carne de cabeza de res, increíblemente tierna y sabrosa" },
  "m8": { nameEs: "Suadero", descriptionEs: "Tierna falda de res, cocida lentamente hasta que se deshace" },
  "m9": { nameEs: "Tripa", descriptionEs: "Tripa de res frita y crujiente con un crujido satisfactorio" },
  "m10": { nameEs: "Buche", descriptionEs: "Tierno estómago de cerdo, crujiente por fuera y suave por dentro" },
  "m11": { nameEs: "Enchilada", descriptionEs: "Cerdo picante marinado en chile con un toque picante" },
  "m12": { nameEs: "Longaniza", descriptionEs: "Sabrosa salchicha mexicana de cerdo con especias aromáticas" },
  "m13": { nameEs: "Cueritos", descriptionEs: "Piel de cerdo encurtida y ácida con una textura deliciosa" },
  "m14": { nameEs: "Picadillo de Res", descriptionEs: "Abundante guiso de carne molida con papas y especias cálidas" },
  "m15": { nameEs: "Oreja", descriptionEs: "Oreja de cerdo crujiente con increíble textura y sabor" },

  // Tacos (Specialty)
  "t1": { nameEs: "Cochinita Pibil", descriptionEs: "Cerdo rostizado lentamente marinado en cítricos y achiote, tierno y aromático" },
  "t2": { nameEs: "Birria", descriptionEs: "Rica carne de res cocida a fuego lento en caldo de chile sabroso, perfectamente sazonada" },
  "t16": { nameEs: "Tacos Arabes", descriptionEs: "Cerdo inspirado en Oriente Medio envuelto en tortilla de harina" },
  "t18": { nameEs: "Barbachera", descriptionEs: "Carne tradicional de barbacoa, tierna y aromática" },
  "t19": { nameEs: "Carne Azada", descriptionEs: "Bistec asado a la llama con carbón ahumado y sabor audaz" },
  "t21": { nameEs: "Chillo", descriptionEs: "Filete de pescado fresco, ligeramente sazonado y perfectamente asado" },
  
  // Taquitos
  "tq1": { nameEs: "Al Pastor", descriptionEs: "Jugoso cerdo marinado con piña en tortilla suave" },
  "tq2": { nameEs: "Carnitas", descriptionEs: "Cerdo frito crujiente y tierno en un taco suave" },
  "tq3": { nameEs: "Suadero", descriptionEs: "Falda de res que se deshace en la boca, simplemente deliciosa" },
  "tq4": { nameEs: "Enchilada", descriptionEs: "Cerdo picante frotado con chile con sabores audaces" },
  "tq5": { nameEs: "Longaniza", descriptionEs: "Salchicha de cerdo aromática con sazonadores tradicionales" },
  "tq6": { nameEs: "Buche", descriptionEs: "Estómago de cerdo crujiente y tierno, único y delicioso" },
  "tq7": { nameEs: "Bistec", descriptionEs: "Bistec de res simplemente asado, clásico y satisfactorio" },
  "tq8": { nameEs: "Cueritos", descriptionEs: "Piel de cerdo encurtida y ácida, refrescante y picante" },
  "tq9": { nameEs: "Pollo Asada", descriptionEs: "Pollo a la parrilla con bondad ahumada" },
  "tq10": { nameEs: "Cecina", descriptionEs: "Carne de res salada en rodajas finas, ahumada y sabrosa" },
  
  // Tostadas
  "ts1": { nameEs: "Birria", descriptionEs: "Rica carne de res cocida en tortilla crujiente con ingredientes frescos" },
  "ts2": { nameEs: "Al Pastor", descriptionEs: "Cerdo marinado con piña sobre una base crujiente" },
  "ts3": { nameEs: "Lengua", descriptionEs: "Tierna lengua de res con frijoles, lechuga y crema" },
  "ts4": { nameEs: "Cabeza", descriptionEs: "Suculenta carne de cabeza de res, en capas con ingredientes frescos" },
  "ts5": { nameEs: "Carnitas", descriptionEs: "Cerdo crujiente con frijoles, lechuga y salsa picante" },
  "ts6": { nameEs: "Suadero", descriptionEs: "Tierna falda de res en concha crujiente con todos los ingredientes" },
  "ts7": { nameEs: "Enchilada", descriptionEs: "Cerdo picante con ingredientes frescos para un equilibrio perfecto" },
  "ts8": { nameEs: "Longaniza", descriptionEs: "Salchicha sabrosa con vegetales frescos y crema" },
  "ts9": { nameEs: "Bistec", descriptionEs: "Bistec de res a la parrilla con los ingredientes tradicionales" },
  "ts10": { nameEs: "Pollo Asada", descriptionEs: "Pollo ahumado en tortilla crujiente" },
  "ts11": { nameEs: "Tinga", descriptionEs: "Pollo desmenuzado en salsa de tomate chipotle picante" },
  "ts12": { nameEs: "Pata", descriptionEs: "Tierna pata de cerdo con vegetales frescos" },
  "ts13": { nameEs: "Picadillo", descriptionEs: "Guiso de carne molida sabroso sobre base crujiente" },
  "ts14": { nameEs: "Vegetariana", descriptionEs: "Frijoles, aguacate, lechuga y salsa fresca" },
  "ts15": { nameEs: "Camarones", descriptionEs: "Camarones jugosos con aguacate y salsa" },
  "ts16": { nameEs: "Cecina", descriptionEs: "Carne de res salada con todos los ingredientes" },
  "ts17": { nameEs: "Arabe", descriptionEs: "Cerdo estilo árabe en tortilla crujiente" },
  
  // Tortas
  "to1": { nameEs: "Birria", descriptionEs: "Torta rellena de birria rica con aguacate y jalapeños" },
  "to2": { nameEs: "Milaneza de Res", descriptionEs: "Bistec empanizado con frijoles, aguacate y jalapeños" },
  "to3": { nameEs: "Milaneza de Pollo", descriptionEs: "Pollo empanizado crujiente en bolillo esponjoso" },
  "to4": { nameEs: "Pierna", descriptionEs: "Pierna de cerdo rostizada con todos los ingredientes" },
  "to5": { nameEs: "Pollo", descriptionEs: "Pollo asado con frijoles y aguacate" },
  "to6": { nameEs: "Chuleta", descriptionEs: "Chuleta de cerdo jugosa con ingredientes frescos" },
  "to10": { nameEs: "Cubana", descriptionEs: "Torta suprema con múltiples carnes y todos los ingredientes" },
  "to11": { nameEs: "Tinga", descriptionEs: "Pollo desmenuzado en salsa chipotle" },
  "to12": { nameEs: "Cecina", descriptionEs: "Carne de res salada en bolillo tradicional" },
  "to13": { nameEs: "Arabe", descriptionEs: "Cerdo estilo árabe con especias" },
  "to14": { nameEs: "Carnitas", descriptionEs: "Cerdo crujiente con todos los ingredientes" },
  "to15": { nameEs: "Pastor", descriptionEs: "Cerdo al pastor con piña y aguacate" },
  
  // Burritos
  "b1": { nameEs: "Birria", descriptionEs: "Burrito grande relleno de birria rica con arroz y frijoles" },
  "b2": { nameEs: "Pollo", descriptionEs: "Pollo asado con arroz, frijoles y salsa" },
  "b3": { nameEs: "Bistec Asado", descriptionEs: "Bistec de res con todos los ingredientes" },
  "b4": { nameEs: "Carnitas", descriptionEs: "Cerdo crujiente envuelto con arroz y frijoles" },
  "b6": { nameEs: "Lengua", descriptionEs: "Lengua tierna con arroz y frijoles" },
  "b7": { nameEs: "Al Pastor", descriptionEs: "Cerdo al pastor con piña y todos los ingredientes" },
  "b8": { nameEs: "Picadillo de Res", descriptionEs: "Guiso de carne molida con arroz y frijoles" },
  "b9": { nameEs: "Vegetariano", descriptionEs: "Frijoles, arroz, lechuga, aguacate y salsa" },
  "b10": { nameEs: "Cecina", descriptionEs: "Carne de res salada con todos los ingredientes" },
  "b11": { nameEs: "Arabe", descriptionEs: "Cerdo estilo árabe especiado" },
  "b12": { nameEs: "Mole", descriptionEs: "Pollo en salsa de mole rica" },
  
  // Sopas
  "s1": { nameEs: "Pozole Chica", descriptionEs: "Sopa abundante de hominy con cerdo tierno en caldo de chile rojo" },
  "s2": { nameEs: "Pozole Grande", descriptionEs: "Tazón grande de sopa tradicional de hominy, puro confort" },
  "s6": { nameEs: "Birria de Res (Consomé)", descriptionEs: "Rico consomé de res con carne tierna, para mojar" },
  
  // Main Platillos (Main Dishes)
  "p1": { nameEs: "Molcajete", descriptionEs: "Tazón sizzling de piedra volcánica con carnes asadas, nopales y queso" },
  "p2": { nameEs: "Cochinita Pibil", descriptionEs: "Cerdo yucateco rostizado lentamente en marinada de cítricos y achiote con cebollas encurtidas" },
  "p3": { nameEs: "Birria", descriptionEs: "Carne de res tradicional cocida a fuego lento en caldo de chile rico con tortillas" },
  "p4": { nameEs: "Ricos Chiles Rellenos", descriptionEs: "Chiles poblanos rellenos de queso, en salsa de tomate sabrosa" },
  "p5": { nameEs: "Chuleta de Puerco", descriptionEs: "Chuleta de cerdo jugosa a la parrilla con arroz, frijoles y ensalada" },
  "p6": { nameEs: "Bistec Encebollado", descriptionEs: "Bistec tierno cubierto de cebollas caramelizadas" },
  "p7": { nameEs: "Bistec a la Mexicana", descriptionEs: "Bistec salteado con tomates, jalapeños y cebollas" },
  "p8": { nameEs: "Bistec de Pollo a la Mexicana", descriptionEs: "Pechuga de pollo con tomates, pimientos y especias audaces" },
  "p9": { nameEs: "Enchilada Poblanas", descriptionEs: "Tortillas en salsa de mole poblano rico con pollo" },
  "p10": { nameEs: "Enchiladas Rojas", descriptionEs: "Tortillas enrolladas en salsa de chile rojo ahumada con queso derretido" },
  "p11": { nameEs: "Enchiladas Verdes", descriptionEs: "Tortillas en salsa de tomatillo picante con crema y queso" },
  "p13": { nameEs: "Cecina", descriptionEs: "Carne de res salada en rodajas finas, asada con nopales y queso fresco" },
  "p14": { nameEs: "Mojarra Frita", descriptionEs: "Tilapia entera frita, crujiente por fuera y tierna por dentro" },
  "p15": { nameEs: "Coctel de Camarones", descriptionEs: "Cóctel de camarones frío en salsa de tomate picante con aguacate" },
  "p16": { nameEs: "Mole Poblano", descriptionEs: "Pollo en salsa rica de chocolate y chile, un clásico mexicano" },
  "p17": { nameEs: "Pechuga Asada", descriptionEs: "Pechuga de pollo perfectamente asada con guarniciones frescas" },
  "p18": { nameEs: "Carne Azada", descriptionEs: "Bistec asado carbonizado con sabor ahumado y textura tierna" },
  "p19": { nameEs: "Carne Enchilada", descriptionEs: "Cerdo marinado en chile, asado a la perfección picante" },
  "p20": { nameEs: "Camarones a la Diabla", descriptionEs: "Camarones en salsa de chile rojo ardiente, no para los débiles de corazón" },
  "p21": { nameEs: "Camarones al Mojo de Ajo", descriptionEs: "Camarones suculentos en salsa rica de mantequilla de ajo" },
  "p22": { nameEs: "Camarones Empanizados", descriptionEs: "Camarones empanizados crujientes, dorados y deliciosos" },
  "p23": { nameEs: "Filete de Pescado Asado a la Plancha", descriptionEs: "Filete de pescado a la parrilla, simplemente sazonado y perfectamente cocinado" },
  "p24": { nameEs: "Arrachera", descriptionEs: "Arrachera marinada tierna, asada a la perfección jugosa" },
  "p25": { nameEs: "Fajitas", descriptionEs: "Pimientos y cebollas sizzling con tu elección de carne" },
  "p26": { nameEs: "Alambre", descriptionEs: "Carne asada con tocino, pimientos, cebollas y queso derretido" },
  "p27": { nameEs: "Parrilladas", descriptionEs: "Plato de parrillada mixta con carnes surtidas para compartir" },

  // Kids Menu
  "k1": { nameEs: "Papas Fritas", descriptionEs: "Papas fritas doradas clásicas y crujientes" },
  "k2": { nameEs: "Nuggets de Pollo", descriptionEs: "Nuggets de pollo dorados y crujientes" },

  // Side Orders
  "e1": { nameEs: "Quesillo", descriptionEs: "Queso oaxaqueño en tiras, cremoso y suave" },
  "e2": { nameEs: "Pico de Gallo", descriptionEs: "Salsa fresca picada con tomate, cebolla y cilantro" },
  "e3": { nameEs: "Guacamole", descriptionEs: "Dip de aguacate cremoso con lima y especias" },
  "e4": { nameEs: "Nopales", descriptionEs: "Nopales asados, tiernos y picantes" },
  "e5": { nameEs: "Crema", descriptionEs: "Crema agria mexicana, rica y picante" },

  // Fines de Semana (Weekend Specials)
  "w1": { nameEs: "Barbacoa", descriptionEs: "Carne tradicional de barbacoa, cocida lentamente a la perfección" },
  "s3": { nameEs: "Pancita", descriptionEs: "Sopa sabrosa de tripa de res con especias aromáticas" },
  "s5": { nameEs: "Caldo de Camaron (Sopa de Mariscos)", descriptionEs: "Sopa de camarones picante con vegetales, audaz y satisfactoria" },
  
  // Quesadillas
  "a3": { nameEs: "Quesadillas Regular", descriptionEs: "Queso derretido en tortilla hecha a mano, perfección simple" },
  "a4": { nameEs: "Quesadillas Toda", descriptionEs: "Quesadilla cargada con carne y todos los ingredientes" },

  // Antojitos Mexicanos
  "a1": { nameEs: "Especial Tacos Orientales", descriptionEs: "Tacos estilo oriental con mezcla única de especias" },
  "a2": { nameEs: "Cemitas de Milaneza", descriptionEs: "Sándwich poblano con carne empanizada y aguacate" },
  "a5": { nameEs: "Sopas", descriptionEs: "Tortilla de maíz gruesa con frijoles e ingredientes" },
  "a6": { nameEs: "Haurache Grande", descriptionEs: "Base de masa oblonga grande con frijoles, carne y salsa" },
  "a7": { nameEs: "Nachos", descriptionEs: "Totopos crujientes cargados con queso, carne e ingredientes frescos" },
  "a8": { nameEs: "Guacamole w. Chips", descriptionEs: "Dip de aguacate fresco con lima y cilantro, adictivo" },
  "a9": { nameEs: "Tacos Dorados", descriptionEs: "Tacos enrollados crujientes con lechuga, crema y salsa" },
  "a10": { nameEs: "Tacos Plazeros", descriptionEs: "Tacos especiales con elección de carnes e ingredientes" },
  "a11": { nameEs: "Chalupas", descriptionEs: "Masa frita cubierta con carne, salsa y queso" },
  "a13": { nameEs: "Fajitas Arabe", descriptionEs: "Fajitas estilo Medio Oriente con especias aromáticas" },
  
  // Bebidas (Drinks)
  "d1": { nameEs: "Aguas Frescas Med", descriptionEs: "Agua de frutas refrescante, endulzada naturalmente" },
  "d2": { nameEs: "Aguas Frescas Gde", descriptionEs: "Agua de frutas grande y refrescante en sabores de temporada" },
  "d3": { nameEs: "Licuados Chocomilk Reg", descriptionEs: "Licuado cremoso de chocolate con leche, rico y satisfactorio" },
  "d4": { nameEs: "Licuados Chocomilk Large", descriptionEs: "Licuado grande de chocolate, indulgente y delicioso" },
  "d5": { nameEs: "Licuados Mamey Reg", descriptionEs: "Licuado tropical de mamey, cremoso y exótico" },
  "d6": { nameEs: "Licuados Mamey Large", descriptionEs: "Licuado grande de mamey, únicamente delicioso" },
  "d7": { nameEs: "Licuados Fresa Reg", descriptionEs: "Licuado fresco de fresa, dulce y refrescante" },
  "d8": { nameEs: "Licuados Fresa Large", descriptionEs: "Licuado grande de fresa, delicioso" },
  "d9": { nameEs: "Licuados Platano Reg", descriptionEs: "Licuado cremoso de plátano, naturalmente dulce" },
  "d10": { nameEs: "Licuados Platano Large", descriptionEs: "Licuado grande de plátano, suave y satisfactorio" },
  "d11": { nameEs: "Licuados Mango Reg", descriptionEs: "Licuado tropical de mango, vibrante y refrescante" },
  "d12": { nameEs: "Licuados Mango Large", descriptionEs: "Licuado grande de mango, sabor de los trópicos" },
  "d13": { nameEs: "Licuados Papaya Reg", descriptionEs: "Licuado suave de papaya, tropical y saludable" },
  "d14": { nameEs: "Licuados Papaya Large", descriptionEs: "Licuado grande de papaya, refrescante y nutritivo" },
  "d15": { nameEs: "Jugo de Naranja", descriptionEs: "Jugo de naranja recién exprimido, puro sol" },
  "d16": { nameEs: "Limonada", descriptionEs: "Limonada recién exprimida, ácida y refrescante" },
  "d17": { nameEs: "Piña Colada", descriptionEs: "Mezcla tropical de piña y coco, vacaciones en un vaso" },
  "d18": { nameEs: "Refrescos Mexicanos", descriptionEs: "Refrescos mexicanos auténticos en botellas de vidrio" },
  "d19": { nameEs: "Sodas del Pais", descriptionEs: "Refrescos americanos clásicos" },
  
  // Postres
  "de1": { nameEs: "Tres Leches", descriptionEs: "Pastel empapado en tres leches, húmedo y decadente" },
  "de2": { nameEs: "Gelatinas", descriptionEs: "Gelatinas coloridas en varios sabores" },
  "de3": { nameEs: "Flan", descriptionEs: "Postre cremoso de caramelo, suave y rico" },
  "de4": { nameEs: "Cremitas", descriptionEs: "Postres de crema dulce en sabores variados" },
};

import { menuItemNamesEnglish } from "./menuNamesEnglish";

export function getMenuItemName(id: string, language: "en" | "es", defaultName: string): string {
  const translation = menuItemTranslations[id];
  
  if (language === "es") {
    return translation?.nameEs || defaultName;
  }
  
  // For English, use the dedicated English names mapping
  return menuItemNamesEnglish[id] || translation?.nameEn || defaultName;
}

export function getMenuItemDescription(id: string, language: "en" | "es", defaultDescription: string | undefined): string | undefined {
  const translation = menuItemTranslations[id];
  if (!translation) return defaultDescription;
  
  if (language === "es") {
    return translation.descriptionEs;
  }
  return translation.descriptionEn || defaultDescription;
}
