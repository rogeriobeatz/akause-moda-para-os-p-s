import { describe, expect, it } from "vitest";
import { WOMENS_SHOE_SIZE_GUIDE, styleTagsForCategory } from "@/lib/store";

describe("Guia referencial de numeração feminina", () => {
  it("cobre o intervalo de 33 a 40 sem lacunas", () => {
    expect(WOMENS_SHOE_SIZE_GUIDE.map((row) => row.size)).toEqual([
      33, 34, 35, 36, 37, 38, 39, 40,
    ]);
    expect(WOMENS_SHOE_SIZE_GUIDE[0]).toEqual({ size: 33, minCm: 21.5, maxCm: 22 });
    expect(WOMENS_SHOE_SIZE_GUIDE[7]).toEqual({ size: 40, minCm: 26.3, maxCm: 27 });
  });

  it("mantém limites válidos em centímetros por numeração", () => {
    for (const row of WOMENS_SHOE_SIZE_GUIDE) {
      expect(row.minCm).toBeLessThan(row.maxCm);
      expect(row.minCm).toBeGreaterThan(0);
    }
  });
});

describe("Tags de ocasião baseadas no cadastro do fornecedor", () => {
  it("identifica scarpins e sandálias com acentos ou letras maiúsculas", () => {
    expect(styleTagsForCategory("Scarpins")).toContain("Elegância Clássica");
    expect(styleTagsForCategory("SANDÁLIAS")).toContain("Dias de Sol");
  });

  it("identifica botas e anabelas", () => {
    expect(styleTagsForCategory("Botas")).toContain("Outono & Inverno");
    expect(styleTagsForCategory("Anabela Salto Alto")).toContain("Altura com Conforto");
  });

  it("não inventa ocasiões para categorias desconhecidas", () => {
    expect(styleTagsForCategory("Outro Modelo")).toEqual([]);
  });
});
