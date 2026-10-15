import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/products.functions";
import { ProductGrid } from "@/components/product-card";
import { CATEGORIES } from "@/lib/store";
import hero from "@/assets/hero.jpg";

const newQuery = queryOptions({ queryKey: ["products", "home"], queryFn: () => listProducts({ data: {} }) });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Akause — moda para os pés | Sandálias, saltos, sapatilhas e botas" },
      { name: "description", content: "Calçados femininos com vibe orgânica e moderna. Compre sandálias, saltos, sapatilhas e botas e finalize pelo WhatsApp." },
      { property: "og:title", content: "Akause — moda para os pés" },
      { property: "og:description", content: "Calçados femininos orgânicos e modernos. Peça pelo WhatsApp." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(newQuery),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(newQuery);
  return (
    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-2">
        <div>
          <p className="mb-4 inline-block rounded-full border border-accent/40 px-4 py-1 text-xs uppercase tracking-[0.25em] text-accent">
            Nova coleção
          </p>
          <h1 className="font-display text-5xl leading-[1.05] text-primary md:text-7xl">
            Passos leves, <em className="text-accent">alma livre.</em>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Sandálias, sapatilhas, saltos e botas com conforto e personalidade — para cada caminho que você escolher.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#novidades" className="rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground hover:bg-primary/90">
              Ver novidades
            </a>
            <Link to="/categoria/$slug" params={{ slug: "saltos" }} className="rounded-full border border-primary px-7 py-3.5 font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
              Saltos
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-6 -top-6 h-40 w-40 rounded-full bg-accent/20 blur-2xl" />
          <img src={hero} alt="Sandálias, mules e sapatilhas Akause sobre pedras naturais" width={1600} height={1104} className="relative rounded-[2.5rem] object-cover shadow-xl" />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 md:grid-cols-4">
        {CATEGORIES.map((c, i) => (
          <Link
            key={c.slug}
            to="/categoria/$slug"
            params={{ slug: c.slug }}
            className={`flex h-32 items-end rounded-[1.75rem] p-5 font-display text-2xl transition hover:-translate-y-1 ${i % 2 ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}
          >
            {c.label}
          </Link>
        ))}
      </section>

      <section id="novidades" className="mx-auto max-w-7xl px-5 pt-20">
        <h2 className="mb-8 font-display text-4xl text-primary">Novidades</h2>
        <ProductGrid products={data.slice(0, 24)} />
      </section>
    </main>
  );
}
