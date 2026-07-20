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
  // Sin sesión: si tiene Face ID configurado, vamos al login con esa opción
  if (biometricEnrolled()){ showScreen("#screen-login"); refreshBiometricUI(); }
  else showScreen("#screen-auth");
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
  if (token.length < 6){ authToast("Ingresá el código completo tal cual llegó al mail"); return; }
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
  maybeOfferBiometric();
}

/* ---------------- LOGOUT ---------------- */
async function authLogout(){
  // scope local: cierra la sesión en este dispositivo pero deja válido el
  // token para poder reentrar con Face ID (si está activado).
  try { if (sb) await sb.auth.signOut({ scope: "local" }); } catch(e){}
  SYNC_KEYS.forEach(k => localStorage.removeItem(k));
  if (window.closeMenu) closeMenu();
  if (biometricEnrolled()){ showScreen("#screen-login"); refreshBiometricUI(); }
  else showScreen("#screen-auth");
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

/* ---------------- BIOMÉTRICO: Face ID / huella (WebAuthn) ---------------- */
const BIO = { cred:"ff_bioCredId", tok:"ff_bioToken", email:"ff_bioEmail" };

function _b64(buf){ return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
function _unb64(b64){ return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); }
function _rand(n){ const a = new Uint8Array(n); crypto.getRandomValues(a); return a; }

async function biometricAvailable(){
  try {
    if (!window.PublicKeyCredential || !navigator.credentials) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch(e){ return false; }
}
function biometricEnrolled(){ return !!localStorage.getItem(BIO.cred); }

/* Muestra u oculta el botón "Entrar con Face ID" y precarga el email */
function refreshBiometricUI(){
  const btn = $("#btn-biometric");
  if (btn) btn.style.display = biometricEnrolled() ? "block" : "none";
  const em = $("#auth-login-email");
  const saved = localStorage.getItem(BIO.email);
  if (em && !em.value && saved) em.value = saved;
}

/* Tras un login exitoso, ofrece activar Face ID (si el equipo lo soporta) */
async function maybeOfferBiometric(){
  if (!biometricEnrolled() && sb && await biometricAvailable()){ showScreen("#screen-bio"); }
  else afterAuth();
}
function skipBiometric(){ afterAuth(); }

/* Activar Face ID: crea la credencial y guarda la sesión detrás del biométrico */
async function enableBiometric(fromSettings){
  if (!sb) return false;
  if (!(await biometricAvailable())){ authToast("Tu dispositivo no ofrece Face ID/huella acá"); return false; }
  const { data } = await sb.auth.getSession();
  if (!data || !data.session){ authToast("Iniciá sesión primero"); return false; }
  const u = data.session.user;
  try {
    const cred = await navigator.credentials.create({ publicKey: {
      challenge: _rand(32),
      rp: { name: "Fac Fit" },
      user: { id: new TextEncoder().encode(u.id), name: u.email || "usuario", displayName: u.email || "Fac Fit" },
      pubKeyCredParams: [{ type:"public-key", alg:-7 }, { type:"public-key", alg:-257 }],
      authenticatorSelection: { authenticatorAttachment:"platform", userVerification:"required" },
      timeout: 60000, attestation:"none"
    }});
    localStorage.setItem(BIO.cred, _b64(cred.rawId));
    localStorage.setItem(BIO.tok, JSON.stringify({ access_token:data.session.access_token, refresh_token:data.session.refresh_token }));
    localStorage.setItem(BIO.email, u.email || "");
    authToast("Face ID activado ✅");
    if (fromSettings){ renderDatos(); } else { afterAuth(); }
    return true;
  } catch(e){
    authToast("No se pudo activar Face ID");
    if (!fromSettings) afterAuth();
    return false;
  }
}

function disableBiometric(){
  localStorage.removeItem(BIO.cred); localStorage.removeItem(BIO.tok); localStorage.removeItem(BIO.email);
  if (typeof renderDatos === "function" && document.getElementById("tab-datos")) renderDatos();
  refreshBiometricUI();
}

/* Toggle desde Datos personales */
function toggleBiometric(){
  if (biometricEnrolled()){ disableBiometric(); authToast("Face ID desactivado"); }
  else enableBiometric(true);
}

/* Entrar con Face ID: pide el biométrico y restaura la sesión guardada */
async function biometricLogin(){
  if (!sb || !biometricEnrolled()){ return; }
  try {
    await navigator.credentials.get({ publicKey: {
      challenge: _rand(32),
      allowCredentials: [{ type:"public-key", id: _unb64(localStorage.getItem(BIO.cred)) }],
      userVerification:"required", timeout:60000
    }});
  } catch(e){ authToast("No se pudo verificar tu Face ID"); return; }
  // Biométrico OK -> restauramos la sesión con el token guardado
  const t = JSON.parse(localStorage.getItem(BIO.tok) || "{}");
  let res = await sb.auth.setSession({ access_token: t.access_token, refresh_token: t.refresh_token });
  if (res.error){ res = await sb.auth.refreshSession({ refresh_token: t.refresh_token }); }
  if (res.error || !res.data || !res.data.session){
    authToast("Tu sesión expiró, entrá con tu contraseña una vez");
    disableBiometric();
    return;
  }
  const s = res.data.session;
  localStorage.setItem(BIO.tok, JSON.stringify({ access_token:s.access_token, refresh_token:s.refresh_token }));
  await pullUserData();
  afterAuth();
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
