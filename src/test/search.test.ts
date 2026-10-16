import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/store";
import {
  hasRealStock, hasValidProductPhoto, matchesSearch, normalizeSearchTerm,
  rankSearchProducts, sanitizeSearchInput, searchScore,
} from "@/lib/search";

function makeProduct(partial: Partial<Product> = {}): Product {
  return {
    reference: "REF-88",
    name: "Sandália de couro",
    category: "Sandálias",
    cost_price: 120,
    on_sale: false,
    brand: "Akause",
    description: "Sandália com fivela e acabamento em verniz.",
    color: "Off White",
    group_code: "grupo-1",
    photos: ["https://example.com/calcado.jpg"],
    stock: [{ size: "38", qty: 2 }],
    total_stock: 2,
    ...partial,
  };
}

describe("busca em português", () => {
  it("normaliza acentos, caixa e espaços extras", () => {
    expect(normalizeSearchTerm("  SANDÁLIA   DE  PÉ  ")).toBe("sandalia de pe");
    expect(normalizeSearchTerm("Bíco FINO")).toBe("bico fino");
    expect(sanitizeSearchInput("  Scarpin   Nude ")).toBe("Scarpin Nude");
    expect(normalizeSearchTerm("REF-88")).toBe("ref-88");
  });

  it("encontra palavras sem acentos em nome, categoria e descrição", () => {
    const product = makeProduct({ name: "Sandália para o Pé", description: "Bico fino com fivela." });
    expect(matchesSearch(product, "sandalia")).toBe(true);
    expect(matchesSearch(product, "pe")).toBe(true);
    expect(matchesSearch(product, "fivela")).toBe(true);
    expect(matchesSearch(product, "bico fino")).toBe(true);
    expect(matchesSearch(product, "SANDÁLIA")).toBe(true);
  });

  it("permite palavras combinadas de campos diferentes", () => {
    const product = makeProduct({ name: "Scarpin salto fino", color: "Nude" });
    expect(matchesSearch(product, "  scarpin   nude ")).toBe(true);
    expect(matchesSearch(product, "nude scarpin")).toBe(true);
    expect(matchesSearch(product, "bota nude")).toBe(false);
  });

  it("busca por referência parcial ou exata", () => {
    const product = makeProduct({ reference: "REF-7014" });
    expect(matchesSearch(product, "7014")).toBe(true);
    expect(matchesSearch(product, "ref-7014")).toBe(true);
    expect(searchScore(product, "REF-7014")).toBeGreaterThan(searchScore(product, "7014"));
  });

  it("não exibe produtos sem foto ou estoque real", () => {
    const good = makeProduct();
    expect(hasValidProductPhoto(good)).toBe(true);
    expect(hasRealStock(good)).toBe(true);
    expect(rankSearchProducts([good], "sandalia")).toHaveLength(1);
    expect(rankSearchProducts([makeProduct({ photos: [] })], "sandalia")).toHaveLength(0);
    expect(rankSearchProducts([makeProduct({ stock: [{ size: "38", qty: 0 }] })], "sandalia")).toHaveLength(0);
    expect(rankSearchProducts([makeProduct({ total_stock: 0 })], "sandalia")).toHaveLength(0);
  });

  it("prioriza a referência exata e o nome antes das coincidências na descrição", () => {
    const ref = makeProduct({ reference: "REF-88", name: "Outro modelo" });
    const name = makeProduct({ reference: "OUTRO-1", name: "REF-88 Scarpin" });
    const description = makeProduct({ reference: "OUTRO-2", name: "Scarpin", description: "Modelo REF-88" });
    expect(rankSearchProducts([description, name, ref], "ref-88").map((p) => p.reference))
      .toEqual(["REF-88", "OUTRO-1", "OUTRO-2"]);
  });
});
