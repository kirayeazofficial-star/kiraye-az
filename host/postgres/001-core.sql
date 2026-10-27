-- Host-only Kirayeal foundation for cPanel PostgreSQL.
-- Apply only to the new empty hosting database after a verified backup.
-- This script does not read, modify, or delete the current Supabase project.

begin;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key,
  email text not null,
  password_hash text,
  email_confirmed_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_length check (char_length(email) between 3 and 254)
);
create unique index if not exists users_email_unique on auth.users (lower(email));

create table if not exists auth.oauth_identities (
  provider text not null,
  provider_user_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (provider, provider_user_id),
  unique (user_id, provider),
  constraint oauth_provider_length check (char_length(provider) between 1 and 32)
);

create table if not exists auth.verification_codes (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  purpose text not null check (purpose in ('signup','recovery','email_change')),
  code_hash bytea not null,
  attempts smallint not null default 0 check (attempts between 0 and 10),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint verification_hash_length check (octet_length(code_hash)=32)
);
create index if not exists verification_email_purpose_idx
  on auth.verification_codes (lower(email), purpose, created_at desc);

create table if not exists auth.sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint session_hash_length check (octet_length(token_hash)=32)
);
create index if not exists sessions_user_idx on auth.sessions (user_id, expires_at desc);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  profile_no bigint generated always as identity unique,
  display_name varchar(100) not null default '',
  phone varchar(32) not null default '',
  role text not null default 'user' check (role in ('user','admin')),
  phone_change_count smallint not null default 0 check (phone_change_count between 0 and 3),
  email_change_count smallint not null default 0 check (email_change_count between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_contact_changes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone_changes integer not null default 0 check (phone_changes between 0 and 3),
  email_changes integer not null default 0 check (email_changes between 0 and 3)
);

create table if not exists public.profile_change_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts>=0)
);

create table if not exists public.listings (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete restrict,
  title varchar(140) not null,
  description text not null,
  category varchar(64) not null,
  city varchar(80) not null,
  district varchar(100),
  price numeric(12,2) not null check (price>=0),
  rental_period text not null check (rental_period in ('daily','weekly','monthly')),
  deposit numeric(12,2) check (deposit is null or deposit>=0),
  min_days smallint not null default 1 check (min_days>0),
  contact varchar(32) not null,
  status text not null default 'pending' check (status in ('draft','pending','published','rejected','archived','expired')),
  attributes jsonb,
  images text[] not null default '{}',
  rooms smallint,
  area_m2 integer,
  rejection_reason varchar(500),
  first_published_at timestamptz,
  expires_at timestamptz,
  available_from date,
  available_until date,
  listing_no bigint generated always as identity (start with 10000001) unique,
  review_kind text not null default 'new' check (review_kind in ('new','edited')),
  promotion_kind text check (promotion_kind in ('vip','premium')),
  promotion_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists listings_public_idx on public.listings (status, created_at desc);
create index if not exists listings_owner_idx on public.listings (owner_id, status, created_at desc);

create table if not exists public.listing_images (
  id uuid primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete restrict,
  storage_path text not null unique,
  public_path text not null,
  sha256 char(64) not null check (sha256 ~ '^[0-9a-f]{64}$'),
  sort_order smallint not null default 0 check (sort_order>=0),
  created_at timestamptz not null default now()
);
create index if not exists listing_images_order_idx on public.listing_images (listing_id, sort_order);

create table if not exists public.chat_threads (
  id uuid primary key,
  listing_id uuid not null references public.listings(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  listing_title text not null,
  listing_image text,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (listing_id, buyer_id, seller_id),
  constraint chat_no_self check (buyer_id<>seller_id)
);
create index if not exists chat_buyer_idx on public.chat_threads (buyer_id, last_message_at desc);
create index if not exists chat_seller_idx on public.chat_threads (seller_id, last_message_at desc);

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body varchar(3000) not null check (char_length(btrim(body))>0),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_page_idx on public.chat_messages (thread_id, id desc);

create table if not exists public.chat_reads (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_message_id bigint not null default 0 check (last_message_id>=0),
  updated_at timestamptz not null default now(),
  primary key (thread_id,user_id)
);

create table if not exists public.chat_reports (
  id bigint generated always as identity (start with 40000001) primary key,
  thread_id uuid not null references public.chat_threads(id) on delete restrict,
  message_id bigint references public.chat_messages(id) on delete restrict,
  reporter_id uuid not null references auth.users(id) on delete restrict,
  reported_id uuid not null references auth.users(id) on delete restrict,
  reason varchar(1000) not null,
  status text not null default 'open' check (status in ('open','resolved')),
  resolved_by uuid references auth.users(id) on delete restrict,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  constraint chat_report_no_self check (reporter_id<>reported_id)
);
create unique index if not exists chat_reports_one_open
  on public.chat_reports(thread_id,reporter_id) where status='open';

create table if not exists public.chat_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id,blocked_id),
  constraint chat_block_no_self check (blocker_id<>blocked_id)
);

create table if not exists public.listing_reports (
  id uuid primary key,
  report_no bigint generated always as identity (start with 20000001) unique,
  listing_id uuid not null references public.listings(id) on delete restrict,
  reporter_id uuid not null references auth.users(id) on delete restrict,
  reason varchar(500) not null,
  message varchar(1000) not null,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete restrict,
  unique(listing_id,reporter_id)
);
create index if not exists listing_reports_status_idx on public.listing_reports (status,created_at desc);

create table if not exists public.staff_members (
  user_id uuid primary key references auth.users(id) on delete restrict,
  staff_role text not null check (staff_role in ('moderator','leader')),
  assigned_by uuid references auth.users(id) on delete restrict,
  assigned_at timestamptz not null default now()
);

create table if not exists public.staff_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete restrict,
  target_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_events (
  id bigint generated always as identity primary key,
  listing_id uuid not null,
  owner_id uuid not null,
  actor_id uuid,
  actor_kind text not null check (actor_kind in ('admin','owner','system')),
  action text not null,
  old_status text,
  new_status text,
  changed_fields text[] not null default '{}',
  before_values jsonb,
  after_values jsonb,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists moderation_events_listing_idx on public.moderation_events (listing_id,id desc);

create table if not exists public.listing_views (
  listing_id uuid not null references public.listings(id) on delete cascade,
  visitor_hash text not null check (visitor_hash ~ '^[0-9a-f]{64}$'),
  view_day date not null default (now() at time zone 'UTC')::date,
  primary key (listing_id,view_day,visitor_hash)
);

create table if not exists public.listing_category_limits (
  category text primary key,
  active_limit integer not null check (active_limit>0),
  period_limit integer not null check (period_limit>0)
);

create table if not exists public.listing_cycle_usage (
  listing_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  started_at timestamptz not null,
  primary key(listing_id,started_at)
);

create table if not exists public.listing_approval_usage (
  listing_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  first_approved_at timestamptz not null,
  primary key(listing_id,category)
);

create table if not exists public.wallet_entries (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete restrict,
  amount numeric(12,2) not null check(amount<>0),
  currency text not null default 'AZN' check(currency='AZN'),
  kind text not null check(kind in ('topup','promotion','refund')),
  provider_reference text not null unique,
  memo text,
  created_at timestamptz not null default now(),
  check((kind in ('topup','refund') and amount>0) or (kind='promotion' and amount<0))
);

commit;
