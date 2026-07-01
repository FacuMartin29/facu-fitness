const CACHE_NAME = "facufitness-v2";
const CACHE_FILES = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "exercises.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "images/exercises/ab_wheel.svg",
  "images/exercises/bench_press_flat.svg",
  "images/exercises/bench_press_flat_db.svg",
  "images/exercises/bench_press_incline_db.svg",
  "images/exercises/bench_press_machine.svg",
  "images/exercises/cable_crossover.svg",
  "images/exercises/cable_crunch.svg",
  "images/exercises/calf_raise_seated.svg",
  "images/exercises/calf_raise_standing.svg",
  "images/exercises/concentration_curl.svg",
  "images/exercises/crunch.svg",
  "images/exercises/curl_barbell.svg",
  "images/exercises/curl_cable.svg",
  "images/exercises/curl_dumbbell.svg",
  "images/exercises/deadlift_rdl.svg",
  "images/exercises/dip.svg",
  "images/exercises/face_pull.svg",
  "images/exercises/fly_lying.svg",
  "images/exercises/front_raise.svg",
  "images/exercises/hanging_leg_raise.svg",
  "images/exercises/hip_thrust.svg",
  "images/exercises/hyperextension.svg",
  "images/exercises/lat_pulldown.svg",
  "images/exercises/lateral_raise.svg",
  "images/exercises/leg_curl.svg",
  "images/exercises/leg_extension.svg",
  "images/exercises/leg_press.svg",
  "images/exercises/lunge.svg",
  "images/exercises/overhead_press_barbell.svg",
  "images/exercises/overhead_press_db.svg",
  "images/exercises/overhead_triceps_extension.svg",
  "images/exercises/plank.svg",
  "images/exercises/preacher_curl.svg",
  "images/exercises/pullover.svg",
  "images/exercises/pullup_hang.svg",
  "images/exercises/pushup.svg",
  "images/exercises/rear_delt_fly.svg",
  "images/exercises/row_bent.svg",
  "images/exercises/row_inverted.svg",
  "images/exercises/row_seated_cable.svg",
  "images/exercises/row_single_arm.svg",
  "images/exercises/side_plank.svg",
  "images/exercises/skullcrusher.svg",
  "images/exercises/squat.svg",
  "images/exercises/stationary_bike.svg",
  "images/exercises/treadmill.svg",
  "images/exercises/triceps_kickback.svg",
  "images/exercises/triceps_pushdown.svg",
  "images/exercises/upright_row.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
