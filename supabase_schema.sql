-- ============================================================
-- SCHEMA: Sistema de Registro de Producción — Contenedores Patagonia
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- EXTENSIONES
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLA: programa_produccion
-- Una fila por contenedor/trabajo. Equivale a la hoja "Programa".
-- ============================================================
create table if not exists programa_produccion (
  id              uuid primary key default gen_random_uuid(),

  -- Campos azules (llena OT al registrar)
  op_pv           text not null,          -- ej: 6503, 6596
  nv              text,                   -- Nota de Venta
  tipo            text not null,          -- ARRIENDO, VENTA, MONTAJE, INTERNO
  vendedor        text,
  cliente         text not null,
  modelo          text,                   -- CP2D, CP2S, DRY20, etc.
  serie           text,                   -- serie del contenedor
  descripcion     text,                   -- descripción del trabajo
  requiere_montaje boolean default false,
  fecha_ingreso   date,
  fecha_despacho  date,
  fecha_reprograma date,

  -- Campos verdes (llena Terreno)
  ejecuta         text,                   -- responsable de taller
  fecha_inicio    date,
  fecha_termino   date,
  estado          text default 'PENDIENTE', -- PENDIENTE, EN_PROCESO, DESPACHADO, REALIZADO, SIN_EFECTO, COORDINADO
  avance_pct      integer default 0,
  observacion     text,

  -- Control OF
  genera_of       boolean default false,  -- si esta fila genera OF
  of_id           uuid,                   -- referencia a la OF creada

  -- Auditoría
  created_at      timestamptz default now(),
  created_by      uuid references auth.users(id),
  updated_at      timestamptz default now(),
  updated_by      uuid references auth.users(id)
);

-- ============================================================
-- TABLA: ordenes_fabricacion (OF)
-- Equivale a la hoja "OF".
-- ============================================================
create table if not exists ordenes_fabricacion (
  id              uuid primary key default gen_random_uuid(),
  of_numero       integer generated always as identity,

  -- Referencia al programa
  programa_id     uuid references programa_produccion(id),
  op_pv           text,
  nv              text,
  serie           text,

  -- Datos OF
  fecha_liberacion date default current_date,
  estado_of       text default 'Planificada', -- Planificada, Liberada, Cerrada
  modalidad       text,                 -- Nueva, Antigua
  tipo_trabajo    text,                 -- Productivo, Transformacion Antigua, Pruebas
  tipo_objeto     text,                 -- Contenedor, Escalera, Caballete, Peineta, Base Madera
  descripcion     text,

  -- Estados de documentos
  plano_estado    text,                 -- OK, Pendiente, NA, EN PROCESO
  ot_estado       text,                 -- OK, Pendiente, NA

  -- Acciones y seguimiento
  accion_requerida text,
  status_ejecucion text,                -- EJECUTADA, EN PROCESO
  observacion     text,

  created_at      timestamptz default now(),
  created_by      uuid references auth.users(id),
  updated_at      timestamptz default now(),
  updated_by      uuid references auth.users(id)
);

-- FK inversa: programa -> of
alter table programa_produccion
  add constraint fk_of foreign key (of_id) references ordenes_fabricacion(id);

-- ============================================================
-- TABLA: maestro_responsables
-- Lista de quienes ejecutan trabajos (campo "EJECUTA" del programa)
-- ============================================================
create table if not exists maestro_responsables (
  id      serial primary key,
  nombre  text not null unique
);

-- Datos iniciales desde maestro_personas.csv (tipo RESPONSABLE_TALLER)
insert into maestro_responsables (nombre) values
  ('CHOPPELO'),
  ('EDISON'),
  ('ERICK'),
  ('EXTERNO'),
  ('EXTERNO/FELIX'),
  ('EXTERNO/PATAGONIA'),
  ('FELIPE/EDISON'),
  ('FELIX'),
  ('FERNANDO'),
  ('LUIS QUEZADA'),
  ('PATAGONIA'),
  ('QUEZADA'),
  ('QUEZADA/ROBERTO'),
  ('QUEZADA/SEBASTIAN'),
  ('ROBERTO'),
  ('SEBASTIAN'),
  ('STOCK'),
  ('STOCK/PATAGONIA'),
  ('VIAK')
