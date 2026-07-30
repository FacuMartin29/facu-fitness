/* =========================================================
   FAC FIT — Modulo: METRICS (Metricas)
   Metricas, gamificacion (racha/logros), compartir progreso y encuesta.
   ========================================================= */
/* =========================================================
   PANTALLA: ENCUESTA / FEEDBACK
   ========================================================= */
const ENCUESTA = [
  { id:"recomienda", type:"score", q:"¿Qué tan probable es que le recomiendes Fac Fit a un amigo/a?", sub:"1 = nada · 5 = totalmente" },
  { id:"facilidad",  type:"score", q:"¿Qué tan fácil te resulta usar la app?" },
  { id:"rutinas",    type:"score", q:"¿Qué tan buenas te parecen las rutinas que te propone?" },
  { id:"ejercicios", type:"score", q:"¿Las imágenes y explicaciones de los ejercicios te resultan útiles?" },
  { id:"progreso",   type:"score", q:"¿Qué tan claro te resulta seguir tu progreso (métricas, racha, logros)?" },
  { id:"frecuencia", type:"choice", q:"¿Con qué frecuencia entrenás usando la app?", opciones:["Casi todos los días","3 a 5 por semana","1 a 2 por semana","Casi nunca"] },
  { id:"largo",      type:"choice", q:"¿La usarías a largo plazo?", opciones:["Sí, seguro","Tal vez","No"] },
  { id:"pago",       type:"choice", q:"¿Cuánto estarías dispuesto/a a pagar por mes por Fac Fit?", opciones:["No pagaría","1 USD","3 USD","5 USD"] },
  { id:"gusta",      type:"text",  q:"¿Qué es lo que MÁS te gusta de la app?", ph:"Escribí lo que quieras…" },
  { id:"cambiar",    type:"text",  q:"¿Qué le cambiarías o le agregarías?", ph:"Ideas, mejoras, lo que sea…" },
  { id:"problema",   type:"text",  q:"¿Tuviste algún error o problema? ¿Cuál?", ph:"Contanos si algo falló…" },
];
let encuestaResp = {};

function renderEncuesta(){
  encuestaResp = {};
  const yaEnviada = localStorage.getItem("ff_encuestaEnviada");
  const c = $("#tab-encuesta");
  let html = `
    <div class="card">
      <div class="section-title" style="margin-top:0;">Tu opinión nos importa 💬</div>
      <p style="font-size:13.5px; color:var(--gris-600); margin:0; line-height:1.5;">
        Son ${ENCUESTA.length} preguntas rápidas sobre la app. Tus respuestas nos ayudan a mejorarla.
        ${yaEnviada ? "<br><b>Ya respondiste antes — ¡gracias! Podés volver a enviar si querés.</b>" : ""}
      </p>
    </div>`;

  ENCUESTA.forEach((p, i) => {
    let control = "";
    if (p.type === "score"){
      control = `<div class="enc-scale">${[1,2,3,4,5].map(n=>`<button class="enc-dot" data-q="${p.id}" data-v="${n}" onclick="setEncuesta('${p.id}',${n},this)">${n}</button>`).join("")}</div>
        <div class="enc-scale-lbl"><span>Malo</span><span>Excelente</span></div>`;
    } else if (p.type === "nps"){
      control = `<div class="enc-scale nps">${Array.from({length:11},(_,n)=>`<button class="enc-dot" data-q="${p.id}" data-v="${n}" onclick="setEncuesta('${p.id}',${n},this)">${n}</button>`).join("")}</div>`;
    } else if (p.type === "choice"){
      control = `<div class="enc-choices">${p.opciones.map(o=>`<button class="enc-choice" data-q="${p.id}" data-v="${o}" onclick="setEncuesta('${p.id}','${o.replace(/'/g,"\\'")}',this)">${o}</button>`).join("")}</div>`;
    } else {
      control = `<textarea class="enc-text" id="enc-${p.id}" rows="2" placeholder="${p.ph||""}"></textarea>`;
    }
    html += `
      <div class="card enc-q">
        <div class="enc-qnum">${i+1} de ${ENCUESTA.length}</div>
        <div class="enc-qtext">${p.q}</div>
        ${p.sub ? `<div class="enc-qsub">${p.sub}</div>` : ""}
        ${control}
      </div>`;
  });

  html += `<button class="btn btn-primary" onclick="submitEncuesta()">Enviar mis respuestas</button>`;
  c.innerHTML = html;
}

function setEncuesta(qid, val, btn){
  encuestaResp[qid] = val;
  const group = btn.parentElement;
  group.querySelectorAll("[data-q='"+qid+"']").forEach(b => b.classList.remove("sel"));
  btn.classList.add("sel");
}

