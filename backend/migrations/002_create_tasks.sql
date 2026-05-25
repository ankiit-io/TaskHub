create table public.tasks (
  id uuid not null default gen_random_uuid (),

  title text not null,

  description text null,

  status public.task_status null default 'pending'::task_status,

  assigned_to uuid null,

  created_by uuid null,

  product_image_url text null,

  created_at timestamp without time zone null default now(),

  updated_at timestamp without time zone null default now(),

  feedback_note text null,

  constraint tasks_pkey primary key (id),

  constraint tasks_assigned_to_fkey
    foreign KEY (assigned_to)
    references users (id),

  constraint tasks_created_by_fkey
    foreign KEY (created_by)
    references users (id)
) TABLESPACE pg_default;