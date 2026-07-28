/* =========================================================
   FAC FIT — Modulo: TRAINING (Entrenamiento)
   Motor de rutina, tipo/dias/asistencias, detalle de ejercicio, registro de cargas (PRs) y swaps.
   ========================================================= */
/* =========================================================
   FAC FIT — app.js
   ========================================================= */

/* ---------- CONFIG DE SPLITS ---------- */
const SPLITS = {
  3: [
    { key: "A", label: "Pecho + Bíceps", corto: "Pecho / Bíceps",
      grupos: [{ g: "pecho", n: 3 }, { g: "biceps", n: 3 }] },
    { key: "B", label: "Espalda + Tríceps + Hombros", corto: "Espalda / Tríceps / Hombro",
      grupos: [{ g: "espalda", n: 3 }, { g: "triceps", n: 2 }, { g: "hombros", n: 1 }] },
    { key: "C", label: "Piernas completo", corto: "Piernas",
      grupos: [{ g: "piernas", n: 5 }, { g: "core", n: 1 }] },
  ],
  4: [
    { key: "A", label: "Pecho + Tríceps", corto: "Pecho / Tríceps",
      grupos: [{ g: "pecho", n: 3 }, { g: "triceps", n: 3 }] },
    { key: "B", label: "Espalda + Bíceps", corto: "Espalda / Bíceps",
      grupos: [{ g: "espalda", n: 3 }, { g: "biceps", n: 3 }] },
    { key: "C", label: "Piernas completo", corto: "Piernas",
      grupos: [{ g: "piernas", n: 5 }, { g: "core", n: 1 }] },
    { key: "D", label: "Hombros + Core", corto: "Hombro / Core",
      grupos: [{ g: "hombros", n: 4 }, { g: "core", n: 2 }] },
  ],
};

/* ---------- SPLITS PARA TIPO "CARDIO" ----------
   Días orientados al acondicionamiento cardiovascular. Cada día
   define un "mode" (bloque cardio principal) y grupos accesorios
   (core o circuito metabólico). */
const CARDIO_SPLIT = {
  3: [
    { key: "H", label: "HIIT + Core", corto: "HIIT / Core", mode: "hiit",
      grupos: [{ g: "core", n: 2 }] },
    { key: "L", label: "Cardio continuo (LISS)", corto: "Cardio continuo", mode: "liss",
      grupos: [] },
    { key: "M", label: "Circuito metabólico", corto: "Circuito", mode: "circuit",
      grupos: [{ g: "cardio_circuit", n: 5 }] },
  ],
  4: [
    { key: "H", label: "HIIT + Core", corto: "HIIT / Core", mode: "hiit",
      grupos: [{ g: "core", n: 2 }] },
    { key: "L", label: "Cardio continuo (LISS)", corto: "Cardio continuo", mode: "liss",
      grupos: [] },
    { key: "M", label: "Circuito metabólico", corto: "Circuito", mode: "circuit",
      grupos: [{ g: "cardio_circuit", n: 5 }] },
    { key: "T", label: "Tempo + Core", corto: "Tempo / Core", mode: "tempo",
      grupos: [{ g: "core", n: 2 }] },
  ],
};

/* Metadatos de cada tipo de rutina (para el selector del menú) */
const ROUTINE_TYPES = {
  musculacion: { label: "Pro Musculación", emoji: "🏋️",
    desc: "Enfoque en hipertrofia y fuerza. División por grupos musculares, 3–4 series de 8–15 reps y un cardio corto de entrada en calor." },
  cardio: { label: "Pro Cardio", emoji: "🏃",
    desc: "Enfoque cardiovascular. Días de HIIT, cardio continuo (LISS), tempo y circuitos metabólicos para quemar y mejorar el fondo en pista." },
  mix: { label: "Mix Cardio · Musculación", emoji: "⚡",
    desc: "Lo mejor de los dos mundos: entrenás fuerza por grupos musculares y sumás un bloque de cardio moderado en cada sesión." },
};
const DEFAULT_ROUTINE_TYPE = "musculacion";

const OBJETIVOS = {
  ganar_musculo: { label:"Ganar músculo", emoji:"💪", desc:"Hipertrofia: cargas altas, 8–12 reps, buen descanso." },
  perder_grasa:  { label:"Perder grasa", emoji:"🔥", desc:"Más reps (12–20), descansos cortos y más cardio." },
  mantener:      { label:"Mantenerme", emoji:"⚖️", desc:"Equilibrio general de fuerza y acondicionamiento." },
};
const NIVELES = {
  principiante: { label:"Principiante", desc:"Menos series, foco en técnica." },
  intermedio:   { label:"Intermedio", desc:"Volumen estándar." },
  avanzado:     { label:"Avanzado", desc:"Más series en ejercicios compuestos." },
};

