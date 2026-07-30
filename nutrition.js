/* =========================================================
   FAC FIT — Modulo: NUTRITION (Nutricion)
   App de nutricion completa, en 4 capas:
   1) Perfil nutricional (dieta, restricciones, nº de comidas)
   2) Metas (Mifflin-St Jeor + actividad + objetivo)
   3) Menus y recetas (generador + biblioteca + lista de compras)
   4) Seguimiento (diario de comidas + anillo de progreso)
   Datos de alimentos/recetas en nutrition-data.js
   ========================================================= */
const OBJETIVO_LABEL = { ganar_musculo:"Ganar músculo", perder_grasa:"Perder grasa", mantener:"Mantener" };

function computeNutrition(){
  const p = State.profile() || {};
  const peso = +p.peso, altura = +p.altura, edad = +p.edad;
  if (!peso || !altura || !edad) return null;
  const genero = p.genero || "masculino";

  // Metabolismo basal (Mifflin-St Jeor)
  let bmr = 10 * peso + 6.25 * altura - 5 * edad;
  if (genero === "masculino") bmr += 5;
  else if (genero === "femenino") bmr -= 161;
  else bmr -= 78; // promedio si no lo dice

  // Factor de actividad según días de entrenamiento por semana
  const dias = (State.trainingDays() || []).length;
  let actividad, actNom;
  if (dias <= 1){ actividad = 1.2;   actNom = "Sedentario"; }
  else if (dias <= 3){ actividad = 1.375; actNom = "Ligero"; }
  else if (dias <= 5){ actividad = 1.55;  actNom = "Moderado"; }
  else { actividad = 1.725; actNom = "Muy activo"; }
  const tdee = bmr * actividad;

  // Ajuste por objetivo
  const objetivo = getObjetivo();
  let cal, ajusteTxt;
  if (objetivo === "perder_grasa"){ cal = tdee * 0.82; ajusteTxt = "Déficit del 18%"; }
  else if (objetivo === "ganar_musculo"){ cal = tdee * 1.10; ajusteTxt = "Superávit del 10%"; }
  else { cal = tdee; ajusteTxt = "Mantenimiento"; }
  cal = Math.round(cal / 10) * 10;
  const autoCal = cal;

  // Meta manual: si la persona fijó sus propias calorías, mandan esas
  const override = +(( (p.nutri||{}).calOverride) || 0);
  const custom = override > 0;
  if (custom){ cal = override; ajusteTxt = "Meta personalizada"; }

  // Macros (proteína por peso; grasa 25%; el resto carbos) — se recalculan con la meta final
  const protPerKg = objetivo === "perder_grasa" ? 2.2 : (objetivo === "ganar_musculo" ? 2.0 : 1.8);
  const prot = Math.round(peso * protPerKg);
  const grasa = Math.round(cal * 0.25 / 9);
  const carbs = Math.max(0, Math.round((cal - (prot * 4 + grasa * 9)) / 4));

  return { bmr:Math.round(bmr), tdee:Math.round(tdee), cal, autoCal, custom, prot, grasa, carbs,
           actNom, dias, objetivo, ajusteTxt, protPerKg };
}

const OBJETIVO_TIP = {
  ganar_musculo: "Comé en superávit y repartí la proteína en todas las comidas. La constancia le gana a la perfección.",
  perder_grasa:  "Un déficit moderado y sostenible rinde más que uno agresivo. La proteína alta te ayuda a no perder músculo.",
  mantener:      "Comé alrededor de tu gasto y ajustá según cómo se mueva la balanza y tus medidas.",
};

/* ---------- Reparto de comidas según cuántas hace la persona ---------- */
const MEAL_PLANS = {
  3: [ {key:"desayuno",label:"Desayuno",pct:.30}, {key:"almuerzo",label:"Almuerzo",pct:.40}, {key:"cena",label:"Cena",pct:.30} ],
  4: [ {key:"desayuno",label:"Desayuno",pct:.25}, {key:"almuerzo",label:"Almuerzo",pct:.35}, {key:"merienda",label:"Merienda",pct:.15}, {key:"cena",label:"Cena",pct:.25} ],
  5: [ {key:"desayuno",label:"Desayuno",pct:.22}, {key:"snack",label:"Colación",pct:.10}, {key:"almuerzo",label:"Almuerzo",pct:.30}, {key:"merienda",label:"Merienda",pct:.13}, {key:"cena",label:"Cena",pct:.25} ],
};
const DIETAS = { omnivoro:"Omnívoro", vegetariano:"Vegetariano", vegano:"Vegano" };
const SEM_EMOJI = { verde:"🟢", amarillo:"🟡", rojo:"🔴" };
const SEM_LABEL = { verde:"Ideal", amarillo:"Con medida", rojo:"Ocasional" };

/* ---------- Preferencias (viven dentro del perfil, ya sincroniza) ---------- */
function nutriPrefs(){
  const p = State.profile() || {};
  return Object.assign({ dieta:"omnivoro", sinTacc:false, comidas:4, excluir:[] }, p.nutri || {});
}
function saveNutriPrefs(patch){
  const p = State.profile() || {};
  p.nutri = Object.assign(nutriPrefs(), patch);
  State.saveProfile(p);
}

/* ---------- Diario de comidas y menú guardado (claves nuevas) ---------- */
function nutriLog(){ return Store.get("ff_nutriLog", {}); }
function saveNutriLog(o){ Store.set("ff_nutriLog", o); }
function dayLog(date){ return nutriLog()[date] || []; }
function nutriMenu(){ return Store.get("ff_nutriMenu", null); }
function saveNutriMenu(m){ Store.set("ff_nutriMenu", m); }

/* ---------- Macros de alimentos y recetas ---------- */
function foodMacros(food, grams){
  const k = grams / 100;
  return { kcal:Math.round(food.kcal*k), p:+(food.p*k).toFixed(1), c:+(food.c*k).toFixed(1), g:+(food.g*k).toFixed(1) };
}
function recipeMacros(recipe, mult){
  mult = mult || 1;
  const t = { kcal:0, p:0, c:0, g:0 };
  recipe.ingr.forEach(i => {
    const f = FOOD_BY_ID[i.f]; if (!f) return;
    const m = foodMacros(f, i.g * mult);
    t.kcal += m.kcal; t.p += m.p; t.c += m.c; t.g += m.g;
  });
  return { kcal:Math.round(t.kcal), p:Math.round(t.p), c:Math.round(t.c), g:Math.round(t.g) };
}
/* Dieta de una receta = la más restrictiva que cumplen TODOS sus ingredientes */
function recipeDiet(recipe){
  const all = tag => recipe.ingr.every(i => (FOOD_BY_ID[i.f]?.tags||[]).includes(tag));
  return { vegano:all(VG), vegetariano:all(V), sintacc:all(ST) };
}

