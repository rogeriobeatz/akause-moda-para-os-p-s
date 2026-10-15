import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { brl, priceOf, type Product } from "@/lib/store";

export function ProductCard({ p }: { p: Product }) {
  return (
    <Link to="/produto/$ref" params={{ ref: p.reference }} className="group block min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {p.photos?.[0] ? (
          <img src={p.photos[0]} alt={`${p.name} ${p.color}`} loading="lazy"
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.035]" />
        ) : <div className="flex h-full items-center justify-center bg-secondary px-3 text-center font-black uppercase text-primary">AKAUSE.</div>}
        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background text-foreground transition-transform group-hover:-rotate-45"><ArrowUpRight size={19} aria-hidden="true" /></span>
        {p.on_sale && <span className="absolute left-3 top-3 bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-wider text-accent-foreground">Em destaque</span>}
        {p.total_stock <= 5 && <span className="absolute bottom-3 left-3 bg-secondary px-3 py-1 text-[10px] font-black uppercase text-secondary-foreground">Últimos pares</span>}
      </div>
      <div className="mt-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">{p.category}</p>
        <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-foreground sm:text-base">{p.name}{p.color && <span className="font-medium text-muted-foreground"> · {p.color}</span>}</p>
        <p className="mt-2 text-base font-black text-primary">{brl(priceOf(p.cost_price))}</p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) return <p className="py-16 text-center font-medium text-muted-foreground">Nenhum produto disponível no momento.</p>;
  return <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">{products.map(p => <ProductCard key={p.reference} p={p} />)}</div>;
}
