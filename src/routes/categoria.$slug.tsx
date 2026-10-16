import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/products.functions";
import { CATEGORIES } from "@/lib/store";
import { FilterableCatalog } from "@/components/filterable-catalog";

const q = (slug: string) =>
  queryOptions({
    queryKey: ["products", slug],
    queryFn: () => listProducts({ data: { category: slug } }),
  });

export const Route = createFileRoute("/categoria/$slug")({
  loader: ({ context, params }) => {
    if (params.slug === "saltos") {
      throw redirect({ to: "/categoria/$slug", params: { slug: "saltos-plataformas" } });
    }
    const cat = CATEGORIES.find((category) => category.slug === params.slug);
    if (!cat) throw notFound();
    return context.queryClient.ensureQueryData(q(params.slug)).then(() => ({ label: cat.label }));
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: (loaderData?.label ?? "Categoria") + " | Akause — Calçados femininos" },
      { name: "description", content: "Compre " + (loaderData?.label?.toLowerCase() ?? "calçados") + " na Akause e finalize pelo WhatsApp." },
      { property: "og:title", content: (loaderData?.label ?? "Categoria") + " | Akause" },
      { property: "og:description", content: (loaderData?.label ?? "Calçados") + " com atitude e personalidade." },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { label } = Route.useLoaderData();
  const { data } = useSuspenseQuery(q(slug));
  return <FilterableCatalog key={slug} products={data} label={label} />;
}

