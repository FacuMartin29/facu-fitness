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

  weightLog(){ return Store.get("ff_weightLog", []); },
  saveWeightLog(arr){ Store.set("ff_weightLog", arr); },
};

/* ---------- SPLIT ACTIVO SEGÚN CANTIDAD DE DÍAS ---------- */
function getActiveSplit(){
  const days = State.trainingDays();
  const n = days.length;
  if (n <= 3) return SPLITS[3];
  return SPLITS[4];
}

/* Devuelve el tipo de día (objeto split) para una fecha dada, o null si es descanso */
function getDayTypeForDate(dateStr){
  const makeups = State.makeups();
  if (makeups[dateStr]) {
    const split = getActiveSplit();
    const found = split.find(s => s.key === makeups[dateStr].dayKey) ||
                  SPLITS[3].concat(SPLITS[4]).find(s => s.key === makeups[dateStr].dayKey);
    return { ...found, repuesto: true, origen: makeups[dateStr].origen };
  }
  const days = State.trainingDays();
  if (!days.length) return null;
  const date = parseDate(dateStr);
  const weekday = date.getDay();
  const idx = days.indexOf(weekday);
  if (idx === -1) return null;
  const split = getActiveSplit();
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

/* Genera el plan completo del día: {rest:true} o {dayType, cardio, exercises:[...]} */
function generateDayPlan(dateStr){
  const dayType = getDayTypeForDate(dateStr);
  if (!dayType) return { rest: true };
  const week = isoWeek(parseDate(dateStr));
  let exercises = [];
  dayType.grupos.forEach((grp, gi) => {
    const seed = week + gi * 3 + dayType.key.charCodeAt(0);
    const picks = pickExercises(grp.g, grp.n, seed);
    picks.forEach(p => exercises.push({ ...p, grupo: grp.g }));
  });
  return { rest: false, dayType, cardio: pickCardio(dateStr), exercises };
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
  setTimeout(() => {
    if (profile && profile.onboardDone) {
      renderHome();
      showScreen("#screen-main");
    } else {
      showScreen("#screen-onb-name");
    }
  }, 1200);
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
  if (tabId === "datos") renderDatos();
  if (tabId === "dias") renderDias();
  if (tabId === "asistencias") renderAsistencias();
  if (tabId === "metricas") renderMetricas();
  $$(".tab-content").forEach(el => el.style.display = "none");
  const active = $("#tab-" + tabId);
  if (active) active.style.display = "block";
  window.scrollTo(0,0);
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

  html += `
    <div class="cardio-chip">
      <span class="dot"></span>
      <div>
        <div style="font-weight:700; font-size:13.5px;">Calentamiento: ${plan.cardio.name}</div>
        <div style="font-size:11.5px; color:var(--gris-600);">${plan.cardio.durMin} minutos, ritmo moderado</div>
      </div>
    </div>`;

  html += `<div class="card"><div class="section-title" style="margin-top:0;">Ejercicios de hoy</div>`;
  plan.exercises.forEach((ex, i) => {
    html += `
      <div class="exercise-row" onclick="openExerciseDetail('${ex.id}')">
        <div class="exercise-left">
          <div class="exercise-idx">${i+1}</div>
          <div>
            <div class="exercise-name">${ex.name}</div>
            <div class="exercise-equip">${ex.equip}</div>
          </div>
        </div>
        <div class="exercise-sr">${ex.reps}x${ex.sets}</div>
      </div>`;
  });
  html += `</div>`;

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

  c.innerHTML = html;
}

function estimateSessionMinutes(plan){
  if (!plan || plan.rest) return 0;
  let sec = plan.cardio.durMin * 60;
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
    attendance[today] = { status: "asistio", dayKey: plan.dayType.key };
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
  const allSplits = SPLITS[3].concat(SPLITS[4]);
  const label = (allSplits.find(s=>s.key===dayKey) || {}).label || "";
  $("#modal-body").innerHTML = `
    <div class="modal-title">¿Cuándo lo reponés?</div>
    <div class="modal-desc">Elegí el día en el que vas a hacer esta rutina (${label}) como reposición.</div>
    <div class="field"><input type="date" id="inp-reschedule" min="${fmtDate(tomorrow)}" value="${fmtDate(tomorrow)}"></div>
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

function openExerciseDetail(id){
  const ex = findExerciseById(id);
  if (!ex) return;
  const archetype = EXERCISE_IMAGE[id] || "bench_press_flat";
  const cue = EXERCISE_CUE[archetype] || "";
  $("#modal-body").innerHTML = `
    <div style="width:100%; border-radius:16px; overflow:hidden; background:#f6f6f8; margin-bottom:16px;">
      <img src="images/exercises/${archetype}.svg" alt="${ex.name}" style="width:100%; display:block;">
    </div>
    <div class="modal-title">${ex.name}</div>
    <div style="display:flex; gap:8px; margin:6px 0 12px;">
      <span class="exercise-sr" style="background:var(--gris-100); color:var(--gris-800);">${ex.equip}</span>
      <span class="exercise-sr">${ex.reps} reps x ${ex.sets} series</span>
    </div>
    <div class="modal-desc" style="margin-bottom:4px;">${cue}</div>
    <button class="btn btn-outline" onclick="closeModal()">Cerrar</button>
  `;
  $("#modal-overlay").classList.add("open");
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
      <div class="section-title" style="margin-top:0;">Registrar peso de hoy</div>
      <p style="font-size:13px; color:var(--gris-600); margin-top:0;">Esto alimenta el gráfico de evolución en Métricas.</p>
      <div class="field"><input id="d-peso-log" type="number" step="0.1" placeholder="Ej: 78.5"></div>
      <button class="btn btn-outline" onclick="logWeight()">Guardar registro</button>
    </div>
  `;
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
  $("#dias-hint").textContent = n < 2
    ? "Elegí al menos 2 días."
    : `Con ${n} días vamos a usar una división de ${n <= 3 ? "3 días (Pecho+Bíceps / Espalda+Tríceps+Hombro / Piernas)" : "4 días (Pecho+Tríceps / Espalda+Bíceps / Piernas / Hombro+Core)"}.`;
  const split = n <= 3 ? SPLITS[3] : SPLITS[4];
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
      ${plan.exercises.map((ex,i)=>`
        <div class="exercise-row" onclick="openExerciseDetail('${ex.id}')">
          <div class="exercise-left"><div class="exercise-idx">${i+1}</div>
            <div><div class="exercise-name">${ex.name}</div><div class="exercise-equip">${ex.equip}</div></div></div>
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
  entries.forEach(([date]) => {
    const plan = generateDayPlan(date);
    totalKcal += estimateSessionKcal(plan, profile.peso);
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
