-- SCHEMA V2: tablas completas para flujo de aprobación

-- Órdenes de Producción (recibidas de ventas, revisadas por OT)
create table if not exists ordenes_produccion (
  id                  uuid primary key default gen_random_uuid(),
  numero_op           integer not null unique,
  numero_nv           integer,
  tipo_op             text not null check (tipo_op in ('ARRIENDO','VENTA','MONTAJE','INTERNO')),
  cliente_nombre      text not null,
  direccion_entrega   text,
  vendedor            text,
  modelo              text,
  cantidad            integer default 1,
  distribucion        text,
  fecha_inicio        date,
  fecha_entrega       date,
  contacto_nombre     text,
  contacto_telefono   text,

  -- Estado revisión OT
  estado              text not null default 'PENDIENTE'
                      check (estado in ('PENDIENTE','APROBADA','RECHAZADA','EN_PRODUCCION','COMPLETADA')),
  observaciones_ot    text,
  fecha_revision      timestamptz,
  revisado_por        uuid references auth.users(id),

  -- Checklist aprobación (guardado como JSON)
  checklist           jsonb default '{}',

  -- Documentos adjuntos
  pdf_op_url          text,
  pdf_nv_url          text,

  created_at          timestamptz default now(),
  created_by          uuid references auth.users(id),
  updated_at          timestamptz default now(),
  updated_by          uuid references auth.users(id)
);

-- Series (contenedores/trabajos dentro de una OP)
create table if not exists op_series (
  id                  uuid primary key default gen_random_uuid(),
  op_id               uuid not null references ordenes_produccion(id) on delete cascade,
  serie               text,
  modelo              text,
  descripcion_trabajo text,
  orden_fila          integer default 1
);

-- Adicionales por OP o por serie
create table if not exists op_adicionales (
  id                  uuid primary key default gen_random_uuid(),
  op_id               uuid not null references ordenes_produccion(id) on delete cascade,
  serie_ref           text,
  numero_item         integer,
  cantidad            numeric(8,2) default 1,
  descripcion_corta   text not null,
  descripcion_larga   text
);

-- Formato técnico (secciones 1,3,5,7) — vinculado a fila de programa
create table if not exists formatos_tecnicos (
  id                  uuid primary key default gen_random_uuid(),
  programa_id         uuid not null references programa_produccion(id) on delete cascade,

  -- Sección 1: Información General
  resumen             text,
  planimetria_codigo  text,
  planimetria_url     text,

  -- Sección 3: Estructura
  largo_m             numeric(6,3),
  ancho_m             numeric(6,3),
  alto_m              numeric(6,3),
  vano_puertas        text,
  vano_ventanas       text,
  vano_ac             text,
  obs_estructura      text,

  -- Sección 5: Carpintería
  aislacion_cielo     text,
  aislacion_muros     text,
  aislacion_piso      text,
  revestimiento_muro  text,
  revestimiento_piso  text,
  revestimiento_cielo text,
  pintura_interior    text,
  terminaciones       text,
  obs_carpinteria     text,

  -- Sección 7: Pintura
  pintura_exterior    text,
  grateo              boolean default false,
  anticorrosivo       boolean default false,
  obs_pintura         text,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  updated_by          uuid references auth.users(id)
);

-- Vincular programa_produccion a ordenes_produccion
alter table programa_produccion
  add column if not exists op_id uuid references ordenes_produccion(id),
  add column if not exists ejecuta text,
  add column if not exists avance_pct integer default 0;

-- RLS para nuevas tablas
alter table ordenes_produccion enable row level security;
alter table op_series enable row level security;
alter table op_adicionales enable row level security;
alter table formatos_tecnicos enable row level security;

-- Políticas ordenes_produccion
create policy "op_select" on ordenes_produccion
  for select to authenticated using (true);
create policy "op_insert" on ordenes_produccion
  for insert to authenticated with check (get_my_role() in ('ot','admin'));
create policy "op_update" on ordenes_produccion
  for update to authenticated using (get_my_role() in ('ot','admin'));

-- Políticas op_series
create policy "op_series_select" on op_series
  for select to authenticated using (true);
create policy "op_series_insert" on op_series
  for insert to authenticated with check (get_my_role() in ('ot','admin'));
create policy "op_series_update" on op_series
  for update to authenticated using (get_my_role() in ('ot','admin'));
create policy "op_series_delete" on op_series
  for delete to authenticated using (get_my_role() in ('ot','admin'));

-- Políticas op_adicionales
create policy "op_adicionales_select" on op_adicionales
  for select to authenticated using (true);
create policy "op_adicionales_insert" on op_adicionales
  for insert to authenticated with check (get_my_role() in ('ot','admin'));
create policy "op_adicionales_update" on op_adicionales
  for update to authenticated using (get_my_role() in ('ot','admin'));
create policy "op_adicionales_delete" on op_adicionales
  for delete to authenticated using (get_my_role() in ('ot','admin'));

-- Políticas formatos_tecnicos
create policy "ft_select" on formatos_tecnicos
  for select to authenticated using (true);
create policy "ft_insert" on formatos_tecnicos
  for insert to authenticated with check (get_my_role() in ('ot','admin'));
create policy "ft_update" on formatos_tecnicos
  for update to authenticated using (get_my_role() in ('ot','admin'));

-- Trigger updated_at para nuevas tablas
create or replace trigger trg_op_updated_at
  before update on ordenes_produccion
  for each row execute function update_updated_at();

create or replace trigger trg_ft_updated_at
  before update on formatos_tecnicos
  for each row execute function update_updated_at();
