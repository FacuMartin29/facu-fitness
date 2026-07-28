/* =========================================================
   FAC FIT — Datos de Nutrición
   Base de alimentos (comida argentina) + recetas.
   Macros SIEMPRE por 100 g comestible. Los alimentos que se
   cuentan por unidad traen `unit` {label, g} para registrar
   "2 huevos" sin pensar en gramos.
   tags: vegetariano / vegano / sintacc (para filtrar por dieta).
   sem: semáforo base 🟢 verde / 🟡 amarillo / 🔴 rojo.
   ========================================================= */

/* Categorías (para agrupar en el buscador) */
const FOOD_CATS = {
  proteina: "Proteínas",
  lacteo: "Lácteos y huevos",
  carbo: "Cereales y tubérculos",
  legumbre: "Legumbres",
  verdura: "Verduras",
  fruta: "Frutas",
  grasa: "Grasas y frutos secos",
  snack: "Snacks y dulces",
  bebida: "Bebidas",
  suple: "Suplementos",
};

const V = "vegetariano", VG = "vegano", ST = "sintacc";

const FOODS = [
  // ---------- PROTEÍNAS ----------
  { id:"pollo",     name:"Pechuga de pollo",     cat:"proteina", kcal:165, p:31, c:0,  g:3.6, sem:"verde",    tags:[ST] },
  { id:"pollo_muslo",name:"Muslo de pollo",      cat:"proteina", kcal:209, p:26, c:0,  g:11,  sem:"amarillo", tags:[ST] },
  { id:"carne_magra",name:"Carne magra (nalga)", cat:"proteina", kcal:187, p:27, c:0,  g:8,   sem:"verde",    tags:[ST] },
  { id:"carne_pic", name:"Carne picada magra",   cat:"proteina", kcal:215, p:26, c:0,  g:12,  sem:"amarillo", tags:[ST] },
  { id:"cerdo",     name:"Lomo de cerdo",        cat:"proteina", kcal:143, p:26, c:0,  g:4,   sem:"verde",    tags:[ST] },
  { id:"merluza",   name:"Merluza",              cat:"proteina", kcal:90,  p:18, c:0,  g:1.5, sem:"verde",    tags:[ST] },
  { id:"atun",      name:"Atún al natural",      cat:"proteina", kcal:116, p:26, c:0,  g:1,   sem:"verde",    tags:[ST] },
  { id:"salmon",    name:"Salmón",               cat:"proteina", kcal:208, p:20, c:0,  g:13,  sem:"amarillo", tags:[ST] },
  { id:"huevo",     name:"Huevo",                cat:"lacteo",   kcal:155, p:13, c:1.1,g:11,  sem:"verde",    tags:[V,ST], unit:{label:"unidad", g:50} },
  { id:"clara",     name:"Clara de huevo",       cat:"lacteo",   kcal:52,  p:11, c:0.7,g:0.2, sem:"verde",    tags:[V,ST], unit:{label:"clara", g:33} },

  // ---------- LÁCTEOS ----------
  { id:"yog_desc",  name:"Yogur natural descremado", cat:"lacteo", kcal:60, p:5.5, c:7, g:1,  sem:"verde",    tags:[V,ST], unit:{label:"pote", g:190} },
  { id:"yog_griego",name:"Yogur griego",         cat:"lacteo",   kcal:97,  p:9,  c:3.6,g:5,   sem:"verde",    tags:[V,ST], unit:{label:"pote", g:150} },
  { id:"leche_desc",name:"Leche descremada",     cat:"lacteo",   kcal:35,  p:3.4,c:5,  g:0.1, sem:"verde",    tags:[V,ST], unit:{label:"vaso", g:200} },
  { id:"q_untable", name:"Queso untable descremado", cat:"lacteo", kcal:120, p:11, c:4, g:6,  sem:"amarillo", tags:[V,ST] },
  { id:"q_portsalut",name:"Queso port salut",    cat:"lacteo",   kcal:340, p:24, c:2,  g:27,  sem:"amarillo", tags:[V,ST] },
  { id:"ricota",    name:"Ricota",               cat:"lacteo",   kcal:174, p:11, c:3,  g:13,  sem:"amarillo", tags:[V,ST] },
  { id:"cottage",   name:"Queso cottage",        cat:"lacteo",   kcal:98,  p:11, c:3,  g:4,   sem:"verde",    tags:[V,ST] },

  // ---------- CEREALES Y TUBÉRCULOS ----------
  { id:"arroz",     name:"Arroz blanco cocido",  cat:"carbo",    kcal:130, p:2.7,c:28, g:0.3, sem:"amarillo", tags:[V,VG,ST] },
  { id:"arroz_int", name:"Arroz integral cocido",cat:"carbo",    kcal:112, p:2.6,c:23, g:0.9, sem:"verde",    tags:[V,VG,ST] },
  { id:"fideos",    name:"Fideos cocidos",       cat:"carbo",    kcal:158, p:5.8,c:31, g:0.9, sem:"amarillo", tags:[V,VG] },
  { id:"avena",     name:"Avena",                cat:"carbo",    kcal:389, p:17, c:66, g:7,   sem:"verde",    tags:[V,VG] },
  { id:"pan_int",   name:"Pan integral",         cat:"carbo",    kcal:247, p:13, c:41, g:3.4, sem:"amarillo", tags:[V,VG], unit:{label:"rebanada", g:30} },
  { id:"pan_blanco",name:"Pan blanco",           cat:"carbo",    kcal:265, p:9,  c:49, g:3.2, sem:"rojo",     tags:[V,VG], unit:{label:"rebanada", g:30} },
  { id:"papa",      name:"Papa cocida",          cat:"carbo",    kcal:87,  p:2,  c:20, g:0.1, sem:"amarillo", tags:[V,VG,ST] },
  { id:"batata",    name:"Batata cocida",        cat:"carbo",    kcal:90,  p:2,  c:21, g:0.1, sem:"verde",    tags:[V,VG,ST] },
  { id:"polenta",   name:"Polenta cocida",       cat:"carbo",    kcal:85,  p:2,  c:18, g:0.4, sem:"amarillo", tags:[V,VG,ST] },
  { id:"quinoa",    name:"Quinoa cocida",        cat:"carbo",    kcal:120, p:4.4,c:21, g:1.9, sem:"verde",    tags:[V,VG,ST] },
  { id:"gall_arroz",name:"Galletas de arroz",    cat:"carbo",    kcal:387, p:8,  c:81, g:3,   sem:"amarillo", tags:[V,VG,ST], unit:{label:"galleta", g:8} },

  // ---------- LEGUMBRES ----------
  { id:"lentejas",  name:"Lentejas cocidas",     cat:"legumbre", kcal:116, p:9,  c:20, g:0.4, sem:"verde",    tags:[V,VG,ST] },
  { id:"garbanzos", name:"Garbanzos cocidos",    cat:"legumbre", kcal:164, p:9,  c:27, g:2.6, sem:"verde",    tags:[V,VG,ST] },
  { id:"porotos",   name:"Porotos cocidos",      cat:"legumbre", kcal:127, p:9,  c:23, g:0.5, sem:"verde",    tags:[V,VG,ST] },
  { id:"tofu",      name:"Tofu",                 cat:"legumbre", kcal:76,  p:8,  c:1.9,g:4.8, sem:"verde",    tags:[V,VG,ST] },

  // ---------- VERDURAS ----------
  { id:"brocoli",   name:"Brócoli",              cat:"verdura",  kcal:34,  p:2.8,c:7,  g:0.4, sem:"verde",    tags:[V,VG,ST] },
  { id:"espinaca",  name:"Espinaca",             cat:"verdura",  kcal:23,  p:2.9,c:3.6,g:0.4, sem:"verde",    tags:[V,VG,ST] },
  { id:"tomate",    name:"Tomate",               cat:"verdura",  kcal:18,  p:0.9,c:3.9,g:0.2, sem:"verde",    tags:[V,VG,ST], unit:{label:"unidad", g:120} },
  { id:"lechuga",   name:"Lechuga",              cat:"verdura",  kcal:15,  p:1.4,c:2.9,g:0.2, sem:"verde",    tags:[V,VG,ST] },
  { id:"zanahoria", name:"Zanahoria",            cat:"verdura",  kcal:41,  p:0.9,c:10, g:0.2, sem:"verde",    tags:[V,VG,ST], unit:{label:"unidad", g:70} },
  { id:"calabaza",  name:"Calabaza / zapallo",   cat:"verdura",  kcal:26,  p:1,  c:6.5,g:0.1, sem:"verde",    tags:[V,VG,ST] },
  { id:"cebolla",   name:"Cebolla",              cat:"verdura",  kcal:40,  p:1.1,c:9,  g:0.1, sem:"verde",    tags:[V,VG,ST] },
  { id:"morron",    name:"Morrón",               cat:"verdura",  kcal:31,  p:1,  c:6,  g:0.3, sem:"verde",    tags:[V,VG,ST] },
  { id:"champinon", name:"Champiñones",          cat:"verdura",  kcal:22,  p:3.1,c:3.3,g:0.3, sem:"verde",    tags:[V,VG,ST] },

  // ---------- FRUTAS ----------
  { id:"banana",    name:"Banana",               cat:"fruta",    kcal:89,  p:1.1,c:23, g:0.3, sem:"verde",    tags:[V,VG,ST], unit:{label:"unidad", g:120} },
  { id:"manzana",   name:"Manzana",              cat:"fruta",    kcal:52,  p:0.3,c:14, g:0.2, sem:"verde",    tags:[V,VG,ST], unit:{label:"unidad", g:150} },
  { id:"naranja",   name:"Naranja",              cat:"fruta",    kcal:47,  p:0.9,c:12, g:0.1, sem:"verde",    tags:[V,VG,ST], unit:{label:"unidad", g:130} },
  { id:"frutilla",  name:"Frutillas",            cat:"fruta",    kcal:32,  p:0.7,c:7.7,g:0.3, sem:"verde",    tags:[V,VG,ST] },
  { id:"arandano",  name:"Arándanos",            cat:"fruta",    kcal:57,  p:0.7,c:14, g:0.3, sem:"verde",    tags:[V,VG,ST] },
  { id:"pera",      name:"Pera",                 cat:"fruta",    kcal:57,  p:0.4,c:15, g:0.1, sem:"verde",    tags:[V,VG,ST], unit:{label:"unidad", g:150} },

  // ---------- GRASAS Y FRUTOS SECOS ----------
  { id:"aceite",    name:"Aceite de oliva",      cat:"grasa",    kcal:884, p:0,  c:0,  g:100, sem:"amarillo", tags:[V,VG,ST], unit:{label:"cucharada", g:10} },
  { id:"palta",     name:"Palta",                cat:"grasa",    kcal:160, p:2,  c:9,  g:15,  sem:"amarillo", tags:[V,VG,ST], unit:{label:"1/2 unidad", g:100} },
  { id:"almendras", name:"Almendras",            cat:"grasa",    kcal:579, p:21, c:22, g:50,  sem:"amarillo", tags:[V,VG,ST], unit:{label:"puñado", g:20} },
  { id:"nueces",    name:"Nueces",               cat:"grasa",    kcal:654, p:15, c:14, g:65,  sem:"amarillo", tags:[V,VG,ST], unit:{label:"puñado", g:20} },
  { id:"mani",      name:"Maní",                 cat:"grasa",    kcal:567, p:26, c:16, g:49,  sem:"amarillo", tags:[V,VG,ST], unit:{label:"puñado", g:20} },
  { id:"chia",      name:"Semillas de chía",     cat:"grasa",    kcal:486, p:17, c:42, g:31,  sem:"verde",    tags:[V,VG,ST], unit:{label:"cucharada", g:12} },
  { id:"mantpeni",  name:"Manteca de maní",      cat:"grasa",    kcal:588, p:25, c:20, g:50,  sem:"amarillo", tags:[V,VG,ST], unit:{label:"cucharada", g:15} },

  // ---------- SNACKS Y DULCES ----------
  { id:"choco70",   name:"Chocolate amargo 70%", cat:"snack",    kcal:546, p:8,  c:46, g:38,  sem:"amarillo", tags:[V,ST] },
  { id:"miel",      name:"Miel",                 cat:"snack",    kcal:304, p:0,  c:82, g:0,   sem:"amarillo", tags:[V,ST], unit:{label:"cucharada", g:20} },
  { id:"ddl",       name:"Dulce de leche",       cat:"snack",    kcal:315, p:6,  c:55, g:7,   sem:"rojo",     tags:[V,ST], unit:{label:"cucharada", g:20} },
  { id:"medialuna", name:"Medialuna / factura",  cat:"snack",    kcal:400, p:8,  c:45, g:22,  sem:"rojo",     tags:[V], unit:{label:"unidad", g:55} },
  { id:"papas_frit",name:"Papas fritas",         cat:"snack",    kcal:312, p:3.4,c:41, g:15,  sem:"rojo",     tags:[V,VG,ST] },
  { id:"galletitas",name:"Galletitas dulces",    cat:"snack",    kcal:480, p:6,  c:70, g:20,  sem:"rojo",     tags:[V], unit:{label:"unidad", g:8} },

  // ---------- BEBIDAS ----------
  { id:"gaseosa",   name:"Gaseosa común",        cat:"bebida",   kcal:42,  p:0,  c:10.6,g:0,  sem:"rojo",     tags:[V,VG,ST], unit:{label:"vaso", g:200} },
  { id:"gaseosa_lt",name:"Gaseosa light/zero",   cat:"bebida",   kcal:0,   p:0,  c:0,  g:0,   sem:"amarillo", tags:[V,VG,ST], unit:{label:"vaso", g:200} },
  { id:"cafe",      name:"Café (solo)",          cat:"bebida",   kcal:2,   p:0.1,c:0,  g:0,   sem:"verde",    tags:[V,VG,ST], unit:{label:"taza", g:200} },

  // ---------- SUPLEMENTOS ----------
  { id:"whey",      name:"Proteína whey",        cat:"suple",    kcal:370, p:80, c:8,  g:6,   sem:"verde",    tags:[V,ST], unit:{label:"scoop", g:30} },
  { id:"caseina",   name:"Proteína vegetal",     cat:"suple",    kcal:375, p:75, c:9,  g:6,   sem:"verde",    tags:[V,VG,ST], unit:{label:"scoop", g:30} },
];

