/* =========================================================
   FAC FIT — Modulo: PROFILE (Datos personales)
   Datos personales, medidas corporales, registro de peso y backup.
   ========================================================= */
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
      <div class="field"><label>Correo electrónico</label><input id="d-email" type="email" autocapitalize="off" autocomplete="email" placeholder="tucorreo@ejemplo.com" value="${p.email||""}"></div>
      <div class="field"><label>Fecha de cumpleaños</label><input id="d-cumple" type="date" value="${p.cumple||""}"></div>
      <div class="field"><label>Género</label>
        <select id="d-genero">
          <option value="masculino" ${(p.genero||"masculino")==="masculino"?"selected":""}>Masculino</option>
          <option value="femenino" ${p.genero==="femenino"?"selected":""}>Femenino</option>
          <option value="no_dice" ${p.genero==="no_dice"?"selected":""}>Prefiero no decirlo</option>
        </select>
      </div>
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
      <div class="section-title" style="margin-top:0;">Apariencia</div>
      <div class="bio-row">
        <div>
          <div style="font-weight:700; font-size:14.5px;">Modo oscuro 🌙</div>
          <div style="font-size:12.5px; color:var(--gris-600);">Ideal para entrenar de noche.</div>
        </div>
        <button class="bio-toggle ${getTheme()==='dark'?'on':''}" onclick="toggleTheme()" aria-label="Modo oscuro"><span></span></button>
      </div>
    </div>

    <div class="card" id="card-seguridad" style="display:none;">
      <div class="section-title" style="margin-top:0;">Seguridad</div>
      <div class="bio-row">
        <div>
          <div style="font-weight:700; font-size:14.5px;">Ingreso con Face ID / huella</div>
          <div style="font-size:12.5px; color:var(--gris-600);">Entrá sin escribir la contraseña.</div>
        </div>
        <button class="bio-toggle" id="bio-toggle" onclick="toggleBiometric()" aria-label="Activar Face ID"><span></span></button>
      </div>
    </div>

    <div class="card">
      <div class="section-title" style="margin-top:0;">Copia de seguridad</div>
      <p style="font-size:13px; color:var(--gris-600); margin:0 0 12px; line-height:1.5;">
        Tus datos se guardan en tu cuenta (nube). Igual podés exportar un respaldo para tenerlo aparte o pasarlo a otro lado.
      </p>
      <button class="btn btn-outline" onclick="exportData()">⤓ Exportar respaldo</button>
      <input type="file" id="d-import-file" accept="application/json,.json" style="display:none" onchange="importDataFile(this)">
      <button class="btn btn-ghost" style="margin-top:8px;" onclick="document.getElementById('d-import-file').click()">⤒ Importar respaldo</button>
    </div>
  `;
  const sel = $("#d-objetivo");
  if (sel) sel.onchange = () => { $("#d-obj-hint").textContent = OBJETIVOS[sel.value].desc; };
  // Mostrar la opción de Face ID solo si el dispositivo lo soporta
  if (typeof biometricAvailable === "function"){
    biometricAvailable().then(ok => {
      const card = $("#card-seguridad"); const tog = $("#bio-toggle");
      if (ok && card){ card.style.display = "block"; if (tog) tog.classList.toggle("on", biometricEnrolled()); }
    });
  }
}

function saveObjetivoNivel(){
  const p = State.profile();
  p.objetivo = $("#d-objetivo").value;
  p.nivel = $("#d-nivel").value;
  State.saveProfile(p);
  toast("Objetivo y nivel guardados 🎯");
}

/* ---------- BACKUP: exportar / importar ---------- */
const BACKUP_KEYS = ["ff_profile","ff_trainingDays","ff_attendance","ff_makeups","ff_routineTypeLog","ff_focus","ff_swaps","ff_weightLog","ff_lifts","ff_measures"];
function exportData(){
  const data = { app:"fac-fit", version:1, exportedAt:new Date().toISOString(), data:{} };
  BACKUP_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v != null) data.data[k] = v; });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fac-fit-backup-${todayStr()}.json`;
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
  const email = $("#d-email").value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ toast("Revisá el correo, no parece válido 📧"); return; }
  p.email = email;
  p.cumple = $("#d-cumple").value || "";
  p.genero = $("#d-genero").value || p.genero || "masculino";
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
   PANTALLA: MEDIDAS CORPORALES
   Registro histórico de circunferencias + peso, con evolución.
   ========================================================= */
const MEDIDAS_CAMPOS = [
  { key:"peso",        label:"Peso",        unit:"kg", emoji:"⚖️", menos:true  },
  { key:"cintura",     label:"Cintura",     unit:"cm", emoji:"📏", menos:true  },
  { key:"cadera",      label:"Cadera",      unit:"cm", emoji:"📏", menos:true  },
  { key:"pecho",       label:"Pecho",       unit:"cm", emoji:"🫁", menos:false },
  { key:"brazo",       label:"Brazo",       unit:"cm", emoji:"💪", menos:false },
  { key:"muslo",       label:"Muslo",       unit:"cm", emoji:"🦵", menos:false },
  { key:"pantorrilla", label:"Pantorrilla", unit:"cm", emoji:"🦵", menos:false },
  { key:"cuello",      label:"Cuello",      unit:"cm", emoji:"📏", menos:false },
];

/* Última entrada que tiene valor para ese campo, y la anterior a esa */
function medUltima(arr, key){
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i][key] != null) return arr[i];
  return null;
}
function medPrevia(arr, key){
  let visto = false;
  for (let i = arr.length - 1; i >= 0; i--){
    if (arr[i][key] != null){
      if (visto) return arr[i];
      visto = true;
    }
  }
  return null;
}

