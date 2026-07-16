# Supabase para FIEB

1. Crea un proyecto en Supabase.
2. Abre `SQL Editor` y ejecuta `schema.sql`.
3. Copia `Project URL` y `anon public key` desde `Project Settings > API`.
4. Pega esos valores en `v2/supabase-config.js`.
5. Abre `v2/fieb.html` desde un servidor web y prueba el formulario.

La tabla se llama `fieb_inscripciones`. La politica RLS permite insertar desde la web con la clave publica `anon`, pero bloquea la lectura publica para proteger los datos personales.
