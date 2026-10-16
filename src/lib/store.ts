// Shared, browser-safe store config and helpers.
export const STORE_NAME = "Akause";
export const STORE_TAGLINE = "moda para os pés";
export const WHATSAPP_NUMBER = "5541996924232";
// Margem aplicada sobre o preço de dropshipping do fornecedor.
export const MARGIN_PERCENT = 80;

export type StockItem = { size: string; qty: number };
export type Product = {
  reference: string;
  name: string;
  category: string;
  cost_price: number;
  on_sale: boolean;
  brand: string;
  description: string;
  color: string;
  group_code: string;
  photos: string[];
  stock: StockItem[];
  total_stock: number;
};

export function priceOf(cost: number) {
  const raw = Number(cost) * (1 + MARGIN_PERCENT / 100);
  return Math.max(0, Math.ceil(raw) - 0.1);
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const CATEGORIES = [
  { slug: "todos", label: "Todos os calçados", match: [] },
  { slug: "scarpins", label: "Scarpins", match: ["%scarpin%"] },
  { slug: "sandalias", label: "Sandálias", match: ["%sand%"] },
  { slug: "botas", label: "Botas", match: ["%bota%"] },
  { slug: "saltos-plataformas", label: "Saltos & plataformas", match: ["%anabela%", "%meia pata%", "%salto%", "%peep%"] },
  { slug: "sapatilhas", label: "Sapatilhas", match: ["%sapatilha%"] },
  { slug: "especial", label: "Numeração especial", match: ["%numera%"] },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function cleanDescription(html: string) {
  return html
    .split(/<br\s*\/?>/i)
    .map((l) => l.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
}