/* Rangos de repeticiones objetivo según objetivo + tipo de ejercicio */
function repsFor(objetivo, tipo){
  if (tipo === "isométrico" || tipo === "metabolico") return null; // mantienen sus reps/segundos
  const table = {
    ganar_musculo: { compuesto:"8-10", aislado:"10-12" },
    perder_grasa:  { compuesto:"12-15", aislado:"15-20" },
    mantener:      { compuesto:"8-12", aislado:"12-15" },
  };
  return (table[objetivo] || table.ganar_musculo)[tipo] || null;
}

/* Ajusta series/reps de un ejercicio de fuerza según objetivo y nivel */
function tuneStrengthExercise(ex, objetivo, nivel){
  const out = { ...ex };
  const reps = repsFor(objetivo, ex.tipo);
  if (reps) out.reps = reps;
  let sets = ex.sets;
  if (nivel === "principiante") sets = Math.min(sets, 3);
  else if (nivel === "avanzado" && ex.tipo === "compuesto") sets = Math.min(sets + 1, 5);
  out.sets = sets;
  return out;
}

/* Factor de duración de cardio según objetivo (perder grasa suma cardio) */
function cardioFactor(objetivo){
  if (objetivo === "perder_grasa") return 1.6;
  if (objetivo === "mantener") return 1.15;
  return 1; // ganar músculo: cardio corto
}

/* ---------- TIPO DE RUTINA VIGENTE EN UNA FECHA ----------
   Busca en el historial la última entrada cuyo "from" es <= fecha.
   Si no hay historial, usa el tipo por defecto (musculación),
   preservando el comportamiento y las métricas previas. */
function getRoutineTypeForDate(dateStr){
  const log = State.routineTypeLog().slice().sort((a,b)=>a.from.localeCompare(b.from));
  let type = DEFAULT_ROUTINE_TYPE;
  for (const e of log){ if (e.from <= dateStr) type = e.type; }
  return type;
}
function currentRoutineType(){ return getRoutineTypeForDate(todayStr()); }

/* Devuelve la lista de días (split) según tipo y cantidad de días entrenados */
function getSplitFor(type, nDays){
  const key = nDays <= 3 ? 3 : 4;
  if (type === "cardio") return CARDIO_SPLIT[key];
  return SPLITS[key]; // musculación y mix comparten división de fuerza
}

/* Split activo hoy (según cantidad de días entrenados y tipo vigente) */
function getActiveSplit(){
  const days = State.trainingDays();
  return getSplitFor(currentRoutineType(), days.length);
}

/* Busca una entrada de split por su key en TODOS los tipos (para reposiciones) */
function findSplitEntryByKey(key){
  const all = SPLITS[3].concat(SPLITS[4], CARDIO_SPLIT[3], CARDIO_SPLIT[4]);
  return all.find(s => s.key === key) || null;
}

/* Devuelve el tipo de día (objeto split) para una fecha dada, o null si es descanso */
function getDayTypeForDate(dateStr){
  const makeups = State.makeups();
  if (makeups[dateStr]) {
    const found = findSplitEntryByKey(makeups[dateStr].dayKey);
    return { ...(found||{}), repuesto: true, origen: makeups[dateStr].origen };
  }
  const days = State.trainingDays();
  if (!days.length) return null;
  const date = parseDate(dateStr);
  const weekday = date.getDay();
  const idx = days.indexOf(weekday);
  if (idx === -1) return null;
  const type = getRoutineTypeForDate(dateStr);
  const split = getSplitFor(type, days.length);
  if (!split.length) return null;
  // Si entrenás más días que largo del split, la división se repite en ciclo
  // para que TODOS los días tengan rutina (hasta los 7 días de la semana).
  return { ...split[idx % split.length], repuesto: false };
}

/* Elige N ejercicios de un grupo muscular rotando según semana ISO, para variar la rutina */
function pickExercises(group, n, seed){
  const pool = EXERCISE_DB[group] || [];
  if (!pool.length) return [];
  const out = [];
  const used = new Set();
  let offset = seed % pool.length;
  const ordered = pool.slice().sort((a,b)=>{
    if (a.tipo === b.tipo) return 0;
    return a.tipo === "compuesto" ? -1 : 1;
  });
  let i = offset;
  let guard = 0;
  while (out.length < n && guard < pool.length * 2){
    const ex = ordered[i % ordered.length];
    if (!used.has(ex.id)){ out.push(ex); used.add(ex.id); }
    i++; guard++;
  }
  return out;
}

