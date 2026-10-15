import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Box, LockKeyhole, LogOut, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminOverview } from "@/lib/admin.functions";

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;
export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin | Akause" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Admin,
});

function Admin() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) setToken(data.session?.access_token ?? null); }).catch(() => { if (alive) setError("Não foi possível recuperar a sessão."); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (alive) { setToken(session?.access_token ?? null); setOverview(null); } });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(""); setSent(false);
    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      if (signInError) throw new Error("Não foi possível enviar o link. Verifique se o provedor de e-mail está habilitado no Lovable Cloud.");
      setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao enviar o link."); }
    finally { setLoading(false); }
  }
  async function refresh() {
    if (!token) return;
    setLoading(true); setError("");
    try { setOverview(await getAdminOverview({ data: { accessToken: token } })); }
    catch (e) { setOverview(null); setError(e instanceof Error ? e.message : "Erro ao consultar o painel."); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (token) void refresh(); }, [token]);
  async function logout() { await supabase.auth.signOut(); setOverview(null); setToken(null); }

  return <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12 md:px-8">
    <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Painel de controle</p><h1 className="editorial-title mt-2 text-5xl md:text-7xl">AKAUSE <span className="text-accent">ADMIN.</span></h1></div>
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={18}/> Voltar à loja</Link>
    </div>
    {!token ? <section className="mx-auto max-w-md border border-border bg-card p-6 shadow-sm md:p-10">
      <LockKeyhole size={28} className="text-primary"/>
      <h2 className="mt-4 text-2xl font-black">Acesso restrito</h2>
      <p className="mt-2 text-sm text-muted-foreground">Informe o e-mail autorizado. Enviaremos um link de acesso, sem precisar de senha.</p>
      <form onSubmit={login} className="mt-7 space-y-4">
        <label className="block text-sm font-semibold">E-mail<input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-4 py-3"/></label>
        {sent && <p role="status" className="rounded-md bg-secondary p-3 text-sm font-semibold text-primary">Link solicitado! Confira sua caixa de entrada e spam. O link retorna para /admin.</p>}
        <button disabled={loading} type="submit" className="w-full bg-primary px-5 py-3 font-black text-primary-foreground disabled:opacity-50">{loading ? "Enviando..." : "Enviar link de acesso"}</button>
      </form>
    </section> : <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="text-primary" size={20}/> Painel de leitura — sem alterações no fornecedor</div>
        <div className="flex gap-3"><button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 border px-4 py-2 text-sm font-bold disabled:opacity-50"><RefreshCw size={17}/>{loading ? "Atualizando..." : "Atualizar dados"}</button><button onClick={logout} className="inline-flex items-center gap-2 border px-4 py-2 text-sm font-bold"><LogOut size={17}/> Sair</button></div>
      </div>
      {overview && <div className="space-y-9">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-secondary p-6"><Box className="text-primary"/><p className="mt-5 text-4xl font-black">{overview.count}</p><p className="text-xs font-black uppercase tracking-wider">Produtos acessíveis</p></div>
          <div className="bg-accent p-6"><TrendingUp/><p className="mt-5 text-4xl font-black">{overview.products.filter(p=>p.active && p.total_stock>0).length}</p><p className="text-xs font-black uppercase tracking-wider">Disponíveis na amostra</p></div>
          <div className="bg-muted p-6"><RefreshCw/><p className="mt-5 text-2xl font-black">{overview.syncRuns?.[0]?.status ?? "—"}</p><p className="text-xs font-black uppercase tracking-wider">Última sincronização</p></div>
        </div>
        <section><h2 className="mb-4 text-2xl font-black uppercase">Integração XML</h2>
          <p className="mb-4 text-sm text-muted-foreground">A sincronização é executada por uma rota protegida do servidor. Esta tela apenas consulta o histórico e não dispara novas requisições ao fornecedor.</p>
          {overview.syncError && <p className="border-l-4 border-accent p-3 text-sm">{overview.syncError}</p>}
          {overview.syncRuns && <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-muted"><tr><th className="p-3">Início</th><th className="p-3">Situação</th><th className="p-3">Produtos</th><th className="p-3">Mensagem</th></tr></thead><tbody>{overview.syncRuns.map(r=><tr key={r.id} className="border-b"><td className="p-3">{new Date(r.started_at).toLocaleString("pt-BR")}</td><td className="p-3 font-bold">{r.status}</td><td className="p-3">{r.products_count ?? "—"}</td><td className="p-3">{r.message ?? "—"}</td></tr>)}</tbody></table>{overview.syncRuns.length===0 && <p className="p-4 text-sm text-muted-foreground">Ainda não existem importações registradas.</p>}</div>}
        </section>
        <section><h2 className="mb-2 text-2xl font-black uppercase">Catálogo</h2><p className="mb-5 text-sm text-muted-foreground">Mostrando até 100 produtos recentes. Os valores são custos internos, não preços de venda.</p>
          <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-muted"><tr><th className="p-3">Ref.</th><th className="p-3">Produto</th><th className="p-3">Categoria</th><th className="p-3">Estoque</th><th className="p-3">Status</th></tr></thead><tbody>{overview.products.map(p=><tr key={p.reference} className="border-b"><td className="p-3 text-muted-foreground">{p.reference}</td><td className="p-3 font-semibold">{p.name}</td><td className="p-3">{p.category}</td><td className="p-3">{p.total_stock}</td><td className="p-3">{p.active ? "Ativo" : "Inativo"}</td></tr>)}</tbody></table></div>
        </section>
      </div>}
    </section>}
    {error && <div role="alert" className="mt-6 flex items-start gap-2 border-l-4 border-destructive bg-muted p-4 text-sm font-semibold"><AlertCircle size={20} className="shrink-0"/>{error}</div>}
  </main>;
}
