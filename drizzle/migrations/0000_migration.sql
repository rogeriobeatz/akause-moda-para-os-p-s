CREATE TABLE public.products (
  reference text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  cost_price numeric(10,2) NOT NULL DEFAULT 0,
  on_sale boolean NOT NULL DEFAULT false,
  brand text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '',
  group_code text NOT NULL DEFAULT '',
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  stock jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_stock integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  registered_at date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products" ON public.products FOR SELECT TO anon, authenticated USING (active = true);
CREATE INDEX products_category_idx ON public.products (category);

CREATE TABLE public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  products_count integer,
  message text
);
GRANT ALL ON public.sync_runs TO service_role;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;