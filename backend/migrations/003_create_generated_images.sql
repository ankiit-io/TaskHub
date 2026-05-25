create table public.generated_images (
  id uuid not null default gen_random_uuid (),

  task_id uuid null,

  image_url text null,

  image_type text null,

  prompt_used text null,

  angle text null,

  is_final boolean null default false,

  created_at timestamp without time zone null default now(),

  constraint generated_images_pkey primary key (id),

  constraint generated_images_task_id_fkey
    foreign KEY (task_id)
    references tasks (id)
    on delete cascade
) TABLESPACE pg_default;