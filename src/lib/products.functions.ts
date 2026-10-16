import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { CATEGORIES, type Product } from "./store";
import { isSpecialProduct } from "./catalog-filters";
import { normalizeSearchTerm, rankSearchProducts, sanitizeSearchInput } from "./search";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (!url || !key) {
    console.error("Akause: configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no ambiente do servidor.");
    return null;
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const COLS =
  "reference,name,category,cost_price,on_sale,brand,description,color,group_code,photos,stock,total_stock";

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        category: z.string().max(40).optional(),
        q: z.string().max(80).optional(),
        sort: z.enum(["new", "price_asc", "price_desc"]).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    if (!sb) return [] as Product[];

    const cat = CATEGORIES.find((category) => category.slug === data.category);
    if (data.category && !cat) return [] as Product[];

    // A numeração especial também inclui produtos cuja grade em estoque chega ao 40.
    // Esse predicado depende do JSON de estoque, por isso é aplicado após a leitura.
    const special = data.category === "especial";
    const pageSize = 500;
    const products: Product[] = [];

    for (let offset = 0; ; offset += pageSize) {
      let query = sb.from("products").select(COLS).eq("active", true).gt("total_stock", 0);

      if (cat && cat.match.length && !special) {
        query = query.or(cat.match.map((match) => "category.ilike." + match).join(","));
      }
      if (data.q) {
        const s = data.q.replace(/[%,()]/g, " ").trim();
        if (s) {
          query = query.or(
            "name.ilike.%" + s + "%,color.ilike.%" + s +
            "%,brand.ilike.%" + s + "%,category.ilike.%" + s + "%",
          );
        }
      }

      if (data.sort === "price_asc") query = query.order("cost_price", { ascending: true });
      else if (data.sort === "price_desc") query = query.order("cost_price", { ascending: false });
      else query = query.order("registered_at", { ascending: false, nullsFirst: false });

      const { data: rows, error } = await query
        .order("reference", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error("Falha ao carregar catálogo Akause:", error);
        throw new Error("Não foi possível carregar os produtos. Tente novamente em instantes.");
      }

      const batch = (rows ?? []) as unknown as Product[];
      products.push(...(special ? batch.filter(isSpecialProduct) : batch));
      if (batch.length < pageSize) break;
    }

    return products;
  });


/**
 * Busca pública sobre a cópia local do catálogo. A consulta rápida em ILIKE
 * cobre referências e texto simples; o fallback normalizado em TypeScript
 * cobre equivalência de acentos e termos distribuídos por vários campos.
 * O PostgreSQL ILIKE por si só não garante equivalência entre "sandalia"
 * e "sandália". Para catálogos muito grandes, migrar para índice unaccent/trgm.
 */
export const searchProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({
      query: z.string().max(80),
      limit: z.number().int().min(1).max(12).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const term = sanitizeSearchInput(data.query);
    const normalized = normalizeSearchTerm(term);
    if (!normalized) return [] as Product[];

    const sb = publicClient();
    if (!sb) return [] as Product[];

    // Etapa 1: índice convencional disponível via PostgREST.
    // Os caracteres da gramática de filtros são retirados antes do .or().
    const token = (normalized.split(" ")[0] ?? "").replace(/[^a-z0-9-]/g, "");
    const referenceQuery = /^(?:ref-?)?\d[\d-]*$/.test(normalized);
    if (token) {
      const pattern = "%" + token + "%";
      const orFilter = ["name", "reference", "color", "description", "category"]
        .map((field) => field + ".ilike." + pattern)
        .join(",");

      if (referenceQuery) {
        // Códigos de referência não dependem de acentuação; evite varredura geral.
        const { data: rows, error } = await sb
          .from("products")
          .select(COLS)
          .eq("active", true)
          .gt("total_stock", 0)
          .or(orFilter)
          .order("registered_at", { ascending: false, nullsFirst: false })
          .order("reference", { ascending: true })
          .limit(1000);
        if (error) {
          console.error("Falha ao buscar referência Akause:", error);
          throw new Error("Não foi possível buscar produtos agora.");
        }
        const matches = rankSearchProducts((rows ?? []) as unknown as Product[], term);
        return typeof data.limit === "number" ? matches.slice(0, data.limit) : matches;
      }

      // A consulta convencional ajuda o banco a selecionar os resultados comuns.
      // Ainda é necessário verificar o catálogo completo para evitar falsos
      // negativos por acentos e por palavras em campos diferentes.
      const { error } = await sb
        .from("products")
        .select("reference")
        .eq("active", true)
        .gt("total_stock", 0)
        .or(orFilter)
        .limit(1);
      if (error) {
        console.error("Falha na pesquisa textual Akause:", error);
        throw new Error("Não foi possível buscar produtos agora.");
      }
    }

    // Etapa 2: fallback sem acentos em memória, sobre produtos ativos.
    // Paginação evita o limite padrão de 1000 linhas da API.
    const pageSize = 500;
    const products: Product[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const { data: rows, error } = await sb
        .from("products")
        .select(COLS)
        .eq("active", true)
        .gt("total_stock", 0)
        .order("registered_at", { ascending: false, nullsFirst: false })
        .order("reference", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error("Falha ao consultar o catálogo para busca Akause:", error);
        throw new Error("Não foi possível buscar produtos agora.");
      }

      const batch = (rows ?? []) as unknown as Product[];
      products.push(...batch);
      if (batch.length < pageSize) break;
    }

    const ranked = rankSearchProducts(products, term);
    return typeof data.limit === "number" ? ranked.slice(0, data.limit) : ranked;
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ reference: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    if (!sb) return null;
    const { data: row, error } = await sb.from("products").select(COLS).eq("reference", data.reference).maybeSingle();
    if (error) {
      console.error("Falha ao buscar produto Akause:", error);
      throw new Error("Não foi possível carregar este produto. Tente novamente.");
    }
    if (!row) return null;
    const p = row as unknown as Product;
    let variants: Product[] = [];
    if (p.group_code) {
      const { data: vs, error: variantsError } = await sb
        .from("products")
        .select(COLS)
        .eq("group_code", p.group_code)
        .gt("total_stock", 0)
        .limit(12);
      if (variantsError) {
        console.error("Falha ao buscar variações Akause:", variantsError);
        throw new Error("Não foi possível carregar as opções deste produto.");
      }
      variants = (vs ?? []) as unknown as Product[];
    }
    return { product: p, variants };
  });
