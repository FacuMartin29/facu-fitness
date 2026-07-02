/* =========================================================
   FACU FITNESS — app.js
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

const DIAS_NOMBRE = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const DIAS_CORTO  = ["D","L","M","X","J","V","S"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

/* ---------- HELPERS DE FECHA ---------- */
function fmtDate(d){ return d.toISOString().slice(0,10); }
function todayStr(){ return fmtDate(new Date()); }
function parseDate(s){ const [y,m,d]=s.split("-").map(Number); return new Date(y, m-1, d); }
function isoWeek(date){
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

/* ---------- ESTADO / STORAGE ---------- */
const Store = {
  get(key, fallback){
    try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch(e){ return fallback; }
  },
  set(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} },
};

const State = {
  profile(){ return Store.get("ff_profile", null); },
  saveProfile(p){ Store.set("ff_profile", p); },

  trainingDays(){ return Store.get("ff_trainingDays", []); },
  saveTrainingDays(arr){ Store.set("ff_trainingDays", arr.slice().sort((a,b)=>a-b)); },

  attendance(){ return Store.get("ff_attendance", {}); },
  saveAttendance(obj){ Store.set("ff_attendance", obj); },

  makeups(){ return Store.get("ff_makeups", {}); },
  saveMakeups(obj){ Store.set("ff_makeups", obj); },

  /* Historial de tipo de rutina: [{from:"YYYY-MM-DD", type:"musculacion|cardio|mix"}].
     Cada cambio aplica "de esa fecha en adelante", así los días ya asistidos
     conservan el tipo que estaba vigente y sus métricas no se mueven. */
  routineTypeLog(){ return Store.get("ff_routineTypeLog", []); },
  saveRoutineTypeLog(arr){ Store.set("ff_routineTypeLog", arr); },

  /* Grupos musculares a priorizar (foco). Suman volumen en sus días. */
  focus(){ return Store.get("ff_focus", []); },
  saveFocus(arr){ Store.set("ff_focus", arr); },

  /* Reemplazos de ejercicio por fecha: { "YYYY-MM-DD": { origId: nuevoId } } */
  swaps(){ return Store.get("ff_swaps", {}); },
  saveSwaps(obj){ Store.set("ff_swaps", obj); },

  weightLog(){ return Store.get("ff_weightLog", []); },
  saveWeightLog(arr){ Store.set("ff_weightLog", arr); },
};

/* Valores por defecto de objetivo/nivel si el perfil no los tiene aún */
function getObjetivo(){ const p = State.profile(); return (p && p.objetivo) || "ganar_musculo"; }
function getNivel(){ const p = State.profile(); return (p && p.nivel) || "intermedio"; }

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
  if (idx >= split.length) return null;
  return { ...split[idx], repuesto: false };
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
   RENDER / UI
   ========================================================= */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function showScreen(id){
  $$(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
}

function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove("show"), 2400);
}

function initials(name, last){
  return ((name||"?")[0] + (last ? last[0] : "")).toUpperCase();
}

/* ---------- ONBOARDING STATE (temporal, hasta guardar) ---------- */
const onb = { nombre:"", apellido:"", edad:"", peso:"", altura:"", dias:[] };

function initApp(){
  const profile = State.profile();
  const splash = $("#screen-splash");
  const goNext = () => {
    if (profile && profile.onboardDone) { renderHome(); showScreen("#screen-main"); }
    else { showScreen("#screen-onb-name"); }
  };
  // El anillo se llena en 3s (CSS). Al terminar, el logo se expande y luego pasamos.
  setTimeout(() => {
    splash.classList.add("zoom");
    setTimeout(goNext, 620);   // espera a que termine la animación de expansión
  }, 3000);
}

/* ---------- ONBOARDING: PASO NOMBRE ---------- */
function onbNameNext(){
  const v = $("#inp-nombre").value.trim();
  if (!v){ toast("Che, poné tu nombre para arrancar 👋"); return; }
  onb.nombre = v;
  showScreen("#screen-onb-datos");
}

/* ---------- ONBOARDING: PASO DATOS ---------- */
function onbDatosNext(){
  const edad = +$("#inp-edad").value, peso = +$("#inp-peso").value, altura = +$("#inp-altura").value;
  if (!edad || !peso || !altura){ toast("Completá edad, peso y altura para continuar"); return; }
  onb.edad = edad; onb.peso = peso; onb.altura = altura;
  showScreen("#screen-onb-dias");
  renderOnbDayChips($("#onb-day-grid"), onb.dias, toggleOnbDay);
}

