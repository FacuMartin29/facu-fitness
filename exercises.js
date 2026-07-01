/* =========================================================
   FACU FITNESS — Base de datos de ejercicios
   Series/repeticiones basadas en rangos de hipertrofia general
   (8-15 reps, 3-4 series, RIR 1-3) usados en rutinas
   Push/Pull/Legs y Torso-Pierna. Los METs son aproximaciones
   del Compendio de Actividades Físicas (Ainsworth et al.)
   para entrenamiento de fuerza con pesas, 8-15 reps.
   ========================================================= */

const EXERCISE_DB = {
  pecho: [
    { id: "pec01", name: "Press de banca con barra", equip: "Barra", sets: 4, reps: "8", tipo: "compuesto" },
    { id: "pec02", name: "Press de banca con mancuernas", equip: "Mancuernas", sets: 4, reps: "10", tipo: "compuesto" },
    { id: "pec03", name: "Press inclinado con mancuernas", equip: "Mancuernas", sets: 3, reps: "10", tipo: "compuesto" },
    { id: "pec04", name: "Press de pecho en máquina", equip: "Máquina", sets: 3, reps: "12", tipo: "compuesto" },
    { id: "pec05", name: "Aperturas con mancuernas", equip: "Mancuernas", sets: 3, reps: "12", tipo: "aislado" },
    { id: "pec06", name: "Cruce de poleas (aperturas en polea)", equip: "Máquina/Polea", sets: 3, reps: "15", tipo: "aislado" },
    { id: "pec07", name: "Fondos en paralelas (énfasis pecho)", equip: "Peso corporal", sets: 3, reps: "10", tipo: "compuesto" },
    { id: "pec08", name: "Flexiones de brazos", equip: "Peso corporal", sets: 3, reps: "15", tipo: "compuesto" },
    { id: "pec09", name: "Press inclinado en máquina", equip: "Máquina", sets: 3, reps: "10", tipo: "compuesto" },
    { id: "pec10", name: "Pullover con mancuerna", equip: "Mancuernas", sets: 3, reps: "12", tipo: "aislado" },
  ],

  espalda: [
    { id: "esp01", name: "Dominadas (agarre prono)", equip: "Peso corporal", sets: 4, reps: "8", tipo: "compuesto" },
    { id: "esp02", name: "Jalón al pecho en polea", equip: "Máquina/Polea", sets: 4, reps: "10", tipo: "compuesto" },
    { id: "esp03", name: "Remo con barra", equip: "Barra", sets: 4, reps: "8", tipo: "compuesto" },
    { id: "esp04", name: "Remo con mancuerna a un brazo", equip: "Mancuernas", sets: 3, reps: "10", tipo: "compuesto" },
    { id: "esp05", name: "Remo sentado en máquina/polea", equip: "Máquina/Polea", sets: 3, reps: "12", tipo: "compuesto" },
    { id: "esp06", name: "Remo en polea baja (agarre estrecho)", equip: "Máquina/Polea", sets: 3, reps: "12", tipo: "compuesto" },
    { id: "esp07", name: "Pull-over en polea alta", equip: "Máquina/Polea", sets: 3, reps: "12", tipo: "aislado" },
    { id: "esp08", name: "Remo invertido (bajo barra o TRX)", equip: "Peso corporal", sets: 3, reps: "12", tipo: "compuesto" },
    { id: "esp09", name: "Jalón tras nuca o agarre ancho en polea", equip: "Máquina/Polea", sets: 3, reps: "10", tipo: "compuesto" },
    { id: "esp10", name: "Hiperextensiones lumbares", equip: "Peso corporal", sets: 3, reps: "15", tipo: "aislado" },
  ],

  hombros: [
    { id: "hom01", name: "Press militar con barra", equip: "Barra", sets: 4, reps: "8", tipo: "compuesto" },
    { id: "hom02", name: "Press de hombros con mancuernas", equip: "Mancuernas", sets: 3, reps: "10", tipo: "compuesto" },
    { id: "hom03", name: "Press de hombros en máquina", equip: "Máquina", sets: 3, reps: "12", tipo: "compuesto" },
    { id: "hom04", name: "Elevaciones laterales con mancuernas", equip: "Mancuernas", sets: 3, reps: "15", tipo: "aislado" },
    { id: "hom05", name: "Elevaciones laterales en polea", equip: "Máquina/Polea", sets: 3, reps: "15", tipo: "aislado" },
    { id: "hom06", name: "Elevaciones frontales con mancuernas", equip: "Mancuernas", sets: 3, reps: "12", tipo: "aislado" },
    { id: "hom07", name: "Pájaros / posterior en polea o mancuernas", equip: "Mancuernas", sets: 3, reps: "15", tipo: "aislado" },
    { id: "hom08", name: "Press Arnold", equip: "Mancuernas", sets: 3, reps: "10", tipo: "compuesto" },
    { id: "hom09", name: "Face pull en polea", equip: "Máquina/Polea", sets: 3, reps: "15", tipo: "aislado" },
    { id: "hom10", name: "Remo al mentón con barra", equip: "Barra", sets: 3, reps: "12", tipo: "compuesto" },
  ],

  biceps: [
    { id: "bic01", name: "Curl con barra", equip: "Barra", sets: 4, reps: "10", tipo: "compuesto" },
    { id: "bic02", name: "Curl con mancuernas alternado", equip: "Mancuernas", sets: 3, reps: "12", tipo: "aislado" },
    { id: "bic03", name: "Curl martillo", equip: "Mancuernas", sets: 3, reps: "12", tipo: "aislado" },
    { id: "bic04", name: "Curl en banco Scott (predicador)", equip: "Barra/Máquina", sets: 3, reps: "10", tipo: "aislado" },
    { id: "bic05", name: "Curl en polea baja", equip: "Máquina/Polea", sets: 3, reps: "15", tipo: "aislado" },
    { id: "bic06", name: "Curl concentrado", equip: "Mancuernas", sets: 3, reps: "12", tipo: "aislado" },
    { id: "bic07", name: "Curl en máquina", equip: "Máquina", sets: 3, reps: "12", tipo: "aislado" },
    { id: "bic08", name: "Dominadas supinas (chin-up)", equip: "Peso corporal", sets: 3, reps: "8", tipo: "compuesto" },
  ],

  triceps: [
    { id: "tri01", name: "Press francés con barra", equip: "Barra", sets: 4, reps: "10", tipo: "aislado" },
    { id: "tri02", name: "Extensión de tríceps en polea alta", equip: "Máquina/Polea", sets: 3, reps: "15", tipo: "aislado" },
    { id: "tri03", name: "Fondos en banco", equip: "Peso corporal", sets: 3, reps: "12", tipo: "compuesto" },
    { id: "tri04", name: "Press cerrado con barra", equip: "Barra", sets: 4, reps: "8", tipo: "compuesto" },
    { id: "tri05", name: "Patada de tríceps con mancuerna", equip: "Mancuernas", sets: 3, reps: "12", tipo: "aislado" },
    { id: "tri06", name: "Extensión de tríceps sobre la cabeza con mancuerna", equip: "Mancuernas", sets: 3, reps: "12", tipo: "aislado" },
    { id: "tri07", name: "Fondos en paralelas (énfasis tríceps)", equip: "Peso corporal", sets: 3, reps: "10", tipo: "compuesto" },
    { id: "tri08", name: "Extensión en polea con cuerda", equip: "Máquina/Polea", sets: 3, reps: "15", tipo: "aislado" },
  ],

  piernas: [
    { id: "pie01", name: "Sentadilla con barra", equip: "Barra", sets: 4, reps: "8", tipo: "compuesto" },
    { id: "pie02", name: "Prensa de piernas", equip: "Máquina", sets: 4, reps: "10", tipo: "compuesto" },
    { id: "pie03", name: "Zancadas con mancuernas", equip: "Mancuernas", sets: 3, reps: "12", tipo: "compuesto" },
    { id: "pie04", name: "Peso muerto rumano", equip: "Barra", sets: 4, reps: "8", tipo: "compuesto" },
    { id: "pie05", name: "Extensión de cuádriceps en máquina", equip: "Máquina", sets: 3, reps: "15", tipo: "aislado" },
    { id: "pie06", name: "Curl femoral en máquina", equip: "Máquina", sets: 3, reps: "15", tipo: "aislado" },
    { id: "pie07", name: "Sentadilla búlgara", equip: "Mancuernas", sets: 3, reps: "10", tipo: "compuesto" },
    { id: "pie08", name: "Hip thrust", equip: "Barra", sets: 4, reps: "10", tipo: "compuesto" },
    { id: "pie09", name: "Elevación de talones de pie (gemelos)", equip: "Máquina", sets: 4, reps: "15", tipo: "aislado" },
    { id: "pie10", name: "Elevación de talones sentado (gemelos)", equip: "Máquina", sets: 3, reps: "15", tipo: "aislado" },
    { id: "pie11", name: "Sentadilla goblet", equip: "Mancuernas", sets: 3, reps: "12", tipo: "compuesto" },
    { id: "pie12", name: "Sentadilla búlgara en máquina Smith", equip: "Máquina", sets: 3, reps: "10", tipo: "compuesto" },
  ],

  core: [
    { id: "cor01", name: "Plancha abdominal", equip: "Peso corporal", sets: 3, reps: "40 seg", tipo: "isométrico" },
    { id: "cor02", name: "Crunch de rodillas en polea", equip: "Máquina/Polea", sets: 3, reps: "15", tipo: "aislado" },
    { id: "cor03", name: "Elevación de piernas colgado", equip: "Peso corporal", sets: 3, reps: "12", tipo: "aislado" },
    { id: "cor04", name: "Rueda abdominal (ab wheel)", equip: "Accesorio", sets: 3, reps: "10", tipo: "compuesto" },
    { id: "cor05", name: "Crunch en máquina", equip: "Máquina", sets: 3, reps: "15", tipo: "aislado" },
    { id: "cor06", name: "Plancha lateral", equip: "Peso corporal", sets: 3, reps: "30 seg", tipo: "isométrico" },
  ],

  // Calentamiento cardiovascular inicial — alterna bici/cinta para variar
  cardio: [
    { id: "car01", name: "Bicicleta estática", equip: "Bici", durMin: 8, met: 5.5 },
    { id: "car02", name: "Cinta — caminata rápida / trote suave", equip: "Cinta", durMin: 8, met: 4.3 },
  ],
};