function pickCardio(dateStr){
  const w = isoWeek(parseDate(dateStr));
  return EXERCISE_DB.cardio[w % EXERCISE_DB.cardio.length];
}

/* Elige el bloque cardiovascular principal según el modo del día */
function pickCardioBlock(mode, seed){
  const list = CARDIO_MODES[mode] || CARDIO_MODES.warmup;
  return list[Math.abs(seed) % list.length];
}

/* Genera el plan completo del día.
   Devuelve {rest:true} o {routineType, dayType, cardio, cardioTitle, exercises:[...]} */
function generateDayPlan(dateStr){
  const dayType = getDayTypeForDate(dateStr);
  if (!dayType || !dayType.key) return { rest: true };
  const type = getRoutineTypeForDate(dateStr);
  const week = isoWeek(parseDate(dateStr));
  const objetivo = getObjetivo(), nivel = getNivel();
  const focus = State.focus();

  let exercises = [];
  (dayType.grupos || []).forEach((grp, gi) => {
    // Foco muscular: +1 ejercicio a los grupos priorizados
    const n = grp.n + (focus.includes(grp.g) ? 1 : 0);
    const seed = week + gi * 3 + dayType.key.charCodeAt(0);
    const picks = pickExercises(grp.g, n, seed);
    picks.forEach(p => exercises.push({ ...p, grupo: grp.g }));
  });

  // Ajuste por objetivo/nivel (solo fuerza; el circuito/cardio mantiene lo suyo)
  if (type !== "cardio"){
    exercises = exercises.map(ex => ex.tipo === "metabolico" ? ex : tuneStrengthExercise(ex, objetivo, nivel));
  }

  // Reemplazos manuales del usuario para esta fecha
  const swaps = State.swaps()[dateStr] || {};
  exercises = exercises.map(ex => {
    const newId = swaps[ex.id];
    if (!newId) return ex;
    const rep = findExerciseById(newId);
    if (!rep) return ex;
    const tuned = (type !== "cardio" && rep.tipo !== "metabolico") ? tuneStrengthExercise(rep, objetivo, nivel) : rep;
    return { ...tuned, grupo: rep.grupo, swappedFrom: ex.id };
  });

  let cardio, cardioTitle;
  if (type === "cardio"){
    const mode = dayType.mode === "circuit" ? null : dayType.mode;
    cardio = mode ? pickCardioBlock(mode, week + dayType.key.charCodeAt(0)) : null;
    cardioTitle = "Bloque cardiovascular";
  } else if (type === "mix"){
    cardio = pickCardioBlock("mix", week + dayType.key.charCodeAt(0));
    cardioTitle = "Bloque de cardio";
  } else {
    cardio = pickCardio(dateStr);
    cardioTitle = "Calentamiento";
  }
  // Objetivo: escalar duración del bloque de cardio (perder grasa suma)
  if (cardio){
    cardio = { ...cardio, durMin: Math.round(cardio.durMin * cardioFactor(objetivo)) };
  }

  return { rest: false, routineType: type, dayType, cardio, cardioTitle, exercises };
}

/* ---------- CÁLCULO DE CALORÍAS ESTIMADAS ---------- */
function estimateSessionKcal(plan, pesoKg){
  if (!plan || plan.rest) return 0;
  let kcal = 0;
  if (plan.cardio){
    const horas = plan.cardio.durMin / 60;
    kcal += plan.cardio.met * pesoKg * horas;
  }
  plan.exercises.forEach(ex => {
    const durSec = (SET_DURATION_SEC[ex.tipo] || 70) * ex.sets;
    const horas = durSec / 3600;
    const met = MET_FUERZA[ex.tipo] || 5;
    kcal += met * pesoKg * horas;
  });
  return Math.round(kcal);
}

/* =========================================================
   DETALLE DE EJERCICIO (imagen + cue)
   ========================================================= */
function findExerciseById(id){
  for (const grp in EXERCISE_DB){
    const found = (EXERCISE_DB[grp]||[]).find(e => e.id === id);
    if (found) return { ...found, grupo: grp };
  }
  return null;
}

/* =========================================================
   REGISTRO DE CARGAS Y RÉCORDS (PRs)
   ========================================================= */
