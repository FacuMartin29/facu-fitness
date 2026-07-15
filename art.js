/* =========================================================
   FAC FIT — art.js
   Arte 100% inline (SVG en JS). No depende de archivos:
   así no hay imágenes rotas ni cache que falle, y funciona
   offline. Íconos por equipamiento, color por grupo muscular.
   ========================================================= */

/* Color de acento por grupo muscular */
const GRUPO_COLOR = {
  pecho:   "#e03131",
  espalda: "#1971c2",
  hombros: "#f08c00",
  biceps:  "#7048e8",
  triceps: "#0ca678",
  piernas: "#e8590c",
  core:    "#c2255c",
  cardio:  "#e03131",
  cardio_circuit: "#e8590c",
};

/* Íconos de equipamiento (contenido interno del SVG, stroke=currentColor).
   viewBox base 0 0 100 72. Trazos limpios, estilo app. */
const EQUIP_ICON = {
  // Barra olímpica con discos
  barra: `
    <line x1="10" y1="36" x2="90" y2="36"/>
    <rect x="16" y="24" width="8" height="24" rx="2" fill="currentColor" stroke="none"/>
    <rect x="26" y="18" width="9" height="36" rx="2" fill="currentColor" stroke="none"/>
    <rect x="65" y="18" width="9" height="36" rx="2" fill="currentColor" stroke="none"/>
    <rect x="76" y="24" width="8" height="24" rx="2" fill="currentColor" stroke="none"/>`,
  // Mancuerna
  mancuernas: `
    <line x1="30" y1="36" x2="70" y2="36"/>
    <rect x="16" y="22" width="10" height="28" rx="3" fill="currentColor" stroke="none"/>
    <rect x="26" y="27" width="7" height="18" rx="2" fill="currentColor" stroke="none"/>
    <rect x="67" y="27" width="7" height="18" rx="2" fill="currentColor" stroke="none"/>
    <rect x="74" y="22" width="10" height="28" rx="3" fill="currentColor" stroke="none"/>`,
  // Máquina (asiento + torre de peso)
  maquina: `
    <rect x="20" y="14" width="16" height="44" rx="3"/>
    <line x1="28" y1="14" x2="28" y2="58"/>
    <rect x="25" y="20" width="6" height="9" rx="1.5" fill="currentColor" stroke="none"/>
    <path d="M50 26 h26 a6 6 0 0 1 6 6 v0 a6 6 0 0 1 -6 6 h-18"/>
    <rect x="46" y="44" width="30" height="10" rx="4"/>
    <line x1="61" y1="38" x2="61" y2="44"/>`,
  // Polea / cable
  cable: `
    <circle cx="72" cy="20" r="8"/>
    <path d="M72 28 v10 a4 4 0 0 1 -4 4 h-6"/>
    <rect x="46" y="42" width="18" height="8" rx="4" fill="currentColor" stroke="none"/>
    <line x1="20" y1="14" x2="20" y2="58"/>
    <line x1="20" y1="58" x2="86" y2="58"/>`,
  // Peso corporal (figura)
  peso_corporal: `
    <circle cx="50" cy="18" r="8"/>
    <line x1="50" y1="26" x2="50" y2="44"/>
    <line x1="50" y1="31" x2="34" y2="24"/>
    <line x1="50" y1="31" x2="66" y2="24"/>
    <line x1="50" y1="44" x2="38" y2="60"/>
    <line x1="50" y1="44" x2="62" y2="60"/>`,
  // Accesorio (rueda abdominal)
  accesorio: `
    <circle cx="50" cy="44" r="14"/>
    <circle cx="50" cy="44" r="4" fill="currentColor" stroke="none"/>
    <line x1="30" y1="44" x2="22" y2="44"/>
    <line x1="70" y1="44" x2="78" y2="44"/>`,
  // Bici estática
  bici: `
    <circle cx="28" cy="50" r="12"/>
    <circle cx="74" cy="50" r="12"/>
    <path d="M28 50 l14 -22 h16"/>
    <line x1="42" y1="28" x2="34" y2="22"/>
    <path d="M58 28 l6 22"/>
    <line x1="58" y1="28" x2="66" y2="24"/>`,
  // Cinta de correr
  cinta: `
    <path d="M18 54 h50 l10 -30"/>
    <line x1="24" y1="58" x2="72" y2="58"/>
    <circle cx="46" cy="26" r="6"/>
    <path d="M46 32 l-4 12 M46 34 l8 -4"/>`,
  // Cardio dinámico (corredor)
  correr: `
    <circle cx="52" cy="16" r="7"/>
    <path d="M52 23 l-6 16 l-10 8"/>
    <path d="M46 30 l14 6 l6 -8"/>
    <path d="M46 39 l10 4 l4 14"/>`,
};

