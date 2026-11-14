-- Housing Finance Planner: Supabase database setup
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- It is safe to run again: it only creates what is missing.
--
-- Logins (email + password) are stored by Supabase Auth in its own secure "auth.users" table.
-- Passwords are hashed by Supabase; this app never stores them itself.

-- 1. Properties (one row per house the user saves)
create table if not exists public.housing_properties (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  property_name text not null default 'Scenario',
  address       text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. Scenarios (the numbers for each saved house)
create table if not exists public.housing_scenarios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  property_id uuid not null references public.housing_properties(id) on delete cascade,
  scenario_name text not null default 'Scenario',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Add every value column (safe if some already exist)
alter table public.housing_scenarios
  add column if not exists home_price                  numeric not null default 0,
  add column if not exists down_payment_pct            numeric not null default 0,
  add column if not exists interest_rate               numeric not null default 0,
  add column if not exists loan_term_years             numeric not null default 30,
  add column if not exists property_tax_annual         numeric not null default 0,
  add column if not exists homeowners_insurance_annual numeric not null default 0,
  add column if not exists hoa_monthly                 numeric not null default 0,
  add column if not exists condo_fee_monthly           numeric not null default 0,
  add column if not exists cdd_annual                  numeric not null default 0,
  add column if not exists special_assessment_annual   numeric not null default 0,
  add column if not exists homestead_enabled           boolean not null default false,
  add column if not exists school_millage              numeric not null default 6.5,
  add column if not exists non_school_millage          numeric not null default 12,
  add column if not exists pmi_rate_annual             numeric not null default 0,
  add column if not exists flood_insurance_annual      numeric not null default 0,
  add column if not exists wind_insurance_annual       numeric not null default 0,
  add column if not exists flood_wind_insurance_annual numeric not null default 0,
  add column if not exists maintenance_pct_annual      numeric not null default 0,
  add column if not exists extra_monthly_principal     numeric not null default 0,
  add column if not exists lump_sum_principal          numeric not null default 0,
  add column if not exists closing_cost_pct            numeric not null default 0,
  add column if not exists seller_lender_credits       numeric not null default 0,
  add column if not exists lender_origination_fee      numeric not null default 0,
  add column if not exists appraisal_fee               numeric not null default 0,
  add column if not exists inspection_fee              numeric not null default 0,
  add column if not exists title_settlement_fee        numeric not null default 0,
  add column if not exists recording_government_fee    numeric not null default 0,
  add column if not exists prepaid_interest            numeric not null default 0,
  add column if not exists initial_escrow              numeric not null default 0,
  add column if not exists estimated_monthly_cost      numeric not null default 0,
  add column if not exists estimated_cash_to_close     numeric not null default 0,
  add column if not exists estimated_total_interest    numeric not null default 0;

create index if not exists housing_properties_user_idx on public.housing_properties(user_id);
create index if not exists housing_scenarios_user_idx  on public.housing_scenarios(user_id, created_at desc);

-- 3. Keep updated_at current
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists housing_properties_updated on public.housing_properties;
create trigger housing_properties_updated before update on public.housing_properties
  for each row execute function public.set_updated_at();

drop trigger if exists housing_scenarios_updated on public.housing_scenarios;
create trigger housing_scenarios_updated before update on public.housing_scenarios
  for each row execute function public.set_updated_at();

-- 4. Security: each signed-in user can only see and change their own houses
alter table public.housing_properties enable row level security;
alter table public.housing_scenarios  enable row level security;

drop policy if exists "own properties" on public.housing_properties;
create policy "own properties" on public.housing_properties
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "own scenarios" on public.housing_scenarios;
create policy "own scenarios" on public.housing_scenarios
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.housing_properties p
                where p.id = property_id and p.user_id = auth.uid())
  );