const GRUPO_LABEL = {
  pecho:"Pecho", espalda:"Espalda", hombros:"Hombros", biceps:"Bíceps",
  triceps:"Tríceps", piernas:"Piernas", core:"Core",
  cardio:"Cardio", cardio_circuit:"Circuito",
};
function liftPR(exId){ return (State.lifts()[exId]||[]).reduce((m,e)=>Math.max(m, e.kg||0), 0); }
function lastLift(exId){ const a = State.lifts()[exId]||[]; return a.length ? a[a.length-1] : null; }

function liftSectionHTML(exId, date){
  const pr = liftPR(exId);
  const last = lastLift(exId);
  return `
    <div class="lift-box">
      <div class="lift-head">
        <div class="section-title" style="margin:0;">Tu registro de peso</div>
        ${pr > 0 ? `<span class="lift-pr">🏆 ${pr} kg</span>` : ""}
      </div>
      <div class="lift-last">${last
        ? `Última: <b>${last.kg} kg</b>${last.reps ? ` × ${last.reps}` : ""} · ${fmtShort(last.d)}`
        : `Registrá cuánto levantaste para ver tu progreso.`}</div>
      <div class="lift-inputs">
        <input id="lift-kg" type="number" inputmode="decimal" step="0.5" placeholder="Peso (kg)">
        <input id="lift-reps" type="number" inputmode="numeric" placeholder="Reps">
        <button class="btn-lift" onclick="logLift('${exId}','${date||todayStr()}')">Guardar</button>
      </div>
    </div>`;
}
function logLift(exId, date){
  const kg = parseFloat($("#lift-kg").value);
  if (!kg || kg <= 0){ toast("Poné el peso en kg 🏋️"); return; }
  const reps = parseInt($("#lift-reps").value) || null;
  const prev = liftPR(exId);
  const lifts = State.lifts();
  if (!lifts[exId]) lifts[exId] = [];
  lifts[exId].push({ d: date || todayStr(), kg, reps });
  State.saveLifts(lifts);
  if (kg > prev && prev > 0) toast(`¡Nuevo récord! 🎉 ${kg} kg`);
  else toast("Registro guardado 💪");
  const sec = $("#lift-section");
  if (sec) sec.innerHTML = liftSectionHTML(exId, date);
}

/* Récord máximo por grupo muscular (para Métricas) */
function computePRsByGroup(){
  const lifts = State.lifts(); const byGroup = {};
  Object.keys(lifts).forEach(exId => {
    const ex = findExerciseById(exId); if (!ex) return;
    const max = Math.max(...lifts[exId].map(e => e.kg || 0));
    if (max <= 0) return;
    if (!byGroup[ex.grupo] || max > byGroup[ex.grupo].kg) byGroup[ex.grupo] = { kg: max, name: ex.name };
  });
  return byGroup;
}
function buildPRCard(){
  const prs = computePRsByGroup();
  const keys = Object.keys(prs);
  if (!keys.length) return "";
  const orden = ["pecho","espalda","hombros","biceps","triceps","piernas","core"];
  keys.sort((a,b)=> orden.indexOf(a) - orden.indexOf(b));
  const rows = keys.map(g => `
    <div class="pr-row">
      <span class="pr-group" style="color:${(typeof GRUPO_COLOR!=="undefined" && GRUPO_COLOR[g]) || "var(--rojo)"}">${GRUPO_LABEL[g]||g}</span>
      <span class="pr-detail">${prs[g].name}</span>
      <span class="pr-kg">${prs[g].kg} kg</span>
    </div>`).join("");
  return `<div class="card"><div class="section-title" style="margin-top:0;">🏆 Récords por músculo</div>${rows}</div>`;
}

/* Traducción de músculos (free-exercise-db usa nombres en inglés) */
const MUSCULO_ES = {
  chest:"Pecho", shoulders:"Hombros", triceps:"Tríceps", biceps:"Bíceps",
  lats:"Dorsales", "middle back":"Espalda media", "lower back":"Zona lumbar",
  traps:"Trapecios", forearms:"Antebrazos", quadriceps:"Cuádriceps",
  hamstrings:"Isquiotibiales", glutes:"Glúteos", calves:"Gemelos",
  abdominals:"Abdominales", adductors:"Aductores", abductors:"Abductores", neck:"Cuello",
};
function musclesHtml(media){
  const p = (media.primary||[]).map(m=>`<span class="musc-tag primary">${MUSCULO_ES[m]||m}</span>`).join("");
  const s = (media.secondary||[]).map(m=>`<span class="musc-tag">${MUSCULO_ES[m]||m}</span>`).join("");
  return p + s;
}

