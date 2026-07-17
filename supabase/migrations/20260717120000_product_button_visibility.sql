-- Controls whether Description and Ingredients tabs are visible on the product page.
alter table public.products
  add column if not exists show_description_tab boolean not null default true,
  add column if not exists show_ingredients_tab boolean not null default true;