async function submitEncuesta(){
  // leer las de texto
  ENCUESTA.filter(p => p.type === "text").forEach(p => {
    const el = $("#enc-" + p.id); if (el && el.value.trim()) encuestaResp[p.id] = el.value.trim();
  });
  if (Object.keys(encuestaResp).length < 3){ toast("Contestá al menos unas preguntas 🙏"); return; }

  const profile = State.profile() || {};
  const payload = { respuestas: encuestaResp, nombre: profile.nombre || "", app_version: (typeof APP_VERSION !== "undefined" ? APP_VERSION : "web") };
  let guardado = false;
  if (typeof sb !== "undefined" && sb){
    try {
      const u = await currentUser();
      const { error } = await sb.from("feedback").insert({ user_id: u ? u.id : null, email: u ? u.email : (profile.email||null), answers: payload });
      if (!error) guardado = true;
    } catch(e){}
  }
  // respaldo local por si el envío falla
  const prev = Store.get("ff_encuestas", []); prev.push({ fecha: new Date().toISOString(), ...payload }); Store.set("ff_encuestas", prev);
  localStorage.setItem("ff_encuestaEnviada", todayStr());
  toast(guardado ? "¡Gracias por tu opinión! 🙌" : "¡Gracias! Guardamos tu opinión 🙌");
  goTo("inicio");
}

/* =========================================================
   PANTALLA: MÉTRICAS
   ========================================================= */
/* =========================================================
   GAMIFICACIÓN: racha y logros
   ========================================================= */
function computeGamification(){
  const att = State.attendance();
  const total = Object.values(att).filter(a => a.status === "asistio").length;
  const dates = Object.keys(att).sort();
  let current = 0, best = 0, run = 0;
  if (dates.length && State.trainingDays().length){
    let d = parseDate(dates[0]);
    const end = new Date();
    while (d <= end){
      const ds = fmtDate(d);
      const dt = getDayTypeForDate(ds);
      if (dt && dt.key){                       // es día de entreno
        const a = att[ds];
        if (a && a.status === "asistio"){ run++; best = Math.max(best, run); current = run; }
        else if (a && a.status === "no_asistio" && a.repuestoEn){ /* repuesto: neutral */ }
        else if (ds === todayStr()){ /* hoy pendiente: no corta */ }
        else { run = 0; current = 0; }         // día de entreno pasado sin asistir: corta
      }
      d.setDate(d.getDate() + 1);
    }
  }
  return { total, current, best };
}

const LOGROS = [
  { emoji:"🎯", label:"Primer entreno",  req:m => m.total >= 1 },
  { emoji:"💪", label:"10 sesiones",     req:m => m.total >= 10 },
  { emoji:"🔥", label:"25 sesiones",     req:m => m.total >= 25 },
  { emoji:"🏅", label:"50 sesiones",     req:m => m.total >= 50 },
  { emoji:"🏆", label:"100 sesiones",    req:m => m.total >= 100 },
  { emoji:"⚡", label:"Racha de 5",      req:m => m.best >= 5 },
  { emoji:"🚀", label:"Racha de 10",     req:m => m.best >= 10 },
  { emoji:"💎", label:"Racha de 20",     req:m => m.best >= 20 },
];

/* Tarjeta compacta de racha para el Inicio */
function buildStreakCard(){
  const g = computeGamification();
  if (g.total < 1) return "";
  const rachaTxt = g.current > 0
    ? `<b>${g.current}</b> ${g.current === 1 ? "sesión" : "sesiones"} seguidas`
    : `¡Volvé a arrancar tu racha!`;
  return `
    <div class="streak-card">
      <div class="streak-fire">🔥</div>
      <div class="streak-body">
        <div class="streak-main">${rachaTxt}</div>
        <div class="streak-sub">${g.total} entrenos en total${g.best > g.current ? ` · récord: ${g.best}` : ""}</div>
      </div>
    </div>`;
}

/* Tarjeta de logros para Métricas */
function buildLogrosCard(){
  const g = computeGamification();
  const items = LOGROS.map(l => {
    const on = l.req(g);
    return `<div class="logro ${on ? "on" : ""}">
      <div class="logro-emoji">${l.emoji}</div>
      <div class="logro-label">${l.label}</div>
    </div>`;
  }).join("");
  const cuantos = LOGROS.filter(l => l.req(g)).length;
  return `
    <div class="card">
      <div class="section-title" style="margin-top:0;">Logros <span style="font-weight:600;color:var(--gris-400);text-transform:none;letter-spacing:0;">${cuantos}/${LOGROS.length}</span></div>
      <div class="logros-grid">${items}</div>
    </div>`;
}

/* =========================================================
   COMPARTIR PROGRESO (genera una imagen para redes)
   ========================================================= */