function openExerciseDetail(id, date, back, slotId){
  const ex = findExerciseById(id);
  if (!ex) return;
  date = date || todayStr();
  slotId = slotId || id;
  const backDate = back === "day" ? date : null;
  const canSwap = date >= todayStr(); // solo hoy o a futuro
  const archetype = EXERCISE_IMAGE[id] || "";
  const cue = EXERCISE_CUE[archetype] || "Mantené la técnica controlada en todo el recorrido y respirá de forma pareja.";
  const media = (typeof EXERCISE_MEDIA !== "undefined") && EXERCISE_MEDIA[id];

  let visual, muscles;
  if (media && media.img && media.img.length){
    const labels = ["Inicio","Fin"];
    const imgs = media.img.map((src,i)=>`
      <figure class="ex-photo">
        <img src="${src}" alt="${ex.name}" loading="lazy" onerror="this.closest('.ex-photo').style.display='none'">
        <figcaption>${labels[i]||""}</figcaption>
      </figure>`).join("");
    visual = `<div class="ex-photo-box">${imgs}</div>`;
    muscles = `<div class="musc-row"><span class="musc-label">Músculos:</span> ${musclesHtml(media)}</div>`;
  } else {
    visual = `<div class="ex-art-box">${exerciseArt(ex)}</div>`;
    muscles = "";
  }

  $("#modal-body").innerHTML = `
    ${visual}
    <div class="modal-title">${ex.name}</div>
    ${muscles}
    <div style="display:flex; gap:8px; margin:8px 0 12px; flex-wrap:wrap;">
      <span class="exercise-sr" style="background:var(--gris-100); color:var(--gris-800);">${ex.equip}</span>
      <span class="exercise-sr">${ex.reps} reps x ${ex.sets} series</span>
    </div>
    <div class="modal-desc" style="margin-bottom:12px;">${cue}</div>
    ${(ex.grupo !== "cardio" && ex.grupo !== "cardio_circuit") ? `<div id="lift-section">${liftSectionHTML(id, date)}</div>` : ""}
    ${canSwap ? `<button class="btn btn-outline" style="margin-bottom:10px;" onclick="openSwapPicker('${slotId}','${ex.grupo}','${date}','${back||""}')">🔁 Cambiar por otro ejercicio</button>` : ""}
    ${backDate
      ? `<button class="btn btn-ghost" onclick="openDayPreview('${backDate}')">‹ Volver a la rutina</button>`
      : `<button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>`}
  `;
  $("#modal-overlay").classList.add("open");
}

/* Picker para reemplazar un ejercicio por otro del mismo grupo muscular.
   Excluye los otros ejercicios que YA tenés ese día en el mismo grupo,
   así no repetís (ej: si hacés 3 de bíceps, no te ofrece los otros 2). */
function openSwapPicker(slotId, grupo, date, back){
  const swaps = State.swaps();
  const activo = (swaps[date] || {})[slotId];
  const plan = generateDayPlan(date);
  const currentId = (plan.exercises.find(e => (e.swappedFrom || e.id) === slotId) || {}).id || activo || slotId;
  // ids del mismo grupo ocupados por OTROS slots de ese día
  const usedByOthers = new Set(
    (plan.exercises || [])
      .filter(e => e.grupo === grupo && (e.swappedFrom || e.id) !== slotId)
      .map(e => e.id)
  );
  const pool = (EXERCISE_DB[grupo] || []).filter(e => !usedByOthers.has(e.id));

  const rows = pool.map(e => {
    const sel = e.id === currentId;
    return `
      <div class="exercise-row" onclick="applySwap('${slotId}','${e.id}','${grupo}','${date}','${back}')">
        <div class="exercise-left">${exerciseThumb({...e, grupo})}
          <div><div class="exercise-name">${e.name}</div><div class="exercise-equip">${e.equip}</div></div></div>
        <div class="exercise-sr" style="${sel ? "" : "background:var(--gris-100);color:var(--gris-600);"}">${sel ? "Actual" : "Elegir"}</div>
      </div>`;
  }).join("");

  const vacio = pool.length <= 1;
  $("#modal-body").innerHTML = `
    <div class="modal-title">Cambiar ejercicio</div>
    <div class="modal-desc">Elegí otro del mismo grupo (no te mostramos los que ya hacés hoy). Aplica solo para ese día.</div>
    ${activo ? `<button class="btn btn-outline" style="margin-bottom:12px;" onclick="applySwap('${slotId}','${slotId}','${grupo}','${date}','${back}')">↩︎ Volver al ejercicio original</button>` : ""}
    ${vacio ? `<div class="hint-box" style="margin-bottom:12px;">No hay otros ejercicios disponibles para este grupo hoy.</div>` : ""}
    <div style="max-height:52vh; overflow-y:auto; margin-bottom:8px;">${rows}</div>
    <button class="btn btn-ghost" onclick="openExerciseDetail('${currentId}','${date}','${back}','${slotId}')">Cancelar</button>
  `;
  $("#modal-overlay").classList.add("open");
}

