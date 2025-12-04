-- Atlantic Canada Business CRM Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

create type business_status as enum (
  'active',
  'inactive', 
  'do_not_contact',
  'bad_data',
  'duplicate'
);

create type business_source as enum (
  'manual',
  'csv_import',
  'api_import',
  'scraper',
  'other'
);

create type interaction_type as enum (
  'call',
  'email',
  'meeting',
  'note',
  'other'
);

create type interaction_direction as enum (
  'inbound',
  'outbound',
  'internal'
);

create type province_code as enum (
  'NS', -- Nova Scotia
  'NB', -- New Brunswick
  'PE', -- Prince Edward Island
  'NL'  -- Newfoundland & Labrador
);

-- ============================================
-- BUSINESSES TABLE
-- ============================================

create table businesses (
  id uuid primary key default uuid_generate_v4(),
  
  -- Core info
  name text not null,
  category text,
  description text,
  
  -- Address
  address_line1 text,
  address_line2 text,
  city text,
  province province_code not null,
  postal_code text,
  
  -- Contact info
  phone_raw text,
  phone_e164 text, -- Normalized phone for deduplication
  email text,
  website text,
  
  -- Location (for mapping)
  latitude double precision,
  longitude double precision,
  
  -- Classification
  naics_code text,
  size_band text check (size_band in ('micro', 'small', 'medium', 'large')),
  
  -- Status & source tracking
  status business_status default 'active',
  source business_source default 'manual',
  source_ref text, -- External URL or ID
  
  -- Denormalized for quick queries
  contact_count integer default 0,
  last_interaction_at timestamptz,
  
  -- Audit
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz -- Soft delete
);

-- Indexes for common queries
create index idx_businesses_province on businesses(province);
create index idx_businesses_status on businesses(status);
create index idx_businesses_phone_e164 on businesses(phone_e164);
create index idx_businesses_city on businesses(city);
create index idx_businesses_created_at on businesses(created_at desc);
create index idx_businesses_deleted_at on businesses(deleted_at) where deleted_at is null;

-- Full-text search
alter table businesses add column search_vector tsvector 
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(city, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'D')
  ) stored;

create index idx_businesses_search on businesses using gin(search_vector);

-- ============================================
-- CONTACTS TABLE
-- ============================================

create table contacts (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  
  -- Person info
  first_name text,
  last_name text,
  position text,
  
  -- Contact info
  email text,
  phone_raw text,
  phone_e164 text,
  
  -- Flags
  is_primary boolean default false,
  
  -- Audit
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_contacts_business on contacts(business_id);
create index idx_contacts_email on contacts(email);

-- ============================================
-- INTERACTIONS TABLE
-- ============================================

create table interactions (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  
  -- Interaction details
  type interaction_type not null,
  direction interaction_direction not null,
  subject text,
  notes text,
  
  -- External reference (e.g., email campaign ID)
  external_ref text,
  
  -- When it happened
  occurred_at timestamptz default now(),
  
  -- Audit
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

create index idx_interactions_business on interactions(business_id);
create index idx_interactions_occurred on interactions(occurred_at desc);

-- ============================================
-- IMPORT JOBS TABLE (for CSV imports)
-- ============================================

create table import_jobs (
  id uuid primary key default uuid_generate_v4(),
  
  -- Job info
  filename text not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  
  -- Results
  total_rows integer default 0,
  imported_count integer default 0,
  skipped_count integer default 0,
  error_count integer default 0,
  error_log text,
  
  -- Timing
  started_at timestamptz,
  finished_at timestamptz,
  
  -- Audit
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ============================================
-- TAGS TABLE (for flexible categorization)
-- ============================================

create table tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  color text default '#6366f1',
  created_at timestamptz default now()
);

create table business_tags (
  business_id uuid references businesses(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (business_id, tag_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table businesses enable row level security;
alter table contacts enable row level security;
alter table interactions enable row level security;
alter table import_jobs enable row level security;
alter table tags enable row level security;
alter table business_tags enable row level security;

-- Simple policies: all authenticated users can see everything (single-tenant)
-- Adjust these if you need multi-tenant later

create policy "Authenticated users can view businesses"
  on businesses for select
  to authenticated
  using (deleted_at is null);

create policy "Authenticated users can insert businesses"
  on businesses for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update businesses"
  on businesses for update
  to authenticated
  using (deleted_at is null);

create policy "Authenticated users can delete businesses"
  on businesses for delete
  to authenticated
  using (true);

-- Contacts
create policy "Authenticated users can view contacts"
  on contacts for select to authenticated using (true);

create policy "Authenticated users can manage contacts"
  on contacts for all to authenticated using (true);

-- Interactions
create policy "Authenticated users can view interactions"
  on interactions for select to authenticated using (true);

create policy "Authenticated users can manage interactions"
  on interactions for all to authenticated using (true);

-- Import jobs
create policy "Authenticated users can view import jobs"
  on import_jobs for select to authenticated using (true);

create policy "Authenticated users can create import jobs"
  on import_jobs for insert to authenticated with check (true);

-- Tags
create policy "Authenticated users can view tags"
  on tags for select to authenticated using (true);

create policy "Authenticated users can manage tags"
  on tags for all to authenticated using (true);

create policy "Authenticated users can manage business_tags"
  on business_tags for all to authenticated using (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger businesses_updated_at
  before update on businesses
  for each row execute function update_updated_at();

create trigger contacts_updated_at
  before update on contacts
  for each row execute function update_updated_at();

-- Update contact_count on businesses
create or replace function update_contact_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update businesses set contact_count = contact_count + 1 where id = new.business_id;
  elsif tg_op = 'DELETE' then
    update businesses set contact_count = contact_count - 1 where id = old.business_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger contacts_count_trigger
  after insert or delete on contacts
  for each row execute function update_contact_count();

-- Update last_interaction_at on businesses
create or replace function update_last_interaction()
returns trigger as $$
begin
  update businesses 
  set last_interaction_at = new.occurred_at 
  where id = new.business_id;
  return new;
end;
$$ language plpgsql;

create trigger interactions_last_trigger
  after insert on interactions
  for each row execute function update_last_interaction();
