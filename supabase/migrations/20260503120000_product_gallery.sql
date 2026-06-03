-- Add a gallery of additional images for the product detail page.
-- The existing `image_url` column stays as the primary card image.

alter table public.products
  add column if not exists gallery_image_urls text[] not null default '{}';