/* ---------- ONBOARDING: PASO DÍAS ---------- */
function renderOnbDayChips(container, selected, onToggle){
  const grid = container;
  grid.innerHTML = "";
  DIAS_NOMBRE.forEach((name, idx) => {
    const chip = document.createElement("div");
    chip.className = "daychip" + (selected.includes(idx) ? " selected" : "");
    chip.innerHTML = `${DIAS_CORTO[idx]}<span class="full">${name.slice(0,3)}</span>`;
    chip.onclick = () => onToggle(idx, chip);
    grid.appendChild(chip);
  });
}

function toggleOnbDay(idx, chipEl){
  const i = onb.dias.indexOf(idx);
  if (i === -1) onb.dias.push(idx); else onb.dias.splice(i,1);
  chipEl.classList.toggle("selected");
  updateOnbDaysHint();
}
function updateOnbDaysHint(){
  const n = onb.dias.length;
  $("#onb-days-count").textContent = n;
  $("#btn-onb-finish").disabled = (n < 2 || n > 5);
}

function onbFinish(){
  if (onb.dias.length < 2){ toast("Elegí al menos 2 días de entrenamiento"); return; }
  const profile = {
    nombre: onb.nombre, apellido: "", edad: onb.edad, peso: onb.peso, altura: onb.altura,
    onboardDone: true,
  };
  State.saveProfile(profile);
  State.saveTrainingDays(onb.dias);
  State.saveWeightLog([{ date: todayStr(), peso: onb.peso }]);
  toast(`¡Bienvenido, ${profile.nombre}! Tu rutina ya está lista 💪`);
  renderHome();
  showScreen("#screen-main");
}

/* =========================================================
   MENÚ LATERAL
   ========================================================= */
const MENU_ITEMS = [
  { id: "inicio", label: "Inicio", icon: "home" },
  { id: "tipo", label: "Tipo de rutina", icon: "dumbbell" },
  { id: "datos", label: "Datos personales", icon: "user" },
  { id: "dias", label: "Días de rutina", icon: "calendar" },
  { id: "asistencias", label: "Asistencias", icon: "check" },
  { id: "metricas", label: "Métricas", icon: "chart" },
];

