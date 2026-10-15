import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { parseFeed } from "@/lib/xmldrop.server";

export const Route = createFileRoute("/api/public/jobs/sync-stock")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;

        const token = process.env["XMLDROP_TOKEN"];
        if (!token) return new Response("Missing supplier token", { status: 500 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: run } = await supabaseAdmin.from("sync_runs").insert({}).select("id").single();
        const finish = (status: string, message: string, count?: number) =>
          run &&
          supabaseAdmin
            .from("sync_runs")
            .update({ status, message, products_count: count ?? null, finished_at: new Date().toISOString() })
            .eq("id", run.id);

        try {
          const url = `https://www.revendadecalcados.com.br/xmldrop?token=${encodeURIComponent(token)}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Feed HTTP ${res.status}`);
          const products = parseFeed(await res.text());
          if (products.length === 0) throw new Error("Feed returned no products");

          const now = new Date().toISOString();
          for (let i = 0; i < products.length; i += 200) {
            const chunk = products.slice(i, i + 200).map((p) => ({ ...p, active: true, updated_at: now }));
            const { error } = await supabaseAdmin.from("products").upsert(chunk, { onConflict: "reference" });
            if (error) throw error;
          }
          // Products no longer in the feed are hidden.
          await supabaseAdmin.from("products").update({ active: false, total_stock: 0 }).lt("updated_at", now);

          await finish("ok", "Synced", products.length);
          return Response.json({ success: true, count: products.length });
        } catch (e) {
          console.error(e);
          await finish("error", e instanceof Error ? e.message : "Unknown error");
          return Response.json({ success: false }, { status: 502 });
        }
      },
    },
  },
});
