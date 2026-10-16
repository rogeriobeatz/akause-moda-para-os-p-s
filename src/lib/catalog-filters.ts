import { priceOf, type Product } from "./store";

export type PriceBand = "all" | "under-150" | "150-249" | "250-plus";
export type SortOrder = "new" | "price_asc" | "price_desc";

export type CatalogFilters = {
  colors: string[];
  sizes: string[];
  price: PriceBand;
  saleOnly: boolean;
  sort: SortOrder;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  colors: [],
  sizes: [],
  price: "all",
  saleOnly: false,
  sort: "new",
};

export const PRICE_OPTIONS: { value: PriceBand; label: string }[] = [
  { value: "under-150", label: "Até R$ 149" },
  { value: "150-249", label: "R$ 150 a R$ 249" },
  { value: "250-plus", label: "A partir de R$ 250" },
];

export function normalizeColor(color: string): string {
  return (color ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

export function availableStock(product: Product) {
  return (Array.isArray(product.stock) ? product.stock : []).filter(
    (stock) => Number(stock.qty) > 0,
  );
}

export function isSpecialProduct(product: Product): boolean {
  return (
    (product.category ?? "").toLocaleLowerCase("pt-BR").includes("numera") ||
    availableStock(product).some((stock) => {
      const match = String(stock.size).trim().match(/^\d+/);
      return match !== null && Number(match[0]) >= 40;
    })
  );
}

export function matchesPrice(price: number, band: PriceBand): boolean {
  if (band === "under-150") return price < 150;
  if (band === "150-249") return price >= 150 && price < 250;
  if (band === "250-plus") return price >= 250;
  return true;
}

type OmittedFacet = "colors" | "sizes" | "price" | "saleOnly";

export function matchesCatalog(
  product: Product,
  filters: CatalogFilters,
  omit?: OmittedFacet,
): boolean {
  if (omit !== "colors" && filters.colors.length > 0 &&
      !filters.colors.includes(normalizeColor(product.color))) return false;
  if (omit !== "sizes" && filters.sizes.length > 0 &&
      !availableStock(product).some((stock) => filters.sizes.includes(String(stock.size)))) return false;
  if (omit !== "price" && !matchesPrice(priceOf(product.cost_price), filters.price)) return false;
  if (omit !== "saleOnly" && filters.saleOnly && !product.on_sale) return false;
  return true;
}

export function filterCatalog(products: Product[], filters: CatalogFilters): Product[] {
  const result = products.filter((product) => matchesCatalog(product, filters));
  if (filters.sort === "new") return result; // A consulta entrega a ordem de cadastro.
  return result.sort((a, b) =>
    filters.sort === "price_asc"
      ? priceOf(a.cost_price) - priceOf(b.cost_price)
      : priceOf(b.cost_price) - priceOf(a.cost_price),
  );
}

export function colorOptions(products: Product[], filters: CatalogFilters) {
  const colors = new Map<string, { key: string; label: string; count: number }>();
  for (const product of products) {
    const key = normalizeColor(product.color);
    if (!key) continue;
    if (!colors.has(key)) {
      const label = key.replace(/(^|[\s/-])\S/g, (letter) => letter.toLocaleUpperCase("pt-BR"));
      colors.set(key, { key, label, count: 0 });
    }
    if (matchesCatalog(product, filters, "colors")) colors.get(key)!.count++;
  }
  return [...colors.values()].sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

export function sizeOptions(products: Product[], filters: CatalogFilters) {
  const sizes = new Map<string, number>();
  for (const product of products) {
    for (const item of availableStock(product)) {
      const size = String(item.size);
      if (!sizes.has(size)) sizes.set(size, 0);
      if (matchesCatalog(product, filters, "sizes")) {
        sizes.set(size, sizes.get(size)! + Number(item.qty));
      }
    }
  }
  return [...sizes.entries()]
    .map(([size, pairs]) => ({ size, pairs }))
    .sort((a, b) => a.size.localeCompare(b.size, "pt-BR", { numeric: true }));
}

export function priceOptions(products: Product[], filters: CatalogFilters) {
  return PRICE_OPTIONS.map((option) => ({
    ...option,
    count: products.filter((product) =>
      matchesCatalog(product, filters, "price") && matchesPrice(priceOf(product.cost_price), option.value),
    ).length,
  }));
}
