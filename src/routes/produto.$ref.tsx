import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Check, Flame, MessageCircleHeart, PackageCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getProduct } from "@/lib/products.functions";
import {
  WHATSAPP_NUMBER, brl, cleanDescription, priceOf, styleTagsForCategory,
  type Product,
} from "@/lib/store";
import { useCart } from "@/lib/cart";
import { SizeGuideModal } from "@/components/size-guide-modal";

const q = (ref: string) =>
  queryOptions({
    queryKey: ["product", ref],
    queryFn: () => getProduct({ data: { reference: ref } }),
  });

export const Route = createFileRoute("/produto/$ref")({
  loader: async ({ context, params }) => {
    const response = await context.queryClient.ensureQueryData(q(params.ref));
    if (!response) throw notFound();
    return {
      name: response.product.name,
      color: response.product.color,
      photo: response.product.photos[0] ?? "",
    };
  },
  head: ({ loaderData }) => {
    const title = (loaderData?.name ?? "Produto") + " " + (loaderData?.color ?? "");
    const text = title.trim();
    const meta = [
      { title: text + " | Akause" },
      { name: "description", content: text + " — compre na Akause e finalize pelo WhatsApp." },
      { property: "og:title", content: text + " | Akause" },
      { property: "og:description", content: text + " — moda para os pés." },
    ];
    if (loaderData?.photo?.startsWith("https://")) {
      meta.push(
        { property: "og:image", content: loaderData.photo },
        { name: "twitter:image", content: loaderData.photo },
      );
    }
    return { meta };
  },
  component: ProductPage,
});

function ProductPage() {
  const { ref } = Route.useParams();
  const { data } = useSuspenseQuery(q(ref));
  if (!data) return null;

  // Evita reaproveitar foto ou tamanho ao navegar entre variações da mesma rota.
  return <ProductDetails key={ref} product={data.product} variants={data.variants} />;
}

