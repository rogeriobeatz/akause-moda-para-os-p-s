import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getProduct } from "@/lib/products.functions";
import { brl, cleanDescription, priceOf } from "@/lib/store";
import { useCart } from "@/lib/cart";

const q = (ref: string) =>
  queryOptions({ queryKey: ["product", ref], queryFn: () => getProduct({ data: { reference: ref } }) });

export const Route = createFileRoute("/produto/$ref")({
  loader: async ({ context, params }) => {
    const r = await context.queryClient.ensureQueryData(q(params.ref));
    if (!r) throw notFound();
    return { name: r.product.name, color: r.product.color, photo: r.product.photos[0] ?? "" };
  },
  head: ({ loaderData }) => {
    const t = `${loaderData?.name ?? "Produto"} ${loaderData?.color ?? ""}`.trim();
    const meta = [
      { title: `${t} | Akause` },
      { name: "description", content: `${t} — compre na Akause e finalize pelo WhatsApp.` },
      { property: "og:title", content: `${t} | Akause` },
      { property: "og:description", content: `${t} — moda para os pés.` },
    ];
    if (loaderData?.photo?.startsWith("https://")) {
      meta.push({ property: "og:image", content: loaderData.photo }, { name: "twitter:image", content: loaderData.photo } as never);
    }
    return { meta };
  },
  component: ProductPage,
});

function ProductPage() {
  const { ref } = Route.useParams();
  const { data } = useSuspenseQuery(q(ref));
  const { add } = useCart();
  const [photo, setPhoto] = useState(0);
  const [size, setSize] = useState("");
  if (!data) return null;
  const { product: p, variants } = data;
  const price = priceOf(p.cost_price);
  const sel = p.stock.find((s) => s.size === size);

  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-5 pt-10 md:grid-cols-2">
      <div>
        <div className="aspect-square overflow-hidden rounded-[2rem] bg-white">
          {p.photos[photo] && <img src={p.photos[photo]} alt={`${p.name} ${p.color}`} className="h-full w-full object-contain p-5" />}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {p.photos.map((ph, i) => (
            <button key={ph} onClick={() => setPhoto(i)} className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white ${i === photo ? "border-accent" : "border-transparent"}`}>
              <img src={ph} alt="" loading="lazy" className="h-full w-full object-contain p-2" />
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-accent">{p.category} · {p.brand}</p>
        <h1 className="mt-2 font-display text-4xl text-primary md:text-5xl">{p.name}</h1>
        <p className="mt-1 text-muted-foreground">{p.color} · Ref. {p.reference}</p>
        <p className="mt-5 text-3xl font-semibold">{brl(price)}</p>
        <p className="text-sm text-muted-foreground">ou 3x de {brl(price / 3)}</p>

        {variants.length > 1 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Cores</p>
            <div className="flex gap-2">
              {variants.map((v) => (
                <Link key={v.reference} to="/produto/$ref" params={{ ref: v.reference }} title={v.color} className={`h-14 w-14 overflow-hidden rounded-full border-2 bg-white ${v.reference === p.reference ? "border-accent" : "border-border"}`}>
                  <img src={v.photos[0]} alt={v.color} className="h-full w-full object-contain p-1" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">Tamanho</p>
          <div className="flex flex-wrap gap-2">
            {p.stock.map((s) => (
              <button
                key={s.size}
                disabled={s.qty <= 0}
                onClick={() => setSize(s.size)}
                className={`h-12 w-12 rounded-full border text-sm transition disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through ${size === s.size ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
              >
                {s.size}
              </button>
            ))}
          </div>
          {sel && sel.qty <= 3 && <p className="mt-2 text-sm text-accent">Só {sel.qty} {sel.qty === 1 ? "par" : "pares"} neste tamanho!</p>}
        </div>

        <button
          disabled={!sel}
          onClick={() =>
            sel &&
            add({ reference: p.reference, name: p.name, color: p.color, size: sel.size, price, photo: p.photos[0] ?? "", qty: 1, max: sel.qty })
          }
          className="mt-8 w-full rounded-full bg-accent py-4 font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
        >
          {sel ? "Adicionar à sacola" : "Escolha um tamanho"}
        </button>

        <div className="mt-10 rounded-[1.5rem] bg-secondary p-6">
          <p className="mb-3 font-display text-xl text-primary">Detalhes</p>
          <ul className="space-y-1.5 text-sm text-foreground/80">
            {cleanDescription(p.description).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
