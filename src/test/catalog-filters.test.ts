import { describe, expect, it } from "vitest";
import { CATEGORIES, priceOf, type Product } from "@/lib/store";
import {
  DEFAULT_CATALOG_FILTERS,
  colorOptions,
  filterCatalog,
  isSpecialProduct,
  normalizeColor,
  priceOptions,
  sizeOptions,
  type CatalogFilters,
} from "@/lib/catalog-filters";

function product(overrides: Partial<Product> = {}): Product {
  return {
    reference: "REF-1",
    name: "Scarpin",
    category: "Scarpin",
    cost_price: 100,
    on_sale: false,
    brand: "Fornecedor",
    description: "",
    color: "Preto",
    group_code: "123",
    photos: [],
    stock: [{ size: "37", qty: 2 }],
    total_stock: 2,
    ...overrides,
  };
}

const withFilters = (overrides: Partial<CatalogFilters>): CatalogFilters => ({
  ...DEFAULT_CATALOG_FILTERS,
  ...overrides,
});

describe("categorias Akause", () => {
  it("separa scarpins, sandálias, botas, saltos e tamanhos especiais", () => {
    expect(CATEGORIES.map((category) => category.slug)).toEqual([
      "todos", "scarpins", "sandalias", "botas",
      "saltos-plataformas", "sapatilhas", "especial",
    ]);
    expect(CATEGORIES.find((category) => category.slug === "todos")?.match).toEqual([]);
    expect(CATEGORIES.find((category) => category.slug === "saltos-plataformas")?.match)
      .toEqual(["%anabela%", "%meia pata%", "%salto%", "%peep%"]);
  });

  it("considera categoria especial ou número 40+ realmente em estoque", () => {
    expect(isSpecialProduct(product({ category: "Numeração Especial" }))).toBe(true);
    expect(isSpecialProduct(product({ stock: [{ size: "40", qty: 1 }] }))).toBe(true);
    expect(isSpecialProduct(product({ stock: [{ size: "40", qty: 0 }] }))).toBe(false);
    expect(isSpecialProduct(product({ stock: [{ size: "39", qty: 5 }] }))).toBe(false);
  });
});

describe("filtros do catálogo", () => {
  const data = [
    product({ reference: "1", color: "Preto", cost_price: 80, stock: [{ size: "37", qty: 3 }] }),
    product({ reference: "2", color: "preto ", cost_price: 100, on_sale: true, stock: [{ size: "38", qty: 2 }] }),
    product({ reference: "3", color: "Caramelo", cost_price: 150, stock: [{ size: "40", qty: 5 }] }),
  ];

  it("usa priceOf(cost_price), nunca o preço de custo, ao filtrar por faixas", () => {
    expect(priceOf(80)).toBeCloseTo(143.9);
    expect(filterCatalog(data, withFilters({ price: "under-150" })).map((p) => p.reference)).toEqual(["1"]);
    expect(filterCatalog(data, withFilters({ price: "150-249" })).map((p) => p.reference)).toEqual(["2"]);
    expect(filterCatalog(data, withFilters({ price: "250-plus" })).map((p) => p.reference)).toEqual(["3"]);
    expect(priceOptions(data, withFilters({})).map((p) => p.count)).toEqual([1, 1, 1]);
  });

  it("combina filtros entre grupos, mas aceita múltiplos tamanhos ou cores", () => {
    expect(filterCatalog(data, withFilters({
      colors: ["preto"], sizes: ["37", "38"], saleOnly: true,
    })).map((p) => p.reference)).toEqual(["2"]);
    expect(filterCatalog(data, withFilters({ sizes: ["37", "40"] })).map((p) => p.reference))
      .toEqual(["1", "3"]);
  });

  it("conta pares positivos em estoque, não apenas modelos", () => {
    expect(sizeOptions(data, withFilters({}))).toEqual([
      { size: "37", pairs: 3 },
      { size: "38", pairs: 2 },
      { size: "40", pairs: 5 },
    ]);
  });

  it("normaliza cores e conta modelos disponíveis", () => {
    expect(normalizeColor(" PRETO   ")).toBe("preto");
    const colors = colorOptions(data, withFilters({}));
    expect(colors.find((color) => color.key === "preto")?.count).toBe(2);
  });

  it("ordena por preço final e preserva a ordem do servidor em mais recentes", () => {
    expect(filterCatalog(data, withFilters({ sort: "new" })).map((p) => p.reference)).toEqual(["1", "2", "3"]);
    expect(filterCatalog(data, withFilters({ sort: "price_desc" })).map((p) => p.reference)).toEqual(["3", "2", "1"]);
  });
});