const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  check: '<path d="M4 12l6 6L20 6"/>',
  chart: '<path d="M4 20V10M12 20V4M20 20v-7"/>',
  dumbbell: '<path d="M6.5 6.5l11 11"/><path d="M3 8l2-2 3 3-2 2z"/><path d="M16 19l2-2 3-3-2-2-3 3z" transform="translate(-1,-1)"/><path d="M2 12l2 2M20 10l2 2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
};
function svgIcon(name, extra=""){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${ICONS[name]||""}</svg>`;
}

function openMenu(){
  $("#menu-overlay").classList.add("open");
  $("#menu-panel").classList.add("open");
}
function closeMenu(){
  $("#menu-overlay").classList.remove("open");
  $("#menu-panel").classList.remove("open");
}

let currentTab = "inicio";
function goTo(tabId){
  currentTab = tabId;
  closeMenu();
  $$(".menu-item").forEach(el => el.classList.toggle("active", el.dataset.tab === tabId));
  if (tabId === "inicio") renderHome();
  if (tabId === "tipo") renderTipo();
  if (tabId === "datos") renderDatos();
  if (tabId === "dias") renderDias();
  if (tabId === "asistencias") renderAsistencias();
  if (tabId === "metricas") renderMetricas();
  $$(".tab-content").forEach(el => el.style.display = "none");
  const active = $("#tab-" + tabId);
  if (active) active.style.display = "block";
  updateBottomNav();
  window.scrollTo(0,0);
}

/* ---------- BARRA DE NAVEGACIÓN INFERIOR ---------- */
const BOTTOM_NAV = [
  { id: "inicio", label: "Inicio", icon: "home" },
  { id: "asistencias", label: "Calendario", icon: "calendar" },
  { id: "metricas", label: "Métricas", icon: "chart" },
  { id: "__menu", label: "Menú", icon: "menu" },
];
function buildBottomNav(){
  const nav = $("#bottomnav");
  if (!nav) return;
  nav.innerHTML = "";
  BOTTOM_NAV.forEach(item => {
    const el = document.createElement("button");
    el.className = "bn-item" + (item.id === currentTab ? " active" : "");
    el.dataset.tab = item.id;
    el.innerHTML = `${svgIcon(item.icon)}<span>${item.label}</span>`;
    el.onclick = () => item.id === "__menu" ? openMenu() : goTo(item.id);
    nav.appendChild(el);
  });
}
function updateBottomNav(){
  $$(".bn-item").forEach(el => el.classList.toggle("active", el.dataset.tab === currentTab));
}

function buildMenu(){
  const profile = State.profile();
  $("#menu-user-name").textContent = profile ? profile.nombre : "";
  $("#menu-user-avatar").textContent = profile ? initials(profile.nombre, profile.apellido) : "";
  $("#topbar-avatar").textContent = profile ? initials(profile.nombre, profile.apellido) : "";
  const nav = $("#menu-nav");
  nav.innerHTML = "";
  MENU_ITEMS.forEach(item => {
    const el = document.createElement("div");
    el.className = "menu-item" + (item.id === currentTab ? " active" : "");
    el.dataset.tab = item.id;
    el.innerHTML = `${svgIcon(item.icon)}<span>${item.label}</span>`;
    el.onclick = () => goTo(item.id);
    nav.appendChild(el);
  });
  buildBottomNav();
}

/* =========================================================
   PANTALLA: INICIO
   ========================================================= */
function renderHome(){
  buildMenu();
  const profile = State.profile();
  const today = todayStr();
  const plan = generateDayPlan(today);
  const attendance = State.attendance();
  const already = attendance[today];

  const d = new Date();
  const fechaTxt = `${DIAS_NOMBRE[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;

  const c = $("#tab-inicio");
  let html = "";

  if (plan.rest){
    html += `
      <div class="hero-day">
        <div class="hero-date">${fechaTxt}</div>
        <div class="hero-muscles">Hoy es día de descanso 🛌</div>
        <span class="rest-badge">Sin rutina programada</span>
      </div>
      <div class="card">
        <p style="color:var(--gris-600); font-size:14px; line-height:1.5; margin:0;">
          Aprovechá para descansar y recuperar. Si querés, andá a <b>Días de rutina</b> para revisar
          o cambiar los días que entrenás esta semana, ${profile.nombre}.
        </p>
      </div>`;
    html += buildUpcomingCard();
    c.innerHTML = html;
    return;
  }

  const muscles = plan.dayType.corto;
  const statusBadge = already
    ? (already.status === "asistio"
        ? `<span class="rest-badge" style="background:#2b3a2e;color:#8ce29c;">✓ Asististe hoy</span>`
        : `<span class="rest-badge" style="background:#3a2323;color:#ff9b9b;">✕ Marcado como no asistido${already.repuestoEn ? " · repuesto el "+fmtShort(already.repuestoEn) : ""}</span>`)
    : (plan.dayType.repuesto ? `<span class="rest-badge" style="background:#3a3323;color:#ffd873;">Sesión de reposición</span>` : "");

  html += `
    <div class="hero-day">
      <div class="hero-date">${fechaTxt}</div>
      <div class="hero-muscles">Hoy toca <span class="tag">${muscles}</span></div>
      ${statusBadge}
      <div class="hero-meta">
        <span>🔥 <b>${estimateSessionKcal(plan, profile.peso)}</b> kcal est.</span>
        <span>🏋️ <b>${plan.exercises.length}</b> ejercicios</span>
        <span>⏱️ <b>~${estimateSessionMinutes(plan)}</b> min</span>
      </div>
    </div>`;

  if (plan.cardio){
    html += `
      <div class="cardio-chip">
        <span class="dot"></span>
        <div>
          <div style="font-weight:700; font-size:13.5px;">${plan.cardioTitle}: ${plan.cardio.name}</div>
          <div style="font-size:11.5px; color:var(--gris-600);">${plan.cardio.durMin} minutos${plan.routineType==="musculacion" ? ", ritmo moderado" : ""}</div>
        </div>
      </div>`;
  }

  if (plan.exercises.length){
    const tituloEj = plan.routineType === "cardio" ? "Circuito / accesorios" : "Ejercicios de hoy";
    html += `<div class="card"><div class="section-title" style="margin-top:0;">${tituloEj}</div>`;
    plan.exercises.forEach((ex, i) => {
      html += `
        <div class="exercise-row" onclick="openExerciseDetail('${ex.id}','${today}','','${ex.swappedFrom||ex.id}')">
          <div class="exercise-left">
            ${exerciseThumb(ex)}
            <div>
              <div class="exercise-name">${ex.name}${ex.swappedFrom ? ' <span class="swap-mark">🔁</span>' : ''}</div>
              <div class="exercise-equip">${ex.equip}</div>
            </div>
          </div>
          <div class="exercise-sr">${ex.reps}x${ex.sets}</div>
        </div>`;
    });
    html += `</div>`;
  } else if (plan.cardio){
    html += `
      <div class="card" style="text-align:center;">
        <div style="font-size:26px; margin-bottom:6px;">🏃</div>
        <div style="font-weight:800; font-size:15px;">Hoy toca puro cardio</div>
        <div style="color:var(--gris-600); font-size:13px; margin-top:4px; line-height:1.5;">
          ${plan.cardio.durMin} minutos de ${plan.cardio.name.toLowerCase()}. Mantené un ritmo que puedas sostener, ${profile.nombre}.
        </div>
      </div>`;
  }

  if (!already){
    html += `
      <div class="card">
        <div class="section-title" style="margin-top:0;">¿Fuiste a entrenar hoy?</div>
        <div class="check-box">
          <button class="btn btn-primary" onclick="markAttendance(true)">✓ Sí, fui</button>
          <button class="btn btn-outline" onclick="markAttendance(false)">✕ No fui</button>
        </div>
      </div>`;
  } else if (already.status === "asistio") {
    html += `
      <div class="card" style="text-align:center;">
        <div style="font-size:28px; margin-bottom:4px;">💪</div>
        <div style="font-weight:800; font-size:15px;">¡Buen trabajo, ${profile.nombre}!</div>
        <div style="color:var(--gris-600); font-size:13px; margin-top:4px;">Ya quedó registrada tu asistencia de hoy.</div>
      </div>`;
  }

  html += buildUpcomingCard();

  c.innerHTML = html;
}

/* Tarjeta "Ver otro día": tira de próximos 7 días + selector de fecha.
   Tocar un día abre la rutina de ese día en un modal (solo lectura). */
function buildUpcomingCard(){
  const today = new Date();
  let chips = "";
  for (let i = 1; i <= 7; i++){
    const d = new Date(today); d.setDate(d.getDate() + i);
    const ds = fmtDate(d);
    const dt = getDayTypeForDate(ds);
    const entrena = !!(dt && dt.key);
    const etq = i === 1 ? "Mañana" : DIAS_CORTO[d.getDay()];
    chips += `
      <div class="upday ${entrena ? "train" : "rest"}" onclick="openDayPreview('${ds}')">
        <div class="upday-dow">${etq}</div>
        <div class="upday-num">${d.getDate()}</div>
        <div class="upday-dot">${entrena ? "•" : ""}</div>
      </div>`;
  }
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  return `
    <div class="card">
      <div class="section-title" style="margin-top:0;">Ver otro día</div>
      <p style="font-size:13px; color:var(--gris-600); margin:0 0 12px;">Mirá qué te toca mañana o cualquier día que elijas.</p>
      <div class="upstrip">${chips}</div>
      <div class="upstrip-picker">
        <input type="date" id="inp-preview-date" value="${fmtDate(tomorrow)}">
        <button class="btn btn-outline btn-sm" onclick="openDayPreview(document.getElementById('inp-preview-date').value)">Ver rutina</button>
      </div>
    </div>`;
}

/* Modal de solo lectura con la rutina de un día cualquiera */
function openDayPreview(dateStr){
  if (!dateStr) { toast("Elegí una fecha"); return; }
  const plan = generateDayPlan(dateStr);
  const d = parseDate(dateStr);
  const titulo = `${DIAS_NOMBRE[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
  let body = `<div class="modal-title">${titulo}</div>`;
  if (plan.rest){
    body += `<div class="modal-desc">Día de descanso 🛌 — no hay rutina programada para este día.</div>
             <button class="btn btn-outline" onclick="closeModal()">Cerrar</button>`;
  } else {
    body += `<div class="preview-daytag">${plan.dayType.label}</div>`;
    if (plan.cardio){
      body += `<div class="cardio-chip" style="margin:12px 0;">
        <span class="dot"></span>
        <div><div style="font-weight:700; font-size:13.5px;">${plan.cardioTitle}: ${plan.cardio.name}</div>
        <div style="font-size:11.5px; color:var(--gris-600);">${plan.cardio.durMin} min</div></div></div>`;
    }
    plan.exercises.forEach((ex, i) => {
      body += `
        <div class="exercise-row" onclick="openExerciseDetail('${ex.id}','${dateStr}','day','${ex.swappedFrom||ex.id}')">
          <div class="exercise-left">${exerciseThumb({...ex})}
            <div><div class="exercise-name">${ex.name}${ex.swappedFrom ? ' <span class="swap-mark">🔁</span>' : ''}</div><div class="exercise-equip">${ex.equip}</div></div></div>
          <div class="exercise-sr">${ex.reps}x${ex.sets}</div>
        </div>`;
    });
    body += `<button class="btn btn-outline" style="margin-top:16px;" onclick="closeModal()">Cerrar</button>`;
  }
  $("#modal-body").innerHTML = body;
  $("#modal-overlay").classList.add("open");
}

function estimateSessionMinutes(plan){
  if (!plan || plan.rest) return 0;
  let sec = plan.cardio ? plan.cardio.durMin * 60 : 0;
  plan.exercises.forEach(ex => { sec += (SET_DURATION_SEC[ex.tipo]||70) * ex.sets; });
  return Math.round(sec/60);
}

function fmtShort(dateStr){
  const d = parseDate(dateStr);
  return `${d.getDate()}/${d.getMonth()+1}`;
}

function markAttendance(fui){
  const today = todayStr();
  const plan = generateDayPlan(today);
  const attendance = State.attendance();
  if (fui){
    const profile = State.profile();
    // Congelamos las kcal de esta sesión: aunque después cambies objetivo,
    // foco o tipo de rutina, tu historial de métricas no se mueve.
    attendance[today] = {
      status: "asistio",
      dayKey: plan.dayType.key,
      kcal: estimateSessionKcal(plan, profile.peso),
    };
    State.saveAttendance(attendance);
    toast("¡Registrado! Sumaste una sesión más 🔥");
    renderHome();
  } else {
    attendance[today] = { status: "no_asistio", dayKey: plan.dayType.key };
    State.saveAttendance(attendance);
    openRescheduleModal(today, plan.dayType.key);
  }
}

function openRescheduleModal(originDate, dayKey){
  const overlay = $("#modal-overlay");
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  const label = (findSplitEntryByKey(dayKey) || {}).label || "tu sesión";
  $("#modal-body").innerHTML = `
    <div class="modal-title">¿Qué día lo reponés?</div>
    <div class="modal-desc">No pasa nada 🙌 Elegí el día en el que vas a hacer <b>${label}</b> como reposición y lo marcamos en tu calendario.</div>
    <div class="field"><label>Día de reposición</label><input type="date" id="inp-reschedule" min="${fmtDate(tomorrow)}" value="${fmtDate(tomorrow)}"></div>
    <button class="btn btn-red" onclick="confirmReschedule('${originDate}','${dayKey}')">Reprogramar</button>
    <button class="btn btn-ghost" onclick="closeModal()">Ahora no</button>
  `;
  overlay.classList.add("open");
}

function confirmReschedule(originDate, dayKey){
  const newDate = $("#inp-reschedule").value;
  if (!newDate){ toast("Elegí una fecha válida"); return; }
  const makeups = State.makeups();
  makeups[newDate] = { dayKey, origen: originDate };
  State.saveMakeups(makeups);
  const attendance = State.attendance();
  attendance[originDate].repuestoEn = newDate;
  State.saveAttendance(attendance);
  closeModal();
  toast(`Reprogramado para el ${fmtShort(newDate)} ✅`);
  renderHome();
}

function closeModal(){ $("#modal-overlay").classList.remove("open"); }

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
    ${canSwap ? `<button class="btn btn-outline" style="margin-bottom:10px;" onclick="openSwapPicker('${slotId}','${ex.grupo}','${date}','${back||""}')">🔁 Cambiar por otro ejercicio</button>` : ""}
    ${backDate
      ? `<button class="btn btn-ghost" onclick="openDayPreview('${backDate}')">‹ Volver a la rutina</button>`
      : `<button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>`}
  `;
  $("#modal-overlay").classList.add("open");
}

/* Picker para reemplazar un ejercicio por otro del mismo grupo muscular */
function openSwapPicker(slotId, grupo, date, back){
  const pool = (EXERCISE_DB[grupo] || []);
  const swaps = State.swaps();
  const activo = (swaps[date] || {})[slotId];
  const rows = pool.map(e => {
    const sel = (e.id === activo) || (!activo && e.id === slotId);
    return `
      <div class="exercise-row" onclick="applySwap('${slotId}','${e.id}','${grupo}','${date}','${back}')">
        <div class="exercise-left">${exerciseThumb({...e, grupo})}
          <div><div class="exercise-name">${e.name}</div><div class="exercise-equip">${e.equip}</div></div></div>
        <div class="exercise-sr" style="${sel ? "" : "background:var(--gris-100);color:var(--gris-600);"}">${sel ? "Actual" : "Elegir"}</div>
      </div>`;
  }).join("");
  $("#modal-body").innerHTML = `
    <div class="modal-title">Elegí el ejercicio</div>
    <div class="modal-desc">Reemplazá por otro del mismo grupo. Aplica solo para ese día.</div>
    ${activo ? `<button class="btn btn-outline" style="margin-bottom:12px;" onclick="applySwap('${slotId}','${slotId}','${grupo}','${date}','${back}')">↩︎ Volver al ejercicio original</button>` : ""}
    <div style="max-height:52vh; overflow-y:auto; margin-bottom:8px;">${rows}</div>
    <button class="btn btn-ghost" onclick="openExerciseDetail('${activo||slotId}','${date}','${back}','${slotId}')">Cancelar</button>
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
   PANTALLA: DATOS PERSONALES
   ========================================================= */
function renderDatos(){
  const p = State.profile();
  const c = $("#tab-datos");
  c.innerHTML = `
    <div class="avatar-big">${initials(p.nombre, p.apellido)}</div>
    <div class="card">
      <div class="field"><label>Nombre</label><input id="d-nombre" value="${p.nombre||""}"></div>
      <div class="field"><label>Apellido</label><input id="d-apellido" value="${p.apellido||""}"></div>
      <div class="field-row">
        <div class="field"><label>Edad</label><input id="d-edad" type="number" value="${p.edad||""}"></div>
        <div class="field"><label>Peso (kg)</label><input id="d-peso" type="number" step="0.1" value="${p.peso||""}"></div>
      </div>
      <div class="field"><label>Altura (cm)</label><input id="d-altura" type="number" value="${p.altura||""}"></div>
      <button class="btn btn-primary" onclick="saveDatos()">Guardar cambios</button>
    </div>

    <div class="card">
      <div class="section-title" style="margin-top:0;">Objetivo y nivel</div>
      <p style="font-size:13px; color:var(--gris-600); margin:0 0 12px;">Ajustamos las series, repeticiones y el cardio de tu rutina según esto.</p>
      <div class="field">
        <label>Mi objetivo</label>
        <select id="d-objetivo">
          ${Object.keys(OBJETIVOS).map(k=>`<option value="${k}" ${getObjetivo()===k?"selected":""}>${OBJETIVOS[k].emoji} ${OBJETIVOS[k].label}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Mi nivel</label>
        <select id="d-nivel">
          ${Object.keys(NIVELES).map(k=>`<option value="${k}" ${getNivel()===k?"selected":""}>${NIVELES[k].label}</option>`).join("")}
        </select>
      </div>
      <div class="hint-box" id="d-obj-hint">${OBJETIVOS[getObjetivo()].desc}</div>
      <button class="btn btn-primary" style="margin-top:14px;" onclick="saveObjetivoNivel()">Guardar objetivo y nivel</button>
    </div>

    <div class="card">
      <div class="section-title" style="margin-top:0;">Registrar peso de hoy</div>
      <p style="font-size:13px; color:var(--gris-600); margin-top:0;">Esto alimenta el gráfico de evolución en Métricas.</p>
      <div class="field"><input id="d-peso-log" type="number" step="0.1" placeholder="Ej: 78.5"></div>
      <button class="btn btn-outline" onclick="logWeight()">Guardar registro</button>
    </div>

    <div class="card">
      <div class="section-title" style="margin-top:0;">Copia de seguridad</div>
      <p style="font-size:13px; color:var(--gris-600); margin:0 0 12px; line-height:1.5;">
        Tus datos viven <b>solo en este teléfono</b>. Si borrás los datos del sitio en Safari, se pierden.
        Guardá un respaldo cada tanto y así podés restaurarlo o pasarlo a otro dispositivo.
      </p>
      <button class="btn btn-outline" onclick="exportData()">⤓ Exportar respaldo</button>
      <input type="file" id="d-import-file" accept="application/json,.json" style="display:none" onchange="importDataFile(this)">
      <button class="btn btn-ghost" style="margin-top:8px;" onclick="document.getElementById('d-import-file').click()">⤒ Importar respaldo</button>
    </div>
  `;
  const sel = $("#d-objetivo");
  if (sel) sel.onchange = () => { $("#d-obj-hint").textContent = OBJETIVOS[sel.value].desc; };
}

function saveObjetivoNivel(){
  const p = State.profile();
  p.objetivo = $("#d-objetivo").value;
  p.nivel = $("#d-nivel").value;
  State.saveProfile(p);
  toast("Objetivo y nivel guardados 🎯");
}

/* ---------- BACKUP: exportar / importar ---------- */
const BACKUP_KEYS = ["ff_profile","ff_trainingDays","ff_attendance","ff_makeups","ff_routineTypeLog","ff_focus","ff_swaps","ff_weightLog"];
function exportData(){
  const data = { app:"facu-fitness", version:1, exportedAt:new Date().toISOString(), data:{} };
  BACKUP_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v != null) data.data[k] = v; });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `facu-fitness-backup-${todayStr()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
  toast("Respaldo descargado ⤓");
}
function importDataFile(input){
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const payload = parsed && parsed.data ? parsed.data : parsed;
      if (!payload || typeof payload !== "object") throw new Error("formato");
      let count = 0;
      BACKUP_KEYS.forEach(k => {
        if (payload[k] != null){
          const val = typeof payload[k] === "string" ? payload[k] : JSON.stringify(payload[k]);
          localStorage.setItem(k, val); count++;
        }
      });
      if (!count) throw new Error("vacío");
      toast("Respaldo importado ✅ Recargando…");
      setTimeout(()=>location.reload(), 900);
    } catch(e){
      toast("No pude leer ese archivo de respaldo 😕");
    }
  };
  reader.readAsText(file);
  input.value = "";
}

function saveDatos(){
  const p = State.profile();
  p.nombre = $("#d-nombre").value.trim() || p.nombre;
  p.apellido = $("#d-apellido").value.trim();
  p.edad = +$("#d-edad").value || p.edad;
  p.peso = +$("#d-peso").value || p.peso;
  p.altura = +$("#d-altura").value || p.altura;
  State.saveProfile(p);
  toast("Datos actualizados ✅");
  buildMenu();
}

function logWeight(){
  const val = +$("#d-peso-log").value;
  if (!val){ toast("Ingresá un peso válido"); return; }
  const log = State.weightLog();
  const today = todayStr();
  const idx = log.findIndex(l => l.date === today);
  if (idx >= 0) log[idx].peso = val; else log.push({ date: today, peso: val });
  State.saveWeightLog(log);
  const p = State.profile(); p.peso = val; State.saveProfile(p);
  toast("Registro de peso guardado 📉");
  renderDatos();
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
      <p style="font-size:13px; color:var(--gris-600); margin-top:0;">Elegí 3 o 4 días. Si cambiás esto, tu rutina semanal se recalcula automáticamente.</p>
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
  $("#dias-hint").textContent = n < 2
    ? "Elegí al menos 2 días."
    : `Con ${n} días usamos una división de ${n <= 3 ? "3" : "4"} días para tu rutina de ${tipoLabel}.`;
  const split = getSplitFor(type, n);
  const sorted = tempDias.slice().sort((a,b)=>a-b);
  let html = `<div class="section-title" style="margin-top:0;">Vista previa semanal</div>`;
  sorted.forEach((d, i) => {
    const s = split[i];
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

/* =========================================================
   PANTALLA: MÉTRICAS
   ========================================================= */
function computeMetrics(){
  const profile = State.profile();
  const attendance = State.attendance();
  const entries = Object.entries(attendance).filter(([,a]) => a.status === "asistio");
  const totalSesiones = entries.length;

  let totalKcal = 0;
  entries.forEach(([date, a]) => {
    // Usa las kcal congeladas al momento de asistir; si es un registro viejo
    // sin ese dato, las recalcula como fallback.
    if (typeof a.kcal === "number") totalKcal += a.kcal;
    else totalKcal += estimateSessionKcal(generateDayPlan(date), profile.peso);
  });

  const kgEstimados = totalKcal / 7700;
  const alturaM = profile.altura / 100;
  const imc = profile.peso / (alturaM*alturaM);

  return { totalSesiones, totalKcal: Math.round(totalKcal), kgEstimados, imc };
}

function imcCategoria(imc){
  if (imc < 18.5) return "Bajo peso";
  if (imc < 25) return "Normal";
  if (imc < 30) return "Sobrepeso";
  return "Obesidad";
}

function renderMetricas(){
  const m = computeMetrics();
  const weightLog = State.weightLog().slice().sort((a,b)=>a.date.localeCompare(b.date));
  const c = $("#tab-metricas");

  const imcPos = Math.min(100, Math.max(0, ((m.imc - 15) / (35-15)) * 100));

  let html = `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-num">${m.totalSesiones}</div><div class="stat-label">Sesiones completadas</div></div>
      <div class="stat-card"><div class="stat-num red">${m.totalKcal}</div><div class="stat-label">Kcal estimadas quemadas</div></div>
      <div class="stat-card"><div class="stat-num">${m.kgEstimados.toFixed(2)}</div><div class="stat-label">Kg estimados por ejercicio</div></div>
      <div class="stat-card"><div class="stat-num">${m.imc.toFixed(1)}</div><div class="stat-label">IMC actual (${imcCategoria(m.imc)})</div></div>
    </div>

    <div class="card">
      <div class="section-title" style="margin-top:0;">Índice de Masa Corporal</div>
      <div class="imc-bar"><div class="imc-marker" style="left:${imcPos}%;"></div></div>
      <div class="imc-labels"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>35</span></div>
      <div class="disclaimer">Calculado con tu peso y altura actuales (Datos personales). Es un indicador general, no diagnóstico médico.</div>
    </div>

    <div class="card">
      <div class="section-title" style="margin-top:0;">Evolución de peso</div>
      ${weightLog.length >= 2 ? svgLineChart(weightLog) : `<div class="empty-state">Registrá tu peso en <b>Datos personales</b> a lo largo de las semanas para ver tu evolución acá.</div>`}
    </div>

    <div class="card">
      <div class="section-title" style="margin-top:0;">Asistencias últimas 8 semanas</div>
      ${svgBarWeeks()}
    </div>

    <div class="card">
      <div class="disclaimer">
        <b>Cómo estimamos esto:</b> como la app no accede a sensores del teléfono ni del reloj, calculamos las calorías
        de cada sesión con la fórmula MET × peso × tiempo, usando valores estándar del Compendio de Actividades Físicas
        para entrenamiento de fuerza y cardio. Los kg "estimados por ejercicio" son una referencia motivacional
        (≈7700 kcal por kg) y <b>no</b> tienen en cuenta tu alimentación — el peso real depende del balance calórico total, no solo del gasto por entrenar.
      </div>
    </div>
  `;
  c.innerHTML = html;
}

function svgLineChart(log){
  const w = 300, h = 120, pad = 24;
  const pesos = log.map(l=>l.peso);
  const min = Math.min(...pesos)-1, max = Math.max(...pesos)+1;
  const pts = log.map((l,i) => {
    const x = pad + (i/(log.length-1)) * (w-pad*2);
    const y = h - pad - ((l.peso-min)/(max-min)) * (h-pad*2);
    return [x,y];
  });
  const path = pts.map((p,i)=> (i===0?"M":"L")+p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
  const dots = pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#e03131"/>`).join("");
  const firstLbl = `${log[0].peso}kg`, lastLbl = `${log[log.length-1].peso}kg`;
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%; height:140px;">
    <path d="${path}" fill="none" stroke="#e03131" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
    <text x="${pts[0][0]}" y="${h-4}" font-size="10" fill="#6c6e76" text-anchor="middle">${firstLbl}</text>
    <text x="${pts[pts.length-1][0]}" y="${h-4}" font-size="10" fill="#6c6e76" text-anchor="middle">${lastLbl}</text>
  </svg>`;
}

function svgBarWeeks(){
  const attendance = State.attendance();
  const weeks = [];
  const now = new Date();
  for (let i=7;i>=0;i--){
    const d = new Date(now); d.setDate(d.getDate() - i*7);
    weeks.push(isoWeek(d) + "-" + d.getFullYear());
  }
  const counts = {};
  Object.entries(attendance).forEach(([date,a])=>{
    if (a.status !== "asistio") return;
    const d = parseDate(date);
    const key = isoWeek(d) + "-" + d.getFullYear();
    counts[key] = (counts[key]||0)+1;
  });
  const w = 300, h = 110, bw = w/weeks.length;
  const maxC = Math.max(4, ...weeks.map(k=>counts[k]||0));
  let bars = "";
  weeks.forEach((k,i)=>{
    const c = counts[k]||0;
    const bh = (c/maxC) * (h-24);
    bars += `<rect x="${i*bw+bw*0.2}" y="${h-20-bh}" width="${bw*0.6}" height="${bh}" rx="4" fill="${c>0?'#e03131':'#e3e4e8'}"/>`;
    bars += `<text x="${i*bw+bw/2}" y="${h-6}" font-size="9" fill="#9a9ca4" text-anchor="middle">${c}</text>`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%; height:110px;">${bars}</svg>`;
}

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  $("#burger-btn").onclick = openMenu;
  $("#menu-overlay").onclick = (e) => { if (e.target.id === "menu-overlay") closeMenu(); };
  $("#modal-overlay").onclick = (e) => { if (e.target.id === "modal-overlay") closeModal(); };
});
