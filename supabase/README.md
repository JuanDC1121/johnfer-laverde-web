# Supabase para FIEB

## Base de datos (ya configurada ✅)

1. Crea un proyecto en Supabase.
2. Abre `SQL Editor` y ejecuta `schema.sql` (re-ejecutable sin peligro).
3. Copia `Project URL` y la llave `anon public` / `publishable` desde `Project Settings > API Keys`.
4. Pega esos valores en `v2/supabase-config.js`.
5. Abre `v2/fieb.html` desde un servidor web y prueba el formulario.

La tabla se llama `fieb_inscripciones`. La política RLS permite insertar desde la web con la clave pública `anon` **solo si el usuario marcó la autorización de datos** (`acepta_datos = true`, Ley 1581), y bloquea la lectura pública para proteger los datos personales. Los datos solo se ven desde el panel de Supabase (Table Editor).

## Correo automático de confirmación (pendiente de activar)

Cuando alguien se inscribe, se le envía un correo de bienvenida automáticamente. El código está en `functions/confirmacion-inscripcion/index.ts`. Para activarlo:

### 1. Cuenta de Brevo (gratis, 300 correos/día)
1. Regístrate en https://www.brevo.com
2. Ve a **Settings → Senders & IP → Senders** y verifica tu correo remitente (puede ser tu Gmail).
3. Ve a **Settings → API Keys → Generate a new API key** y cópiala (empieza por `xkeysib-...`).

### 2. Crear la Edge Function en Supabase
1. En el panel de Supabase: **Edge Functions → Deploy a new function → Via Editor**.
2. Nombre: `confirmacion-inscripcion`.
3. Pega el contenido completo de `functions/confirmacion-inscripcion/index.ts` y despliega.
4. En **Edge Functions → Secrets** agrega:
   - `BREVO_API_KEY` = tu API key de Brevo
   - `SENDER_EMAIL` = el correo verificado en Brevo
   - `SENDER_NAME` = `FIEB - Festival Internacional de Eufonios y Bombardinos`
   - `FIEB_WEBHOOK_SECRET` = una cadena secreta inventada por ti (ej. 30 caracteres aleatorios)

### 3. Conectar el webhook (dispara la función en cada inscripción)
1. En el panel: **Database → Webhooks → Create a new hook**.
2. Nombre: `correo-confirmacion-fieb` · Tabla: `fieb_inscripciones` · Evento: **Insert**.
3. Tipo: **Supabase Edge Function** → elige `confirmacion-inscripcion`.
4. En **HTTP Headers** agrega:
   - `x-fieb-secret` = el mismo valor de `FIEB_WEBHOOK_SECRET`
5. Guarda. Desde ese momento, cada inscripción con consentimiento dispara el correo.

### 4. Probar
Llena el formulario de la página con tu propio correo. Debe llegarte el mensaje de bienvenida en menos de un minuto. Revisa **Edge Functions → Logs** si algo falla.

Notas:
- El correo solo se envía si la persona marcó la autorización de datos (habeas data).
- Brevo gratis: 300 correos/día — de sobra para las inscripciones del festival.
- Para campañas masivas (anunciar la próxima edición), exporta los correos desde Table Editor a Brevo y envía desde allá.
