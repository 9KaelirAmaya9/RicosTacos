type TranslationKey = string;
type Translations = Record<TranslationKey, string>;

export const translations: Record<"en" | "es", Translations> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.comida": "Comida",
    "nav.fullMenu": "Full Menu",
    "nav.menuDesc": "Browse our complete selection of authentic dishes",
    "nav.hoursLocation": "Hours & Location",
    "nav.hoursDesc": "Visit us in Brooklyn",
    "nav.orderOnline": "Order Online",
    "nav.location": "Location",
    "nav.cart": "Cart",

    // Homepage
    "home.hero.title1": "Auténtica Cocina",
    "home.hero.title2": "Mexicana",
    "home.hero.subtitle": "Puebla's rich, savory heritage lives on in Sunset Park. Every dish honors centuries of poblano tradition with bold flavors and authentic techniques.",
    "home.hero.orderNow": "Order Now",
    "home.hero.viewMenu": "View Menu",
    
    "home.about.title1": "A Taste of",
    "home.about.title2": "Tradition",
    "home.about.p1": "At Ricos Tacos, we honor the rich culinary heritage of Puebla, Mexico. Each dish is crafted from authentic recipes passed down through generations, featuring natural, locally sourced ingredients that bring out the delectable, savory flavors of traditional poblano cuisine.",
    "home.about.p2": "From our handmade mole poblano with its intricate blend of chiles and spices, to our succulent tacos árabes and chalupas, every bite celebrates the time-honored techniques and fresh ingredients that make Puebla's gastronomy world-renowned.",
    "home.about.exploreMenu": "Explore Our Menu",
    
    "home.why.title": "Why Choose",
    "home.why.titleHighlight": "Ricos Tacos",
    "home.why.subtitle": "Quality, authenticity, and convenience—all in one place",
    
    "home.feature1.title": "Authentic Recipes",
    "home.feature1.desc": "Traditional Mexican recipes made with love and the finest ingredients, bringing you genuine flavors from our kitchen to your table.",
    
    "home.feature2.title": "Fast Delivery",
    "home.feature2.desc": "Quick pickup and delivery options to enjoy our delicious food wherever you are in Brooklyn. Order online for convenience.",
    
    "home.feature3.title": "Catering Available",
    "home.feature3.desc": "Planning an event? We offer full catering services with authentic Mexican dishes perfect for any celebration.",
    
    "home.cta.title": "Ready to Experience Authentic Mexican Cuisine?",
    "home.cta.subtitle": "Order now for pickup or delivery and taste the difference that tradition makes",
    "home.cta.startOrder": "Start Your Order",
    
    "home.footer.tagline1": "Auténtica Comida Mexicana",
    "home.footer.tagline2": "Authentic Mexican Food",
    "home.footer.contact": "Contact",
    "home.footer.hours": "Hours",
    "home.footer.openDays": "Open 7 Days a Week",
    "home.footer.copyright": "All rights reserved.",

    // Menu Page
    "menu.title": "Our",
    "menu.titleHighlight": "Menu",
    "menu.subtitle": "Discover our selection of authentic Mexican dishes, each prepared with traditional recipes and fresh ingredients",
    "menu.notes.title": "Notes",
    "menu.notes.1": "Con Quesillo $1.00 Extra (With Cheese)",
    "menu.notes.2": "Platillos served with arroz, frijoles, ensaladas o papas fritas (Rice, beans, salad, or french fries - choose 2 options)",
    "menu.notes.3": "All orders extras available: Quesillo, Pico de Gallo, Guacamole, Nopales, Crema ($1.00 each)",
    "menu.notes.4": "Catering services available for all occasions - call (917) 370-0430",
    "menu.addToCart": "added to cart",
    "menu.add": "Add",

    // Order Page
    "order.title": "Order",
    "order.titleHighlight": "Online",
    "order.subtitle": "Choose pickup or delivery and start building your order",
    "order.pickup": "Pickup",
    "order.delivery": "Delivery",
    "order.filterBy": "Filter by category:",
    "order.allItems": "All Items",
    "order.addToCart": "Add to Cart",
    "order.yourOrder": "Your Order",
    "order.emptyCart": "Your cart is empty",
    "order.total": "Total:",
    "order.checkout": "Proceed to Checkout",
    "order.deliveryNote": "Delivery fee will be calculated at checkout",
    "order.pickupNote": "Pickup available in 20-30 minutes",
    "order.cartEmpty": "Your cart is empty",
    "order.placed": "Order placed for",

    // Location Page
    "location.title": "Visit",
    "location.titleHighlight": "Us",
    "location.subtitle": "Find us in the heart of Brooklyn. We're ready to serve you authentic Mexican cuisine.",
    "location.locationTitle": "Location",
    "location.address": "Address",
    "location.hoursTitle": "Hours",
    "location.contact": "Contact",
    "location.checkDelivery": "Check Delivery Eligibility",
    "location.verifyDeliveryArea": "Verify Delivery Area",
    "location.checkDeliverySubtext": "We deliver within a 20-minute drive from our restaurant. Enter your address below to verify if delivery is available to your location.",
    "location.deliveryAddressLabel": "Delivery Address",
    "location.services": "Our Services",
    "location.dineIn": "Dine-In",
    "location.dineInDesc": "Enjoy our authentic dishes in our welcoming restaurant atmosphere",
    "location.takeout": "Takeout",
    "location.takeoutDesc": "Quick pickup orders ready in 20-30 minutes",
    "location.freeDelivery": "Free Delivery",
    "location.deliveryDesc": "Free delivery available in the local Brooklyn area",
    "location.catering": "Catering Services",
    "location.cateringTitle": "Planning a special event? We prepare banquets for any occasion.",
    "location.cateringDishes": "Available dishes: Rica Birria, Chiles Rellenos, Flautas (Fried Tacos),",
    "location.cateringDishes2": "Mole, Carnitas, Barbacoa, Mixiotes, Pollo Enchilado, Pico de Gallo,",
    "location.cateringDishes3": "Guacamole c/Chips, Salsa, Ensalada Arroz y Mucho Mas",
    "location.cateringContact": "Contact for Catering (Banquetes)",
    "location.askFor": "Ask for Josefina",

    // Cart Page
    "cart.title": "Your",
    "cart.titleHighlight": "Cart",
    "cart.empty": "Your cart is empty",
    "cart.emptyDesc": "Start adding delicious items from our menu to begin your order",
    "cart.browseMenu": "Browse Menu",

    // Menu Categories
    "category.desayunos": "Mexican Breakfasts",
    "category.tamales": "Tamales",
    "category.carnes": "Meats for Tacos",
    "category.tacos": "Specialty Tacos",
    "category.taquitos": "Small Soft Tacos",
    "category.tostadas": "Crispy Tostadas",
    "category.tortas": "Mexican Sandwiches",
    "category.burritos": "Burritos",
    "category.sopas": "Soups",
    "category.platillos": "Main Dishes",
    "category.kids": "Kids Menu",
    "category.sides": "Side Orders",
    "category.weekend": "Weekend Specials",
    "category.quesadillas": "Quesadillas",
    "category.antojitos": "Mexican Snacks",
    "category.bebidas": "Drinks",
    "category.postres": "Desserts",

    // Common
    "common.browseMenu": "Browse Menu",
    "common.days": "Monday - Sunday",
    "common.hours": "10:00 AM - 10:00 PM",
  },
  es: {
    // Navigation
    "nav.home": "Inicio",
    "nav.comida": "Comida",
    "nav.fullMenu": "Menú Completo",
    "nav.menuDesc": "Explora nuestra selección completa de platillos auténticos",
    "nav.hoursLocation": "Horario y Ubicación",
    "nav.hoursDesc": "Visítanos en Brooklyn",
    "nav.orderOnline": "Ordenar En Línea",
    "nav.location": "Ubicación",
    "nav.cart": "Carrito",

    // Homepage
    "home.hero.title1": "Auténtica Cocina",
    "home.hero.title2": "Mexicana",
    "home.hero.subtitle": "La rica y sabrosa herencia de Puebla vive en Sunset Park. Cada platillo honra siglos de tradición poblana con sabores intensos y técnicas auténticas.",
    "home.hero.orderNow": "Ordenar Ahora",
    "home.hero.viewMenu": "Ver Menú",
    
    "home.about.title1": "Un Sabor de",
    "home.about.title2": "Tradición",
    "home.about.p1": "En Ricos Tacos, honramos la rica herencia culinaria de Puebla, México. Cada platillo se elabora con recetas auténticas transmitidas por generaciones, utilizando ingredientes naturales de origen local que resaltan los sabores deliciosos y sabrosos de la cocina tradicional poblana.",
    "home.about.p2": "Desde nuestro mole poblano hecho a mano con su intrincada mezcla de chiles y especias, hasta nuestros suculentos tacos árabes y chalupas, cada bocado celebra las técnicas tradicionales e ingredientes frescos que hacen de la gastronomía de Puebla reconocida mundialmente.",
    "home.about.exploreMenu": "Explorar Nuestro Menú",
    
    "home.why.title": "Por Qué Elegir",
    "home.why.titleHighlight": "Ricos Tacos",
    "home.why.subtitle": "Calidad, autenticidad y conveniencia—todo en un solo lugar",
    
    "home.feature1.title": "Recetas Auténticas",
    "home.feature1.desc": "Recetas mexicanas tradicionales hechas con amor y los mejores ingredientes, trayendo sabores genuinos de nuestra cocina a tu mesa.",
    
    "home.feature2.title": "Entrega Rápida",
    "home.feature2.desc": "Opciones rápidas de recolección y entrega para disfrutar nuestra deliciosa comida donde quiera que estés en Brooklyn. Ordena en línea para mayor comodidad.",
    
    "home.feature3.title": "Catering Disponible",
    "home.feature3.desc": "¿Planificando un evento? Ofrecemos servicios completos de catering con platillos mexicanos auténticos perfectos para cualquier celebración.",
    
    "home.cta.title": "¿Listo para Experimentar la Auténtica Cocina Mexicana?",
    "home.cta.subtitle": "Ordena ahora para recolección o entrega y prueba la diferencia que hace la tradición",
    "home.cta.startOrder": "Comenzar Tu Orden",
    
    "home.footer.tagline1": "Auténtica Comida Mexicana",
    "home.footer.tagline2": "Authentic Mexican Food",
    "home.footer.contact": "Contacto",
    "home.footer.hours": "Horario",
    "home.footer.openDays": "Abierto 7 Días a la Semana",
    "home.footer.copyright": "Todos los derechos reservados.",

    // Menu Page
    "menu.title": "Nuestro",
    "menu.titleHighlight": "Menú",
    "menu.subtitle": "Descubre nuestra selección de platillos mexicanos auténticos, cada uno preparado con recetas tradicionales e ingredientes frescos",
    "menu.notes.title": "Notas",
    "menu.notes.1": "Con Quesillo $1.00 Extra",
    "menu.notes.2": "Platillos servidos con arroz, frijoles, ensaladas o papas fritas (elegir 2 opciones)",
    "menu.notes.3": "Todos los extras disponibles: Quesillo, Pico de Gallo, Guacamole, Nopales, Crema ($1.00 cada uno)",
    "menu.notes.4": "Servicios de catering disponibles para todas las ocasiones - llame al (917) 370-0430",
    "menu.addToCart": "agregado al carrito",
    "menu.add": "Agregar",

    // Order Page
    "order.title": "Ordenar",
    "order.titleHighlight": "En Línea",
    "order.subtitle": "Elige recolección o entrega y comienza a armar tu orden",
    "order.pickup": "Recolección",
    "order.delivery": "Entrega",
    "order.filterBy": "Filtrar por categoría:",
    "order.allItems": "Todos los Artículos",
    "order.addToCart": "Agregar al Carrito",
    "order.yourOrder": "Tu Orden",
    "order.emptyCart": "Tu carrito está vacío",
    "order.total": "Total:",
    "order.checkout": "Proceder al Pago",
    "order.deliveryNote": "La tarifa de entrega se calculará al finalizar la compra",
    "order.pickupNote": "Recolección disponible en 20-30 minutos",
    "order.cartEmpty": "Tu carrito está vacío",
    "order.placed": "Orden realizada para",

    // Location Page
    "location.title": "Visítanos",
    "location.titleHighlight": "",
    "location.subtitle": "Encuéntranos en el corazón de Brooklyn. Estamos listos para servirte auténtica cocina mexicana.",
    "location.locationTitle": "Ubicación",
    "location.address": "Dirección",
    "location.hoursTitle": "Horario",
    "location.contact": "Contacto",
    "location.checkDelivery": "Verificar Elegibilidad de Entrega",
    "location.verifyDeliveryArea": "Verificar Zona de Entrega",
    "location.checkDeliverySubtext": "Entregamos dentro de un viaje de 20 minutos desde nuestro restaurante. Ingresa tu dirección a continuación para verificar si la entrega está disponible en tu ubicación.",
    "location.deliveryAddressLabel": "Dirección de Entrega",
    "location.services": "Nuestros Servicios",
    "location.dineIn": "Comer Aquí",
    "location.dineInDesc": "Disfruta nuestros platillos auténticos en nuestro acogedor ambiente de restaurante",
    "location.takeout": "Para Llevar",
    "location.takeoutDesc": "Órdenes rápidas de recolección listas en 20-30 minutos",
    "location.freeDelivery": "Entrega Gratis",
    "location.deliveryDesc": "Entrega gratis disponible en el área local de Brooklyn",
    "location.catering": "Servicios de Catering",
    "location.cateringTitle": "¿Planificando un evento especial? Preparamos banquetes para cualquier ocasión.",
    "location.cateringDishes": "Platillos disponibles: Rica Birria, Chiles Rellenos, Flautas,",
    "location.cateringDishes2": "Mole, Carnitas, Barbacoa, Mixiotes, Pollo Enchilado, Pico de Gallo,",
    "location.cateringDishes3": "Guacamole c/Chips, Salsa, Ensalada Arroz y Mucho Mas",
    "location.cateringContact": "Contacto para Catering (Banquetes)",
    "location.askFor": "Preguntar por Josefina",

    // Cart Page
    "cart.title": "Tu",
    "cart.titleHighlight": "Carrito",
    "cart.empty": "Tu carrito está vacío",
    "cart.emptyDesc": "Comienza agregando deliciosos artículos de nuestro menú para comenzar tu orden",
    "cart.browseMenu": "Explorar Menú",

    // Menu Categories
    "category.desayunos": "Desayunos Mexicanos",
    "category.tamales": "Tamales",
    "category.carnes": "Carnes para Tacos",
    "category.tacos": "Tacos Especiales",
    "category.taquitos": "Taquitos",
    "category.tostadas": "Tostadas",
    "category.tortas": "Tortas",
    "category.burritos": "Burritos",
    "category.sopas": "Sopas",
    "category.platillos": "Platillos Principales",
    "category.kids": "Menú Infantil",
    "category.sides": "Guarniciones",
    "category.weekend": "Fines de Semana",
    "category.quesadillas": "Quesadillas",
    "category.antojitos": "Antojitos Mexicanos",
    "category.bebidas": "Bebidas",
    "category.postres": "Postres",

    // Common
    "common.browseMenu": "Explorar Menú",
    "common.days": "Lunes - Domingo",
    "common.hours": "10:00 AM - 10:00 PM",
  }
};


export const getTranslation = (language: "en" | "es", key: string): string => {
  return translations[language][key] || key;
};

// Map English category names to translation keys
const categoryKeyMap: Record<string, string> = {
  "Desayunos Mexicanos": "category.desayunos",
  "Tamales": "category.tamales",
  "Carnes/Meats": "category.carnes",
  "Tacos": "category.tacos",
  "Taquitos": "category.taquitos",
  "Tostadas": "category.tostadas",
  "Tortas": "category.tortas",
  "Burritos": "category.burritos",
  "Sopas": "category.sopas",
  "Main Platillos": "category.platillos",
  "Kids Menu": "category.kids",
  "Side Orders": "category.sides",
  "Fines de Semana": "category.weekend",
  "Quesadillas": "category.quesadillas",
  "Antojitos": "category.antojitos",
  "Bebidas": "category.bebidas",
  "Postres": "category.postres",
};

export const getCategoryTranslation = (language: "en" | "es", categoryName: string): string => {
  const key = categoryKeyMap[categoryName];
  return key ? translations[language][key] : categoryName;
};