/* ---------- Ilustración de plato (SVG) por receta ----------
   Genera una tarjeta con degradé propio de cada receta + el emoji sobre un
   "plato". Consistente, offline y sin riesgo legal (a diferencia de fotos
   sueltas por plato). El color sale de un hash del id, así cada receta es
   distinta pero estable. */
function hashHue(s){ let h = 0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) >>> 0; return h % 360; }
function recipeArt(r){
  const hue = hashHue(r.id);
  const c1 = `hsl(${hue} 68% 60%)`, c2 = `hsl(${(hue+38)%360} 70% 46%)`;
  const gid = "rg-" + r.id;
  return `<svg viewBox="0 0 120 90" class="recipe-art" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <rect width="120" height="90" fill="url(#${gid})"/>
    <circle cx="60" cy="45" r="27" fill="rgba(255,255,255,.20)"/>
    <circle cx="60" cy="45" r="20" fill="rgba(255,255,255,.34)"/>
    <text x="60" y="46" text-anchor="middle" dominant-baseline="central" font-size="30">${r.emoji||"🍽️"}</text>
  </svg>`;
}

/* ---------- Filtros por dieta / restricciones ---------- */
function foodAllowed(food, prefs){
  prefs = prefs || nutriPrefs();
  if (prefs.dieta === "vegano" && !food.tags.includes(VG)) return false;
  if (prefs.dieta === "vegetariano" && !food.tags.includes(V)) return false;
  if (prefs.sinTacc && !food.tags.includes(ST)) return false;
  if (prefs.excluir && prefs.excluir.includes(food.id)) return false;
  return true;
}
function recipeAllowed(recipe, prefs){
  prefs = prefs || nutriPrefs();
  return recipe.ingr.every(i => FOOD_BY_ID[i.f] && foodAllowed(FOOD_BY_ID[i.f], prefs));
}

/* ---------- Semáforo según objetivo ---------- */
function semaforo(food, objetivo){
  objetivo = objetivo || getObjetivo();
  let s = food.sem;
  if (objetivo === "ganar_musculo" && s === "amarillo" && (food.cat === "carbo" || food.cat === "fruta")) s = "verde";
  if (objetivo === "perder_grasa" && s === "amarillo" && (food.cat === "snack" || food.cat === "grasa")) s = "rojo";
  return s;
}

/* ---------- Totales del día (diario) ---------- */
function dayTotals(date){
  const t = { kcal:0, p:0, c:0, g:0 };
  dayLog(date).forEach(it => { t.kcal += it.kcal||0; t.p += it.p||0; t.c += it.c||0; t.g += it.g||0; });
  t.p = Math.round(t.p); t.c = Math.round(t.c); t.g = Math.round(t.g);
  return t;
}

/* =========================================================
   TARJETA DE NUTRICIÓN PARA MÉTRICAS (últimos 7 días)
   ========================================================= */