function renderMedidas(){
  const arr = State.measures().slice().sort((a,b)=>a.date.localeCompare(b.date));
  const c = $("#tab-medidas");
  const hoy = todayStr();
  const deHoy = arr.find(e => e.date === hoy) || {};

  const inputs = MEDIDAS_CAMPOS.map(f => {
    const val = deHoy[f.key] != null ? deHoy[f.key] : "";
    return `
      <div class="med-field">
        <label>${f.emoji} ${f.label} <span class="med-unit">(${f.unit})</span></label>
        <input id="med-${f.key}" type="number" inputmode="decimal" step="0.1" placeholder="—" value="${val}">
      </div>`;
  }).join("");

  // Tarjetas de evolución (solo campos con al menos un registro)
  const cards = MEDIDAS_CAMPOS.map(f => {
    const ult = medUltima(arr, f.key);
    if (!ult) return "";
    const prev = medPrevia(arr, f.key);
    let delta = "";
    if (prev){
      const d = ult[f.key] - prev[f.key];
      if (Math.abs(d) >= 0.05){
        const baja = d < 0;
        const bueno = f.menos ? baja : !baja; // según objetivo del campo
        delta = `<span class="med-delta ${bueno ? "good" : "bad"}">${baja ? "▼" : "▲"} ${Math.abs(d).toFixed(1)}</span>`;
      } else {
        delta = `<span class="med-delta flat">＝</span>`;
      }
    }
    return `
      <div class="med-stat">
        <div class="med-stat-top">
          <span class="med-stat-label">${f.emoji} ${f.label}</span>
          ${delta}
        </div>
        <div class="med-stat-val">${ult[f.key]}<span class="med-stat-unit">${f.unit}</span></div>
        <div class="med-stat-date">Actualizado ${fmtShort(ult.date)}</div>
      </div>`;
  }).join("");

  const tieneAlgo = arr.some(e => MEDIDAS_CAMPOS.some(f => e[f.key] != null));

  c.innerHTML = `
    <div class="card">
      <div class="section-title" style="margin-top:0;">📏 Registrar medidas de hoy</div>
      <p style="color:var(--gris-600); font-size:13px; line-height:1.5; margin:0 0 14px;">
        Cargá las que quieras (podés dejar vacías las demás). Medí siempre a la misma hora y en el mismo lugar del músculo para que sea comparable.
      </p>
      <div class="med-grid">${inputs}</div>
      <button class="btn btn-primary" style="margin-top:14px;" onclick="saveMedidas()">Guardar medidas</button>
    </div>

    ${tieneAlgo ? `
      <div class="section-title">Tu evolución</div>
      <div class="med-stats-grid">${cards}</div>
    ` : `
      <div class="card" style="text-align:center;">
        <div style="font-size:26px; margin-bottom:6px;">📐</div>
        <div style="font-weight:800; font-size:15px;">Todavía no cargaste medidas</div>
        <div style="color:var(--gris-600); font-size:13px; margin-top:4px; line-height:1.5;">
          Registrá tus primeras medidas arriba. Con el tiempo vas a ver acá cómo evolucionan.
        </div>
      </div>
    `}

    <div class="card">
      <div class="disclaimer">
        Las medidas corporales son una gran forma de ver progreso cuando la balanza no se mueve: los músculos pesan y el cuerpo cambia de forma aunque el número no baje.
      </div>
    </div>
  `;
}

function saveMedidas(){
  const arr = State.measures();
  const hoy = todayStr();
  const entry = { date: hoy };
  let any = false;
  MEDIDAS_CAMPOS.forEach(f => {
    const v = parseFloat($("#med-" + f.key).value);
    if (v && v > 0){ entry[f.key] = v; any = true; }
  });
  if (!any){ toast("Cargá al menos una medida 📏"); return; }

  const idx = arr.findIndex(e => e.date === hoy);
  if (idx >= 0) arr[idx] = { ...arr[idx], ...entry };
  else arr.push(entry);
  arr.sort((a,b)=>a.date.localeCompare(b.date));
  State.saveMeasures(arr);

  // El peso se integra con el perfil y el historial de peso (gráfico de Métricas)
  if (entry.peso){
    const log = State.weightLog();
    const li = log.findIndex(l => l.date === hoy);
    if (li >= 0) log[li].peso = entry.peso; else log.push({ date: hoy, peso: entry.peso });
    State.saveWeightLog(log);
    const p = State.profile(); if (p){ p.peso = entry.peso; State.saveProfile(p); }
  }

  toast("Medidas guardadas 📏");
  renderMedidas();
}

/* Empujón desde Inicio para registrar / actualizar medidas */
function buildMeasuresNudge(){
  const arr = State.measures().slice().sort((a,b)=>a.date.localeCompare(b.date));
  const ultima = arr.length ? arr[arr.length - 1] : null;
  if (!ultima){
    return `
      <div class="card nudge-card" onclick="goTo('medidas')">
        <div class="nudge-emoji">📏</div>
        <div class="nudge-txt">
          <div class="nudge-title">Registrá tus medidas corporales</div>
          <div class="nudge-sub">Cintura, brazos, pecho y más. Empezá hoy y seguí tu progreso real.</div>
        </div>
        <div class="nudge-arrow">›</div>
      </div>`;
  }
  const dias = Math.floor((new Date(todayStr()) - new Date(ultima.date)) / 86400000);
  if (dias >= 14){
    return `
      <div class="card nudge-card" onclick="goTo('medidas')">
        <div class="nudge-emoji">📐</div>
        <div class="nudge-txt">
          <div class="nudge-title">Actualizá tus medidas</div>
          <div class="nudge-sub">Pasaron ${dias} días desde tu última medición. Volvé a cargarlas y compará.</div>
        </div>
        <div class="nudge-arrow">›</div>
      </div>`;
  }
  return "";
}

