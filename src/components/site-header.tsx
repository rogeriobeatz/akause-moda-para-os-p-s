import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { CATEGORIES } from "@/lib/store";

export function SiteHeader() {
  const { count, setOpen } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="bg-primary py-1.5 text-center text-xs tracking-wide text-primary-foreground">
        Pedidos direto pelo WhatsApp · atendimento humano e carinhoso
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4">
        <Link to="/" className="leading-none">
          <span className="font-display text-3xl font-semibold text-primary">Akause</span>
          <span className="block text-[11px] uppercase tracking-[0.3em] text-accent">moda para os pés</span>
        </Link>
        <nav className="hidden gap-7 text-sm font-medium md:flex">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to="/categoria/$slug"
              params={{ slug: c.slug }}
              className="text-foreground/80 transition-colors hover:text-accent"
              activeProps={{ className: "text-accent" }}
            >
              {c.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir sacola"
          className="relative rounded-full border border-border p-2.5 transition-colors hover:border-accent hover:text-accent"
        >
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-foreground">
              {count}
            </span>
          )}
        </button>
      </div>
      <nav className="flex gap-5 overflow-x-auto px-5 pb-3 text-sm md:hidden">
        {CATEGORIES.map((c) => (
          <Link key={c.slug} to="/categoria/$slug" params={{ slug: c.slug }} className="whitespace-nowrap text-foreground/80">
            {c.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl">Akause</p>
          <p className="mt-2 max-w-xs text-sm opacity-80">
            Sandálias, sapatilhas, saltos e botas com alma leve e moderna. Feito para caminhar com você.
          </p>
        </div>
        <div className="text-sm opacity-90">
          <p className="mb-2 font-semibold">Como comprar</p>
          <p>Escolha seus favoritos, monte sua sacola e finalize o pedido pelo WhatsApp.</p>
        </div>
        <div className="text-sm opacity-90">
          <p className="mb-2 font-semibold">Fale com a gente</p>
          <a href="https://wa.me/5541996924232" className="underline-offset-4 hover:underline">
            WhatsApp (41) 99692-4232
          </a>
        </div>
      </div>
    </footer>
  );
}