/* Duración estimada por serie (segundos) para cálculo de tiempo/calorías,
   según tipo de ejercicio: compuesto pesado, aislado, isométrico */
const SET_DURATION_SEC = {
  compuesto: 40 + 90,   // trabajo + descanso
  aislado: 30 + 60,
  "isométrico": 40 + 60,
};

/* METs aproximados de entrenamiento de fuerza según intensidad
   (Compendio de Actividades Físicas: entrenamiento con pesas 8-15 reps) */
const MET_FUERZA = {
  compuesto: 6.0,   // esfuerzo intenso, multiarticular
  aislado: 4.0,     // esfuerzo moderado, monoarticular
  "isométrico": 3.0,
};

/* Mapeo ejercicio -> pictograma (images/exercises/<archetype>.svg) */
const EXERCISE_IMAGE = {
  pec01: "bench_press_flat", pec02: "bench_press_flat_db", pec03: "bench_press_incline_db",
  pec04: "bench_press_machine", pec05: "fly_lying", pec06: "cable_crossover", pec07: "dip",
  pec08: "pushup", pec09: "bench_press_machine", pec10: "pullover",

  esp01: "pullup_hang", esp02: "lat_pulldown", esp03: "row_bent", esp04: "row_single_arm",
  esp05: "row_seated_cable", esp06: "row_seated_cable", esp07: "pullover", esp08: "row_inverted",
  esp09: "lat_pulldown", esp10: "hyperextension",

  hom01: "overhead_press_barbell", hom02: "overhead_press_db", hom03: "overhead_press_db",
  hom04: "lateral_raise", hom05: "lateral_raise", hom06: "front_raise", hom07: "rear_delt_fly",
  hom08: "overhead_press_db", hom09: "face_pull", hom10: "upright_row",

  bic01: "curl_barbell", bic02: "curl_dumbbell", bic03: "curl_dumbbell", bic04: "preacher_curl",
  bic05: "curl_cable", bic06: "concentration_curl", bic07: "curl_cable", bic08: "pullup_hang",

  tri01: "skullcrusher", tri02: "triceps_pushdown", tri03: "dip", tri04: "bench_press_flat",
  tri05: "triceps_kickback", tri06: "overhead_triceps_extension", tri07: "dip", tri08: "triceps_pushdown",

  pie01: "squat", pie02: "leg_press", pie03: "lunge", pie04: "deadlift_rdl",
  pie05: "leg_extension", pie06: "leg_curl", pie07: "lunge", pie08: "hip_thrust",
  pie09: "calf_raise_standing", pie10: "calf_raise_seated", pie11: "squat", pie12: "lunge",

  cor01: "plank", cor02: "cable_crunch", cor03: "hanging_leg_raise", cor04: "ab_wheel",
  cor05: "crunch", cor06: "side_plank",

  car01: "stationary_bike", car02: "treadmill",
};

