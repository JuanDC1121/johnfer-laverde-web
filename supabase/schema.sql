-- Esquema para guardar inscripciones del formulario FIEB en Supabase.
-- Ejecuta este archivo en Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.fieb_inscripciones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  edad integer check (edad is null or edad between 6 and 99),
  correo text not null,
  telefono text,
  pais_ciudad text,
  instrumento text not null,
  nivel text,
  institucion text,
  mensaje text,
  origen text not null default 'web-fieb',
  estado text not null default 'nueva',
  acepta_datos boolean not null default false,
  user_agent text,
  constraint fieb_inscripciones_correo_check
    check (correo ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  constraint fieb_inscripciones_instrumento_check
    check (instrumento in ('Eufonio', 'Bombardino', 'Tuba', 'Otro')),
  constraint fieb_inscripciones_nivel_check
    check (nivel is null or nivel in ('Iniciacion', 'Iniciación', 'Intermedio', 'Avanzado', 'Profesional'))
);

-- Migración: si la tabla ya existía sin la columna de consentimiento (Ley 1581).
alter table public.fieb_inscripciones
  add column if not exists acepta_datos boolean not null default false;

create index if not exists fieb_inscripciones_created_at_idx
  on public.fieb_inscripciones (created_at desc);

create index if not exists fieb_inscripciones_correo_idx
  on public.fieb_inscripciones (correo);

alter table public.fieb_inscripciones enable row level security;

drop policy if exists "Permitir insertar inscripciones publicas" on public.fieb_inscripciones;
create policy "Permitir insertar inscripciones publicas"
  on public.fieb_inscripciones
  for insert
  to anon
  with check (
    nombre is not null
    and correo is not null
    and instrumento is not null
    and acepta_datos is true
  );

drop policy if exists "Bloquear lectura publica de inscripciones" on public.fieb_inscripciones;
create policy "Bloquear lectura publica de inscripciones"
  on public.fieb_inscripciones
  for select
  to anon
  using (false);

-- Para ver datos, entra al panel de Supabase con tu usuario owner/service role.
-- No agregues politicas SELECT para anon porque expondria datos personales.
