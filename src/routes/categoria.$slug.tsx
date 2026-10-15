import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listProducts } from "@/lib/products.functions";
import { ProductGrid } from "@/components/product-card";
import { CATEGORIES } from "@/lib/store";

const q = (slug: string) =>
  queryOptions({ queryKey: ["products", slug], queryFn: () => listProducts({ data: { category: slug } }) });

export const Route = createFileRoute("/categoria/$slug")({
  loader: ({ context, params }) => {
    const cat = CATEGORIES.find((c) => c.slug === params.slug);
    if (!cat) throw notFound();
    return context.queryClient.ensureQueryData(q(params.slug)).then(() => ({ label: cat.label }));
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.label ?? "Categoria"} femininas | Akause` },
      { name: "description", content: `Compre ${loaderData?.label?.toLowerCase()} femininas na Akause e finalize pelo WhatsApp.` },
      { property: "og:title", content: `${loaderData?.label} | Akause` },
      { property: "og:description", content: `${loaderData?.label} com vibe orgânica e moderna.` },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { label } = Route.useLoaderData();
  const { data } = useSuspenseQuery(q(slug));
  const [size, setSize] = useState("");
  const [sort, setSort] = useState("new");

  const sizes = useMemo(
    () => [...new Set(data.flatMap((p) => p.stock.filter((s) => s.qty > 0).map((s) => s.size)))].sort(),
    [data],
  );
  const list = useMemo(() => {
    let l = size ? data.filter((p) => p.stock.some((s) => s.size === size && s.qty > 0)) : data;
    if (sort === "asc") l = [...l].sort((a, b) => a.cost_price - b.cost_price);
    if (sort === "desc") l = [...l].sort((a, b) => b.cost_price - a.cost_price);
    return l;
  }, [data, size, sort]);

  return (
    <main className="mx-auto max-w-7xl px-5 pt-10">
      <h1 className="font-display text-5xl text-primary">{label}</h1>
      <p className="mt-2 text-muted-foreground">{list.length} modelos disponíveis</p>
      <div className="my-8 flex flex-wrap items-center gap-2">
        <button onClick={() => setSize("")} className={`rounded-full border px-4 py-1.5 text-sm ${!size ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
          Todos
        </button>
        {sizes.map((s) => (
          <button key={s} onClick={() => setSize(s)} className={`rounded-full border px-4 py-1.5 text-sm ${size === s ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}>
            {s}
          </button>
        ))}
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="ml-auto rounded-full border border-border bg-card px-4 py-1.5 text-sm">
          <option value="new">Mais recentes</option>
          <option value="asc">Menor preço</option>
          <option value="desc">Maior preço</option>
        </select>
      </div>
      <ProductGrid products={list} />
    </main>
  );
}
