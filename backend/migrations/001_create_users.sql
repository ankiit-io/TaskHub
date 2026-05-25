create table public.users (
  id uuid not null default gen_random_uuid (),
  name text null,
  email text null,
  avatar text null,
  role text null default 'user'::text,
  provider text null,
  created_at timestamp without time zone null default now(),
  avatar_url text null,
  display_name text null,

  constraint users_pkey primary key (id),

  constraint users_email_key unique (email)
) TABLESPACE pg_default;