import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Search } from "lucide-react";
import { FilterableCatalog } from "@/components/filterable-catalog";
import { searchProducts } from "@/lib/products.functions";
import { sanitizeSearchInput } from "@/lib/search";

const searchOptions = (term: string) =>
  queryOptions({
    queryKey: ["products", "search", term],
    queryFn: () => searchProducts({ data: { query: term } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/busca")({
  validateSearch: (search): { q: string } => ({
    q: typeof search.q === "string" ? sanitizeSearchInput(search.q) : "",
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(searchOptions(deps.q));
    return { q: deps.q };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.q ? "Busca por " + loaderData.q + " | Akause" : "Buscar calçados | Akause" },
      { name: "description", content: "Encontre calçados por nome, modelo, cor, descrição ou referência na Akause." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { data: products } = useSuspenseQuery(searchOptions(q));

  if (!q) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-7xl px-5 py-16 text-center md:px-8">
        <Search className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
        <h1 className="font-fraunces mt-5 text-4xl font-bold text-primary md:text-5xl">O que vamos encontrar hoje?</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Use a lupa no topo para procurar um modelo, cor, estilo ou código de referência.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to="/busca" search={{ q: "scarpin" }} className="rounded-full border border-border bg-card px-5 py-3 text-sm font-bold text-primary hover:border-primary">
            Scarpins
          </Link>
          <Link to="/busca" search={{ q: "sandália" }} className="rounded-full border border-border bg-card px-5 py-3 text-sm font-bold text-primary hover:border-primary">
            Sandálias
          </Link>
          <Link to="/categoria/$slug" params={{ slug: "todos" }} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
            Explorar catálogo
          </Link>
        </div>
      </main>
    );
  }

  const empty = (
    <div className="border border-dashed border-border px-6 py-14 text-center">
      <Search className="mx-auto h-9 w-9 text-primary" aria-hidden="true" />
      <h2 className="font-fraunces mt-5 text-2xl font-bold text-primary">Não encontramos seu par — ainda!</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
        Tente procurar por outro nome, cor ou referência. Você também pode explorar nossos modelos.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/busca" search={{ q: "scarpin" }} className="rounded-full border border-border px-4 py-2.5 text-xs font-bold hover:border-primary">
          Buscar scarpin
        </Link>
        <Link to="/busca" search={{ q: "rasteira" }} className="rounded-full border border-border px-4 py-2.5 text-xs font-bold hover:border-primary">
          Buscar rasteira
        </Link>
        <Link to="/categoria/$slug" params={{ slug: "todos" }} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-wide text-primary-foreground">
          Ver todos os calçados <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );

  return (
    <FilterableCatalog
      key={q}
      products={products}
      label="Sua busca"
      resultTerm={q}
      emptyFallback={empty}
    />
  );
}
