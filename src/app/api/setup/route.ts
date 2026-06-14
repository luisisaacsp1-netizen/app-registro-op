import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// One-time setup endpoint — DELETE this file after running
const SETUP_TOKEN = 'patagonia-setup-2026'

const SQL = `
create extension if not exists "pgcrypto";

create table if not exists programa_produccion (
  id uuid primary key default gen_random_uuid(),
  op_pv text not null,
  nv text,
  tipo text not null,
  vendedor text,
  cliente text not null,
  modelo text,
  serie text,
  descripcion text,
  requiere_montaje boolean default false,
  fecha_ingreso date,
  fecha_despacho date,
  fecha_reprograma date,
  ejecuta text,
  fecha_inicio date,
  fecha_termino date,
  estado text default 'PENDIENTE',
  avance_pct integer default 0,
  observacion text,
  genera_of boolean default false,
  of_id uuid,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists ordenes_fabricacion (
  id uuid primary key default gen_random_uuid(),
  of_numero integer generated always as identity,
  programa_id uuid references programa_produccion(id),
  op_pv text,
  nv text,
  serie text,
  fecha_liberacion date default current_date,
  estado_of text default 'Planificada',
  modalidad text,
  tipo_trabajo text,
  tipo_objeto text,
  descripcion text,
  plano_estado text,
  ot_estado text,
  accion_requerida text,
  status_ejecucion text,
  observacion text,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists maestro_responsables (
  id serial primary key,
  nombre text not null unique
);

insert into maestro_responsables (nombre) values
  ('CHOPPELO'),('EDISON'),('ERICK'),('EXTERNO'),('EXTERNO/FELIX'),
  ('EXTERNO/PATAGONIA'),('FELIPE/EDISON'),('FELIX'),('FERNANDO'),
  ('LUIS QUEZADA'),('PATAGONIA'),('QUEZADA'),('QUEZADA/ROBERTO'),
  ('QUEZADA/SEBASTIAN'),('ROBERTO'),('SEBASTIAN'),('STOCK'),
  ('STOCK/PATAGONIA'),('VIAK')
on conflict (nombre) do nothing;

create table if not exists maestro_vendedores (
  id serial primary key,
  nombre text not null unique
);

insert into maestro_vendedores (nombre) values
  ('ANDREA'),('BREZZY'),('CAROLINA'),('ENILIAM'),('HECTOR'),
  ('JAVIERA R'),('JOEL'),('JORGE'),('LUIS S'),('MONICA'),
  ('NICOLAS'),('NICOLE'),('ROBERTO'),('RODOLFO'),('ROMINA'),
  ('SULEIKA'),('THANIA')
on conflict (nombre) do nothing;

create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('ot', 'terreno', 'admin')),
  unique(user_id)
);

alter table programa_produccion enable row level security;
alter table ordenes_fabricacion enable row level security;
alter table maestro_responsables enable row level security;
alter table maestro_vendedores enable row level security;
alter table user_roles enable row level security;

create or replace function get_my_role()
returns text as $$
  select role from user_roles where user_id = auth.uid();
$$ language sql security definer stable;

create policy if not exists "programa_select" on programa_produccion for select to authenticated using (true);
create policy if not exists "programa_insert_ot" on programa_produccion for insert to authenticated with check (get_my_role() in ('ot', 'admin'));
create policy if not exists "programa_update" on programa_produccion for update to authenticated using (true);
create policy if not exists "of_select" on ordenes_fabricacion for select to authenticated using (true);
create policy if not exists "of_insert" on ordenes_fabricacion for insert to authenticated with check (get_my_role() in ('ot', 'admin'));
create policy if not exists "of_update" on ordenes_fabricacion for update to authenticated using (get_my_role() in ('ot', 'admin'));
create policy if not exists "responsables_select" on maestro_responsables for select to authenticated using (true);
create policy if not exists "vendedores_select" on maestro_vendedores for select to authenticated using (true);
create policy if not exists "roles_select_own" on user_roles for select to authenticated using (user_id = auth.uid());

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_programa_updated_at before update on programa_produccion for each row execute function update_updated_at();
create or replace trigger trg_of_updated_at before update on ordenes_fabricacion for each row execute function update_updated_at();
`

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (token !== SETUP_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const statements = SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('--'))

  const results: string[] = []
  let errors = 0

  for (const stmt of statements) {
    const { error } = await supabase.rpc('exec_sql', { sql: stmt }).single()
    if (error && !error.message.includes('already exists') && !error.message.includes('duplicate')) {
      // Try direct query via from()
      results.push(`WARN: ${stmt.slice(0, 60)}... → ${error.message.slice(0, 80)}`)
      errors++
    } else {
      results.push(`OK: ${stmt.slice(0, 60)}...`)
    }
  }

  return NextResponse.json({ success: true, errors, results })
}