const FOOD_BY_ID = {};
FOODS.forEach(f => FOOD_BY_ID[f.id] = f);

/* Recetas: se componen de ingredientes (foodId + gramos). Los macros se
   calculan solos desde FOODS (una sola fuente de verdad). meals: en qué
   momento del día encaja. diet: se deriva de los ingredientes. */
const RECIPES = [
  // ---------- DESAYUNOS ----------
  { id:"avena_banana", name:"Avena con banana y maní", emoji:"🥣", meals:["desayuno","merienda"],
    ingr:[{f:"avena",g:60},{f:"leche_desc",g:200},{f:"banana",g:120},{f:"mani",g:15}],
    steps:["Cociná la avena con la leche 3–4 min.","Sumá la banana en rodajas y el maní picado."] },
  { id:"yog_frutos", name:"Yogur griego con frutos y avena", emoji:"🫐", meals:["desayuno","merienda"],
    ingr:[{f:"yog_griego",g:200},{f:"arandano",g:60},{f:"frutilla",g:60},{f:"avena",g:30}],
    steps:["Poné el yogur en un bowl.","Agregá las frutas y la avena por encima."] },
  { id:"tost_palta_huevo", name:"Tostadas con palta y huevo", emoji:"🥑", meals:["desayuno","merienda"],
    ingr:[{f:"pan_int",g:60},{f:"palta",g:80},{f:"huevo",g:100}],
    steps:["Tostá el pan.","Pisá la palta y untala.","Sumá los huevos revueltos o poché."] },
  { id:"revuelto_queso", name:"Revuelto de huevos con queso", emoji:"🍳", meals:["desayuno","cena"],
    ingr:[{f:"huevo",g:150},{f:"q_portsalut",g:30},{f:"tomate",g:120}],
    steps:["Batí los huevos.","Cociná a fuego bajo con el queso y el tomate en cubos."] },
  { id:"licuado_prot", name:"Licuado proteico", emoji:"🥤", meals:["desayuno","merienda","snack"],
    ingr:[{f:"leche_desc",g:250},{f:"banana",g:120},{f:"whey",g:30},{f:"mantpeni",g:15}],
    steps:["Licuá todo con hielo hasta que quede cremoso."] },

  // ---------- ALMUERZOS / CENAS ----------
  { id:"pollo_arroz_brocoli", name:"Pollo con arroz y brócoli", emoji:"🍗", meals:["almuerzo","cena"],
    ingr:[{f:"pollo",g:180},{f:"arroz",g:150},{f:"brocoli",g:150},{f:"aceite",g:10}],
    steps:["Salteá el pollo en el aceite.","Serví con el arroz y el brócoli al vapor."] },
  { id:"carne_papa_ensalada", name:"Carne magra con papa y ensalada", emoji:"🥩", meals:["almuerzo","cena"],
    ingr:[{f:"carne_magra",g:180},{f:"papa",g:200},{f:"lechuga",g:60},{f:"tomate",g:120},{f:"aceite",g:10}],
    steps:["Cociná la carne a la plancha.","Acompañá con papa y ensalada de lechuga y tomate."] },
  { id:"merluza_pure", name:"Merluza con puré de calabaza", emoji:"🐟", meals:["almuerzo","cena"],
    ingr:[{f:"merluza",g:200},{f:"calabaza",g:250},{f:"aceite",g:10},{f:"espinaca",g:80}],
    steps:["Horneá la merluza.","Hacé un puré con la calabaza y serví con espinaca salteada."] },
  { id:"wok_pollo", name:"Wok de pollo con verduras y fideos", emoji:"🥡", meals:["almuerzo","cena"],
    ingr:[{f:"pollo",g:150},{f:"fideos",g:150},{f:"morron",g:80},{f:"cebolla",g:60},{f:"zanahoria",g:70},{f:"aceite",g:10}],
    steps:["Salteá el pollo y las verduras en el wok.","Mezclá con los fideos cocidos."] },
  { id:"ensalada_completa", name:"Ensalada completa de atún", emoji:"🥗", meals:["almuerzo","cena"],
    ingr:[{f:"atun",g:120},{f:"huevo",g:100},{f:"lechuga",g:80},{f:"tomate",g:120},{f:"papa",g:150},{f:"aceite",g:10}],
    steps:["Mezclá todo en un bowl grande.","Condimentá con aceite de oliva."] },
  { id:"bowl_lentejas", name:"Bowl de lentejas con arroz", emoji:"🍲", meals:["almuerzo","cena"],
    ingr:[{f:"lentejas",g:200},{f:"arroz_int",g:120},{f:"morron",g:80},{f:"cebolla",g:60},{f:"aceite",g:10}],
    steps:["Salteá cebolla y morrón.","Sumá lentejas y serví sobre el arroz integral."] },
  { id:"milanesa_pollo", name:"Milanesa de pollo al horno", emoji:"🍽️", meals:["almuerzo","cena"],
    ingr:[{f:"pollo",g:180},{f:"huevo",g:50},{f:"pan_int",g:30},{f:"lechuga",g:60},{f:"tomate",g:120}],
    steps:["Pasá el pollo por huevo y pan rallado integral.","Horneá 20 min y serví con ensalada."] },
  { id:"salmon_quinoa", name:"Salmón con quinoa y espinaca", emoji:"🍥", meals:["almuerzo","cena"],
    ingr:[{f:"salmon",g:170},{f:"quinoa",g:150},{f:"espinaca",g:80},{f:"aceite",g:8}],
    steps:["Sellá el salmón.","Serví con quinoa y espinaca salteada."] },
  { id:"tortilla_esp", name:"Tortilla de espinaca y papa", emoji:"🥧", meals:["cena","almuerzo"],
    ingr:[{f:"huevo",g:150},{f:"espinaca",g:100},{f:"papa",g:150},{f:"cebolla",g:50},{f:"aceite",g:8}],
    steps:["Salteá espinaca, papa y cebolla.","Sumá los huevos batidos y cociná de ambos lados."] },
  { id:"pollo_batata", name:"Pollo al horno con batata", emoji:"🍠", meals:["almuerzo","cena"],
    ingr:[{f:"pollo",g:180},{f:"batata",g:200},{f:"brocoli",g:120},{f:"aceite",g:10}],
    steps:["Horneá el pollo y la batata en cubos.","Acompañá con brócoli al vapor."] },
  { id:"tofu_wok", name:"Tofu salteado con verduras y arroz", emoji:"🌱", meals:["almuerzo","cena"],
    ingr:[{f:"tofu",g:200},{f:"arroz_int",g:150},{f:"brocoli",g:100},{f:"morron",g:80},{f:"aceite",g:10}],
    steps:["Dorá el tofu en cubos.","Salteá las verduras y mezclá con el arroz."] },
  { id:"guiso_lentejas", name:"Guiso de lentejas", emoji:"🥘", meals:["almuerzo","cena"],
    ingr:[{f:"lentejas",g:250},{f:"papa",g:120},{f:"zanahoria",g:70},{f:"cebolla",g:60},{f:"morron",g:60},{f:"aceite",g:10}],
    steps:["Rehogá las verduras.","Sumá lentejas y agua, cociná 20 min a fuego bajo."] },

  // ---------- MERIENDAS / SNACKS ----------
  { id:"yog_nueces", name:"Yogur con frutas y nueces", emoji:"🥛", meals:["merienda","snack"],
    ingr:[{f:"yog_desc",g:190},{f:"manzana",g:150},{f:"nueces",g:20}],
    steps:["Cortá la manzana en cubos.","Mezclá con el yogur y las nueces."] },
  { id:"manzana_mani", name:"Manzana con manteca de maní", emoji:"🍎", meals:["merienda","snack"],
    ingr:[{f:"manzana",g:150},{f:"mantpeni",g:20}],
    steps:["Cortá la manzana en gajos.","Untá con manteca de maní."] },
  { id:"tost_queso", name:"Tostadas con queso untable", emoji:"🧀", meals:["merienda","desayuno"],
    ingr:[{f:"pan_int",g:60},{f:"q_untable",g:40},{f:"frutilla",g:60}],
    steps:["Tostá el pan.","Untá el queso y sumá frutillas."] },
];

const RECIPE_BY_ID = {};
RECIPES.forEach(r => RECIPE_BY_ID[r.id] = r);
