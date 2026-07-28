/* =========================================================
   FAC FIT — Modulo: CORE
   Store, State, helpers, navegacion de pantallas, menu, tema, arranque e instalacion.
   ========================================================= */
const DIAS_NOMBRE = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const DIAS_CORTO  = ["D","L","M","X","J","V","S"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

/* ---------- HELPERS DE FECHA ---------- */
/* Fecha local en formato YYYY-MM-DD. Ojo: NO usar toISOString() acá porque
   devuelve UTC y, de noche en Argentina (UTC-3), adelantaba el día — rompía
   "hoy", la rutina del día y la fecha de la asistencia. */
function fmtDate(d){
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
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
  set(key, val){
    try{
      localStorage.setItem(key, JSON.stringify(val));
      // Sincroniza los datos del usuario con la nube (Supabase), con debounce
      if (key.indexOf("ff_") === 0 && typeof scheduleCloudSync === "function") scheduleCloudSync();
    }catch(e){}
  },
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

  /* Registro de cargas por ejercicio: { exId: [{ d, kg, reps }] } */
  lifts(){ return Store.get("ff_lifts", {}); },
  saveLifts(obj){ Store.set("ff_lifts", obj); },

  /* Medidas corporales: [{ date, cintura, cadera, pecho, brazo, muslo, ... }] */
  measures(){ return Store.get("ff_measures", []); },
  saveMeasures(arr){ Store.set("ff_measures", arr); },

  weightLog(){ return Store.get("ff_weightLog", []); },
  saveWeightLog(arr){ Store.set("ff_weightLog", arr); },
};

/* Valores por defecto de objetivo/nivel si el perfil no los tiene aún */
function getObjetivo(){ const p = State.profile(); return (p && p.objetivo) || "ganar_musculo"; }
function getNivel(){ const p = State.profile(); return (p && p.nivel) || "intermedio"; }

/* =========================================================
   RENDER / UI
   ========================================================= */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function showScreen(id){
  $$(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
  // Ya salimos del splash: liberamos el fondo negro de arranque
  if (id !== "#screen-splash") document.documentElement.classList.remove("ff-boot");
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
const onb = { nombre:"", apellido:"", cumple:"", genero:"masculino", edad:"", peso:"", altura:"", dias:[] };

function initApp(){
  const splash = $("#screen-splash");
  // El loader gira 2s. Al terminar, el logo se expande y el flujo de auth
  // decide: login/registro, onboarding o home.
  setTimeout(() => {
    splash.classList.add("zoom");
    setTimeout(() => { authBoot(); }, 620);
  }, 2000);
}

/* ---------- ONBOARDING: PASO NOMBRE ---------- */
function onbNameNext(){
  const v = $("#inp-nombre").value.trim();
  if (!v){ toast("Che, poné tu nombre para arrancar 👋"); return; }
  onb.nombre = v;
  onb.apellido = $("#inp-apellido").value.trim();
  showScreen("#screen-onb-datos");
}

/* ---------- ONBOARDING: PASO DATOS ---------- */
function onbDatosNext(){
  const edad = +$("#inp-edad").value, peso = +$("#inp-peso").value, altura = +$("#inp-altura").value;
  if (!edad || !peso || !altura){ toast("Completá edad, peso y altura para continuar"); return; }
  onb.edad = edad; onb.peso = peso; onb.altura = altura;
  onb.cumple = $("#inp-cumple").value || "";
  onb.genero = $("#inp-genero").value || "masculino";
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
  $("#btn-onb-finish").disabled = (n < 2 || n > 7);
}

function onbFinish(){
  if (onb.dias.length < 2){ toast("Elegí al menos 2 días de entrenamiento"); return; }
  const existing = State.profile() || {};
  const profile = {
    ...existing,
    nombre: onb.nombre, apellido: onb.apellido || existing.apellido || "",
    cumple: onb.cumple || existing.cumple || "",
    genero: onb.genero || existing.genero || "masculino",
    edad: onb.edad, peso: onb.peso, altura: onb.altura,
    onboardDone: true,
  };
  State.saveProfile(profile);
  State.saveTrainingDays(onb.dias);
  State.saveWeightLog([{ date: todayStr(), peso: onb.peso }]);
  const saludo = profile.genero === "femenino" ? "¡Bienvenida" : (profile.genero === "no_dice" ? "¡Hola" : "¡Bienvenido");
  toast(`${saludo}, ${profile.nombre}! Tu rutina ya está lista 💪`);
  if (typeof maybeOfferBiometric === "function") maybeOfferBiometric();
  else { renderHome(); showScreen("#screen-main"); }
}

/* =========================================================
   MENÚ LATERAL
   ========================================================= */
/* Menú por módulos: algunos entran directo (leaf) y otros agrupan sub-secciones.
   Los ids de las sub-secciones siguen siendo los mismos tabs de siempre. */
const MENU_GROUPS = [
  { id: "inicio", label: "Inicio", icon: "home" },
  { id: "entrenamiento", label: "Entrenamiento", icon: "dumbbell", children: [
      { id: "tipo", label: "Tipo de rutina", icon: "dumbbell" },
      { id: "dias", label: "Días de rutina", icon: "calendar" },
      { id: "asistencias", label: "Asistencias", icon: "check" },
  ]},
  { id: "perfil", label: "Datos personales", icon: "user", children: [
      { id: "datos", label: "Mis datos", icon: "user" },
      { id: "medidas", label: "Medidas corporales", icon: "ruler" },
  ]},
  { id: "nutricion", label: "Nutrición", icon: "apple" },
  { id: "metricas", label: "Métricas", icon: "chart" },
  { id: "encuesta", label: "Tu opinión", icon: "chat" },
];
/* Tabs que viven dentro de cada grupo (para saber qué grupo abrir) */
function groupOf(tabId){
  const g = MENU_GROUPS.find(m => m.children && m.children.some(c => c.id === tabId));
  return g ? g.id : null;
}

const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  check: '<path d="M4 12l6 6L20 6"/>',
  chart: '<path d="M4 20V10M12 20V4M20 20v-7"/>',
  dumbbell: '<path d="M6.5 6.5l11 11"/><path d="M3 8l2-2 3 3-2 2z"/><path d="M16 19l2-2 3-3-2-2-3 3z" transform="translate(-1,-1)"/><path d="M2 12l2 2M20 10l2 2"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  ruler: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 7v3M11 7v4M15 7v3M19 7v4"/>',
  apple: '<path d="M12 7c0-2 1.5-3.5 3.5-3.5M12 7c-1.5-2-4-2.2-5.6-.8C4.5 8 4.5 12 6 15c1 2 2 3.5 3.5 3.5 1 0 1.4-.5 2.5-.5s1.5.5 2.5.5c1.5 0 2.5-1.5 3.5-3.5 1.5-3 1.5-7-.4-8.8C18 4 15.5 4.5 14 6.5"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
};
function svgIcon(name, extra=""){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${ICONS[name]||""}</svg>`;
}

function openMenu(){
  buildMenu(); // reconstruye para reflejar el tab activo y abrir su grupo
  $("#menu-overlay").classList.add("open");
  $("#menu-panel").classList.add("open");
}
function closeMenu(){
  $("#menu-overlay").classList.remove("open");
  $("#menu-panel").classList.remove("open");
}

/* Acordeón del menú: abre el grupo tocado y cierra los otros */
function toggleMenuGroup(groupId){
  const target = document.querySelector(`.menu-group[data-group="${groupId}"]`);
  if (!target) return;
  const wasOpen = target.classList.contains("open");
  $$(".menu-group").forEach(g => g.classList.remove("open"));
  if (!wasOpen) target.classList.add("open");
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
  if (tabId === "medidas") renderMedidas();
  if (tabId === "nutricion") renderNutricion();
  if (tabId === "metricas") renderMetricas();
  if (tabId === "encuesta") renderEncuesta();
  $$(".tab-content").forEach(el => el.style.display = "none");
  const active = $("#tab-" + tabId);
  if (active) active.style.display = "block";
  updateBottomNav();
  window.scrollTo(0,0);
}

/* ---------- TEMA (claro / oscuro) — preferencia local del dispositivo ---------- */
function getTheme(){ return localStorage.getItem("ff_theme") || "light"; }
function applyTheme(t){
  if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t === "dark" ? "#0d0d0f" : "#f1f1f4");
}
function toggleTheme(){
  const next = getTheme() === "dark" ? "light" : "dark";
  localStorage.setItem("ff_theme", next);
  applyTheme(next);
  if (currentTab === "datos") renderDatos();
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
  const sub = document.querySelector(".menu-user .sub");
  if (sub) sub.textContent = (profile && profile.email) ? profile.email : "Fac Fit";
  $("#menu-user-avatar").textContent = profile ? initials(profile.nombre, profile.apellido) : "";
  $("#topbar-avatar").textContent = profile ? initials(profile.nombre, profile.apellido) : "";
  const nav = $("#menu-nav");
  const openGroup = groupOf(currentTab); // grupo que contiene el tab activo
  let html = "";
  MENU_GROUPS.forEach(item => {
    if (item.children){
      const isOpen = item.id === openGroup;
      const rows = item.children.map(c =>
        `<div class="menu-item menu-subitem${c.id === currentTab ? " active" : ""}" data-tab="${c.id}" onclick="goTo('${c.id}')">
           ${svgIcon(c.icon)}<span>${c.label}</span>
         </div>`).join("");
      html += `
        <div class="menu-group${isOpen ? " open" : ""}" data-group="${item.id}">
          <div class="menu-group-head" onclick="toggleMenuGroup('${item.id}')">
            ${svgIcon(item.icon)}<span>${item.label}</span>
            <span class="menu-chevron">${svgIcon("chevron")}</span>
          </div>
          <div class="menu-group-body">${rows}</div>
        </div>`;
    } else {
      html += `<div class="menu-item${item.id === currentTab ? " active" : ""}" data-tab="${item.id}" onclick="goTo('${item.id}')">
                 ${svgIcon(item.icon)}<span>${item.label}</span>
               </div>`;
    }
  });
  nav.innerHTML = html;
  buildBottomNav();
  const mi = $("#menu-install");
  if (mi) mi.style.display = (typeof isStandaloneApp === "function" && isStandaloneApp()) ? "none" : "block";
}

/* =========================================================
   INSTALAR / COMPARTIR LA APP
   ========================================================= */
let deferredInstall = null;
function isStandaloneApp(){ return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }

/* Íconos para las instrucciones */
const SHARE_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0a84ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px;"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 14v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/></svg>';
const PLUS_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:-4px;"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
const DOTS_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align:-4px;"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';

window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstall = e; });
window.addEventListener("appinstalled", () => { deferredInstall = null; closeInstall(); });

/* Muestra las instrucciones de instalación según el dispositivo.
   auto=true -> solo la primera vez (visitante nuevo no instalado) */
function showInstallInstructions(auto){
  if (isStandaloneApp()) return;                       // ya la tiene instalada
  if (auto && sessionStorage.getItem("ff_installSeen")) return;  // una vez por sesión
  const ov = document.getElementById("install-overlay");
  const card = document.getElementById("install-card");
  if (!ov || !card) return;

  const ua = navigator.userAgent;
  const iOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const iOSOtroNavegador = iOS && /(CriOS|FxiOS|EdgiOS|OPiOS)/i.test(ua);
  const android = /android/i.test(ua);
  let cuerpo = "";

  if (iOSOtroNavegador){
    cuerpo = `
      <div class="ins-note">Para instalarla en el iPhone tenés que abrir este link en <b>Safari</b> (este navegador no lo permite).</div>
      <button class="btn btn-primary" onclick="copyAppLink()">Copiar link y abrir en Safari</button>`;
  } else if (iOS){
    cuerpo = `
      <div class="ins-step"><span class="ins-num">1</span><div>Tocá el botón <b>Compartir</b> ${SHARE_ICON} en la barra de abajo de Safari.</div></div>
      <div class="ins-step"><span class="ins-num">2</span><div>Deslizá hacia abajo y tocá <b>“Agregar a inicio”</b> ${PLUS_ICON}.</div></div>
      <div class="ins-step"><span class="ins-num">3</span><div>Tocá <b>“Agregar”</b> arriba a la derecha. ¡Listo! 🎉</div></div>`;
  } else if (android){
    cuerpo = `
      ${deferredInstall ? `<button class="btn btn-primary" onclick="doInstall()">📲 Instalar Fac Fit</button><div class="ins-or">— o a mano —</div>` : ""}
      <div class="ins-step"><span class="ins-num">1</span><div>Tocá el <b>menú</b> ${DOTS_ICON} (arriba a la derecha).</div></div>
      <div class="ins-step"><span class="ins-num">2</span><div>Elegí <b>“Instalar aplicación”</b> o <b>“Agregar a la pantalla principal”</b>.</div></div>`;
  } else {
    cuerpo = deferredInstall
      ? `<button class="btn btn-primary" onclick="doInstall()">Instalar Fac Fit</button>`
      : `<div class="ins-note">Abrí este link desde tu <b>teléfono</b> para instalar la app en la pantalla de inicio.</div>`;
  }

  card.innerHTML = `
    <div class="ins-brand">FAC <span>FIT</span></div>
    <div class="ins-title">Sumá Fac Fit a tu teléfono</div>
    <div class="ins-sub">Instalala como una app de verdad: entra directo, anda offline y se ve a pantalla completa.</div>
    <div class="ins-steps">${cuerpo}</div>
    <button class="btn btn-ghost" onclick="closeInstall()">Seguir en el navegador</button>`;
  ov.style.display = "flex";
  try { sessionStorage.setItem("ff_installSeen", "1"); } catch(e){}
}
async function doInstall(){
  if (!deferredInstall) return;
  deferredInstall.prompt();
  try { await deferredInstall.userChoice; } catch(e){}
  deferredInstall = null;
  closeInstall();
}
function closeInstall(){ const ov = document.getElementById("install-overlay"); if (ov) ov.style.display = "none"; }
function copyAppLink(){
  const url = location.origin + location.pathname;
  if (navigator.clipboard){ navigator.clipboard.writeText(url).then(()=>toast("Link copiado 📋 Pegalo en Safari")).catch(()=>toast(url)); }
  else toast(url);
}

async function shareApp(){
  const url = location.origin + location.pathname;
  const data = { title: "Fac Fit", text: "Te comparto Fac Fit, la app para organizar tus entrenamientos 💪🔥", url };
  if (navigator.share){
    try { await navigator.share(data); } catch(e){}
  } else {
    try { await navigator.clipboard.writeText(url); toast("Link copiado 📋 Pegalo donde quieras"); }
    catch(e){ toast(url); }
  }
  if (window.closeMenu) closeMenu();
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
