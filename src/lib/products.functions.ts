import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { CATEGORIES, type Product } from "./store";

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
    let query = sb.from("products").select(COLS).gt("total_stock", 0);
    const cat = CATEGORIES.find((c) => c.slug === data.category);
    if (cat) query = query.or(cat.match.map((m) => `category.ilike.${m}`).join(","));
    if (data.q) {
      const s = data.q.replace(/[%,()]/g, " ");
      query = query.or(`name.ilike.%${s}%,color.ilike.%${s}%,brand.ilike.%${s}%,category.ilike.%${s}%`);
    }
    if (data.sort === "price_asc") query = query.order("cost_price", { ascending: true });
    else if (data.sort === "price_desc") query = query.order("cost_price", { ascending: false });
    else query = query.order("registered_at", { ascending: false, nullsFirst: false });
    const { data: rows, error } = await query.limit(400);
    if (error) {
      console.error("Falha ao carregar catálogo Akause:", error);
      throw new Error("Não foi possível carregar os produtos. Tente novamente em instantes.");
    }
    return rows as unknown as Product[];
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
