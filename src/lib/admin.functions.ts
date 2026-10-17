import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function configuration() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const emails = new Set(
    (process.env["AKAUSE_ADMIN_EMAILS"] ?? "")
      .split(/[,;\n]/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!url || !key) {
    throw new Error("A conexão com o catálogo não está configurada no servidor.");
  }
  if (emails.size === 0) {
    throw new Error("O painel administrativo ainda não está ativado. Configure AKAUSE_ADMIN_EMAILS no ambiente do servidor.");
  }

  return { url, key, emails };
}

function userClient(url: string, key: string, accessToken?: string) {
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      ...(accessToken
        ? { headers: { Authorization: "Bearer " + accessToken } }
        : {}),
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        // Chaves sb_publishable_* não são JWTs; o token do usuário deve continuar no Bearer.
        if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const getAdminOverview = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) =>
    z.object({
      accessToken: z.string().min(20).max(10000),
    }).parse(value),
  )
  .handler(async ({ data }) => {
    const { url, key, emails } = configuration();

    // Nunca confie no e-mail informado pelo cliente nem somente no JWT decodificado.
    // getUser valida a sessão junto ao Supabase Auth.
    const verifier = userClient(url, key);
    const { data: verified, error: authError } =
      await verifier.auth.getUser(data.accessToken);

    if (authError || !verified.user) {
      throw new Error("Sua sessão é inválida ou expirou. Saia do painel e entre novamente.");
    }

    const email = verified.user.email?.trim().toLowerCase();
    if (!email) {
      throw new Error("A conta autenticada não possui um e-mail válido.");
    }
    if (!emails.has(email)) {
      throw new Error("Este e-mail não está autorizado a acessar o painel Akause. Solicite a inclusão em AKAUSE_ADMIN_EMAILS.");
    }

    // Após verificar identidade e allowlist, o acesso ao banco ainda respeita RLS.
    // Jamais usar a service_role para consultar dados em nome do usuário.
    const authenticated = userClient(url, key, data.accessToken);
    const [products, runs] = await Promise.all([
      authenticated
        .from("products")
        .select("reference,name,category,brand,cost_price,total_stock,active,updated_at", { count: "exact" })
        .order("updated_at", { ascending: false })
        .limit(100),
      authenticated
        .from("sync_runs")
        .select("id,status,message,products_count,started_at,finished_at")
        .order("started_at", { ascending: false })
        .limit(10),
    ]);

    if (products.error) {
      console.error("Akause: falha de permissão na leitura do catálogo administrativo.", products.error);
      throw new Error("Acesso autenticado, mas sem permissão para consultar o catálogo. Verifique as políticas RLS no Supabase.");
    }

    return {
      products: products.data ?? [],
      count: products.count ?? 0,
      syncRuns: runs.error ? null : (runs.data ?? []),
      syncError: runs.error
        ? "Histórico de sincronização indisponível para este usuário. Verifique as políticas RLS de sync_runs."
        : null,
    };
  });