function ProductDetails({ product: p, variants }: { product: Product; variants: Product[] }) {
  const { add, items, setOpen } = useCart();
  const [photo, setPhoto] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  const price = priceOf(p.cost_price);
  const selection = p.stock.find((item) => item.size === selectedSize && item.qty > 0);
  const styleTags = styleTagsForCategory(p.category);
  const consultingText = "Olá! Gostei do " + p.name + " (Ref: " + p.reference + ") e queria tirar uma dúvida antes de fechar.";
  const consultingUrl = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(consultingText);

  const handleAdd = () => {
    if (!selection || added) return;

    const previouslyAdded = items.find((item) => item.reference === p.reference && item.size === selection.size);
    if (previouslyAdded && previouslyAdded.qty >= selection.qty) {
      toast.info("Você já colocou na sacola todos os pares disponíveis neste tamanho.", {
        action: { label: "Ver sacola", onClick: () => setOpen(true) },
      });
      return;
    }

    add({
      reference: p.reference,
      name: p.name,
      color: p.color,
      size: selection.size,
      price,
      photo: p.photos[0] ?? "",
      qty: 1,
      max: selection.qty,
    }, { openCart: false });

    setAdded(true);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setAdded(false);
      timer.current = null;
    }, 800);

    toast.success(p.name + " (Tam. " + selection.size + ") adicionado à sacola", {
      duration: 4500,
      action: { label: "Ver sacola", onClick: () => setOpen(true) },
    });
  };

  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-5 pt-10 md:grid-cols-2 md:gap-12">
      <section aria-label="Fotos do produto" className="min-w-0">
        <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-white">
          {p.photos[photo] ? (
            <img
              src={p.photos[photo]}
              alt={p.name + " " + p.color + " — foto " + (photo + 1)}
              className="h-full w-full object-contain p-5"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl font-black text-primary">AKAUSE.</div>
          )}
          {p.total_stock > 0 && p.total_stock <= 4 && (
            <span className="absolute left-4 top-4 rounded-full bg-accent/20 px-4 py-2 text-xs font-bold text-foreground backdrop-blur-sm">
              Últimos pares da coleção
            </span>
          )}
        </div>
        {p.photos.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Escolher foto">
            {p.photos.map((src, index) => (
              <button
                key={src + index}
                type="button"
                aria-label={"Mostrar foto " + (index + 1)}
                aria-pressed={index === photo}
                onClick={() => setPhoto(index)}
                className={
                  "h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition " +
                  (index === photo ? "border-accent" : "border-transparent hover:border-border")
                }
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-contain p-2" />
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">
          {p.category} · {p.brand}
        </p>
        <h1 className="font-fraunces mt-3 text-4xl font-bold leading-tight text-primary md:text-5xl">{p.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{p.color} · Ref. {p.reference}</p>

        {styleTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Estilos e ocasiões">
            {styleTags.map((tag) => (
              <span key={tag} className="rounded-full border border-primary/20 bg-secondary/40 px-3 py-1.5 text-[11px] font-semibold text-primary">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6">
          <p className="text-3xl font-extrabold text-foreground">{brl(price)}</p>
          <p className="mt-1 text-sm text-muted-foreground">ou 3x de {brl(price / 3)}</p>
        </div>

        {variants.length > 1 && (
          <section className="mt-7" aria-label="Outras cores disponíveis">
            <h2 className="mb-3 text-sm font-bold">Outras cores</h2>
            <div className="flex flex-wrap gap-3">
              {variants.map((variant) => (
                <Link
                  key={variant.reference}
                  to="/produto/$ref"
                  params={{ ref: variant.reference }}
                  title={variant.color}
                  aria-label={"Ver cor " + variant.color}
                  className={
                    "h-16 w-16 overflow-hidden rounded-full border-2 bg-white transition hover:border-primary " +
                    (variant.reference === p.reference ? "border-accent" : "border-border")
                  }
                >
                  {variant.photos[0] && (
                    <img src={variant.photos[0]} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8" aria-labelledby="product-size-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="product-size-heading" className="text-sm font-extrabold">Selecione o tamanho</h2>
            <SizeGuideModal />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Numeração disponível">
            {p.stock.map((item) => {
              const selected = item.size === selectedSize;
              return (
                <button
                  key={item.size}
                  type="button"
                  disabled={item.qty <= 0}
                  aria-pressed={selected}
                  aria-label={"Tamanho " + item.size + (item.qty > 0 ? " — " + item.qty + " pares disponíveis" : " — esgotado")}
                  onClick={() => { setSelectedSize(item.size); setAdded(false); }}
                  className={
                    "h-12 min-w-12 rounded-full border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through " +
                    (selected ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary")
                  }
                >
                  {item.size}
                </button>
              );
            })}
          </div>
          <div className="mt-3 min-h-6" aria-live="polite" role="status">
            {selection?.qty === 1 ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Flame aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
                Resta apenas 1 par no tamanho {selection.size} no estoque central.
              </p>
            ) : selection?.qty === 2 ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Flame aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
                Atenção: restam apenas 2 pares neste tamanho.
              </p>
            ) : selection && selection.qty >= 3 ? (
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Check aria-hidden="true" className="h-4 w-4" /> Tamanho disponível
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Escolha sua numeração para continuar.</p>
            )}
          </div>
        </section>

        <button
          type="button"
          disabled={!selection || added}
          onClick={handleAdd}
          className={
            "mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-extrabold transition-all duration-200 disabled:cursor-not-allowed " +
            (added
              ? "bg-primary text-primary-foreground motion-safe:animate-pulse"
              : "bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50")
          }
        >
          {added ? (
            <><Check aria-hidden="true" className="h-5 w-5" /> Adicionado!</>
          ) : selection ? "Adicionar à sacola" : "Escolha um tamanho"}
        </button>

        <a
          href={consultingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-primary/40 px-5 py-3 text-sm font-bold text-primary transition hover:bg-secondary"
        >
          <MessageCircleHeart aria-hidden="true" className="h-5 w-5" />
          Conversar com uma consultora
        </a>

        <section aria-labelledby="trust-title" className="mt-9">
          <h2 id="trust-title" className="font-fraunces mb-4 text-2xl font-bold text-primary">Pode escolher com carinho.</h2>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card px-4 py-5">
              <RefreshCw aria-hidden="true" className="mb-3 h-5 w-5 text-primary" />
              <h3 className="text-sm font-extrabold leading-snug">Primeira troca sem complicação</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Não serviu perfeitamente? Apoiamos sua troca diretamente pelo WhatsApp.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card px-4 py-5">
              <MessageCircleHeart aria-hidden="true" className="mb-3 h-5 w-5 text-primary" />
              <h3 className="text-sm font-extrabold leading-snug">Atendimento com consultora real</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Quer fotos calçadas ou tirar dúvidas de combinação? Chame nossa consultora.
              </p>
              <a
                href={consultingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-bold text-primary underline underline-offset-4"
              >
                Tirar minha dúvida
              </a>
            </div>
            <div className="rounded-2xl border border-border bg-card px-4 py-5">
              <PackageCheck aria-hidden="true" className="mb-3 h-5 w-5 text-primary" />
              <h3 className="text-sm font-extrabold leading-snug">Envio cuidadoso</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Calçados embalados individualmente e revisados par a par antes do envio.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-9 rounded-[1.5rem] bg-secondary p-6" aria-labelledby="product-detail-title">
          <h2 id="product-detail-title" className="font-fraunces mb-3 text-2xl font-bold text-primary">Detalhes</h2>
          <ul className="space-y-1.5 text-sm leading-relaxed text-foreground/80">
            {cleanDescription(p.description).map((line, index) => (
              <li key={line + index}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
