-- ============================================================
-- FAC FIT — Seed de datos de prueba
-- 50 usuarios (auth.users + public.profiles) + 50 feedbacks
-- ------------------------------------------------------------
-- Correr en: Supabase → SQL Editor (usa rol service, ignora RLS).
-- Es TU base y son datos ficticios. Emails @facfit.test para
-- poder borrarlos fácil con el bloque de LIMPIEZA de abajo.
-- ============================================================
do $$
declare
  nombres_m text[] := array['Facundo','Mateo','Santiago','Bruno','Thiago','Lucas','Benjamín','Joaquín','Tomás','Nicolás','Agustín','Franco','Ramiro','Iván','Gonzalo','Emiliano','Lautaro','Julián','Marcos','Diego'];
  nombres_f text[] := array['Martina','Valentina','Sofía','Camila','Lucía','Julieta','Catalina','Renata','Emma','Mía','Delfina','Guadalupe','Paula','Florencia','Agustina','Carla','Rocío','Micaela','Brenda','Antonella'];
  apellidos text[] := array['González','Rodríguez','Gómez','Fernández','López','Díaz','Martínez','Pérez','Sosa','Romero','Álvarez','Torres','Ruiz','Ramírez','Flores','Benítez','Acosta','Medina','Suárez','Herrera'];
  objetivos text[] := array['ganar_musculo','perder_grasa','mantener'];
  niveles   text[] := array['principiante','intermedio','avanzado'];
  generos   text[] := array['masculino','femenino','no_dice'];
  tdays_arr text[] := array['[1,3,5]','[1,2,4,5]','[0,2,4]','[1,2,3,4,5]','[2,4,6]','[1,3,5,6]'];
  freq_arr  text[] := array['Casi todos los días','3 a 5 por semana','1 a 2 por semana','Casi nunca'];
  largo_arr text[] := array['Sí, seguro','Tal vez','No'];
  pago_arr  text[] := array['No pagaría','1 USD','3 USD','5 USD'];
  gusta_arr text[] := array['Las rutinas','Lo simple que es','El seguimiento del progreso','La sección de nutrición','Los logros y la racha','El diseño','Que es muy claro'];
  cambiar_arr text[] := array['Más ejercicios','Fotos reales de las comidas','Un timer de descanso','Más recetas','Nada por ahora','Que se integre con el reloj'];
  problema_arr text[] := array['Ninguno','Todo ok','A veces tarda en cargar','No, anda bien','Ninguno hasta ahora'];
  i int; uid uuid; em text; gen text; nom text; ape text;
  edad int; peso numeric; altura int; obj text; niv text;
  prof jsonb; wlog jsonb; meas jsonb; created timestamptz;
begin
  for i in 1..50 loop
    uid := gen_random_uuid();
    em  := 'facfit_test_' || i || '@facfit.test';
    gen := generos[1 + floor(random()*3)::int];
    if gen = 'femenino' then nom := nombres_f[1 + floor(random()*array_length(nombres_f,1))::int];
    else nom := nombres_m[1 + floor(random()*array_length(nombres_m,1))::int]; end if;
    ape    := apellidos[1 + floor(random()*array_length(apellidos,1))::int];
    edad   := 18 + floor(random()*38)::int;                 -- 18..55
    peso   := round((55 + random()*45)::numeric, 1);        -- 55..100 kg
    altura := 155 + floor(random()*40)::int;                -- 155..194 cm
    obj    := objetivos[1 + floor(random()*3)::int];
    niv    := niveles[1 + floor(random()*3)::int];
    created := now() - (floor(random()*120) || ' days')::interval;

    -- Perfil como lo guarda la app (numeros y flags)
    prof := jsonb_build_object(
      'nombre', nom, 'apellido', ape, 'email', em, 'genero', gen,
      'edad', edad, 'peso', peso, 'altura', altura,
      'objetivo', obj, 'nivel', niv, 'onboardDone', true
    );
    wlog := jsonb_build_array(
      jsonb_build_object('date', to_char(created,'YYYY-MM-DD'), 'peso', round((peso+2)::numeric,1)),
      jsonb_build_object('date', to_char(now(),'YYYY-MM-DD'),   'peso', peso)
    );
    meas := jsonb_build_array(
      jsonb_build_object('date', to_char(now(),'YYYY-MM-DD'),
        'cintura', 70+floor(random()*35)::int,
        'brazo',   28+floor(random()*15)::int,
        'pecho',   88+floor(random()*30)::int)
    );

    -- 1) Usuario en auth.users (por si profiles.id referencia auth.users)
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
      crypt('FacFitTest123!', gen_salt('bf')),
      created, created, now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('nombre', nom),
      '', '', '', ''
    ) on conflict (id) do nothing;

    -- 2) Perfil: el blob data guarda cada clave como STRING (igual que la app)
    insert into public.profiles (id, email, data, updated_at)
    values (uid, em, jsonb_build_object(
      'ff_profile',      prof::text,
      'ff_trainingDays', tdays_arr[1 + floor(random()*array_length(tdays_arr,1))::int],
      'ff_weightLog',    wlog::text,
      'ff_measures',     meas::text
    ), now())
    on conflict (id) do update
      set email = excluded.email, data = excluded.data, updated_at = now();

    -- 3) Feedback: una respuesta por usuario (mismo formato que la encuesta)
    insert into public.feedback (user_id, email, answers)
    values (uid, em, jsonb_build_object(
      'nombre', nom, 'app_version', 'v36',
      'respuestas', jsonb_build_object(
        'recomienda', 3 + floor(random()*3)::int,   -- 3..5 (NPS positivo)
        'facilidad',  3 + floor(random()*3)::int,
        'rutinas',    3 + floor(random()*3)::int,
        'ejercicios', 2 + floor(random()*4)::int,   -- 2..5
        'progreso',   3 + floor(random()*3)::int,
        'frecuencia', freq_arr[1 + floor(random()*4)::int],
        'largo',      largo_arr[1 + floor(random()*3)::int],
        'pago',       pago_arr[1 + floor(random()*4)::int],
        'gusta',      gusta_arr[1 + floor(random()*array_length(gusta_arr,1))::int],
        'cambiar',    cambiar_arr[1 + floor(random()*array_length(cambiar_arr,1))::int],
        'problema',   problema_arr[1 + floor(random()*array_length(problema_arr,1))::int]
      )
    ));
  end loop;
end $$;

-- Verificar
select count(*) as perfiles_test from public.profiles where email like '%@facfit.test';
select count(*) as feedbacks_test from public.feedback where email like '%@facfit.test';

-- ============================================================
-- LIMPIEZA (descomentar y correr para borrar TODO lo de prueba)
-- ============================================================
-- delete from public.feedback where email like '%@facfit.test';
-- delete from public.profiles where email like '%@facfit.test';
-- delete from auth.users    where email like '%@facfit.test';
