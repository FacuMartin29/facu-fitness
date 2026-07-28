/* =========================================================
   FAC FIT — Modulo: HOME (Inicio)
   Pantalla de inicio: rutina del dia, asistencia, proximos dias y empujones.
   ========================================================= */
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
  html += buildStreakCard();

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
    html += buildMeasuresNudge();
    html += `<button class="btn btn-outline improve-btn" onclick="goTo('encuesta')">💬 ¡Quiero mejorar esta app!</button>`;
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
  } else if (already.status === "no_asistio") {
    html += `
      <div class="card">
        <div class="section-title" style="margin-top:0;">Marcaste que hoy no fuiste</div>
        <p style="color:var(--gris-600); font-size:13.5px; line-height:1.5; margin:0 0 12px;">
          ${already.repuestoEn
            ? `Lo vas a reponer el <b>${fmtShort(already.repuestoEn)}</b>. Podés cambiar el día si querés.`
            : `Podés elegir otro día para reponer esta sesión (${plan.dayType.label}).`}
        </p>
        <button class="btn btn-primary" onclick="openRescheduleModal('${today}','${plan.dayType.key}')">
          ${already.repuestoEn ? "🔁 Cambiar día de reemplazo" : "📅 Elegir día de reemplazo"}
        </button>
        <button class="btn btn-ghost" style="margin-top:8px;" onclick="undoNoAsistio('${today}')">Deshacer (sí fui)</button>
      </div>`;
  }

  html += buildUpcomingCard();
  html += buildMeasuresNudge();
  html += `<button class="btn btn-outline improve-btn" onclick="goTo('encuesta')">💬 ¡Quiero mejorar esta app!</button>`;

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
  const att = State.attendance()[originDate] || {};
  const actual = att.repuestoEn && att.repuestoEn >= fmtDate(tomorrow) ? att.repuestoEn : fmtDate(tomorrow);
  $("#modal-body").innerHTML = `
    <div class="modal-title">¿Qué día lo reponés?</div>
    <div class="modal-desc">No pasa nada 🙌 Elegí el día en el que vas a hacer <b>${label}</b> como reposición y lo marcamos en tu calendario.</div>
    <div class="field"><label>Día de reposición</label><input type="date" id="inp-reschedule" min="${fmtDate(tomorrow)}" value="${actual}"></div>
    <button class="btn btn-red" onclick="confirmReschedule('${originDate}','${dayKey}')">${att.repuestoEn ? "Cambiar día" : "Reprogramar"}</button>
    <button class="btn btn-ghost" onclick="closeModal()">Ahora no</button>
  `;
  overlay.classList.add("open");
}

function confirmReschedule(originDate, dayKey){
  const newDate = $("#inp-reschedule").value;
  if (!newDate){ toast("Elegí una fecha válida"); return; }
  const makeups = State.makeups();
  const attendance = State.attendance();
  const prev = attendance[originDate] && attendance[originDate].repuestoEn;
  if (prev && prev !== newDate) delete makeups[prev]; // limpiar reposición anterior
  makeups[newDate] = { dayKey, origen: originDate };
  State.saveMakeups(makeups);
  if (!attendance[originDate]) attendance[originDate] = { status: "no_asistio", dayKey };
  attendance[originDate].repuestoEn = newDate;
  State.saveAttendance(attendance);
  closeModal();
  toast(`Reprogramado para el ${fmtShort(newDate)} ✅`);
  renderHome();
}

/* Deshace un "no fui": borra el registro (y su reposición si tenía) */
function undoNoAsistio(date){
  const attendance = State.attendance();
  const rec = attendance[date];
  if (rec && rec.repuestoEn){
    const makeups = State.makeups();
    delete makeups[rec.repuestoEn];
    State.saveMakeups(makeups);
  }
  delete attendance[date];
  State.saveAttendance(attendance);
  toast("Listo, lo podés volver a marcar");
  renderHome();
}

function closeModal(){ $("#modal-overlay").classList.remove("open"); }