/* Breves indicaciones técnicas (cues) por arquetipo — se muestran junto a la imagen */
const EXERCISE_CUE = {
  bench_press_flat: "Bajá la barra controlada hasta rozar el pecho y empujá sin despegar los glúteos del banco.",
  bench_press_flat_db: "Codos a unos 45° del torso, bajá hasta sentir estiramiento y empujá en línea recta.",
  bench_press_incline_db: "Banco a 30-45°, controlá el descenso y evitá que los hombros suban hacia las orejas.",
  bench_press_machine: "Ajustá el asiento a la altura del pecho y empujá sin trabar los codos al final.",
  dip: "Bajá hasta 90° de codo, torso inclinado adelante si querés más pecho, más vertical para tríceps.",
  pushup: "Cuerpo recto de cabeza a talones, bajá el pecho cerca del piso sin hundir la cadera.",
  fly_lying: "Codos con leve flexión fija, abrí en arco y juntá las mancuernas arriba sin chocar.",
  cable_crossover: "Leve inclinación adelante, llevá las manos al frente cruzando a la altura del ombligo.",
  pullover: "Un solo dumbbell con ambas manos, bajá en arco detrás de la cabeza y volvé al pecho.",
  pullup_hang: "Agarre firme, subí hasta que el mentón pase la barra sin balancear el cuerpo.",
  lat_pulldown: "Tirá la barra hacia la parte alta del pecho llevando los codos hacia abajo y atrás.",
  row_bent: "Espalda recta, torso a ~45°, llevá la barra hacia el abdomen apretando los omóplatos.",
  row_single_arm: "Apoyá rodilla y mano en el banco, remá el codo hacia atrás pegado al torso.",
  row_seated_cable: "Espalda erguida, tirá el agarre hacia el abdomen sin balancear el torso.",
  row_inverted: "Cuerpo recto en diagonal, tirá el pecho hacia la barra apretando la espalda.",
  hyperextension: "Cadera apoyada en el borde del banco, bajá controlado y subí sin hiperextender.",
  overhead_press_barbell: "Empujá la barra en línea recta arriba, sin arquear demasiado la zona lumbar.",
  overhead_press_db: "Codos ligeramente adelante del cuerpo, empujá arriba hasta casi extender el codo.",
  lateral_raise: "Leve flexión de codo, elevá hasta la altura del hombro liderando con el codo.",
  front_raise: "Elevá el brazo al frente hasta la altura del hombro, sin usar impulso de cadera.",
  rear_delt_fly: "Torso inclinado adelante, abrí los brazos hacia atrás apretando omóplatos.",
  face_pull: "Tirá la cuerda hacia la cara separando las manos, codos altos.",
  upright_row: "Tirá la barra pegada al cuerpo hasta la altura del pecho, codos liderando.",
  curl_barbell: "Codos pegados al torso, subí sin balancear la espalda ni usar impulso.",
  curl_dumbbell: "Subí controlado girando la muñeca (supinación) si el ejercicio lo indica.",
  curl_cable: "Tensión constante del cable, codo fijo, subí y bajá controlado.",
  preacher_curl: "Brazo apoyado en el banco predicador, extendé completo sin despegar el codo.",
  concentration_curl: "Codo apoyado en la cara interna del muslo, curl estricto sin balanceo.",
  skullcrusher: "Codos fijos apuntando al techo, bajá la barra hacia la frente y extendé.",
  triceps_pushdown: "Codos pegados al torso, extendé completo la polea hacia abajo.",
  triceps_kickback: "Torso inclinado, brazo pegado al cuerpo, extendé el codo hacia atrás.",
  overhead_triceps_extension: "Codos apuntando al frente, bajá el peso detrás de la cabeza y extendé.",
  squat: "Barra apoyada en la espalda alta, bajá con la cadera hacia atrás y rodillas alineadas con los pies.",
  leg_press: "Pies a la altura de los hombros en la plataforma, bajá sin despegar la zona lumbar del respaldo.",
  lunge: "Paso al frente, bajá hasta que ambas rodillas formen ~90°, tronco erguido.",
  deadlift_rdl: "Espalda neutra, bisagra de cadera, bajá la barra pegada a las piernas.",
  leg_extension: "Extendé la rodilla completo sin despegar la espalda del respaldo.",
  leg_curl: "Flexioná la rodilla llevando el talón hacia los glúteos, controlado.",
  hip_thrust: "Espalda apoyada en el banco, empujá la cadera arriba apretando glúteos.",
  calf_raise_standing: "Subí lo más alto posible en la punta de pies y bajá controlado el talón.",
  calf_raise_seated: "Con la rodilla flexionada, subí en punta de pies enfocando el sóleo.",
  plank: "Cuerpo alineado de cabeza a talones, core activado, sin hundir la cadera.",
  side_plank: "Cadera elevada en línea recta, hombro alineado sobre el codo de apoyo.",
  crunch: "Curvá el torso llevando las costillas hacia la pelvis, sin tirar del cuello.",
  cable_crunch: "De rodillas frente a la polea, curvá la columna llevando los codos hacia las rodillas.",
  hanging_leg_raise: "Colgado de la barra, subí las piernas controlado sin balancear el cuerpo.",
  ab_wheel: "De rodillas, rodá hacia adelante manteniendo el core firme y volvé sin hundir la lumbar.",
  stationary_bike: "Ritmo constante y sostenido, ideal para activar el cuerpo antes de la fuerza.",
  treadmill: "Caminata rápida o trote suave, subí gradualmente el ritmo cardíaco.",
};

if (typeof module !== "undefined") {
  module.exports = { EXERCISE_DB, SET_DURATION_SEC, MET_FUERZA, EXERCISE_IMAGE, EXERCISE_CUE };
}
