import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function configuration() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const emails = (process.env["AKAUSE_ADMIN_EMAILS"] || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  if (!url || !key) throw new Error("A conexão com o catálogo não está configurada.");
  if (!emails.length) throw new Error("Painel administrativo ainda não ativado: configure AKAUSE_ADMIN_EMAILS na Vercel.");
  return { url, key, emails };
}

export const getAdminOverview = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => z.object({ accessToken: z.string().min(20).max(10000) }).parse(value))
  .handler(async ({ data }) => {
    const { url, key, emails } = configuration();
    const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: verified, error: authError } = await client.auth.getUser(data.accessToken);
    const email = verified.user?.email?.toLowerCase();
    if (authError || !email || !emails.includes(email)) throw new Error("Acesso administrativo não autorizado.");
    // Requisições com o JWT do usuário mantêm as políticas RLS do backend.
    const authenticated = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
    });
    const [products, runs] = await Promise.all([
      authenticated.from("products").select("reference,name,category,brand,cost_price,total_stock,active,updated_at", { count: "exact" }).order("updated_at", { ascending: false }).limit(100),
      authenticated.from("sync_runs").select("id,status,message,products_count,started_at,finished_at").order("started_at", { ascending: false }).limit(10),
    ]);
    if (products.error) throw new Error("Sem permissão para consultar produtos. Verifique as políticas RLS administrativas no Lovable Cloud.");
    return {
      products: products.data ?? [],
      count: products.count ?? 0,
      syncRuns: runs.error ? null : (runs.data ?? []),
      syncError: runs.error ? "Histórico de sincronização indisponível para este usuário." : null,
    };
  });
