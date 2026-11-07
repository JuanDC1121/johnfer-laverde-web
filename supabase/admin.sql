-- Panel de administración (johnferlaverde.com/admin/):
-- textos e imágenes editables, contador de visitas y de descargas.
-- Ejecuta este archivo completo en Supabase > SQL Editor. Es re-ejecutable.

-- 1. Administradores ---------------------------------------------------------
-- Solo los usuarios de esta tabla pueden editar y ver las estadísticas.
-- Sin políticas RLS: nadie la lee ni la modifica desde la web.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 2. Contenido editable ------------------------------------------------------
-- Cada fila reemplaza un texto o una imagen marcados en el HTML con
-- data-edit / data-edit-img. Si no hay fila, la página muestra lo original.
create table if not exists public.contenido (
  clave text primary key,
  tipo text not null,
  valor text not null,
  actualizado timestamptz not null default now(),
  constraint contenido_clave_check check (clave ~ '^(johnfer|fieb|fundacion)\.[a-z0-9._-]{2,80}$'),
  constraint contenido_tipo_check check (tipo in ('texto', 'imagen')),
  constraint contenido_valor_check check (
    char_length(valor) <= 5000
    and (tipo = 'texto' or valor ~ '^https://')
  )
);
alter table public.contenido enable row level security;

drop policy if exists "Contenido visible para todos" on public.contenido;
create policy "Contenido visible para todos"
  on public.contenido for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins crean contenido" on public.contenido;
create policy "Admins crean contenido"
  on public.contenido for insert
  to authenticated
  with check (public.es_admin());

drop policy if exists "Admins editan contenido" on public.contenido;
create policy "Admins editan contenido"
  on public.contenido for update
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "Admins borran contenido" on public.contenido;
create policy "Admins borran contenido"
  on public.contenido for delete
  to authenticated
  using (public.es_admin());

-- 3. Contadores --------------------------------------------------------------
-- Un total por día (hora de Colombia). La web no escribe aquí directamente:
-- usa registrar_evento(), que solo acepta páginas y archivos conocidos.
create table if not exists public.contadores (
  tipo text not null,
  recurso text not null,
  dia date not null,
  total integer not null default 0,
  primary key (tipo, recurso, dia),
  constraint contadores_tipo_check check (tipo in ('visita', 'descarga'))
);
alter table public.contadores enable row level security;

drop policy if exists "Admins ven contadores" on public.contadores;
create policy "Admins ven contadores"
  on public.contadores for select
  to authenticated
  using (public.es_admin());

create or replace function public.registrar_evento(p_tipo text, p_recurso text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Para contar una página o un archivo nuevo, agrégalo a esta lista.
  if not (
    (p_tipo = 'visita' and p_recurso in ('johnfer', 'fieb', 'fundacion'))
    or (p_tipo = 'descarga' and p_recurso in ('metodo-eufonio'))
  ) then
    return;
  end if;

  insert into public.contadores (tipo, recurso, dia, total)
  values (p_tipo, p_recurso, (now() at time zone 'America/Bogota')::date, 1)
  on conflict (tipo, recurso, dia)
  do update set total = public.contadores.total + 1;
end;
$$;

revoke all on function public.registrar_evento(text, text) from public;
grant execute on function public.registrar_evento(text, text) to anon, authenticated;

-- 4. Imágenes ----------------------------------------------------------------
-- Bucket público (cualquiera ve las fotos); solo los admins suben o borran.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contenido', 'contenido', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins suben imagenes" on storage.objects;
create policy "Admins suben imagenes"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'contenido' and public.es_admin());

drop policy if exists "Admins borran imagenes" on storage.objects;
create policy "Admins borran imagenes"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'contenido' and public.es_admin());

-- 5. Dar permiso de administrador --------------------------------------------
-- Primero crea el usuario en Authentication > Users > Add user > Create new user
-- (marca "Auto Confirm User"). Luego cambia el correo y ejecuta solo esta parte:
--
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'CORREO_DEL_ADMIN@gmail.com'
-- on conflict do nothing;