on conflict (nombre) do nothing;

-- ============================================================
-- TABLA: maestro_vendedores
-- ============================================================
create table if not exists maestro_vendedores (
  id      serial primary key,
  nombre  text not null unique
);

insert into maestro_vendedores (nombre) values
  ('ANDREA'),
  ('BREZZY'),
  ('CAROLINA'),
  ('ENILIAM'),
  ('HECTOR'),
  ('JAVIERA R'),
  ('JOEL'),
  ('JORGE'),
  ('LUIS S'),
  ('MONICA'),
  ('NICOLAS'),
  ('NICOLE'),
  ('ROBERTO'),
  ('RODOLFO'),
  ('ROMINA'),
  ('SULEIKA'),
  ('THANIA')
on conflict (nombre) do nothing;

-- ============================================================
-- TABLA: user_roles
-- Asigna roles a usuarios de Supabase Auth
-- ============================================================
create table if not exists user_roles (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role    text not null check (role in ('ot', 'terreno', 'admin')),
  unique(user_id)
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table programa_produccion enable row level security;
alter table ordenes_fabricacion enable row level security;
alter table maestro_responsables enable row level security;
alter table maestro_vendedores enable row level security;
alter table user_roles enable row level security;

-- Helper function: obtiene el rol del usuario actual
create or replace function get_my_role()
returns text as $$
  select role from user_roles where user_id = auth.uid();
$$ language sql security definer stable;

-- programa_produccion: todos los roles autenticados pueden leer
create policy "programa_select" on programa_produccion
  for select to authenticated using (true);

-- programa_produccion: OT y admin pueden insertar
create policy "programa_insert_ot" on programa_produccion
  for insert to authenticated
  with check (get_my_role() in ('ot', 'admin'));

-- programa_produccion: OT actualiza campos azules, terreno actualiza campos verdes
-- (La lógica de qué campos puede tocar cada rol se maneja en el frontend + una policy permisiva)
create policy "programa_update" on programa_produccion
  for update to authenticated using (true);

-- ordenes_fabricacion: todos leen
create policy "of_select" on ordenes_fabricacion
  for select to authenticated using (true);

-- ordenes_fabricacion: OT y admin insertan/actualizan
create policy "of_insert" on ordenes_fabricacion
  for insert to authenticated
  with check (get_my_role() in ('ot', 'admin'));

create policy "of_update" on ordenes_fabricacion
  for update to authenticated using (get_my_role() in ('ot', 'admin'));

-- maestros: todos leen
create policy "responsables_select" on maestro_responsables
  for select to authenticated using (true);

create policy "vendedores_select" on maestro_vendedores
  for select to authenticated using (true);

-- user_roles: solo admin puede gestionar, cada usuario puede ver el suyo
create policy "roles_select_own" on user_roles
  for select to authenticated using (user_id = auth.uid());

-- ============================================================
-- TRIGGER: actualiza updated_at automáticamente
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$ language plpgsql;

create trigger trg_programa_updated_at
  before update on programa_produccion
  for each row execute function update_updated_at();

create trigger trg_of_updated_at
  before update on ordenes_fabricacion
  for each row execute function update_updated_at();

-- ============================================================
-- VIEW: dashboard_resumen
-- ============================================================
create or replace view dashboard_resumen as
select
  count(*) filter (where estado = 'PENDIENTE') as pendientes,
  count(*) filter (where estado = 'EN_PROCESO') as en_proceso,
  count(*) filter (where estado in ('DESPACHADO','REALIZADO') and fecha_despacho = current_date) as despachos_hoy,
  count(*) filter (where genera_of = true and of_id is null) as pendientes_of
from programa_produccion;