function buildNutriMetricsCard(){
  const n = computeNutrition();
  if (!n) return "";
  const days = [];
  for (let i = 6; i >= 0; i--){ const d = new Date(); d.setDate(d.getDate() - i); days.push(fmtDate(d)); }
  const data = days.map(dt => { const t = dayTotals(dt); return { date:dt, kcal:t.kcal, p:t.p }; });
  const logged = data.filter(x => x.kcal > 0);

  if (!logged.length){
    return `
      <div class="card">
        <div class="section-title" style="margin-top:0;">🥗 Nutrición</div>
        <div class="empty-state">Registrá lo que comés en <b>Nutrición → Hoy</b> y acá vas a ver tu adherencia, promedios y los últimos 7 días.</div>
      </div>`;
  }

  const goal = n.cal;
  const avgKcal = Math.round(logged.reduce((s,x)=>s+x.kcal,0) / logged.length);
  const avgP = Math.round(logged.reduce((s,x)=>s+x.p,0) / logged.length);
  const enObjetivo = logged.filter(x => Math.abs(x.kcal - goal) <= goal*0.10).length;

  // Mini gráfico de barras: kcal por día vs meta
  const w = 300, h = 116, padX = 10, padTop = 14, padBot = 20;
  const maxV = Math.max(goal, ...data.map(x=>x.kcal)) * 1.12 || 1;
  const bw = (w - padX*2) / 7;
  const yGoal = padTop + (1 - goal/maxV) * (h - padTop - padBot);
  const bars = data.map((x,i) => {
    const bh = x.kcal>0 ? Math.max(2, (x.kcal/maxV) * (h - padTop - padBot)) : 0;
    const bx = padX + i*bw + bw*0.2, by = h - padBot - bh, bwid = bw*0.6;
    const near = Math.abs(x.kcal - goal) <= goal*0.10;
    const col = x.kcal===0 ? "var(--gris-200)" : (near ? "#2f9e44" : (x.kcal>goal ? "#f08c00" : "#e03131"));
    const dow = DIAS_CORTO[parseDate(x.date).getDay()];
    return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bwid.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${col}"/>
      <text x="${(bx+bwid/2).toFixed(1)}" y="${h-6}" text-anchor="middle" font-size="9" fill="var(--gris-400)">${dow}</text>`;
  }).join("");
  const goalLine = `<line x1="${padX}" y1="${yGoal.toFixed(1)}" x2="${w-padX}" y2="${yGoal.toFixed(1)}" stroke="var(--gris-400)" stroke-width="1" stroke-dasharray="4 3"/>
    <text x="${w-padX}" y="${(yGoal-4).toFixed(1)}" text-anchor="end" font-size="9" fill="var(--gris-500)">meta ${goal}</text>`;

  return `
    <div class="card">
      <div class="section-title" style="margin-top:0;">🥗 Nutrición · últimos 7 días</div>
      <div class="nutri-metric-grid">
        <div class="nm-stat"><div class="nm-num">${logged.length}<span>/7</span></div><div class="nm-lbl">días registrados</div></div>
        <div class="nm-stat"><div class="nm-num">${avgKcal}</div><div class="nm-lbl">kcal promedio</div></div>
        <div class="nm-stat"><div class="nm-num">${avgP}<span>g</span></div><div class="nm-lbl">proteína prom.</div></div>
        <div class="nm-stat"><div class="nm-num">${enObjetivo}</div><div class="nm-lbl">días en objetivo</div></div>
      </div>
      <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:120px; margin-top:6px;">${goalLine}${bars}</svg>
    </div>`;
}

/* =========================================================
   NAVEGACIÓN DEL MÓDULO (sub-pestañas)
   ========================================================= */
let nutriTab = "hoy";
function nutriGo(sub){ nutriTab = sub; renderNutricion(); }

function renderNutricion(){
  const c = $("#tab-nutricion");
  const n = computeNutrition();
  if (!n){
    c.innerHTML = `
      <div class="card" style="text-align:center;">
        <div style="font-size:26px; margin-bottom:6px;">🥗</div>
        <div style="font-weight:800; font-size:15px;">Completá tus datos para tu nutrición</div>
        <div style="color:var(--gris-600); font-size:13px; margin:6px 0 14px; line-height:1.5;">
          Necesitamos tu <b>peso</b>, <b>altura</b> y <b>edad</b> para armar tu plan.
        </div>
        <button class="btn btn-primary" onclick="goTo('datos')">Ir a Datos personales</button>
      </div>`;
    return;
  }
  const tabs = [
    { id:"hoy", label:"Hoy", emoji:"📊" },
    { id:"menus", label:"Menús", emoji:"🍽️" },
    { id:"alimentos", label:"Alimentos", emoji:"🥑" },
    { id:"perfil", label:"Plan", emoji:"🎯" },
  ];
  const pills = tabs.map(t => `<button class="nsub ${nutriTab===t.id?"active":""}" onclick="nutriGo('${t.id}')">${t.emoji} ${t.label}</button>`).join("");
  let body = "";
  if (nutriTab === "hoy") body = viewNutriHoy(n);
  else if (nutriTab === "menus") body = viewNutriMenus(n);
  else if (nutriTab === "alimentos") body = viewNutriAlimentos(n);
  else body = viewNutriPerfil(n);
  c.innerHTML = `<div class="nsub-bar">${pills}</div>${body}`;
}

/* =========================================================
   VISTA "HOY" — diario + anillo de progreso
   ========================================================= */
function nutriRing(consumed, goal){
  const r = 52, C = 2 * Math.PI * r;
  const pct = goal ? Math.min(1, consumed / goal) : 0;
  const off = C * (1 - pct);
  const over = consumed > goal;
  return `
    <svg viewBox="0 0 120 120" class="nutri-ring">
      <circle cx="60" cy="60" r="${r}" class="nr-track"/>
      <circle cx="60" cy="60" r="${r}" class="nr-fill ${over?"over":""}" style="stroke-dasharray:${C.toFixed(1)}; stroke-dashoffset:${off.toFixed(1)};"/>
    </svg>`;
}
function macroMini(label, val, goal, color){
  const pct = goal ? Math.min(100, Math.round(val/goal*100)) : 0;
  return `
    <div class="mm">
      <div class="mm-top"><span>${label}</span><b>${val}/${goal}g</b></div>
      <div class="mm-bar"><div class="mm-fill" style="width:${pct}%; background:${color};"></div></div>
    </div>`;
}
function viewNutriHoy(n){
  const date = todayStr();
  const t = dayTotals(date);
  const rem = Math.max(0, n.cal - t.kcal);
  const prefs = nutriPrefs();
  const plan = MEAL_PLANS[prefs.comidas] || MEAL_PLANS[4];
  const log = dayLog(date);

  const meals = plan.map(m => {
    const items = log.filter(it => it.meal === m.key);
    const mk = items.reduce((s,it)=>s+(it.kcal||0),0);
    const rows = items.map(it => `
      <div class="diary-item">
        <div class="di-main"><span class="di-name">${it.emoji||"•"} ${esc(it.name)}</span>
          <span class="di-sub">${it.detail||""} · ${it.kcal} kcal · P${it.p} C${it.c} G${it.g}</span></div>
        <button class="di-del" onclick="removeDiaryItem('${it.uid}')">✕</button>
      </div>`).join("");
    return `
      <div class="card meal-card">
        <div class="meal-head">
          <div><span class="meal-name">${m.label}</span> <span class="meal-target">meta ~${Math.round(n.cal*m.pct)} kcal</span></div>
          <span class="meal-kcal">${mk} kcal</span>
        </div>
        ${rows || `<div class="meal-empty">Todavía no cargaste nada acá.</div>`}
        <button class="btn btn-outline meal-add" onclick="openAddFood('${m.key}')">+ Agregar alimento</button>
      </div>`;
  }).join("");

  return `
    <div class="card nutri-today">
      <div class="nt-ring">
        ${nutriRing(t.kcal, n.cal)}
        <div class="nt-center">
          <div class="nt-rem">${rem}</div>
          <div class="nt-rem-lbl">kcal restantes</div>
        </div>
      </div>
      <div class="nt-macros">
        ${macroMini("Proteína", t.p, n.prot, "#e03131")}
        ${macroMini("Carbos", t.c, n.carbs, "#f59f00")}
        ${macroMini("Grasas", t.g, n.grasa, "#40c057")}
        <div class="nt-eaten">${t.kcal} de ${n.cal} kcal consumidas</div>
      </div>
    </div>
    ${meals}
    <button class="btn btn-ghost" style="margin-top:4px;" onclick="nutriGo('menus')">🍽️ ¿No sabés qué comer? Generá un menú</button>
  `;
}

/* ---------- Modal: agregar alimento/receta al diario ---------- */
let addFoodMeal = "almuerzo";
function openAddFood(meal){
  addFoodMeal = meal;
  $("#modal-body").innerHTML = `
    <div class="modal-title">Agregar a ${mealLabel(meal)}</div>
    <button class="btn btn-outline nf-scan-btn" onclick="openBarcodeScanner()">📷 Escanear código de barras</button>
    <input id="nf-search" class="nf-search" placeholder="Buscar alimento o receta…" oninput="nfSearch(this.value)" autocomplete="off">
    <div id="nf-results" class="nf-results">${nfResultsHTML("")}</div>
    <button class="btn btn-ghost" style="margin-top:8px;" onclick="closeModal()">Cerrar</button>
  `;
  $("#modal-overlay").classList.add("open");
  setTimeout(()=>{ const i=$("#nf-search"); if(i) i.focus(); }, 60);
}
function mealLabel(key){
  for (const n in MEAL_PLANS){ const f = MEAL_PLANS[n].find(m=>m.key===key); if (f) return f.label; }
  return "comida";
}
/* Plural en español: vocal final → +s, consonante → +es (unidad → unidades) */
function pluralUnidad(label, n){
  if (n <= 1) return label;
  return /[aeiouáéíóú]$/i.test(label) ? label + "s" : label + "es";
}
function nfSearch(q){ const el = $("#nf-results"); if (el) el.innerHTML = nfResultsHTML(q); }
function nfResultsHTML(q){
  const prefs = nutriPrefs();
  q = (q||"").toLowerCase().trim();
  const foods = FOODS.filter(f => foodAllowed(f,prefs) && (!q || f.name.toLowerCase().includes(q)));
  const recipes = RECIPES.filter(r => recipeAllowed(r,prefs) && (!q || r.name.toLowerCase().includes(q)));
  const rHtml = recipes.slice(0,8).map(r => {
    const mm = recipeMacros(r);
    return `<div class="nf-row" onclick="pickRecipe('${r.id}')">
      <div class="nf-left">${r.emoji||"🍽️"} <div><div class="nf-name">${r.name}</div><div class="nf-sub">Receta · ${mm.kcal} kcal</div></div></div>
      <span class="nf-add">+</span></div>`;
  }).join("");
  const fHtml = foods.slice(0,40).map(f => {
    const s = semaforo(f);
    return `<div class="nf-row" onclick="pickFood('${f.id}')">
      <div class="nf-left">${SEM_EMOJI[s]} <div><div class="nf-name">${f.name}</div><div class="nf-sub">${f.kcal} kcal/100g · P${f.p} C${f.c} G${f.g}</div></div></div>
      <span class="nf-add">+</span></div>`;
  }).join("");
  const rSec = recipes.length ? `<div class="nf-cat">Recetas</div>${rHtml}` : "";
  const fSec = foods.length ? `<div class="nf-cat">Alimentos</div>${fHtml}` : "";
  return (rSec + fSec) || `<div class="meal-empty">Sin resultados para "${esc(q)}".</div>`;
}
/* Alimento: elegir cantidad */
function pickFood(foodId){
  const f = FOOD_BY_ID[foodId]; if (!f) return;
  const defG = f.unit ? f.unit.g : 100;
  const unitTxt = f.unit ? `<button class="nf-chip" onclick="nfSetUnits(1)">1 ${f.unit.label}</button><button class="nf-chip" onclick="nfSetUnits(2)">2 ${f.unit.label}</button>` : "";
  $("#modal-body").innerHTML = `
    <div class="modal-title">${SEM_EMOJI[semaforo(f)]} ${f.name}</div>
    <div class="modal-desc" style="margin-bottom:10px;">${f.kcal} kcal cada 100 g · P${f.p} · C${f.c} · G${f.g}</div>
    <label class="nf-label">Cantidad (gramos)</label>
    <div class="nf-qty">
      <input id="nf-grams" type="number" inputmode="numeric" value="${defG}" oninput="nfPreview('${foodId}')">
      ${f.unit ? `<span class="nf-unit">${f.unit.label} ≈ ${f.unit.g} g</span>` : ""}
    </div>
    <div class="nf-chips">${unitTxt}<button class="nf-chip" onclick="nfSetGrams(100)">100 g</button><button class="nf-chip" onclick="nfSetGrams(150)">150 g</button></div>
    <div id="nf-prev" class="nf-preview"></div>
    <button class="btn btn-primary" style="margin-top:12px;" onclick="confirmAddFood('${foodId}')">Agregar</button>
    <button class="btn btn-ghost" style="margin-top:8px;" onclick="openAddFood('${addFoodMeal}')">‹ Volver</button>
  `;
  nfPreview(foodId);
}
function nfSetGrams(g){ const i=$("#nf-grams"); if(i){ i.value=g; nfPreview(i.dataset.fid||window._nfFid); } }
function nfSetUnits(u){ const i=$("#nf-grams"); const f=FOOD_BY_ID[window._nfFid]; if(i&&f&&f.unit){ i.value=Math.round(f.unit.g*u); nfPreview(window._nfFid); } }
function nfPreview(foodId){
  window._nfFid = foodId;
  const f = FOOD_BY_ID[foodId]; const g = +($("#nf-grams").value||0);
  const m = foodMacros(f, g);
  const el = $("#nf-prev");
  if (el) el.innerHTML = `<b>${m.kcal}</b> kcal · P ${m.p} · C ${m.c} · G ${m.g}`;
}
function confirmAddFood(foodId){
  const f = FOOD_BY_ID[foodId]; const g = +($("#nf-grams").value||0);
  if (!g || g <= 0){ toast("Poné una cantidad válida"); return; }
  const m = foodMacros(f, g);
  addDiaryItem({ name:f.name, emoji:SEM_EMOJI[semaforo(f)], detail:`${g} g`, meal:addFoodMeal, kind:"food", ...m });
  toast("Agregado al diario ✅");
  closeModal(); renderNutricion();
}
/* Receta: vista completa (ingredientes en la cantidad real + paso a paso).
   `mult` permite abrirla ya escalada (ej: desde un menú que dice ×1.8). */
function pickRecipe(recipeId, mult){
  const r = RECIPE_BY_ID[recipeId]; if (!r) return;
  mult = mult || 1;
  window._nfRid = recipeId;
  const nSteps = (r.steps || []).length;
  const steps = (r.steps || []).map((s,i) => `<li>${esc(s)}</li>`).join("");
  const momentos = r.meals.map(m => mealLabel(m)).join(" · ");
  $("#modal-body").innerHTML = `
    <div class="recipe-photo">${recipeArt(r)}</div>
    <div class="modal-title" style="margin:12px 0 2px;">${r.name}</div>
    <div class="recipe-moment">Ideal para: ${momentos}</div>
    <div id="nf-prev" class="nf-preview"></div>
    <label class="nf-label" style="margin-top:14px;">Porciones</label>
    <div class="nf-chips">
      <button class="nf-chip" onclick="nfSetPortion(0.5)">½</button>
      <button class="nf-chip" onclick="nfSetPortion(1)">1</button>
      <button class="nf-chip" onclick="nfSetPortion(1.5)">1½</button>
      <button class="nf-chip" onclick="nfSetPortion(2)">2</button>
    </div>
    <input id="nf-portion" type="hidden" value="${mult}">
    <div class="recipe-block"><div class="recipe-h">🧾 Ingredientes</div><ul id="nf-ingr" class="recipe-ul"></ul></div>
    ${nSteps ? `<div class="recipe-block"><div class="recipe-h">👩‍🍳 Preparación (${nSteps} pasos)</div><ol class="recipe-ol">${steps}</ol></div>` : ""}
    <button class="btn btn-primary" style="margin-top:12px;" onclick="confirmAddRecipe('${recipeId}')">Agregar al diario</button>
    <button class="btn btn-ghost" style="margin-top:8px;" onclick="closeModal()">Cerrar</button>
  `;
  $("#modal-overlay").classList.add("open");
  nfSetPortion(mult);
}
function nfSetPortion(p){
  const inp = $("#nf-portion"); if (inp) inp.value = p;
  const r = RECIPE_BY_ID[window._nfRid]; if (!r) return;
  const m = recipeMacros(r, p);
  const prev = $("#nf-prev");
  if (prev) prev.innerHTML = `<b>${m.kcal}</b> kcal · P ${m.p} · C ${m.c} · G ${m.g}`;
  const ing = $("#nf-ingr");
  if (ing) ing.innerHTML = r.ingr.map(i => {
    const f = FOOD_BY_ID[i.f]; const g = Math.round(i.g * p);
    let u = "";
    if (f && f.unit && g >= f.unit.g){ const n = Math.round(g / f.unit.g); u = ` <span class="ingr-unit">(≈ ${n} ${pluralUnidad(f.unit.label, n)})</span>`; }
    return `<li>${f ? esc(f.name) : i.f} — <b>${g} g</b>${u}</li>`;
  }).join("");
}
function confirmAddRecipe(recipeId){
  const r = RECIPE_BY_ID[recipeId]; const mult = +($("#nf-portion").value||1);
  const m = recipeMacros(r, mult);
  addDiaryItem({ name:r.name, emoji:r.emoji||"🍽️", detail:`${mult===1?"1 porción":mult+" porciones"}`, meal:addFoodMeal, kind:"recipe", ...m });
  toast("Receta agregada ✅");
  closeModal(); renderNutricion();
}
function addDiaryItem(item){
  const log = nutriLog(); const date = todayStr();
  log[date] = log[date] || [];
  item.uid = "d" + Date.now() + Math.floor(Math.random()*1000);
  log[date].push(item);
  saveNutriLog(log);
}
function removeDiaryItem(uid){
  const log = nutriLog(); const date = todayStr();
  log[date] = (log[date]||[]).filter(it => it.uid !== uid);
  if (!log[date].length) delete log[date];
  saveNutriLog(log);
  renderNutricion();
}

/* =========================================================
   ESCÁNER DE CÓDIGO DE BARRAS (ZXing) + Open Food Facts
   Funciona en iPhone y Android. Necesita internet para buscar
   el producto (la base es Open Food Facts, gratis y abierta).
   ========================================================= */
let _bcReader = null;
function openBarcodeScanner(){
  $("#modal-body").innerHTML = `
    <div class="modal-title">📷 Escanear producto</div>
    <div class="scan-wrap"><video id="scan-video" playsinline muted autoplay></video><div class="scan-frame"></div></div>
    <div id="scan-status" class="scan-status">Apuntá al código de barras del envase…</div>
    <div class="scan-manual">
      <input id="scan-code" class="nf-search" inputmode="numeric" placeholder="…o escribí el número del código" style="margin:0;">
      <button class="btn-lift" onclick="lookupBarcode(document.getElementById('scan-code').value)">Buscar</button>
    </div>
    <button class="btn btn-ghost" style="margin-top:10px;" onclick="closeScanner()">Cancelar</button>
  `;
  $("#modal-overlay").classList.add("open");
  startScanner();
}
function startScanner(){
  if (typeof ZXing === "undefined" || !ZXing.BrowserMultiFormatReader){
    setScanStatus("Tu navegador no soporta el escaneo. Escribí el número del código 👇"); return;
  }
  try {
    _bcReader = new ZXing.BrowserMultiFormatReader();
    const video = document.getElementById("scan-video");
    const cb = (result, err) => {
      if (result){ const code = result.getText ? result.getText() : result.text; lookupBarcode(code); }
    };
    const constraints = { video: { facingMode: { ideal: "environment" } } };
    if (typeof _bcReader.decodeFromConstraints === "function") _bcReader.decodeFromConstraints(constraints, video, cb);
    else _bcReader.decodeFromVideoDevice(null, video, cb);
  } catch(e){ setScanStatus("No pude abrir la cámara. Escribí el número del código 👇"); }
}
function stopScanner(){ try { if (_bcReader) _bcReader.reset(); } catch(e){} _bcReader = null; }
function closeScanner(){ stopScanner(); closeModal(); }
function setScanStatus(t){ const el = $("#scan-status"); if (el) el.textContent = t; }

/* Extrae un valor "por 100 g" probando varias formas en que OFF guarda los datos */
function offVal(nm, base, sq){
  if (nm[base+"_100g"] != null) return +nm[base+"_100g"];
  if (nm[base+"_serving"] != null && sq) return +nm[base+"_serving"] / sq * 100;
  if (nm[base] != null) return +nm[base];
  return 0;
}
function offKcal(nm, sq){
  if (nm["energy-kcal_100g"] != null) return +nm["energy-kcal_100g"];
  if (nm["energy-kcal_serving"] != null && sq) return +nm["energy-kcal_serving"] / sq * 100;
  if (nm["energy-kcal"] != null) return +nm["energy-kcal"];
  if (nm["energy-kcal_value"] != null) return +nm["energy-kcal_value"];
  if (nm["energy_100g"] != null) return +nm["energy_100g"] / 4.184;      // kJ -> kcal
  if (nm["energy-kj_100g"] != null) return +nm["energy-kj_100g"] / 4.184;
  return 0;
}
async function lookupBarcode(code){
  code = (code||"").trim();
  if (!/^\d{6,14}$/.test(code)){ setScanStatus("Ese código no parece válido 🤔"); return; }
  stopScanner();
  setScanStatus("Buscando el producto…");
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_es,brands,nutriments,serving_quantity`);
    const data = await res.json();
    const p = (data && data.product) || null;
    const nombre = p ? (p.product_name_es || p.product_name || "").trim() : "";
    if (!data || data.status !== 1 || !p){ showManualProduct(code, ""); return; }
    const nm = p.nutriments || {}; const sq = +p.serving_quantity || 0;
    const prod = {
      code, name: nombre || "Producto", brand: (p.brands||"").split(",")[0].trim(),
      kcal: Math.round(offKcal(nm, sq)),
      p: Math.round(offVal(nm,"proteins",sq)*10)/10,
      c: Math.round(offVal(nm,"carbohydrates",sq)*10)/10,
      g: Math.round(offVal(nm,"fat",sq)*10)/10,
    };
    // Sin ningún dato nutricional -> carga manual (con el nombre ya cargado)
    if (!prod.kcal && !prod.p && !prod.c && !prod.g){ showManualProduct(code, nombre); return; }
    showScannedProduct(prod);
  } catch(e){
    // Sin conexión: si estábamos escaneando, avisamos; si no, ofrecemos carga manual
    if ($("#scan-status")) setScanStatus("Sin conexión para buscar. Probá de nuevo o cargalo a mano 👇");
    else showManualProduct(code, "");
  }
}
/* Cuando OFF no tiene datos: cargar los de la etiqueta a mano (nunca queda bloqueado) */
function showManualProduct(code, name){
  $("#modal-body").innerHTML = `
    <div class="modal-title">Cargar de la etiqueta</div>
    <div class="modal-desc" style="margin-bottom:12px;">${name?`<b>${esc(name)}</b>. `:""}No encontramos su info nutricional. Copiá los valores <b>por 100 g</b> del envase 👇</div>
    <input id="man-name" class="nf-search" placeholder="Nombre del producto" value="${esc(name||"")}" style="margin-bottom:10px;">
    <div class="man-grid">
      <div class="field"><label>Calorías (kcal)</label><input id="man-kcal" type="number" inputmode="numeric" placeholder="0"></div>
      <div class="field"><label>Proteína (g)</label><input id="man-p" type="number" inputmode="decimal" placeholder="0"></div>
      <div class="field"><label>Carbohidratos (g)</label><input id="man-c" type="number" inputmode="decimal" placeholder="0"></div>
      <div class="field"><label>Grasas (g)</label><input id="man-g" type="number" inputmode="decimal" placeholder="0"></div>
    </div>
    <button class="btn btn-primary" style="margin-top:14px;" onclick="saveManualProduct('${code}')">Continuar</button>
    <button class="btn btn-outline" style="margin-top:8px;" onclick="openAddFood('${addFoodMeal}')">Mejor buscar por nombre</button>
    <button class="btn btn-ghost" style="margin-top:8px;" onclick="closeModal()">Cancelar</button>
  `;
  $("#modal-overlay").classList.add("open");
  setTimeout(()=>{ const i=$("#man-name"); if(i && !i.value) i.focus(); }, 60);
}
function saveManualProduct(code){
  const kcal = +($("#man-kcal").value||0);
  if (!kcal){ toast("Poné al menos las calorías de la etiqueta"); return; }
  const prod = {
    code, name: ($("#man-name").value||"Producto").trim(), brand:"",
    kcal: Math.round(kcal),
    p: Math.round((+($("#man-p").value||0))*10)/10,
    c: Math.round((+($("#man-c").value||0))*10)/10,
    g: Math.round((+($("#man-g").value||0))*10)/10,
  };
  showScannedProduct(prod);
}
function showScannedProduct(prod){
  window._scanned = prod;
  $("#modal-body").innerHTML = `
    <div class="scanned-badge">📦 Escaneado de Open Food Facts</div>
    <div class="modal-title">${esc(prod.name)}</div>
    <div class="modal-desc" style="margin-bottom:10px;">${prod.brand?esc(prod.brand)+" · ":""}${prod.kcal} kcal/100g · P${prod.p} · C${prod.c} · G${prod.g}</div>
    <label class="nf-label">Cantidad (gramos)</label>
    <div class="nf-qty"><input id="nf-grams" type="number" inputmode="numeric" value="100" oninput="scanPreview()"></div>
    <div class="nf-chips">
      <button class="nf-chip" onclick="document.getElementById('nf-grams').value=50;scanPreview()">50 g</button>
      <button class="nf-chip" onclick="document.getElementById('nf-grams').value=100;scanPreview()">100 g</button>
      <button class="nf-chip" onclick="document.getElementById('nf-grams').value=200;scanPreview()">200 g</button>
    </div>
    <div id="nf-prev" class="nf-preview"></div>
    <button class="btn btn-primary" style="margin-top:12px;" onclick="confirmScanned()">Agregar al diario</button>
    <button class="btn btn-ghost" style="margin-top:8px;" onclick="openBarcodeScanner()">‹ Escanear otro</button>
  `;
  scanPreview();
}
function scanPreview(){
  const prod = window._scanned; const gr = +($("#nf-grams").value||0); const k = gr/100;
  const el = $("#nf-prev");
  if (el) el.innerHTML = `<b>${Math.round(prod.kcal*k)}</b> kcal · P ${(prod.p*k).toFixed(1)} · C ${(prod.c*k).toFixed(1)} · G ${(prod.g*k).toFixed(1)}`;
}
function confirmScanned(){
  const prod = window._scanned; const gr = +($("#nf-grams").value||0);
  if (!gr || gr <= 0){ toast("Poné una cantidad válida"); return; }
  const k = gr/100;
  addDiaryItem({ name:prod.name, emoji:"📦", detail:`${gr} g`, meal:addFoodMeal, kind:"scanned",
    kcal:Math.round(prod.kcal*k), p:+(prod.p*k).toFixed(1), c:+(prod.c*k).toFixed(1), g:+(prod.g*k).toFixed(1) });
  toast("Agregado al diario ✅"); closeModal(); renderNutricion();
}

