import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { SlidersHorizontal, X, RotateCcw, ArrowDownUp } from "lucide-react";
import { listProducts } from "@/lib/products.functions";
import { ProductGrid } from "@/components/product-card";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { CATEGORIES, type Product } from "@/lib/store";
import {
  DEFAULT_CATALOG_FILTERS,
  PRICE_OPTIONS,
  colorOptions,
  filterCatalog,
  priceOptions,
  sizeOptions,
  type CatalogFilters,
  type PriceBand,
  type SortOrder,
} from "@/lib/catalog-filters";

const q = (slug: string) =>
  queryOptions({
    queryKey: ["products", slug],
    queryFn: () => listProducts({ data: { category: slug } }),
  });

export const Route = createFileRoute("/categoria/$slug")({
  loader: ({ context, params }) => {
    const cat = CATEGORIES.find((category) => category.slug === params.slug);
    if (!cat) throw notFound();
    return context.queryClient.ensureQueryData(q(params.slug)).then(() => ({ label: cat.label }));
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: (loaderData?.label ?? "Categoria") + " femininos | Akause" },
      { name: "description", content: "Compre " + (loaderData?.label?.toLowerCase() ?? "calçados") + " na Akause e finalize pelo WhatsApp." },
      { property: "og:title", content: (loaderData?.label ?? "Categoria") + " | Akause" },
      { property: "og:description", content: (loaderData?.label ?? "Calçados") + " com atitude e personalidade." },
    ],
  }),
  component: CategoryPage,
});

type FilterSetter = Dispatch<SetStateAction<CatalogFilters>>;

function CategoryPage() {
  const { slug } = Route.useParams();
  const { label } = Route.useLoaderData();
  const { data } = useSuspenseQuery(q(slug));
  // Remonta o estado quando a pessoa troca de categoria sem desmontar a rota.
  return <Catalog key={slug} products={data} label={label} />;
}

function updateSelected(items: string[], item: string): string[] {
  return items.includes(item) ? items.filter((value) => value !== item) : [...items, item];
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b border-border pb-6 last:border-b-0">
      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function SortSelect({ filters, setFilters }: { filters: CatalogFilters; setFilters: FilterSetter }) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
      <ArrowDownUp className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">Ordenar produtos</span>
      <select
        aria-label="Ordenar produtos"
        value={filters.sort}
        onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as SortOrder }))}
        className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground"
      >
        <option value="new">Mais recentes</option>
        <option value="price_asc">Menor preço</option>
        <option value="price_desc">Maior preço</option>
      </select>
    </label>
  );
}

