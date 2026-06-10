create table if not exists public.listas_producao (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  operador_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  conteudo text not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'em_producao', 'concluida', 'cancelada')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

alter table public.listas_producao enable row level security;

drop policy if exists "listas_select_admin_or_operador" on public.listas_producao;
create policy "listas_select_admin_or_operador"
on public.listas_producao
for select
to authenticated
using (
  public.is_admin()
  or operador_id = auth.uid()
);

drop policy if exists "listas_insert_admin" on public.listas_producao;
create policy "listas_insert_admin"
on public.listas_producao
for insert
to authenticated
with check (
  public.is_admin()
  and admin_id = auth.uid()
);

drop policy if exists "listas_update_admin_or_operador" on public.listas_producao;
create policy "listas_update_admin_or_operador"
on public.listas_producao
for update
to authenticated
using (
  public.is_admin()
  or operador_id = auth.uid()
)
with check (
  public.is_admin()
  or operador_id = auth.uid()
);

drop policy if exists "listas_delete_admin" on public.listas_producao;
create policy "listas_delete_admin"
on public.listas_producao
for delete
to authenticated
using (public.is_admin());