/* =========================================================
   VISTA "MENÚS" — generador + biblioteca + lista de compras
   ========================================================= */
function generateMenu(){
  const n = computeNutrition(); if (!n) return null;
  const prefs = nutriPrefs();
  const plan = MEAL_PLANS[prefs.comidas] || MEAL_PLANS[4];
  const used = new Set();
  const meals = plan.map(m => {
    const target = Math.round(n.cal * m.pct);
    let cands = RECIPES.filter(r => r.meals.includes(m.key) && recipeAllowed(r,prefs) && !used.has(r.id));
    if (!cands.length) cands = RECIPES.filter(r => r.meals.includes(m.key) && recipeAllowed(r,prefs));
    if (!cands.length) return { mealKey:m.key, mealLabel:m.label, target, recipeId:null, mult:1 };
    cands.sort((a,b)=>Math.abs(recipeMacros(a).kcal-target)-Math.abs(recipeMacros(b).kcal-target));
    const pick = cands[Math.floor(Math.random()*Math.min(3,cands.length))];
    used.add(pick.id);
    let mult = target / recipeMacros(pick).kcal;
    mult = Math.max(0.6, Math.min(1.8, Math.round(mult*10)/10));
    return { mealKey:m.key, mealLabel:m.label, target, recipeId:pick.id, mult };
  });
  return { date: todayStr(), cal:n.cal, meals };
}
function regenMenu(){ saveNutriMenu(generateMenu()); renderNutricion(); }
function viewNutriMenus(n){
  const menu = nutriMenu();
  let menuHtml = "";
  if (menu){
    let tot = { kcal:0,p:0,c:0,g:0 };
    const rows = menu.meals.map(mm => {
      const r = mm.recipeId ? RECIPE_BY_ID[mm.recipeId] : null;
      if (!r) return `<div class="menu-meal"><div class="mm-label">${mm.mealLabel}</div><div class="meal-empty">Sin receta para tu dieta.</div></div>`;
      const m = recipeMacros(r, mm.mult);
      tot.kcal+=m.kcal; tot.p+=m.p; tot.c+=m.c; tot.g+=m.g;
      return `
        <div class="menu-meal" onclick="pickRecipe('${r.id}', ${mm.mult})">
          <div class="mm-label">${mm.mealLabel} <span class="mm-tgt">~${mm.target} kcal</span></div>
          <div class="mm-recipe">
            <div class="mm-thumb">${recipeArt(r)}</div>
            <div class="mm-info"><div class="mm-rname">${r.name}${mm.mult!==1?` <span class="mm-x">×${mm.mult}</span>`:""}</div>
              <div class="mm-macros">${m.kcal} kcal · P${m.p} · C${m.c} · G${m.g}</div></div>
          </div>
        </div>`;
    }).join("");
    menuHtml = `
      <div class="card">
        <div class="menu-top">
          <div class="section-title" style="margin:0;">Menú del día</div>
          <button class="nf-chip" onclick="regenMenu()">🔄 Otro</button>
        </div>
        ${rows}
        <div class="menu-total">Total: <b>${Math.round(tot.kcal)}</b> kcal · P${Math.round(tot.p)} · C${Math.round(tot.c)} · G${Math.round(tot.g)} <span class="menu-goal">(meta ${n.cal})</span></div>
        <button class="btn btn-primary" style="margin-top:10px;" onclick="useMenuToday()">Usar este menú hoy</button>
        <button class="btn btn-outline" style="margin-top:8px;" onclick="showShoppingList()">🛒 Lista de compras</button>
      </div>`;
  } else {
    menuHtml = `
      <div class="card" style="text-align:center;">
        <div style="font-size:26px;margin-bottom:6px;">🍽️</div>
        <div style="font-weight:800;font-size:15px;">Generá tu menú del día</div>
        <div style="color:var(--gris-600);font-size:13px;margin:6px 0 12px;line-height:1.5;">Armamos un día completo que cierra tus <b>${n.cal} kcal</b> y respeta tu dieta.</div>
        <button class="btn btn-primary" onclick="regenMenu()">✨ Generar menú</button>
      </div>`;
  }
  // Biblioteca de recetas
  const prefs = nutriPrefs();
  const recetas = RECIPES.filter(r => recipeAllowed(r,prefs));
  const lib = recetas.map(r => {
    const m = recipeMacros(r);
    return `<div class="recipe-card" onclick="pickRecipe('${r.id}')">
      <div class="rc-thumb">${recipeArt(r)}</div>
      <div class="rc-info"><div class="rc-name">${r.name}</div><div class="rc-macros">${m.kcal} kcal · P${m.p}</div></div>
    </div>`;
  }).join("");
  return `
    ${menuHtml}
    <div class="section-title">Recetas (${recetas.length})</div>
    <div class="recipe-grid">${lib}</div>
  `;
}
function useMenuToday(){
  const menu = nutriMenu(); if (!menu) return;
  const log = nutriLog(); const date = todayStr();
  log[date] = []; // reemplaza el día con el menú
  menu.meals.forEach(mm => {
    const r = mm.recipeId ? RECIPE_BY_ID[mm.recipeId] : null; if (!r) return;
    const m = recipeMacros(r, mm.mult);
    log[date].push({ uid:"d"+Date.now()+Math.floor(Math.random()*100000), name:r.name, emoji:r.emoji||"🍽️",
      detail: mm.mult!==1?`${mm.mult} porciones`:"1 porción", meal:mm.mealKey, kind:"recipe", ...m });
  });
  saveNutriLog(log);
  toast("Menú cargado en tu diario 📋");
  nutriGo("hoy");
}
function showShoppingList(){
  const menu = nutriMenu(); if (!menu) return;
  const acc = {};
  menu.meals.forEach(mm => {
    const r = mm.recipeId ? RECIPE_BY_ID[mm.recipeId] : null; if (!r) return;
    r.ingr.forEach(i => { acc[i.f] = (acc[i.f]||0) + i.g * (mm.mult||1); });
  });
  const byCat = {};
  Object.keys(acc).forEach(fid => {
    const f = FOOD_BY_ID[fid]; if (!f) return;
    (byCat[f.cat] = byCat[f.cat] || []).push({ name:f.name, g:Math.round(acc[fid]) });
  });
  const html = Object.keys(byCat).map(cat => `
    <div class="shop-cat">${FOOD_CATS[cat]||cat}</div>
    ${byCat[cat].map(x=>`<div class="shop-item"><span>${x.name}</span><b>${x.g} g</b></div>`).join("")}
  `).join("");
  $("#modal-body").innerHTML = `
    <div class="modal-title">🛒 Lista de compras</div>
    <div class="modal-desc" style="margin-bottom:10px;">Ingredientes del menú del día.</div>
    ${html}
    <button class="btn btn-ghost" style="margin-top:12px;" onclick="closeModal()">Cerrar</button>
  `;
  $("#modal-overlay").classList.add("open");
}

