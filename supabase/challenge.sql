-- $500 → $5,000 Challenge (breakaway.info/challenge) — Breakaway Academy.
-- Run once in the Supabase SQL Editor for the Academy project. Safe to re-run.

-- Free opt-in sign-ups from /challenge/join.
create table if not exists challenge_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null,
  terms_ack boolean not null default true,
  status text not null default 'new' check (status in ('new', 'contacted', 'in_telegram', 'trading', 'inactive')),
  notes text not null default '',
  source text not null default 'challenge',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists challenge_members_created_at_idx on challenge_members (created_at desc);

-- Who may open the backoffice at breakaway.info/backoffice. Emails must
-- match a Breakaway Academy login (same accounts as the student dashboard).
create table if not exists challenge_admins (
  email text primary key,
  created_at timestamptz not null default now()
);
insert into challenge_admins (email) values
  ('marvin.sambo@gmail.com'),
  ('info@visamclub.com')
on conflict do nothing;

-- Manually updated challenge account progress, shown in the backoffice.
create table if not exists challenge_progress (
  id uuid primary key default gen_random_uuid(),
  balance numeric(12,2) not null,
  note text not null default '',
  recorded_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists challenge_progress_recorded_on_idx on challenge_progress (recorded_on desc);

-- Server-only: RLS on with no policies, so only the service role (the
-- /api functions) can read or write. Students' dashboard logins see nothing.
alter table challenge_members enable row level security;
alter table challenge_admins enable row level security;
alter table challenge_progress enable row level security;