function applySwap(slotId, newId, grupo, date, back){
  const swaps = State.swaps();
  swaps[date] = swaps[date] || {};
  if (newId === slotId) delete swaps[date][slotId]; // volver al original
  else swaps[date][slotId] = newId;
  if (Object.keys(swaps[date]).length === 0) delete swaps[date];
  State.saveSwaps(swaps);
  toast("Ejercicio actualizado 🔁");
  // refrescar la vista de origen
  if (date === todayStr()) renderHome();
  // reabrir el detalle del ejercicio (nuevo o el que quedó)
  const shownId = newId;
  openExerciseDetail(shownId, date, back, slotId);
}

/* =========================================================
   PANTALLA: TIPO DE RUTINA
   ========================================================= */
let tipoSeleccionado = null;
function renderTipo(){
  const actual = currentRoutineType();
  tipoSeleccionado = actual;
  const c = $("#tab-tipo");
  const cards = Object.keys(ROUTINE_TYPES).map(key => {
    const t = ROUTINE_TYPES[key];
    return `
      <div class="tipo-card ${key===actual ? "current" : ""}" data-tipo="${key}" onclick="selectTipo('${key}')">
        <div class="tipo-emoji">${t.emoji}</div>
        <div class="tipo-body">
          <div class="tipo-name">${t.label} ${key===actual ? '<span class="tipo-badge">Actual</span>' : ""}</div>
          <div class="tipo-desc">${t.desc}</div>
        </div>
        <div class="tipo-radio"></div>
      </div>`;
  }).join("");

  c.innerHTML = `
    <div class="card">
      <div class="section-title" style="margin-top:0;">Elegí tu tipo de rutina</div>
      <p style="font-size:13px; color:var(--gris-600); margin:0 0 14px; line-height:1.5;">
        El cambio se aplica <b>desde la fecha que elijas en adelante</b>. Los días que ya asististe
        no se tocan y tus métricas quedan intactas.
      </p>
      <div class="tipo-list">${cards}</div>
      <div class="field" style="margin-top:16px;">
        <label>Aplicar desde</label>
        <input type="date" id="inp-tipo-desde" value="${todayStr()}" min="${todayStr()}">
      </div>
      <button class="btn btn-primary" onclick="saveTipo()">Guardar tipo de rutina</button>
    </div>

    <div class="card">
      <div class="section-title" style="margin-top:0;">Foco muscular <span style="font-weight:600;color:var(--gris-400);text-transform:none;letter-spacing:0;">(opcional)</span></div>
      <p style="font-size:13px; color:var(--gris-600); margin:0 0 12px; line-height:1.5;">
        Elegí los grupos que querés priorizar y les sumamos un ejercicio extra los días que se entrenan.
        Aplica a las rutinas de fuerza (Musculación y Mix).
      </p>
      <div class="daychip-grid" id="focus-grid" style="grid-template-columns:repeat(3,1fr);"></div>
      <button class="btn btn-primary" style="margin-top:14px;" onclick="saveFocus()">Guardar foco</button>
    </div>

    <div class="card" id="tipo-preview"></div>
  `;
  renderFocusChips();
  updateTipoUI();
}

