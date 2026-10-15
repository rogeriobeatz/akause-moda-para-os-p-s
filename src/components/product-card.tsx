import { Link } from "@tanstack/react-router";
import { brl, priceOf, type Product } from "@/lib/store";

export function ProductCard({ p }: { p: Product }) {
  return (
    <Link to="/produto/$ref" params={{ ref: p.reference }} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-secondary">
        {p.photos[0] && (
          <img
            src={p.photos[0]}
            alt={`${p.name} ${p.color}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        {p.on_sale && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            Promo
          </span>
        )}
        {p.total_stock <= 5 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs">Últimos pares</span>
        )}
      </div>
      <div className="mt-3 px-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{p.category}</p>
        <p className="font-medium">
          {p.name} {p.color && <span className="text-muted-foreground">· {p.color}</span>}
        </p>
        <p className="mt-0.5 font-semibold text-primary">{brl(priceOf(p.cost_price))}</p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) return <p className="py-16 text-center text-muted-foreground">Nenhum produto encontrado.</p>;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.reference} p={p} />
      ))}
    </div>
  );
}