function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

async function shareProgress(){
  try { await document.fonts.ready; } catch(e){}
  const g = computeGamification();
  const m = computeMetrics();
  const profile = State.profile() || {};
  const nombre = ((profile.nombre||"") + " " + (profile.apellido||"")).trim() || "Atleta";

  const W = 1080, H = 1080;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");

  // Fondo negro + brillo rojo
  ctx.fillStyle = "#0d0d0f"; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W/2, 360, 40, W/2, 360, 680);
  glow.addColorStop(0, "rgba(224,49,49,.30)"); glow.addColorStop(1, "rgba(224,49,49,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";

  // Título FAC FIT
  ctx.font = "120px Bangers, 'Arial Black', sans-serif";
  const facW = ctx.measureText("FAC ").width, fitW = ctx.measureText("FIT").width;
  const startX = W/2 - (facW+fitW)/2;
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff"; ctx.fillText("FAC ", startX, 180);
  ctx.fillStyle = "#e03131"; ctx.fillText("FIT", startX+facW, 180);
  ctx.textAlign = "center";

  // tagline
  ctx.font = "italic 600 30px Inter, sans-serif"; ctx.fillStyle = "#9a9ca4";
  ctx.fillText("mi progreso", W/2, 232);

  // Número grande: total de entrenamientos
  ctx.font = "800 260px Inter, sans-serif"; ctx.fillStyle = "#ffffff";
  ctx.fillText(String(m.totalSesiones), W/2, 560);
  ctx.font = "800 34px Inter, sans-serif"; ctx.fillStyle = "#e03131";
  ctx.fillText("ENTRENAMIENTOS COMPLETADOS", W/2, 620);

  // 3 stat cards
  const stats = [
    { n: String(g.current), l: "Racha" },
    { n: String(g.best), l: "Récord" },
    { n: (m.totalKcal >= 1000 ? (m.totalKcal/1000).toFixed(1)+"k" : String(m.totalKcal)), l: "Kcal" },
  ];
  const cardW = 300, cardH = 190, gap = 20, totalW = cardW*3 + gap*2;
  let cx = W/2 - totalW/2, cy = 700;
  stats.forEach(s => {
    ctx.fillStyle = "#17181b"; roundRect(ctx, cx, cy, cardW, cardH, 26); ctx.fill();
    ctx.strokeStyle = "rgba(224,49,49,.35)"; ctx.lineWidth = 2; roundRect(ctx, cx, cy, cardW, cardH, 26); ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.font = "800 84px Inter, sans-serif";
    ctx.fillText(s.n, cx + cardW/2, cy + 105);
    ctx.fillStyle = "#9a9ca4"; ctx.font = "700 30px Inter, sans-serif";
    ctx.fillText(s.l, cx + cardW/2, cy + 155);
    cx += cardW + gap;
  });

  // Nombre + fecha
  ctx.fillStyle = "#ffffff"; ctx.font = "800 46px Inter, sans-serif";
  ctx.fillText(nombre, W/2, 990);
  const hoy = new Date();
  ctx.fillStyle = "#6c6e76"; ctx.font = "600 28px Inter, sans-serif";
  ctx.fillText(`${hoy.getDate()} de ${MESES[hoy.getMonth()]} de ${hoy.getFullYear()}`, W/2, 1035);

  // Exportar y compartir
  cv.toBlob(async (blob) => {
    if (!blob){ toast("No pude generar la imagen 😕"); return; }
    const file = new File([blob], "facfit-progreso.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })){
      try { await navigator.share({ files: [file], title: "Mi progreso en Fac Fit", text: "Mi progreso en Fac Fit 💪🔥" }); }
      catch(e){ /* cancelado */ }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "facfit-progreso.png";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 1000);
      toast("Imagen guardada 📸");
    }
  }, "image/png");
}

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
    <button class="btn btn-primary btn-share" onclick="shareProgress()">📲 Compartir mi progreso</button>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-num">${m.totalSesiones}</div><div class="stat-label">Sesiones completadas</div></div>
      <div class="stat-card"><div class="stat-num red">${m.totalKcal}</div><div class="stat-label">Kcal estimadas quemadas</div></div>
      <div class="stat-card"><div class="stat-num">${m.kgEstimados.toFixed(2)}</div><div class="stat-label">Kg estimados por ejercicio</div></div>
      <div class="stat-card"><div class="stat-num">${m.imc.toFixed(1)}</div><div class="stat-label">IMC actual (${imcCategoria(m.imc)})</div></div>
    </div>

    ${buildLogrosCard()}

    ${buildPRCard()}

    ${typeof buildNutriMetricsCard === "function" ? buildNutriMetricsCard() : ""}

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

