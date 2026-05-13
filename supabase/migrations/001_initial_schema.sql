-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- FAMILY GROUPS
-- ============================================================
create table family_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid not null,
  invite_code text unique not null default upper(substring(md5(random()::text), 1, 8)),
  created_at timestamptz default now()
);

-- ============================================================
-- PROFILES (linked to auth.users)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  family_group_id uuid references family_groups(id) on delete set null,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add FK from family_groups.created_by -> profiles
alter table family_groups
  add constraint family_groups_created_by_fkey
  foreign key (created_by) references profiles(id) on delete cascade;

-- ============================================================
-- CATEGORIES
-- ============================================================
create table categories (
  id uuid primary key default uuid_generate_v4(),
  family_group_id uuid references family_groups(id) on delete cascade,
  name text not null,
  icon text default '💰',
  color text default '#6366f1',
  type text not null check (type in ('fixed', 'variable', 'income', 'savings')),
  is_default boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- PAYMENT METHODS
-- ============================================================
create table payment_methods (
  id uuid primary key default uuid_generate_v4(),
  family_group_id uuid not null references family_groups(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'credit_card', 'debit_card', 'bank_account')),
  bank_name text,
  last_four text,
  color text default '#6366f1',
  billing_day int check (billing_day between 1 and 31),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- MONTHLY BUDGETS
-- ============================================================
create table monthly_budgets (
  id uuid primary key default uuid_generate_v4(),
  family_group_id uuid not null references family_groups(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  variable_budget numeric(12,0) not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (family_group_id, year, month)
);

-- ============================================================
-- BUDGET CATEGORIES (monthly allocation per category)
-- ============================================================
create table budget_categories (
  id uuid primary key default uuid_generate_v4(),
  family_group_id uuid not null references family_groups(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  budget_amount numeric(12,0) not null default 0,
  created_at timestamptz default now(),
  unique (family_group_id, category_id, year, month)
);

-- ============================================================
-- INCOME RECORDS
-- ============================================================
create table income_records (
  id uuid primary key default uuid_generate_v4(),
  family_group_id uuid not null references family_groups(id) on delete cascade,
  member_id uuid not null references profiles(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  amount numeric(12,0) not null,
  type text not null check (type in ('salary', 'side_income', 'other')),
  description text,
  created_at timestamptz default now()
);

-- ============================================================
-- SAVINGS
-- ============================================================
create table savings (
  id uuid primary key default uuid_generate_v4(),
  family_group_id uuid not null references family_groups(id) on delete cascade,
  name text not null,
  amount numeric(12,0) not null default 0,
  year int not null,
  month int not null check (month between 1 and 12),
  category text default 'general' check (category in ('housing', 'emergency', 'investment', 'education', 'general', 'other')),
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- FIXED COSTS
-- ============================================================
create table fixed_costs (
  id uuid primary key default uuid_generate_v4(),
  family_group_id uuid not null references family_groups(id) on delete cascade,
  name text not null,
  amount numeric(12,0) not null,
  category_id uuid references categories(id) on delete set null,
  payment_method_id uuid references payment_methods(id) on delete set null,
  payment_day int check (payment_day between 1 and 31),
  is_active boolean default true,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- EXPENSE RECORDS (variable expenses)
-- ============================================================
create table expense_records (
  id uuid primary key default uuid_generate_v4(),
  family_group_id uuid not null references family_groups(id) on delete cascade,
  member_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  amount numeric(12,0) not null,
  category_id uuid references categories(id) on delete set null,
  payment_method_id uuid references payment_methods(id) on delete set null,
  memo text,
  is_zero_day_candidate boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SPECIAL EVENTS (planned expenses / reserve fund)
-- ============================================================
create table special_events (
  id uuid primary key default uuid_generate_v4(),
  family_group_id uuid not null references family_groups(id) on delete cascade,
  member_id uuid references profiles(id) on delete set null,
  title text not null,
  event_date date not null,
  expected_amount numeric(12,0) not null default 0,
  category text default 'other' check (category in (
    'birthday', 'family_gathering', 'travel', 'hospital',
    'school_event', 'holiday', 'condolence', 'car_insurance',
    'tax', 'tuition', 'other'
  )),
  payment_method_id uuid references payment_methods(id) on delete set null,
  memo text,
  is_recurring boolean default false,
  recurrence_pattern text check (recurrence_pattern in ('yearly', 'monthly', 'quarterly')),
  is_completed boolean default false,
  actual_amount numeric(12,0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_expense_records_family_date on expense_records(family_group_id, date);
create index idx_expense_records_member on expense_records(member_id);
create index idx_fixed_costs_family on fixed_costs(family_group_id);
create index idx_income_records_family_period on income_records(family_group_id, year, month);
create index idx_special_events_family_date on special_events(family_group_id, event_date);
create index idx_monthly_budgets_family_period on monthly_budgets(family_group_id, year, month);
create index idx_profiles_family_group on profiles(family_group_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table family_groups enable row level security;
alter table categories enable row level security;
alter table payment_methods enable row level security;
alter table monthly_budgets enable row level security;
alter table budget_categories enable row level security;
alter table income_records enable row level security;
alter table savings enable row level security;
alter table fixed_costs enable row level security;
alter table expense_records enable row level security;
alter table special_events enable row level security;

-- Helper function: get user's family_group_id
create or replace function get_user_family_group_id()
returns uuid language sql security definer stable as $$
  select family_group_id from profiles where id = auth.uid()
$$;

-- Profiles: user can read/update own profile; family members can see each other
create policy "profiles_select" on profiles for select
  using (family_group_id = get_user_family_group_id() or id = auth.uid());

create policy "profiles_insert" on profiles for insert
  with check (id = auth.uid());

create policy "profiles_update" on profiles for update
  using (id = auth.uid());

-- Family groups
create policy "family_groups_select" on family_groups for select
  using (id = get_user_family_group_id());

create policy "family_groups_insert" on family_groups for insert
  with check (created_by = auth.uid());

create policy "family_groups_update" on family_groups for update
  using (id = get_user_family_group_id() and created_by = auth.uid());

-- Generic family-scoped policy helper (same family = access)
create policy "categories_select" on categories for select
  using (family_group_id = get_user_family_group_id() or is_default = true);

create policy "categories_all" on categories for all
  using (family_group_id = get_user_family_group_id());

create policy "payment_methods_all" on payment_methods for all
  using (family_group_id = get_user_family_group_id());

create policy "monthly_budgets_all" on monthly_budgets for all
  using (family_group_id = get_user_family_group_id());

create policy "budget_categories_all" on budget_categories for all
  using (family_group_id = get_user_family_group_id());

create policy "income_records_all" on income_records for all
  using (family_group_id = get_user_family_group_id());

create policy "savings_all" on savings for all
  using (family_group_id = get_user_family_group_id());

create policy "fixed_costs_all" on fixed_costs for all
  using (family_group_id = get_user_family_group_id());

create policy "expense_records_all" on expense_records for all
  using (family_group_id = get_user_family_group_id());

create policy "special_events_all" on special_events for all
  using (family_group_id = get_user_family_group_id());

-- ============================================================
-- DEFAULT CATEGORIES (global seed)
-- ============================================================
insert into categories (id, family_group_id, name, icon, color, type, is_default, sort_order) values
-- Variable expense categories
(uuid_generate_v4(), null, '식비', '🍚', '#ef4444', 'variable', true, 1),
(uuid_generate_v4(), null, '교통비', '🚌', '#f97316', 'variable', true, 2),
(uuid_generate_v4(), null, '생활용품', '🛒', '#eab308', 'variable', true, 3),
(uuid_generate_v4(), null, '문화생활', '🎬', '#22c55e', 'variable', true, 4),
(uuid_generate_v4(), null, '건강/병원', '🏥', '#06b6d4', 'variable', true, 5),
(uuid_generate_v4(), null, '의류/미용', '👗', '#8b5cf6', 'variable', true, 6),
(uuid_generate_v4(), null, '경조사', '🎁', '#ec4899', 'variable', true, 7),
(uuid_generate_v4(), null, '교육비', '📚', '#6366f1', 'variable', true, 8),
(uuid_generate_v4(), null, '기타', '💸', '#94a3b8', 'variable', true, 99),
-- Fixed expense categories
(uuid_generate_v4(), null, '보험', '🛡️', '#3b82f6', 'fixed', true, 1),
(uuid_generate_v4(), null, '통신비', '📱', '#10b981', 'fixed', true, 2),
(uuid_generate_v4(), null, '대출', '🏦', '#f59e0b', 'fixed', true, 3),
(uuid_generate_v4(), null, '구독', '📺', '#a855f7', 'fixed', true, 4),
(uuid_generate_v4(), null, '관리비', '🏠', '#64748b', 'fixed', true, 5),
(uuid_generate_v4(), null, '저축', '💰', '#059669', 'savings', true, 1);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_monthly_budgets_updated_at before update on monthly_budgets
  for each row execute function set_updated_at();
create trigger trg_fixed_costs_updated_at before update on fixed_costs
  for each row execute function set_updated_at();
create trigger trg_expense_records_updated_at before update on expense_records
  for each row execute function set_updated_at();
create trigger trg_special_events_updated_at before update on special_events
  for each row execute function set_updated_at();
