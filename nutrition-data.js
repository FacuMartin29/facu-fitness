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
  { id:"barrita_prot",name:"Barrita proteica",   cat:"suple",    kcal:350, p:33, c:40, g:9,   sem:"verde",    tags:[V], unit:{label:"barrita", g:50} },
  { id:"creatina",  name:"Creatina",             cat:"suple",    kcal:0,   p:0,  c:0,  g:0,   sem:"verde",    tags:[V,VG,ST], unit:{label:"cucharadita", g:5} },

  // ---------- MÁS PROTEÍNAS / FIAMBRES ----------
  { id:"pavita",    name:"Pechuga de pavita",    cat:"proteina", kcal:135, p:29, c:0,  g:1.7, sem:"verde",    tags:[ST] },
  { id:"peceto",    name:"Peceto",               cat:"proteina", kcal:150, p:22, c:0,  g:6,   sem:"verde",    tags:[ST] },
  { id:"camaron",   name:"Camarones",            cat:"proteina", kcal:99,  p:24, c:0.2,g:0.3, sem:"verde",    tags:[ST] },
  { id:"sardina",   name:"Sardinas (lata)",      cat:"proteina", kcal:208, p:24, c:0,  g:11,  sem:"amarillo", tags:[ST] },
  { id:"jamon_coc", name:"Jamón cocido",         cat:"proteina", kcal:145, p:18, c:1.5,g:7,   sem:"amarillo", tags:[ST] },
  { id:"jamon_cru", name:"Jamón crudo",          cat:"proteina", kcal:195, p:25, c:0,  g:10,  sem:"amarillo", tags:[ST] },
  { id:"bondiola",  name:"Bondiola de cerdo",    cat:"proteina", kcal:250, p:18, c:0,  g:19,  sem:"amarillo", tags:[ST] },
  { id:"hamburguesa",name:"Hamburguesa (medallón)",cat:"proteina",kcal:250,p:17, c:3,  g:19,  sem:"rojo",     tags:[], unit:{label:"medallón", g:80} },
  { id:"salchicha", name:"Salchicha",            cat:"proteina", kcal:300, p:12, c:2,  g:27,  sem:"rojo",     tags:[], unit:{label:"unidad", g:45} },
  { id:"mortadela", name:"Mortadela",            cat:"proteina", kcal:311, p:16, c:3,  g:26,  sem:"rojo",     tags:[] },
  { id:"mila_soja", name:"Milanesa de soja",     cat:"proteina", kcal:200, p:16, c:18, g:7,   sem:"amarillo", tags:[V,VG], unit:{label:"unidad", g:80} },

  // ---------- MÁS LÁCTEOS ----------
  { id:"leche_ent", name:"Leche entera",         cat:"lacteo",   kcal:61,  p:3.2,c:4.8,g:3.3, sem:"amarillo", tags:[V,ST], unit:{label:"vaso", g:200} },
  { id:"yog_beb",   name:"Yogur bebible",        cat:"lacteo",   kcal:71,  p:2.8,c:12, g:1.5, sem:"amarillo", tags:[V,ST], unit:{label:"botellita", g:200} },
  { id:"muzza",     name:"Muzzarella",           cat:"lacteo",   kcal:280, p:22, c:2.2,g:22,  sem:"amarillo", tags:[V,ST] },
  { id:"q_cremoso", name:"Queso cremoso",        cat:"lacteo",   kcal:273, p:18, c:3,  g:21,  sem:"amarillo", tags:[V,ST] },
  { id:"provolone", name:"Provolone",            cat:"lacteo",   kcal:351, p:25, c:2,  g:27,  sem:"amarillo", tags:[V,ST] },
  { id:"crema",     name:"Crema de leche",       cat:"lacteo",   kcal:292, p:2.5,c:3,  g:30,  sem:"rojo",     tags:[V,ST], unit:{label:"cucharada", g:15} },
  { id:"flan",      name:"Flan",                 cat:"lacteo",   kcal:145, p:4,  c:22, g:4,   sem:"amarillo", tags:[V,ST], unit:{label:"porción", g:100} },
  { id:"ddl_light", name:"Dulce de leche light", cat:"lacteo",   kcal:265, p:7,  c:50, g:4,   sem:"amarillo", tags:[V,ST], unit:{label:"cucharada", g:20} },

  // ---------- MÁS CARBOS ----------
  { id:"pan_lactal",name:"Pan lactal",           cat:"carbo",    kcal:265, p:9,  c:49, g:4,   sem:"amarillo", tags:[V,VG], unit:{label:"rebanada", g:25} },
  { id:"fideos_int",name:"Fideos integrales",    cat:"carbo",    kcal:124, p:5,  c:26, g:0.8, sem:"verde",    tags:[V,VG] },
  { id:"noquis",    name:"Ñoquis",               cat:"carbo",    kcal:160, p:3.5,c:33, g:1,   sem:"amarillo", tags:[V] },
  { id:"cuscus",    name:"Cuscús cocido",        cat:"carbo",    kcal:112, p:3.8,c:23, g:0.2, sem:"amarillo", tags:[V,VG] },
  { id:"granola",   name:"Granola",              cat:"carbo",    kcal:471, p:10, c:64, g:20,  sem:"amarillo", tags:[V,VG] },
  { id:"empanada",  name:"Empanada de carne",    cat:"carbo",    kcal:260, p:9,  c:28, g:12,  sem:"rojo",     tags:[], unit:{label:"unidad", g:100} },
  { id:"pizza",     name:"Pizza de muzzarella",  cat:"carbo",    kcal:266, p:11, c:33, g:10,  sem:"rojo",     tags:[V], unit:{label:"porción", g:120} },
  { id:"tarta_verd",name:"Tarta de verdura",     cat:"carbo",    kcal:200, p:7,  c:18, g:11,  sem:"amarillo", tags:[V], unit:{label:"porción", g:150} },

  // ---------- MÁS LEGUMBRES ----------
  { id:"soja",      name:"Porotos de soja",      cat:"legumbre", kcal:173, p:17, c:10, g:9,   sem:"verde",    tags:[V,VG,ST] },
  { id:"edamame",   name:"Edamame",              cat:"legumbre", kcal:121, p:11, c:9,  g:5,   sem:"verde",    tags:[V,VG,ST] },
  { id:"habas",     name:"Habas cocidas",        cat:"legumbre", kcal:110, p:8,  c:20, g:0.4, sem:"verde",    tags:[V,VG,ST] },
  { id:"hummus",    name:"Hummus",               cat:"legumbre", kcal:177, p:8,  c:20, g:8,   sem:"amarillo", tags:[V,VG,ST], unit:{label:"cucharada", g:25} },
  { id:"arvejas",   name:"Arvejas",              cat:"legumbre", kcal:81,  p:5.4,c:14, g:0.4, sem:"verde",    tags:[V,VG,ST] },

  // ---------- MÁS VERDURAS ----------
  { id:"pepino",    name:"Pepino",               cat:"verdura",  kcal:15,  p:0.7,c:3.6,g:0.1, sem:"verde",    tags:[V,VG,ST] },
  { id:"apio",      name:"Apio",                 cat:"verdura",  kcal:16,  p:0.7,c:3,  g:0.2, sem:"verde",    tags:[V,VG,ST] },
  { id:"remolacha", name:"Remolacha",            cat:"verdura",  kcal:43,  p:1.6,c:10, g:0.2, sem:"verde",    tags:[V,VG,ST] },
  { id:"choclo",    name:"Choclo (maíz)",        cat:"verdura",  kcal:96,  p:3.4,c:21, g:1.5, sem:"amarillo", tags:[V,VG,ST] },
  { id:"chaucha",   name:"Chauchas",             cat:"verdura",  kcal:31,  p:1.8,c:7,  g:0.1, sem:"verde",    tags:[V,VG,ST] },
  { id:"berenjena", name:"Berenjena",            cat:"verdura",  kcal:25,  p:1,  c:6,  g:0.2, sem:"verde",    tags:[V,VG,ST] },
  { id:"zapallito", name:"Zapallito / zucchini", cat:"verdura",  kcal:17,  p:1.2,c:3.1,g:0.3, sem:"verde",    tags:[V,VG,ST] },
  { id:"coliflor",  name:"Coliflor",             cat:"verdura",  kcal:25,  p:1.9,c:5,  g:0.3, sem:"verde",    tags:[V,VG,ST] },
  { id:"repollo",   name:"Repollo",              cat:"verdura",  kcal:25,  p:1.3,c:6,  g:0.1, sem:"verde",    tags:[V,VG,ST] },
  { id:"rucula",    name:"Rúcula",               cat:"verdura",  kcal:25,  p:2.6,c:3.7,g:0.7, sem:"verde",    tags:[V,VG,ST] },
  { id:"acelga",    name:"Acelga",               cat:"verdura",  kcal:19,  p:1.8,c:3.7,g:0.2, sem:"verde",    tags:[V,VG,ST] },
  { id:"palmito",   name:"Palmitos",             cat:"verdura",  kcal:28,  p:2.5,c:4.5,g:0.6, sem:"verde",    tags:[V,VG,ST] },

  // ---------- MÁS FRUTAS ----------
  { id:"uva",       name:"Uva",                  cat:"fruta",    kcal:69,  p:0.7,c:18, g:0.2, sem:"verde",    tags:[V,VG,ST] },
  { id:"durazno",   name:"Durazno",              cat:"fruta",    kcal:39,  p:0.9,c:10, g:0.3, sem:"verde",    tags:[V,VG,ST], unit:{label:"unidad", g:150} },
  { id:"ciruela",   name:"Ciruela",              cat:"fruta",    kcal:46,  p:0.7,c:11, g:0.3, sem:"verde",    tags:[V,VG,ST], unit:{label:"unidad", g:66} },
  { id:"kiwi",      name:"Kiwi",                 cat:"fruta",    kcal:61,  p:1.1,c:15, g:0.5, sem:"verde",    tags:[V,VG,ST], unit:{label:"unidad", g:75} },
  { id:"anana",     name:"Ananá",                cat:"fruta",    kcal:50,  p:0.5,c:13, g:0.1, sem:"verde",    tags:[V,VG,ST] },
  { id:"sandia",    name:"Sandía",               cat:"fruta",    kcal:30,  p:0.6,c:8,  g:0.2, sem:"verde",    tags:[V,VG,ST] },
  { id:"melon",     name:"Melón",                cat:"fruta",    kcal:34,  p:0.8,c:8,  g:0.2, sem:"verde",    tags:[V,VG,ST] },
  { id:"mandarina", name:"Mandarina",            cat:"fruta",    kcal:53,  p:0.8,c:13, g:0.3, sem:"verde",    tags:[V,VG,ST], unit:{label:"unidad", g:90} },
  { id:"mango",     name:"Mango",                cat:"fruta",    kcal:60,  p:0.8,c:15, g:0.4, sem:"verde",    tags:[V,VG,ST] },
  { id:"higo",      name:"Higo",                 cat:"fruta",    kcal:74,  p:0.8,c:19, g:0.3, sem:"verde",    tags:[V,VG,ST] },
  { id:"pomelo",    name:"Pomelo",               cat:"fruta",    kcal:42,  p:0.8,c:11, g:0.1, sem:"verde",    tags:[V,VG,ST], unit:{label:"unidad", g:200} },
  { id:"pasas",     name:"Pasas de uva",         cat:"fruta",    kcal:299, p:3.1,c:79, g:0.5, sem:"amarillo", tags:[V,VG,ST], unit:{label:"puñado", g:30} },

  // ---------- MÁS GRASAS Y FRUTOS SECOS ----------
  { id:"aceite_gir",name:"Aceite de girasol",    cat:"grasa",    kcal:884, p:0,  c:0,  g:100, sem:"amarillo", tags:[V,VG,ST], unit:{label:"cucharada", g:10} },
  { id:"manteca",   name:"Manteca",              cat:"grasa",    kcal:717, p:0.9,c:0.1,g:81,  sem:"rojo",     tags:[V,ST], unit:{label:"cucharada", g:10} },
  { id:"mayonesa",  name:"Mayonesa",             cat:"grasa",    kcal:680, p:1,  c:2,  g:75,  sem:"rojo",     tags:[V,ST], unit:{label:"cucharada", g:15} },
  { id:"aceitunas", name:"Aceitunas",            cat:"grasa",    kcal:115, p:0.8,c:6,  g:11,  sem:"amarillo", tags:[V,VG,ST] },
  { id:"lino",      name:"Semillas de lino",     cat:"grasa",    kcal:534, p:18, c:29, g:42,  sem:"verde",    tags:[V,VG,ST], unit:{label:"cucharada", g:12} },
  { id:"sem_girasol",name:"Semillas de girasol", cat:"grasa",    kcal:584, p:21, c:20, g:51,  sem:"amarillo", tags:[V,VG,ST], unit:{label:"puñado", g:20} },
  { id:"caju",      name:"Castañas de cajú",     cat:"grasa",    kcal:553, p:18, c:30, g:44,  sem:"amarillo", tags:[V,VG,ST], unit:{label:"puñado", g:20} },
  { id:"pistacho",  name:"Pistachos",            cat:"grasa",    kcal:560, p:20, c:28, g:45,  sem:"amarillo", tags:[V,VG,ST], unit:{label:"puñado", g:20} },
  { id:"coco",      name:"Coco rallado",         cat:"grasa",    kcal:660, p:6.9,c:24, g:64,  sem:"amarillo", tags:[V,VG,ST], unit:{label:"cucharada", g:10} },

  // ---------- MÁS SNACKS Y DULCES ----------
  { id:"barra_cereal",name:"Barra de cereal",    cat:"snack",    kcal:420, p:6,  c:70, g:12,  sem:"amarillo", tags:[V], unit:{label:"barra", g:25} },
  { id:"helado",    name:"Helado de crema",      cat:"snack",    kcal:207, p:3.5,c:24, g:11,  sem:"rojo",     tags:[V,ST], unit:{label:"bocha", g:60} },
  { id:"alfajor",   name:"Alfajor",              cat:"snack",    kcal:450, p:5,  c:60, g:21,  sem:"rojo",     tags:[V], unit:{label:"unidad", g:45} },
  { id:"turron",    name:"Turrón de maní",       cat:"snack",    kcal:480, p:12, c:50, g:26,  sem:"rojo",     tags:[V], unit:{label:"unidad", g:25} },
  { id:"choco_leche",name:"Chocolate con leche", cat:"snack",    kcal:535, p:7.7,c:59, g:30,  sem:"rojo",     tags:[V,ST] },
  { id:"budin",     name:"Budín",                cat:"snack",    kcal:380, p:5,  c:55, g:15,  sem:"rojo",     tags:[V], unit:{label:"porción", g:60} },
  { id:"gall_agua", name:"Galletas de agua",     cat:"snack",    kcal:420, p:10, c:72, g:9,   sem:"amarillo", tags:[V,VG], unit:{label:"unidad", g:6} },
  { id:"pochoclo",  name:"Pochoclo",             cat:"snack",    kcal:387, p:13, c:78, g:4,   sem:"amarillo", tags:[V,VG,ST] },
  { id:"papas_paq", name:"Papas fritas (paquete)",cat:"snack",   kcal:536, p:6.6,c:53, g:34,  sem:"rojo",     tags:[V,VG,ST], unit:{label:"paquete", g:35} },
  { id:"gelatina",  name:"Gelatina",             cat:"snack",    kcal:62,  p:1.2,c:14, g:0,   sem:"amarillo", tags:[ST], unit:{label:"pote", g:120} },
  { id:"mermelada", name:"Mermelada",            cat:"snack",    kcal:250, p:0.4,c:65, g:0.1, sem:"amarillo", tags:[V,VG,ST], unit:{label:"cucharada", g:20} },

  // ---------- MÁS BEBIDAS ----------
  { id:"agua",      name:"Agua",                 cat:"bebida",   kcal:0,   p:0,  c:0,  g:0,   sem:"verde",    tags:[V,VG,ST], unit:{label:"vaso", g:200} },
  { id:"jugo_exp",  name:"Jugo de naranja exprimido",cat:"bebida",kcal:45, p:0.7,c:10, g:0.2, sem:"amarillo", tags:[V,VG,ST], unit:{label:"vaso", g:200} },
  { id:"jugo_polvo",name:"Jugo en polvo (preparado)",cat:"bebida",kcal:25, p:0,  c:6,  g:0,   sem:"amarillo", tags:[V,VG,ST], unit:{label:"vaso", g:200} },
  { id:"leche_choc",name:"Leche chocolatada",    cat:"bebida",   kcal:83,  p:3,  c:12, g:2.5, sem:"amarillo", tags:[V,ST], unit:{label:"vaso", g:200} },
  { id:"agua_sabor",name:"Agua saborizada",      cat:"bebida",   kcal:20,  p:0,  c:5,  g:0,   sem:"amarillo", tags:[V,VG,ST], unit:{label:"vaso", g:200} },
  { id:"cerveza",   name:"Cerveza",              cat:"bebida",   kcal:43,  p:0.5,c:3.6,g:0,   sem:"rojo",     tags:[V,VG], unit:{label:"vaso", g:330} },
  { id:"vino",      name:"Vino tinto",           cat:"bebida",   kcal:85,  p:0.1,c:2.6,g:0,   sem:"rojo",     tags:[V,VG,ST], unit:{label:"copa", g:150} },
  { id:"energizante",name:"Bebida energizante",  cat:"bebida",   kcal:45,  p:0,  c:11, g:0,   sem:"rojo",     tags:[V,VG,ST], unit:{label:"lata", g:250} },
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
