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


/** Medidas brasileiras referenciais, em cm de comprimento do pé (podem variar por fabricante). */
export const WOMENS_SHOE_SIZE_GUIDE = [
  { size: 33, minCm: 21.5, maxCm: 22.0 },
  { size: 34, minCm: 22.1, maxCm: 22.7 },
  { size: 35, minCm: 22.8, maxCm: 23.4 },
  { size: 36, minCm: 23.5, maxCm: 24.1 },
  { size: 37, minCm: 24.2, maxCm: 24.8 },
  { size: 38, minCm: 24.9, maxCm: 25.5 },
  { size: 39, minCm: 25.6, maxCm: 26.2 },
  { size: 40, minCm: 26.3, maxCm: 27.0 },
] as const;

export function styleTagsForCategory(category: string): string[] {
  const value = (category ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (value.includes("scarpin"))
    return ["Alfaiataria & Trabalho", "Elegância Clássica", "Salto Fino"];
  if (value.includes("sand") || value.includes("rasteira"))
    return ["Dias de Sol", "Conforto & Frescor", "Leveza"];
  if (value.includes("bota"))
    return ["Outono & Inverno", "Presença Marcante"];
  if (value.includes("anabela") || value.includes("meia pata") || value.includes("plataforma"))
    return ["Altura com Conforto", "Estilo Versátil"];
  return [];
}

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function cleanDescription(html: string) {
  return html
    .split(/<br\s*\/?>/i)
    .map((l) => l.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
}
