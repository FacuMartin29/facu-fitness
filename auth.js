/* =========================================================
   FAC FIT — auth.js
   Login / registro con Supabase. Cada usuario tiene sus datos
   aislados (tabla profiles + RLS). Los datos de la app (ff_*)
   se sincronizan con la nube (profiles.data).
   ========================================================= */
const SB_URL = "https://apmpwscoogznvlxekkoh.supabase.co";
const SB_KEY = "sb_publishable_LcQ1GOIvJL8lBc7JKkNPHQ_RD1uBE5V";

let sb = null;
try {
  sb = window.supabase.createClient(SB_URL, SB_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "facfit_auth" }
  });
} catch (e) { console.warn("Supabase no disponible:", e); }

/* Claves de datos que se sincronizan con la nube (mismas del backup) */
const SYNC_KEYS = ["ff_profile","ff_trainingDays","ff_attendance","ff_makeups","ff_routineTypeLog","ff_focus","ff_swaps","ff_weightLog"];

const authState = { email: "" };
function authToast(m){ if (window.toast) toast(m); }

/* ---------------- BOOT: decide qué pantalla mostrar al abrir ---------------- */
async function authBoot(){
  if (!sb){
    // Sin librería (offline sin cache): usar datos locales si los hay
    const p = State.profile();
    if (p && p.onboardDone){ renderHome(); showScreen("#screen-main"); }
    else showScreen("#screen-auth");
    return;
  }
  try {
    const { data } = await sb.auth.getSession();
    if (data && data.session){
      await pullUserData();
      afterAuth();
      return;
    }
  } catch(e){}
  showScreen("#screen-auth");
}

/* Ya autenticado: si completó el onboarding va al home, si no lo arranca */
function afterAuth(){
  const p = State.profile();
  if (p && p.onboardDone){ renderHome(); showScreen("#screen-main"); }
  else { resetOnb(); showScreen("#screen-onb-name"); }
}

/* ---------------- NAVEGACIÓN ENTRE PANTALLAS DE AUTH ---------------- */
function goRegister(){ showScreen("#screen-register"); }
function goLogin(){ showScreen("#screen-login"); }
function authBack(){ showScreen("#screen-auth"); }

/* ---------------- REGISTRO: 1) enviar código ---------------- */
async function authSendCode(){
  const email = ($("#auth-reg-email").value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ authToast("Poné un correo válido 📧"); return; }
  if (!sb){ authToast("Sin conexión con el servidor"); return; }
  authState.email = email;
  setBtnLoading("#btn-send-code", true);
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  setBtnLoading("#btn-send-code", false);
  if (error){
    authToast(/rate|limit|seconds/i.test(error.message) ? "Esperá unos segundos antes de pedir otro código" : "No pude enviar el código 😕");
    return;
  }
  $("#otp-email-label").textContent = email;
  $("#auth-otp").value = "";
  showScreen("#screen-otp");
}

async function authResend(){
  if (!authState.email || !sb) return;
  const { error } = await sb.auth.signInWithOtp({ email: authState.email, options: { shouldCreateUser: true } });
  authToast(error ? "Esperá unos segundos para reenviar" : "Código reenviado 📩");
}

/* ---------------- REGISTRO: 2) verificar código ---------------- */
async function authVerifyCode(){
  const token = ($("#auth-otp").value || "").replace(/\D/g,"").trim();
  if (token.length < 6){ authToast("El código tiene 6 dígitos"); return; }
  if (!sb){ return; }
  setBtnLoading("#btn-verify", true);
  const { error } = await sb.auth.verifyOtp({ email: authState.email, token, type: "email" });
  setBtnLoading("#btn-verify", false);
  if (error){ authToast("Código incorrecto o vencido"); return; }
  showScreen("#screen-setpass");
}

/* ---------------- REGISTRO: 3) crear contraseña ---------------- */
async function authSetPassword(){
  const p1 = $("#auth-newpass").value, p2 = $("#auth-newpass2").value;
  if (p1.length < 6){ authToast("La contraseña necesita al menos 6 caracteres"); return; }
  if (p1 !== p2){ authToast("Las contraseñas no coinciden"); return; }
  if (!sb){ return; }
  setBtnLoading("#btn-setpass", true);
  const { error } = await sb.auth.updateUser({ password: p1 });
  setBtnLoading("#btn-setpass", false);
  if (error){ authToast("No pude guardar la contraseña"); return; }
  // cuenta nueva: arrancamos con datos limpios y guardamos el email
  SYNC_KEYS.forEach(k => localStorage.removeItem(k));
  State.saveProfile({ email: authState.email });
  resetOnb();
  showScreen("#screen-onb-name");
}

/* ---------------- LOGIN ---------------- */
async function authLogin(){
  const email = ($("#auth-login-email").value || "").trim().toLowerCase();
  const pass = $("#auth-login-pass").value;
  if (!email || !pass){ authToast("Completá correo y contraseña"); return; }
  if (!sb){ authToast("Sin conexión con el servidor"); return; }
  setBtnLoading("#btn-login", true);
  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  if (error){ setBtnLoading("#btn-login", false); authToast("Correo o contraseña incorrectos"); return; }
  await pullUserData();
  setBtnLoading("#btn-login", false);
  afterAuth();
}

/* ---------------- LOGOUT ---------------- */
async function authLogout(){
  try { if (sb) await sb.auth.signOut(); } catch(e){}
  SYNC_KEYS.forEach(k => localStorage.removeItem(k));
  if (window.closeMenu) closeMenu();
  showScreen("#screen-auth");
  authToast("Cerraste sesión");
}

/* ---------------- SINCRONIZACIÓN DE DATOS ---------------- */
async function currentUser(){
  try { const { data } = await sb.auth.getUser(); return data.user; } catch(e){ return null; }
}

async function pullUserData(){
  if (!sb) return;
  const u = await currentUser(); if (!u) return;
  // El cloud es la fuente de verdad de la cuenta: limpiamos lo local antes de cargar,
  // así nunca se mezclan datos entre usuarios del mismo dispositivo.
  SYNC_KEYS.forEach(k => localStorage.removeItem(k));
  try {
    const { data } = await sb.from("profiles").select("data").eq("id", u.id).single();
    if (data && data.data){
      Object.keys(data.data).forEach(k => {
        if (SYNC_KEYS.includes(k)){
          const v = data.data[k];
          localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
        }
      });
    }
  } catch(e){}
}

let _syncTimer = null;
function scheduleCloudSync(){
  if (!sb) return;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(pushUserData, 1200);
}
async function pushUserData(){
  if (!sb) return;
  const u = await currentUser(); if (!u) return;
  const blob = {};
  SYNC_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v != null) blob[k] = v; });
  try { await sb.from("profiles").upsert({ id: u.id, email: u.email, data: blob, updated_at: new Date().toISOString() }); } catch(e){}
}

/* ---------------- helpers ---------------- */
function setBtnLoading(sel, on){
  const b = $(sel); if (!b) return;
  if (on){ b.dataset.txt = b.textContent; b.textContent = "Un momento…"; b.disabled = true; }
  else { if (b.dataset.txt) b.textContent = b.dataset.txt; b.disabled = false; }
}
function resetOnb(){
  if (window.onb){ onb.nombre=""; onb.apellido=""; onb.edad=""; onb.peso=""; onb.altura=""; onb.dias=[]; }
}