const FOCUS_GRUPOS = [
  { g:"pecho", label:"Pecho" }, { g:"espalda", label:"Espalda" }, { g:"hombros", label:"Hombros" },
  { g:"biceps", label:"Bíceps" }, { g:"triceps", label:"Tríceps" }, { g:"piernas", label:"Piernas" },
  { g:"core", label:"Core" },
];
let focusSel = [];
function renderFocusChips(){
  focusSel = State.focus().slice();
  const grid = $("#focus-grid");
  grid.innerHTML = "";
  FOCUS_GRUPOS.forEach(item => {
    const chip = document.createElement("div");
    chip.className = "daychip" + (focusSel.includes(item.g) ? " selected" : "");
    chip.textContent = item.label;
    chip.onclick = () => {
      const i = focusSel.indexOf(item.g);
      if (i === -1) focusSel.push(item.g); else focusSel.splice(i,1);
      chip.classList.toggle("selected");
    };
    grid.appendChild(chip);
  });
}
function saveFocus(){
  State.saveFocus(focusSel);
  toast(focusSel.length ? "Foco muscular guardado 🎯" : "Foco muscular quitado");
}

function selectTipo(key){
  tipoSeleccionado = key;
  updateTipoUI();
}

function updateTipoUI(){
  $$(".tipo-card").forEach(el => el.classList.toggle("selected", el.dataset.tipo === tipoSeleccionado));
  const t = ROUTINE_TYPES[tipoSeleccionado];
  const dias = State.trainingDays().length;
  const split = getSplitFor(tipoSeleccionado, dias);
  let rows = split.map((s,i) => `
    <div class="exercise-row"><div class="exercise-left"><div class="exercise-idx">${i+1}</div>
      <div><div class="exercise-name">${s.label}</div><div class="exercise-equip">${s.corto}</div></div></div></div>`).join("");
  $("#tipo-preview").innerHTML = `
    <div class="section-title" style="margin-top:0;">Cómo queda ${t.label}</div>
    <p style="font-size:13px; color:var(--gris-600); margin:0 0 8px;">Con tus ${dias} días entrenados, la semana se arma así:</p>
    ${rows}`;
}

function saveTipo(){
  const desde = $("#inp-tipo-desde").value || todayStr();
  const log = State.routineTypeLog().filter(e => e.from !== desde);
  log.push({ from: desde, type: tipoSeleccionado });
  log.sort((a,b)=>a.from.localeCompare(b.from));
  State.saveRoutineTypeLog(log);
  toast(`Rutina cambiada a ${ROUTINE_TYPES[tipoSeleccionado].label} 💪`);
  goTo("inicio");
}

/* =========================================================
   PANTALLA: DÍAS DE RUTINA
   ========================================================= */
let tempDias = [];
function renderDias(){
  tempDias = State.trainingDays().slice();
  const c = $("#tab-dias");
  c.innerHTML = `
    <div class="card">
      <div class="section-title" style="margin-top:0;">¿Qué días entrenás?</div>
      <p style="font-size:13px; color:var(--gris-600); margin-top:0;">Elegí de 2 a 7 días. Si cambiás esto, tu rutina semanal se recalcula automáticamente.</p>
      <div class="daychip-grid" id="dias-grid"></div>
      <div class="hint-box" id="dias-hint"></div>
    </div>
    <div class="card" id="dias-preview"></div>
    <button class="btn btn-primary" onclick="saveDias()">Guardar días</button>
  `;
  renderOnbDayChips($("#dias-grid"), tempDias, (idx, chipEl) => {
    const i = tempDias.indexOf(idx);
    if (i === -1) tempDias.push(idx); else tempDias.splice(i,1);
    chipEl.classList.toggle("selected");
    updateDiasPreview();
  });
  updateDiasPreview();
}

function updateDiasPreview(){
  const n = tempDias.length;
  const type = currentRoutineType();
  const tipoLabel = ROUTINE_TYPES[type].label;
  const split = getSplitFor(type, n);
  $("#dias-hint").textContent = n < 2
    ? "Elegí al menos 2 días."
    : `Con ${n} días usamos una división de ${split.length} días${n > split.length ? " que se repite en ciclo para cubrir todos tus días" : ""} (rutina de ${tipoLabel}).`;
  const sorted = tempDias.slice().sort((a,b)=>a-b);
  let html = `<div class="section-title" style="margin-top:0;">Vista previa semanal</div>`;
  sorted.forEach((d, i) => {
    const s = split[i % split.length];
    html += `<div class="exercise-row"><div class="exercise-left"><div class="exercise-idx">${DIAS_CORTO[d]}</div>
      <div><div class="exercise-name">${DIAS_NOMBRE[d]}</div><div class="exercise-equip">${s ? s.label : "—"}</div></div></div></div>`;
  });
  $("#dias-preview").innerHTML = html || "";
}

function saveDias(){
  if (tempDias.length < 2){ toast("Elegí al menos 2 días"); return; }
  State.saveTrainingDays(tempDias);
  toast("¡Listo! Tu rutina semanal se actualizó 🔄");
  goTo("inicio");
}