/* =========================================================
   VISTA "ALIMENTOS" — buscador + semáforo
   ========================================================= */
let alimQuery = "";
function alimSearch(q){ alimQuery = q; const el=$("#alim-list"); if(el) el.innerHTML = alimListHTML(); }
function alimListHTML(){
  const prefs = nutriPrefs();
  const q = (alimQuery||"").toLowerCase().trim();
  const cats = {};
  FOODS.forEach(f => {
    if (!foodAllowed(f,prefs)) return;
    if (q && !f.name.toLowerCase().includes(q)) return;
    (cats[f.cat] = cats[f.cat] || []).push(f);
  });
  const order = Object.keys(FOOD_CATS).filter(c=>cats[c]);
  if (!order.length) return `<div class="meal-empty">Sin resultados para "${esc(q)}".</div>`;
  return order.map(cat => `
    <div class="alim-cat">${FOOD_CATS[cat]}</div>
    ${cats[cat].map(f => {
      const s = semaforo(f);
      return `<div class="alim-row" onclick="openFoodInfo('${f.id}')">
        <div class="nf-left">${SEM_EMOJI[s]} <div><div class="nf-name">${f.name}</div>
          <div class="nf-sub">${f.kcal} kcal/100g · P${f.p} · C${f.c} · G${f.g}</div></div></div>
        <span class="alim-sem sem-${s}">${SEM_LABEL[s]}</span>
      </div>`;
    }).join("")}
  `).join("");
}
function viewNutriAlimentos(n){
  return `
    <div class="card" style="padding-bottom:8px;">
      <div class="sem-legend">
        <span>🟢 Ideal</span><span>🟡 Con medida</span><span>🔴 Ocasional</span>
      </div>
      <div class="disclaimer" style="margin:0;">El semáforo se ajusta a tu objetivo: <b>${OBJETIVO_LABEL[n.objetivo]}</b>.</div>
    </div>
    <input class="nf-search" placeholder="Buscar alimento…" oninput="alimSearch(this.value)" value="${esc(alimQuery)}" autocomplete="off">
    <div id="alim-list" class="alim-list">${alimListHTML()}</div>
  `;
}
function openFoodInfo(foodId){
  const f = FOOD_BY_ID[foodId]; if (!f) return;
  const s = semaforo(f);
  const prefs = nutriPrefs();
  const excl = prefs.excluir.includes(foodId);
  $("#modal-body").innerHTML = `
    <div class="modal-title">${SEM_EMOJI[s]} ${f.name}</div>
    <div class="food-sem sem-${s}">${SEM_LABEL[s]} para ${OBJETIVO_LABEL[getObjetivo()].toLowerCase()}</div>
    <div class="food-macros-grid">
      <div><b>${f.kcal}</b><span>kcal</span></div>
      <div><b>${f.p}</b><span>Proteína</span></div>
      <div><b>${f.c}</b><span>Carbos</span></div>
      <div><b>${f.g}</b><span>Grasas</span></div>
    </div>
    <div class="disclaimer" style="margin-top:10px;">Valores por 100 g${f.unit?` · 1 ${f.unit.label} ≈ ${f.unit.g} g`:""}.</div>
    <button class="btn btn-primary" style="margin-top:12px;" onclick="closeModal(); openAddFood('${addFoodMeal}'); pickFood('${f.id}')">+ Agregar a mi diario</button>
    <button class="btn btn-outline" style="margin-top:8px;" onclick="toggleExcluir('${f.id}')">${excl?"↩︎ Volver a incluir":"🚫 No como esto"}</button>
    <button class="btn btn-ghost" style="margin-top:8px;" onclick="closeModal()">Cerrar</button>
  `;
  $("#modal-overlay").classList.add("open");
}
function toggleExcluir(foodId){
  const prefs = nutriPrefs();
  const i = prefs.excluir.indexOf(foodId);
  if (i === -1) prefs.excluir.push(foodId); else prefs.excluir.splice(i,1);
  saveNutriPrefs({ excluir: prefs.excluir });
  toast(i===-1 ? "Lo sacamos de tus menús 🚫" : "Lo volvimos a incluir ✅");
  closeModal(); renderNutricion();
}

