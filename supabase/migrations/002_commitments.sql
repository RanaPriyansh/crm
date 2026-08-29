-- Perishable-trade commitment hub
-- Human-gated trade commitments + append-only status audit log.
-- Run this in the Supabase SQL Editor after 001_initial_schema.sql.

create type commitment_status as enum (
  'draft',
  'internal_ok',
  'send_hold',
  'confirmed',
  'killed'
);

create type commodity_class as enum (
  'fresh_finfish',
  'frozen_finfish',
  'live_shellfish',
  'frozen_shellfish',
  'fresh_produce',
  'dairy',
  'poultry',
  'red_meat'
);

create table commitments (
  id uuid primary key default uuid_generate_v4(),

  -- Fail closed: a commitment cannot exist without a counterparty business.
  business_id uuid not null references businesses(id) on delete restrict,
  counterparty_name text,

  commodity_class commodity_class not null,
  volume numeric not null check (volume > 0),
  unit text not null check (unit in ('kg', 'lb', 'tonne', 'case', 'pallet')),
  incoterm text not null check (incoterm in ('EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP')),

  ship_window_from date not null,
  ship_window_to date not null,
  check (ship_window_from <= ship_window_to),

  currency text not null check (currency in ('CAD', 'USD', 'EUR', 'GBP', 'JPY')),

  status commitment_status not null default 'draft',
  -- Human-in-the-loop attestation; must be true to leave draft.
  human_ok boolean not null default false,
  notes text,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_commitments_business on commitments(business_id);
create index idx_commitments_status on commitments(status);
create index idx_commitments_created_at on commitments(created_at desc);

-- Append-only audit: one immutable row per status change (who/when/from/to).
create table commitment_audit (
  id uuid primary key default uuid_generate_v4(),
  commitment_id uuid not null references commitments(id) on delete cascade,
  actor text not null,
  from_status commitment_status,
  to_status commitment_status not null,
  human_ok boolean not null default false,
  note text,
  at timestamptz not null default now()
);

create index idx_commitment_audit_commitment on commitment_audit(commitment_id, at);

alter table commitments enable row level security;
alter table commitment_audit enable row level security;

create policy "Authenticated users can view commitments"
  on commitments for select to authenticated using (true);

create policy "Authenticated users can manage commitments"
  on commitments for all to authenticated using (true) with check (true);

create policy "Authenticated users can view commitment audit"
  on commitment_audit for select to authenticated using (true);

-- Audit is append-only: allow insert, but never update or delete.
create policy "Authenticated users can append commitment audit"
  on commitment_audit for insert to authenticated with check (true);

create trigger commitments_updated_at
  before update on commitments
  for each row execute function update_updated_at();

-- Enforce append-only at the DB level: block edits/removals of audit rows.
create or replace function reject_commitment_audit_mutation()
returns trigger as $$
begin
  raise exception 'commitment_audit is append-only';
end;
$$ language plpgsql;

create trigger commitment_audit_no_update
  before update or delete on commitment_audit
  for each row execute function reject_commitment_audit_mutation();
