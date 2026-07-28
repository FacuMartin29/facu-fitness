/* =========================================================
   FAC FIT — Modulo: NUTRITION (Nutricion)
   Metas de calorias y macros (Mifflin-St Jeor + actividad + objetivo).
   ========================================================= */
/* =========================================================
   MÓDULO: NUTRICIÓN  (Fase 1 — metas de calorías y macros)
   Metas estimadas con Mifflin-St Jeor + factor de actividad
   según días de entrenamiento + ajuste por objetivo.
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

  // Macros
  const protPerKg = objetivo === "perder_grasa" ? 2.2 : (objetivo === "ganar_musculo" ? 2.0 : 1.8);
  const prot = Math.round(peso * protPerKg);
  const grasa = Math.round(cal * 0.25 / 9);
  const carbs = Math.max(0, Math.round((cal - (prot * 4 + grasa * 9)) / 4));

  return { bmr:Math.round(bmr), tdee:Math.round(tdee), cal, prot, grasa, carbs,
           actNom, dias, objetivo, ajusteTxt, protPerKg };
}

const OBJETIVO_TIP = {
  ganar_musculo: "Comé en superávit y repartí la proteína en todas las comidas. La constancia le gana a la perfección.",
  perder_grasa:  "Un déficit moderado y sostenible rinde más que uno agresivo. La proteína alta te ayuda a no perder músculo.",
  mantener:      "Comé alrededor de tu gasto y ajustá según cómo se mueva la balanza y tus medidas.",
};

function renderNutricion(){
  const c = $("#tab-nutricion");
  const n = computeNutrition();

  if (!n){
    c.innerHTML = `
      <div class="card" style="text-align:center;">
        <div style="font-size:26px; margin-bottom:6px;">🥗</div>
        <div style="font-weight:800; font-size:15px;">Completá tus datos para calcular tu nutrición</div>
        <div style="color:var(--gris-600); font-size:13px; margin:6px 0 14px; line-height:1.5;">
          Necesitamos tu <b>peso</b>, <b>altura</b> y <b>edad</b> para estimar tus calorías y proteína.
        </div>
        <button class="btn btn-primary" onclick="goTo('datos')">Ir a Datos personales</button>
      </div>`;
    return;
  }

  const kcalProt = n.prot * 4, kcalCarbs = n.carbs * 4, kcalGrasa = n.grasa * 9;
  const total = kcalProt + kcalCarbs + kcalGrasa || 1;
  const pctP = Math.round(kcalProt / total * 100);
  const pctC = Math.round(kcalCarbs / total * 100);
  const pctG = Math.max(0, 100 - pctP - pctC);

  const macro = (emoji, nombre, gramos, kcal, pct, color) => `
    <div class="macro-row">
      <div class="macro-head">
        <span class="macro-name">${emoji} ${nombre}</span>
        <span class="macro-g">${gramos} g <span class="macro-kcal">· ${kcal} kcal</span></span>
      </div>
      <div class="macro-bar"><div class="macro-fill" style="width:${pct}%; background:${color};"></div></div>
    </div>`;

  c.innerHTML = `
    <div class="card nutri-hero">
      <div class="nutri-goal-label">Tu objetivo diario</div>
      <div class="nutri-kcal">${n.cal}<span>kcal</span></div>
      <div class="nutri-goal-sub">${OBJETIVO_LABEL[n.objetivo]} · ${n.ajusteTxt}</div>
    </div>

    <div class="card">
      <div class="section-title" style="margin-top:0;">Reparto de macronutrientes</div>
      ${macro("🥩", "Proteína", n.prot, kcalProt, pctP, "#e03131")}
      ${macro("🍚", "Carbohidratos", n.carbs, kcalCarbs, pctC, "#f59f00")}
      ${macro("🥑", "Grasas", n.grasa, kcalGrasa, pctG, "#40c057")}
      <div class="disclaimer" style="margin-top:12px;">
        Proteína calculada en <b>${n.protPerKg} g por kg</b> de peso — clave para construir y conservar músculo.
      </div>
    </div>

    <div class="card nutri-tip">
      <div class="nutri-tip-emoji">💡</div>
      <div>${OBJETIVO_TIP[n.objetivo]}</div>
    </div>

    <div class="card">
      <div class="section-title" style="margin-top:0;">Cómo lo calculamos</div>
      <div class="nutri-calc">
        <div class="nutri-calc-row"><span>Metabolismo basal (BMR)</span><b>${n.bmr} kcal</b></div>
        <div class="nutri-calc-row"><span>Nivel de actividad (${n.dias} ${n.dias===1?"día":"días"}/sem)</span><b>${n.actNom}</b></div>
        <div class="nutri-calc-row"><span>Gasto diario total (TDEE)</span><b>${n.tdee} kcal</b></div>
        <div class="nutri-calc-row"><span>Ajuste por tu objetivo</span><b>${n.ajusteTxt}</b></div>
        <div class="nutri-calc-row total"><span>Tu meta diaria</span><b>${n.cal} kcal</b></div>
      </div>
      <div class="disclaimer" style="margin-top:12px;">
        Es una <b>estimación</b> con la fórmula Mifflin-St Jeor y valores estándar de actividad, no un plan médico ni nutricional personalizado.
        Ajustá según tus resultados reales y, ante dudas o condiciones de salud, consultá con un profesional.
        Cambiás tu objetivo, peso o días desde <b>Datos personales</b> y <b>Días de rutina</b>.
      </div>
    </div>
  `;
}

