import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { CATEGORIES, WHATSAPP_NUMBER } from "@/lib/store";

export function SiteHeader() {
  const { count, setOpen } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/15 bg-background/95 backdrop-blur-md">
      <div className="bg-primary px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.22em] text-primary-foreground sm:text-xs">
        Seu próximo par favorito está aqui. ★ Peça pelo WhatsApp
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link to="/" aria-label="Akause, voltar à página inicial" className="flex flex-col leading-none">
          <span className="font-display text-[2.1rem] font-black uppercase leading-[0.85] tracking-[-0.095em] text-primary sm:text-[2.7rem]">AKAUSE<span className="text-accent">.</span></span>
          <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.3em] text-foreground">Moda para os pés</span>
        </Link>
        <nav aria-label="Categorias" className="hidden items-center gap-7 lg:flex">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to="/categoria/$slug" params={{ slug: c.slug }}
              className="text-xs font-black uppercase tracking-[0.11em] transition-colors hover:text-primary"
              activeProps={{ className: "text-primary underline underline-offset-8" }}>
              {c.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"
            className="hidden items-center gap-1.5 text-xs font-black uppercase tracking-wide hover:text-primary sm:inline-flex">
            Fale com a gente <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <button type="button" onClick={() => setOpen(true)} aria-label={`Abrir sacola com ${count} itens`}
            className="relative ml-2 flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background transition hover:bg-primary">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-black text-accent-foreground">{count}</span>}
          </button>
        </div>
      </div>
      <nav aria-label="Categorias mobile" className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
        {CATEGORIES.map(c => (
          <Link key={c.slug} to="/categoria/$slug" params={{ slug: c.slug }}
            className="shrink-0 rounded-full border border-foreground/20 px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide hover:bg-secondary"
            activeProps={{ className: "bg-secondary border-primary" }}>{c.label}</Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-14 md:py-20">
        <p className="editorial-title break-words text-[clamp(4rem,15vw,12rem)]">AKAUSE<span className="text-accent">.</span></p>
        <div className="mt-10 grid gap-8 border-t border-white/30 pt-8 md:grid-cols-3">
          <div><p className="text-xs font-black uppercase tracking-[0.2em]">Moda para os pés</p><p className="mt-3 max-w-sm text-sm opacity-85">Pares com personalidade para quem faz as próprias regras.</p></div>
          <div><p className="text-xs font-black uppercase tracking-[0.2em]">Como comprar</p><p className="mt-3 text-sm opacity-85">Escolha seus favoritos, monte sua sacola e envie seu pedido pelo WhatsApp. Frete e pagamento são combinados no atendimento.</p></div>
          <div><p className="text-xs font-black uppercase tracking-[0.2em]">Bora conversar?</p><a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 font-black underline underline-offset-4">WhatsApp (41) 99692-4232 <ArrowUpRight size={17} /></a></div>
        </div>
      </div>
    </footer>
  );
}