/* =========================================================
   PANTALLA: ASISTENCIAS (CALENDARIO)
   ========================================================= */
let calCursor = new Date();
function renderAsistencias(){
  buildCalendar();
}

function buildCalendar(){
  const year = calCursor.getFullYear(), month = calCursor.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const attendance = State.attendance();
  const makeups = State.makeups();
  const today = todayStr();

  let cells = "";
  for (let i=0;i<startWeekday;i++) cells += `<div class="cal-cell empty"></div>`;
  for (let day=1; day<=daysInMonth; day++){
    const dateObj = new Date(year, month, day);
    const dateStr = fmtDate(dateObj);
    const att = attendance[dateStr];
    const isMakeup = !!makeups[dateStr];
    const plan = getDayTypeForDate(dateStr);
    let cls = "cal-cell";
    if (dateStr === today) cls += " hoy";
    if (att && att.status === "asistio") cls += " ok";
    else if (att && att.status === "no_asistio") cls += " miss";
    else if (isMakeup) cls += " makeup";
    else if (plan) cls += " planned";
    const dot = (att || isMakeup || plan) ? `<div class="pt"></div>` : "";
    cells += `<div class="${cls}" onclick="openDayDetail('${dateStr}')"><span class="d">${day}</span>${dot}</div>`;
  }

  $("#tab-asistencias").innerHTML = `
    <div class="card">
      <div class="cal-head">
        <button onclick="calMove(-1)">‹</button>
        <div class="cal-title">${MESES[month]} ${year}</div>
        <button onclick="calMove(1)">›</button>
      </div>
      <div class="cal-grid">
        ${DIAS_CORTO.map(d=>`<div class="cal-dow">${d}</div>`).join("")}
        ${cells}
      </div>
      <div class="legend">
        <span><i style="background:var(--verde)"></i>Asististe</span>
        <span><i style="background:var(--rojo)"></i>No asististe</span>
        <span><i style="background:var(--amarillo)"></i>Repuesto</span>
        <span><i style="background:var(--rojo-suave)"></i>Programado</span>
      </div>
    </div>
    <div id="day-detail"></div>
  `;
}

function calMove(delta){
  calCursor.setMonth(calCursor.getMonth()+delta);
  buildCalendar();
}

function openDayDetail(dateStr){
  const plan = generateDayPlan(dateStr);
  const attendance = State.attendance();
  const att = attendance[dateStr];
  const box = $("#day-detail");
  const d = parseDate(dateStr);
  const titulo = `${DIAS_NOMBRE[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
  if (plan.rest){
    box.innerHTML = `<div class="card"><div class="section-title" style="margin-top:0;">${titulo}</div><p style="color:var(--gris-600); font-size:13.5px;">Día de descanso, sin rutina programada.</p></div>`;
    return;
  }
  let statusTxt = "Sin registrar";
  if (att) statusTxt = att.status === "asistio" ? "✓ Asististe" : ("✕ No asististe" + (att.repuestoEn ? ` (repuesto el ${fmtShort(att.repuestoEn)})` : ""));
  box.innerHTML = `
    <div class="card">
      <div class="section-title" style="margin-top:0;">${titulo}${plan.dayType.repuesto ? " · Reposición" : ""}</div>
      <div style="font-weight:800; font-size:15px; margin-bottom:10px;">${plan.dayType.label}</div>
      ${plan.cardio ? `<div class="cardio-chip" style="margin-bottom:10px;"><span class="dot"></span>
        <div><div style="font-weight:700; font-size:13.5px;">${plan.cardioTitle}: ${plan.cardio.name}</div>
        <div style="font-size:11.5px; color:var(--gris-600);">${plan.cardio.durMin} min</div></div></div>` : ""}
      ${plan.exercises.map((ex,i)=>`
        <div class="exercise-row" onclick="openExerciseDetail('${ex.id}','${dateStr}','','${ex.swappedFrom||ex.id}')">
          <div class="exercise-left">${exerciseThumb(ex)}
            <div><div class="exercise-name">${ex.name}${ex.swappedFrom ? ' <span class="swap-mark">🔁</span>' : ''}</div><div class="exercise-equip">${ex.equip}</div></div></div>
          <div class="exercise-sr">${ex.reps}x${ex.sets}</div>
        </div>`).join("")}
      <div class="hint-box" style="margin-top:12px;">Estado: <b>${statusTxt}</b></div>
    </div>
  `;
}