function FilterControls({
  products,
  filters,
  setFilters,
}: {
  products: Product[];
  filters: CatalogFilters;
  setFilters: FilterSetter;
}) {
  const colors = useMemo(() => colorOptions(products, filters), [products, filters]);
  const sizes = useMemo(() => sizeOptions(products, filters), [products, filters]);
  const prices = useMemo(() => priceOptions(products, filters), [products, filters]);

  return (
    <div className="space-y-6">
      <FilterSection title="Cor">
        <div className="flex flex-wrap gap-2">
          {colors.map(({ key, label, count }) => {
            const active = filters.colors.includes(key);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                disabled={!active && count === 0}
                onClick={() => setFilters((current) => ({ ...current, colors: updateSelected(current.colors, key) }))}
                className={
                  "rounded-full border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 " +
                  (active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary")
                }
              >
                {label} <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        {colors.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma cor cadastrada.</p>}
      </FilterSection>

      <FilterSection title="Preço de venda">
        <div className="space-y-2">
          {prices.map(({ value, label, count }) => (
            <label key={value} className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="radio"
                name="catalog-price"
                checked={filters.price === value}
                disabled={filters.price !== value && count === 0}
                onChange={() => setFilters((current) => ({ ...current, price: value }))}
                className="h-4 w-4 accent-primary disabled:opacity-40"
              />
              <span className="flex-1">{label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
            </label>
          ))}
          {filters.price !== "all" && (
            <button type="button" onClick={() => setFilters((current) => ({ ...current, price: "all" }))} className="text-xs font-bold text-primary underline underline-offset-4">
              Qualquer preço
            </button>
          )}
        </div>
      </FilterSection>

      <FilterSection title="Tamanhos em estoque">
        <p className="text-xs text-muted-foreground">Números entre parênteses representam pares disponíveis.</p>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map(({ size, pairs }) => {
            const active = filters.sizes.includes(size);
            return (
              <button
                type="button"
                key={size}
                aria-pressed={active}
                disabled={!active && pairs === 0}
                onClick={() => setFilters((current) => ({ ...current, sizes: updateSelected(current.sizes, size) }))}
                className={
                  "flex min-h-11 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-35 " +
                  (active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary")
                }
              >
                {size}<span className="text-[10px] font-semibold opacity-70">({pairs})</span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Ofertas">
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
          <span>Apenas em promoção</span>
          <input
            type="checkbox"
            checked={filters.saleOnly}
            onChange={(event) => setFilters((current) => ({ ...current, saleOnly: event.target.checked }))}
            className="h-5 w-5 accent-primary"
          />
        </label>
      </FilterSection>
    </div>
  );
}

function Catalog({ products, label }: { products: Product[]; label: string }) {
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_CATALOG_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const list = useMemo(() => filterCatalog(products, filters), [products, filters]);
  const colors = useMemo(() => colorOptions(products, filters), [products, filters]);
  const activeCount = filters.colors.length + filters.sizes.length +
    (filters.price !== "all" ? 1 : 0) + (filters.saleOnly ? 1 : 0);
  const clear = () => setFilters({ ...DEFAULT_CATALOG_FILTERS });

  const removeColor = (color: string) =>
    setFilters((current) => ({ ...current, colors: current.colors.filter((item) => item !== color) }));
  const removeSize = (size: string) =>
    setFilters((current) => ({ ...current, sizes: current.sizes.filter((item) => item !== size) }));

  const pills: { key: string; label: string; remove: () => void }[] = [
    ...filters.colors.map((color) => ({
      key: "color-" + color,
      label: "Cor: " + (colors.find((option) => option.key === color)?.label ?? color),
      remove: () => removeColor(color),
    })),
    ...filters.sizes.map((size) => ({
      key: "size-" + size,
      label: "Tam. " + size,
      remove: () => removeSize(size),
    })),
    ...(filters.price !== "all" ? [{
      key: "price",
      label: PRICE_OPTIONS.find((option) => option.value === filters.price)?.label ?? "Preço",
      remove: () => setFilters((current) => ({ ...current, price: "all" as PriceBand })),
    }] : []),
    ...(filters.saleOnly ? [{
      key: "sale",
      label: "Em promoção",
      remove: () => setFilters((current) => ({ ...current, saleOnly: false })),
    }] : []),
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 pt-10 md:px-8">
      <div className="border-b border-border pb-7">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-primary">Encontre seu par perfeito</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-primary md:text-7xl">{label}</h1>
        <p aria-live="polite" className="mt-4 text-sm font-semibold text-muted-foreground">
          {list.length} {list.length === 1 ? "modelo disponível" : "modelos disponíveis"}
        </p>

        {pills.length > 0 && (
          <div aria-label="Filtros ativos" className="mt-5 flex flex-wrap items-center gap-2">
            {pills.map((pill) => (
              <button key={pill.key} type="button" onClick={pill.remove} aria-label={"Remover filtro " + pill.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-secondary px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary">
                {pill.label}<X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ))}
            <button type="button" onClick={clear} className="px-2 py-1.5 text-xs font-black text-primary underline underline-offset-4">Limpar tudo</button>
          </div>
        )}
      </div>

      <div className="my-6 flex items-center justify-between gap-3 lg:justify-end">
        <div className="lg:hidden">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <button type="button" className="inline-flex items-center gap-2 rounded-full border border-foreground bg-foreground px-5 py-3 text-xs font-black uppercase tracking-wide text-background">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Filtrar {activeCount > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-foreground">{activeCount}</span>}
              </button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[92dvh]">
              <DrawerHeader className="text-left">
                <DrawerTitle className="editorial-title text-2xl text-primary">Filtrar produtos</DrawerTitle>
                <DrawerDescription>Combine cores, preços, tamanhos e ofertas.</DrawerDescription>
              </DrawerHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
                <div className="mb-6"><SortSelect filters={filters} setFilters={setFilters} /></div>
                <FilterControls products={products} filters={filters} setFilters={setFilters} />
              </div>
              <DrawerFooter className="border-t border-border bg-background">
                <button type="button" onClick={() => setDrawerOpen(false)}
                  className="rounded-full bg-primary px-5 py-3.5 text-sm font-black uppercase tracking-wide text-primary-foreground">
                  Ver {list.length} {list.length === 1 ? "resultado" : "resultados"}
                </button>
                <button type="button" onClick={clear} className="flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase text-primary">
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> Limpar tudo
                </button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
        <div className="hidden lg:block"><SortSelect filters={filters} setFilters={setFilters} /></div>
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground lg:hidden">{list.length} resultados</span>
      </div>

      <div className="flex items-start gap-8">
        <aside aria-label="Filtros do catálogo" className="sticky top-36 hidden max-h-[calc(100dvh-10rem)] w-64 shrink-0 overflow-y-auto pr-2 lg:block">
          <div className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Refinar busca
          </div>
          <FilterControls products={products} filters={filters} setFilters={setFilters} />
          {activeCount > 0 && (
            <button type="button" onClick={clear} className="mt-4 flex items-center gap-2 text-xs font-black uppercase text-primary">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Limpar tudo
            </button>
          )}
        </aside>

        <div className="min-w-0 flex-1">
          {list.length > 0 ? (
            <ProductGrid products={list} />
          ) : (
            <div className="border border-dashed border-border px-5 py-16 text-center">
              <p className="editorial-title text-3xl text-foreground">Nenhum par encontrado.</p>
              <p className="mt-3 text-sm text-muted-foreground">Experimente remover um dos filtros para ver mais opções.</p>
              {activeCount > 0 && (
                <button type="button" onClick={clear} className="mt-6 rounded-full bg-primary px-6 py-3 text-xs font-black uppercase text-primary-foreground">
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