/* ---------- Meta de calorías editable ---------- */
function openCalGoal(){
  const n = computeNutrition(); if (!n) return;
  $("#modal-body").innerHTML = `
    <div class="modal-title">🎯 Meta de calorías diaria</div>
    <div class="modal-desc" style="margin-bottom:12px;">Sugerida automática: <b>${n.autoCal} kcal</b> (${OBJETIVO_LABEL[n.objetivo]}, ${n.ajusteTxt.toLowerCase()}). Podés fijar la tuya.</div>
    <label class="nf-label">Calorías objetivo</label>
    <input id="cal-goal" class="nf-search" type="number" inputmode="numeric" value="${n.cal}" style="margin-bottom:4px;">
    <div class="nf-chips">
      <button class="nf-chip" onclick="document.getElementById('cal-goal').value=${n.autoCal}">Auto (${n.autoCal})</button>
      <button class="nf-chip" onclick="calGoalNudge(-100)">−100</button>
      <button class="nf-chip" onclick="calGoalNudge(100)">+100</button>
    </div>
    <button class="btn btn-primary" style="margin-top:14px;" onclick="saveCalGoal()">Guardar meta</button>
    ${n.custom ? `<button class="btn btn-outline" style="margin-top:8px;" onclick="resetCalGoal()">↩︎ Volver a la meta automática</button>` : ""}
    <button class="btn btn-ghost" style="margin-top:8px;" onclick="closeModal()">Cancelar</button>
  `;
  $("#modal-overlay").classList.add("open");
}
function calGoalNudge(d){ const i = $("#cal-goal"); if (i) i.value = Math.max(0, (+i.value||0) + d); }
function saveCalGoal(){
  const v = Math.round(+($("#cal-goal").value || 0));
  if (!v || v < 800 || v > 6000){ toast("Poné un valor realista (800–6000)"); return; }
  saveNutriPrefs({ calOverride: v });
  toast("Meta actualizada 🎯"); closeModal(); renderNutricion();
}
function resetCalGoal(){ saveNutriPrefs({ calOverride: 0 }); toast("Volviste a la meta automática"); closeModal(); renderNutricion(); }

