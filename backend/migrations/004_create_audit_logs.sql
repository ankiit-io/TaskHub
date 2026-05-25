create table public.audit_logs (
  id uuid not null default gen_random_uuid (),

  action text null,

  user_id uuid null,

  table_name text null,

  record_id uuid null,

  old_data jsonb null,

  new_data jsonb null,

  created_at timestamp without time zone null default now(),

  constraint audit_logs_pkey primary key (id),

  constraint audit_logs_user_id_fkey
    foreign KEY (user_id)
    references users (id)
) TABLESPACE pg_default;