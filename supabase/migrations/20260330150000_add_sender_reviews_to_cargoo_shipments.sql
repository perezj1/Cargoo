alter table public.cargoo_shipments
  add column if not exists sender_review_rating integer check (sender_review_rating between 1 and 5),
  add column if not exists sender_review_comment text,
  add column if not exists sender_reviewed_at timestamptz;