/* =========================================================
   VISTA "PLAN" — metas + preferencias
   ========================================================= */
function viewNutriPerfil(n){
  const prefs = nutriPrefs();
  const kcalProt = n.prot*4, kcalCarbs = n.carbs*4, kcalGrasa = n.grasa*9;
  const total = kcalProt+kcalCarbs+kcalGrasa || 1;
  const pctP = Math.round(kcalProt/total*100), pctC = Math.round(kcalCarbs/total*100), pctG = Math.max(0,100-pctP-pctC);
  const macro = (emoji,nombre,gr,kcal,pct,color)=>`
    <div class="macro-row"><div class="macro-head"><span class="macro-name">${emoji} ${nombre}</span>
      <span class="macro-g">${gr} g <span class="macro-kcal">· ${kcal} kcal</span></span></div>
      <div class="macro-bar"><div class="macro-fill" style="width:${pct}%; background:${color};"></div></div></div>`;
  const dietaOpts = Object.keys(DIETAS).map(k=>`<option value="${k}" ${prefs.dieta===k?"selected":""}>${DIETAS[k]}</option>`).join("");
  const comidasOpts = [3,4,5].map(k=>`<option value="${k}" ${prefs.comidas===k?"selected":""}>${k} comidas</option>`).join("");
  const excl = prefs.excluir.map(id=>{ const f=FOOD_BY_ID[id]; return f?`<span class="excl-chip" onclick="toggleExcluir('${id}')">${f.name} ✕</span>`:""; }).join("");

  return `
    <div class="card nutri-hero">
      <div class="nutri-goal-label">Tu objetivo diario</div>
      <div class="nutri-kcal">${n.cal}<span>kcal</span></div>
      <div class="nutri-goal-sub">${OBJETIVO_LABEL[n.objetivo]} · ${n.ajusteTxt}</div>
      <button class="nutri-edit-goal" onclick="openCalGoal()">✏️ Editar meta</button>
    </div>
    <div class="card">
      <div class="section-title" style="margin-top:0;">Reparto de macros</div>
      ${macro("🥩","Proteína",n.prot,kcalProt,pctP,"#e03131")}
      ${macro("🍚","Carbohidratos",n.carbs,kcalCarbs,pctC,"#f59f00")}
      ${macro("🥑","Grasas",n.grasa,kcalGrasa,pctG,"#40c057")}
      <div class="disclaimer" style="margin-top:12px;">Proteína en <b>${n.protPerKg} g/kg</b>. La meta se recalcula sola con tu objetivo, peso y días de rutina.</div>
    </div>
    <div class="card">
      <div class="section-title" style="margin-top:0;">Mis preferencias</div>
      <div class="field"><label>Tipo de alimentación</label>
        <select onchange="saveNutriPrefs({dieta:this.value}); renderNutricion();">${dietaOpts}</select></div>
      <div class="field"><label>Comidas por día</label>
        <select onchange="saveNutriPrefs({comidas:+this.value}); renderNutricion();">${comidasOpts}</select></div>
      <label class="nutri-check"><input type="checkbox" ${prefs.sinTacc?"checked":""} onchange="saveNutriPrefs({sinTacc:this.checked}); renderNutricion();"> Sin TACC (celíaco)</label>
      ${excl?`<div class="field" style="margin-top:10px;"><label>No como esto</label><div class="excl-list">${excl}</div></div>`:`<div class="disclaimer" style="margin-top:10px;">En <b>Alimentos</b> podés marcar los que no comés para que no aparezcan en tus menús.</div>`}
    </div>
    <div class="card nutri-tip"><div class="nutri-tip-emoji">💡</div><div>${OBJETIVO_TIP[n.objetivo]}</div></div>
    <div class="card">
      <div class="section-title" style="margin-top:0;">Cómo lo calculamos</div>
      <div class="nutri-calc">
        <div class="nutri-calc-row"><span>Metabolismo basal (BMR)</span><b>${n.bmr} kcal</b></div>
        <div class="nutri-calc-row"><span>Actividad (${n.dias} ${n.dias===1?"día":"días"}/sem)</span><b>${n.actNom}</b></div>
        <div class="nutri-calc-row"><span>Gasto diario total (TDEE)</span><b>${n.tdee} kcal</b></div>
        <div class="nutri-calc-row total"><span>Meta diaria</span><b>${n.cal} kcal</b></div>
      </div>
      <div class="disclaimer" style="margin-top:12px;">Estimación (Mifflin-St Jeor). No reemplaza a un profesional de la nutrición.</div>
    </div>
  `;
}