/* Mapea el string de equipamiento del ejercicio a un ícono */
function equipIconKey(equip){
  const e = (equip || "").toLowerCase();
  if (e.includes("polea") || e.includes("cable")) return "cable";
  if (e.includes("barra") && e.includes("máquina")) return "maquina";
  if (e.includes("barra")) return "barra";
  if (e.includes("mancuerna")) return "mancuernas";
  if (e.includes("máquina") || e.includes("maquina")) return "maquina";
  if (e.includes("bici")) return "bici";
  if (e.includes("cinta") || e.includes("pista") || e.includes("remo") || e.includes("elíptica") || e.includes("eliptica")) return "cinta";
  if (e.includes("accesorio")) return "accesorio";
  if (e.includes("corporal")) return "peso_corporal";
  return "peso_corporal";
}

/* SVG de equipamiento (fallback cuando no hay foto) */
function equipSvg(ex, cls){
  const grupo = ex.grupo || "pecho";
  const color = GRUPO_COLOR[grupo] || "#e03131";
  const key = ex.tipo === "metabolico" ? "correr" : equipIconKey(ex.equip);
  return `<svg class="${cls}" viewBox="0 0 100 72" style="color:${color}" fill="none"
     stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${EQUIP_ICON[key]||EQUIP_ICON.peso_corporal}</svg>`;
}

/* Miniatura para la lista: usa la foto demostrativa real si existe,
   con fallback automático al ícono de equipamiento si la imagen falla. */
function exerciseThumb(ex){
  const m = (typeof EXERCISE_MEDIA !== "undefined") && EXERCISE_MEDIA[ex.id];
  if (m && m.img && m.img[0]){
    const fb = encodeURIComponent(equipSvg(ex, "ex-thumb"));
    return `<img class="ex-thumb-img" src="${m.img[0]}" alt="" loading="lazy" data-fb="${fb}" onerror="ffImgFail(this)">`;
  }
  return equipSvg(ex, "ex-thumb");
}

/* SVG grande para el detalle del ejercicio (fallback cuando no hay foto) */
function exerciseArt(ex){
  return equipSvg(ex, "ex-art");
}

/* Si una imagen no carga, la reemplaza por el ícono SVG guardado en data-fb */
if (typeof window !== "undefined"){
  window.ffImgFail = function(img){
    try {
      const fb = decodeURIComponent(img.getAttribute("data-fb") || "");
      if (fb) img.insertAdjacentHTML("afterend", fb);
    } catch(e){}
    img.remove();
  };
}

/* Logo de la app (emblema con mancuerna + 29) */
const LOGO_SVG = `
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="ff-logo-svg">
  <defs>
    <linearGradient id="ffg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2a2b30"/>
      <stop offset="1" stop-color="#0d0d0f"/>
    </linearGradient>
  </defs>
  <rect x="6" y="6" width="108" height="108" rx="30" fill="url(#ffg)" stroke="#e03131" stroke-width="3"/>
  <g stroke="#e03131" stroke-width="7" stroke-linecap="round">
    <line x1="34" y1="46" x2="86" y2="46"/>
    <line x1="30" y1="38" x2="30" y2="54"/>
    <line x1="40" y1="34" x2="40" y2="58"/>
    <line x1="80" y1="34" x2="80" y2="58"/>
    <line x1="90" y1="38" x2="90" y2="54"/>
  </g>
  <text x="60" y="94" text-anchor="middle" font-family="Archivo Black, Arial Black, sans-serif"
        font-size="34" fill="#ffffff" letter-spacing="1">29</text>
</svg>`;

if (typeof module !== "undefined") {
  module.exports = { GRUPO_COLOR, EQUIP_ICON, exerciseThumb, exerciseArt, LOGO_SVG };
}
