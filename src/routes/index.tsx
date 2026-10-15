import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, MoveRight } from "lucide-react";
import { listProducts } from "@/lib/products.functions";
import { ProductGrid } from "@/components/product-card";
import { CATEGORIES } from "@/lib/store";

const newQuery = queryOptions({ queryKey: ["products", "home"], queryFn: () => listProducts({ data: {} }) });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Akause — Calçados femininos com atitude" },
      { name: "description", content: "Sandálias, saltos, sapatilhas e botas para fazer seu estilo acontecer. Descubra seus favoritos e peça pelo WhatsApp." },
      { property: "og:title", content: "Akause — Seu estilo, suas regras" },
      { property: "og:description", content: "Calçados femininos com atitude. Explore os modelos e peça pelo WhatsApp." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(newQuery),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(newQuery);
  const featured = data.find(p => p.photos?.[0]);
  return (
    <main>
      <section className="relative isolate overflow-hidden bg-secondary">
        <div className="pointer-events-none absolute -right-28 top-0 h-80 w-80 rounded-full bg-accent/80 blur-[2px] md:h-[30rem] md:w-[30rem]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-44 -left-32 h-96 w-96 rounded-full border-[70px] border-primary/20" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[570px] max-w-7xl items-center gap-4 px-5 py-14 md:min-h-[650px] md:grid-cols-[1.2fr_0.8fr] md:px-8">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 bg-background px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em]"><span className="h-2 w-2 rounded-full bg-accent" /> Atenção: looks apaixonantes ♡</div>
            <h1 className="editorial-title max-w-[850px] text-[clamp(4.8rem,11.5vw,10.5rem)] text-primary">PISA<br /><span className="text-foreground">FORTE.</span></h1>
            <p className="mt-7 max-w-md text-base font-semibold leading-relaxed text-foreground/85 sm:text-lg">Do lookinho casual ao salto de milhões: tem um par com a sua energia por aqui.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#novidades" className="inline-flex items-center gap-3 rounded-full bg-foreground px-7 py-4 text-xs font-black uppercase tracking-[0.1em] text-background transition hover:bg-primary">Quero meu próximo par <ArrowUpRight size={19} /></a>
              <Link to="/categoria/$slug" params={{ slug: "saltos" }} className="inline-flex items-center gap-2 rounded-full border-2 border-foreground px-6 py-4 text-xs font-black uppercase tracking-wide hover:bg-background">Explorar saltos <MoveRight size={17} /></Link>
            </div>
          </div>
          <div className="relative mx-auto flex w-full max-w-[450px] items-center justify-center">
            <div className="relative aspect-square w-full rotate-[-7deg] overflow-hidden rounded-[50%_50%_44%_56%] border-[12px] border-background bg-accent shadow-[18px_20px_0_rgba(0,95,55,0.35)]">
              {featured?.photos?.[0] ? <img src={featured.photos[0]} alt={featured.name} className="h-full w-full object-contain p-5" fetchPriority="high" /> : <div className="flex h-full items-center justify-center"><span className="editorial-title -rotate-12 text-center text-6xl text-foreground">HOT<br />DROP!</span></div>}
            </div>
            <div className="absolute -bottom-5 right-0 rotate-[-8deg] bg-primary px-5 py-3 text-lg font-black uppercase text-primary-foreground shadow-lg">MUITO BABADO ✳</div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden bg-primary py-3 text-primary-foreground" aria-label="Moda para os pés. Estilo sem regras.">
        <div className="akause-ticker flex w-max gap-10 whitespace-nowrap text-sm font-black uppercase tracking-[0.22em]">
          {Array.from({ length: 8 }, (_, i) => <span key={i}>AKAUSE ♥ PISA COM TUDO ★ SE JOGA NO LOOK ♥ </span>)}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-primary">Escolha seu mood</p><h2 className="editorial-title text-5xl text-foreground md:text-7xl">QUAL É A<br />SUA VIBE<span className="text-accent">?</span></h2></div>
          <ArrowDownRight className="h-10 w-10 text-primary" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORIES.map((c, i) => <Link key={c.slug} to="/categoria/$slug" params={{ slug: c.slug }}
            className={`group relative flex aspect-[4/5] flex-col justify-between overflow-hidden p-4 transition-transform hover:-translate-y-1 md:p-6 ${i === 0 ? "bg-accent text-foreground" : i === 1 ? "bg-primary text-primary-foreground" : i === 2 ? "bg-secondary text-secondary-foreground" : "bg-foreground text-background"}`}>
            <span className="relative z-10 text-xs font-black tracking-wider">0{i + 1} / SHOP</span>
            <span className="pointer-events-none absolute -right-12 top-1/4 h-40 w-40 rotate-45 rounded-[40%] border-[30px] border-current opacity-15 transition-transform group-hover:rotate-90" />
            <span className="relative z-10 flex items-end justify-between gap-1"><span className="editorial-title break-words text-[clamp(1.45rem,3.2vw,3.5rem)]">{c.label}</span><ArrowUpRight className="shrink-0" size={22} /></span>
          </Link>)}
        </div>
      </section>

      <section id="novidades" className="mx-auto max-w-7xl px-5 pb-12 md:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div><p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-primary">Aviso: risco de se apaixonar</p><h2 className="editorial-title text-5xl md:text-7xl">SEU NOVO<br /><span className="text-accent">CRUSH.</span></h2></div>
          <span className="border-b-2 border-foreground pb-1 text-xs font-black uppercase tracking-wider">{data.length} modelos disponíveis</span>
        </div>
        <ProductGrid products={data.slice(0, 24)} />
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-5 md:px-8">
        <div className="grid items-center gap-8 bg-accent px-7 py-12 text-foreground md:grid-cols-[1fr_auto] md:px-12">
          <div><p className="mb-2 text-xs font-black uppercase tracking-[0.2em]">Achou seu crush em forma de sapato?</p><h2 className="editorial-title text-4xl md:text-6xl">VIU. AMOU.<br />LEVOU.</h2><p className="mt-4 max-w-lg text-sm font-semibold">Monte sua sacola e combine os detalhes do pedido diretamente pelo WhatsApp.</p></div>
          <a href="#novidades" className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-7 py-4 text-xs font-black uppercase tracking-wider text-background hover:bg-primary">Escolher favoritos <ArrowUpRight size={19} /></a>
        </div>
      </section>
    </main>
  );
}
