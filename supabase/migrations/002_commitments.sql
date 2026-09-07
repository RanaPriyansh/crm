-- Perishable-trade commitments. Fail closed.
-- Status machine: draft → internal_ok → send_hold → confirmed | killed
-- Leaving draft requires human_ok_at. Audit is append-only.

create type commitment_status as enum (
  'draft',
  'internal_ok',
  'send_hold',
  'confirmed',
  'killed'
);

create type commodity_class as enum (
  'chilled_bivalves',
  'live_crustacean',
  'frozen_finfish',
  'live_finfish',
  'chilled_produce',
  'frozen_produce',
  'chilled_dairy'
);

create type volume_unit as enum ('kg', 'mt', 'lb', 'cases');

create type incoterm_code as enum (
  'EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'
);

create type commitment_currency as enum ('CAD', 'USD', 'EUR');

create table commitments (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id),
  commodity_class commodity_class not null,
  volume numeric not null check (volume > 0),
  unit volume_unit not null,
  incoterm incoterm_code not null,
  ship_window_from date not null,
  ship_window_to date not null,
  currency commitment_currency not null,
  status commitment_status not null default 'draft',
  human_ok_at timestamptz,
  human_ok_by text,
  created_by text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint commitments_ship_window_order
    check (ship_window_from <= ship_window_to)
);

create index idx_commitments_business on commitments(business_id);
create index idx_commitments_status on commitments(status);
create index idx_commitments_ship_from on commitments(ship_window_from);

create table commitment_audit (
  id uuid primary key default uuid_generate_v4(),
  commitment_id uuid not null references commitments(id) on delete restrict,
  actor text not null,
  at timestamptz not null default now(),
  from_status commitment_status not null,
  to_status commitment_status not null
);

create index idx_commitment_audit_commitment on commitment_audit(commitment_id, at);

alter table commitments enable row level security;
alter table commitment_audit enable row level security;

create policy "Authenticated users can view commitments"
  on commitments for select to authenticated using (true);

create policy "Authenticated users can insert commitments"
  on commitments for insert to authenticated with check (true);

create policy "Authenticated users can update commitments"
  on commitments for update to authenticated using (true);

create policy "Authenticated users can view commitment audit"
  on commitment_audit for select to authenticated using (true);

create policy "Authenticated users can insert commitment audit"
  on commitment_audit for insert to authenticated with check (true);

-- Append-only: no update/delete policies, plus a trigger.
create or replace function reject_commitment_audit_mutation()
returns trigger as $$
begin
  raise exception 'commitment_audit is append-only';
end;
$$ language plpgsql;

create trigger commitment_audit_no_update
  before update or delete on commitment_audit
  for each row execute function reject_commitment_audit_mutation();

create or replace function enforce_commitment_status_machine()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'commitments must be created as draft';
    end if;
    return new;
  end if;

  if old.status is not distinct from new.status then
    return new;
  end if;

  if old.status = 'draft' and new.status = 'internal_ok' then
    if new.human_ok_at is null then
      raise exception 'leaving draft requires human_ok';
    end if;
    return new;
  end if;

  if old.status = 'internal_ok' and new.status = 'send_hold' then
    return new;
  end if;

  if old.status = 'send_hold' and new.status in ('confirmed', 'killed') then
    return new;
  end if;

  raise exception 'illegal commitment transition % → %', old.status, new.status;
end;
$$ language plpgsql;

create trigger commitments_status_machine
  before insert or update of status, human_ok_at on commitments
  for each row execute function enforce_commitment_status_machine();

create trigger commitments_updated_at
  before update on commitments
  for each row execute function update_updated_at();
