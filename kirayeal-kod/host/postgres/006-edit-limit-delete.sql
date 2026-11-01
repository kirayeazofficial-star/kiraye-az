alter table public.listings add column if not exists last_edited_at timestamptz;
alter table public.chat_threads drop constraint if exists chat_threads_listing_id_fkey;
alter table public.chat_threads add constraint chat_threads_listing_id_fkey foreign key (listing_id) references public.listings(id) on delete cascade;
alter table public.listing_reports drop constraint if exists listing_reports_listing_id_fkey;
alter table public.listing_reports add constraint listing_reports_listing_id_fkey foreign key (listing_id) references public.listings(id) on delete cascade;
