create type task_status as enum (
  'pending',
  'assigned',
  'in_progress',
  'submitted',
  'revision_requested',
  'accepted'
);