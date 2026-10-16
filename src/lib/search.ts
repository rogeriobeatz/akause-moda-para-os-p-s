import type { Product } from "./store";

/**
 * Normalização compartilhada entre cliente, busca e testes.
 * NFD remove acentos sem alterar letras, números ou códigos como REF-88.
 */
export function normalizeSearchTerm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}-]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function sanitizeSearchInput(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

function searchableFields(product: Product): string[] {
  return [
    product.reference,
    product.name,
    product.color,
    product.category,
    product.description.replace(/<[^>]*>/g, " "),
    product.brand,
  ].map((field) => normalizeSearchTerm(field ?? ""));
}

export function hasValidProductPhoto(product: Product): boolean {
  return Array.isArray(product.photos) &&
    typeof product.photos[0] === "string" && /^https?:\/\/\S+/i.test(product.photos[0].trim());
}

export function hasRealStock(product: Product): boolean {
  return product.total_stock > 0 &&
    Array.isArray(product.stock) &&
    product.stock.some((item) => Number(item.qty) > 0);
}

export function matchesSearch(product: Product, query: string): boolean {
  const tokens = normalizeSearchTerm(query).split(" ").filter(Boolean);
  if (!tokens.length) return false;
  const fields = searchableFields(product);
  return tokens.every((token) => fields.some((field) => field.includes(token)));
}

export function searchScore(product: Product, query: string): number {
  if (!matchesSearch(product, query)) return -1;
  const needle = normalizeSearchTerm(query);
  const [reference, name, color, category, description, brand] = searchableFields(product);
  const tokens = needle.split(" ");
  let score = 0;

  if (reference === needle) score += 1000;
  else if (reference.startsWith(needle)) score += 500;
  else if (reference.includes(needle)) score += 250;

  if (name === needle) score += 300;
  else if (name.startsWith(needle)) score += 180;
  else if (name.includes(needle)) score += 140;
  else if (tokens.every((token) => name.includes(token))) score += 90;

  if (category.includes(needle)) score += 75;
  if (color.includes(needle)) score += 65;
  if (brand.includes(needle)) score += 30;
  if (description.includes(needle)) score += 15;
  return score;
}

export function rankSearchProducts(products: Product[], query: string): Product[] {
  return products
    .map((product, index) => ({ product, index, score: searchScore(product, query) }))
    .filter(({ product, score }) => score >= 0 && hasValidProductPhoto(product) && hasRealStock(product))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ product }) => product);
}
