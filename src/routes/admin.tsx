import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Box,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminOverview } from "@/lib/admin.functions";

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Área administrativa | Akause" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Admin,
});

function loginErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
    case "invalid_login_credentials":
      return "E-mail ou senha incorretos.";
    case "email_not_confirmed":
      return "Este e-mail ainda não foi confirmado. Solicite a ativação da conta ao responsável pelo painel.";
    case "user_banned":
      return "Esta conta está temporariamente bloqueada. Contate o responsável pelo painel.";
    case "over_request_rate_limit":
    case "too_many_requests":
      return "Muitas tentativas de acesso. Aguarde um pouco antes de tentar novamente.";
    case "email_provider_disabled":
      return "A autenticação por e-mail e senha está desativada no Supabase.";
    default:
      return "Não foi possível entrar. Verifique as credenciais e tente novamente.";
  }
}

function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewBusy, setOverviewBusy] = useState(false);
  const [overviewError, setOverviewError] = useState("");

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error) throw error;
        setToken(data.session?.access_token ?? null);
      } catch {
        if (active) setLoginError("Não foi possível recuperar a sessão. Faça login novamente.");
      } finally {
        if (active) setSessionReady(true);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;
        setToken(session?.access_token ?? null);
        setSessionReady(true);
        if (!session) {
          setOverview(null);
          setOverviewError("");
        }
      },
    );

    void restoreSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadOverview = useCallback(async (accessToken: string) => {
    setOverviewBusy(true);
    setOverviewError("");
    setOverview(null);

    try {
      const response = await getAdminOverview({ data: { accessToken } });
      setOverview(response);
    } catch (error) {
      setOverviewError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o painel administrativo.",
      );
    } finally {
      setOverviewBusy(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      void loadOverview(token);
    } else {
      setOverview(null);
      setOverviewError("");
    }
  }, [token, loadOverview]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authBusy) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setLoginError("Informe seu e-mail e sua senha.");
      return;
    }

    setAuthBusy(true);
    setLoginError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setLoginError(loginErrorMessage(error.code));
        return;
      }

      if (!data.session?.access_token) {
        setLoginError("Não foi possível iniciar a sessão. Tente novamente.");
        return;
      }

      setPassword("");
      setShowPassword(false);
      setToken(data.session.access_token);
    } catch {
      setLoginError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout() {
    setAuthBusy(true);
    setOverviewError("");

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setToken(null);
      setOverview(null);
      setPassword("");
      setShowPassword(false);
    } catch {
      setOverviewError("Não foi possível encerrar a sessão. Tente novamente.");
    } finally {
      setAuthBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12 md:px-8">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
            Painel de controle
          </p>
          <h1 className="font-fraunces mt-2 text-5xl font-bold tracking-tight text-primary md:text-7xl">
            AKAUSE <span className="text-accent">ADMIN.</span>
          </h1>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary">
          <ArrowLeft size={18} aria-hidden="true" /> Voltar à loja
        </Link>
      </div>

      {!sessionReady ? (
        <div role="status" className="mx-auto flex max-w-md items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          Verificando sua sessão...
        </div>
      ) : !token ? (
        <section className="mx-auto max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
            <LockKeyhole className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <h2 className="font-fraunces mt-5 text-3xl font-bold text-primary">
            Bem-vinda ao painel
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Entre com seu e-mail autorizado e sua senha para gerenciar o acesso às informações da loja.
          </p>

          <form onSubmit={login} className="mt-7 space-y-5" aria-busy={authBusy}>
            <div>
              <label htmlFor="admin-email" className="block text-sm font-bold">
                E-mail
              </label>
              <input
                id="admin-email"
                required
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={authBusy}
                placeholder="seuemail@exemplo.com"
                className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-bold">
                Senha
              </label>
              <div className="relative mt-2">
                <input
                  id="admin-password"
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  maxLength={256}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={authBusy}
                  placeholder="Digite sua senha"
                  className="w-full rounded-xl border border-input bg-background py-3 pl-4 pr-12 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-primary"
                >
                  {showPassword
                    ? <EyeOff className="h-5 w-5" aria-hidden="true" />
                    : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {loginError && (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={authBusy}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-black text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
            >
              {authBusy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {authBusy ? "Entrando..." : "Entrar no painel"}
            </button>
          </form>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Acesso exclusivo para administradores autorizados.
          </p>
        </section>
      ) : (
        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="text-primary" size={20} aria-hidden="true" />
              {overview
                ? "Painel de leitura — sem alterações no fornecedor"
                : "Verificando permissão administrativa"}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { if (token) void loadOverview(token); }}
                disabled={overviewBusy || authBusy}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                <RefreshCw size={17} aria-hidden="true" />
                {overviewBusy ? "Atualizando..." : "Atualizar dados"}
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                disabled={authBusy}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                <LogOut size={17} aria-hidden="true" /> Sair
              </button>
            </div>
          </div>

          {overviewBusy && (
            <p role="status" className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
              Confirmando acesso e carregando informações...
            </p>
          )}

          {overviewError && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
              <AlertCircle size={20} className="shrink-0 text-destructive" aria-hidden="true" />
              <div>
                <p className="font-extrabold text-foreground">Não foi possível acessar o painel.</p>
                <p className="mt-2 text-muted-foreground">{overviewError}</p>
                <p className="mt-2 text-muted-foreground">
                  Se o login foi concluído, confira se seu e-mail está autorizado em AKAUSE_ADMIN_EMAILS.
                </p>
              </div>
            </div>
          )}

          {overview && (
            <div className="space-y-9">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-secondary p-6">
                  <Box className="text-primary" aria-hidden="true" />
                  <p className="mt-5 text-4xl font-black">{overview.count}</p>
                  <p className="text-xs font-black uppercase tracking-wider">Produtos acessíveis</p>
                </div>
                <div className="rounded-2xl bg-accent p-6">
                  <TrendingUp aria-hidden="true" />
                  <p className="mt-5 text-4xl font-black">
                    {overview.products.filter((item) => item.active && item.total_stock > 0).length}
                  </p>
                  <p className="text-xs font-black uppercase tracking-wider">Disponíveis na amostra</p>
                </div>
                <div className="rounded-2xl bg-muted p-6">
                  <RefreshCw aria-hidden="true" />
                  <p className="mt-5 text-2xl font-black">{overview.syncRuns?.[0]?.status ?? "—"}</p>
                  <p className="text-xs font-black uppercase tracking-wider">Última sincronização</p>
                </div>
              </div>

              <section>
                <h2 className="mb-4 text-2xl font-black uppercase">Integração XML</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  A sincronização é executada por uma rota protegida do servidor.
                  Esta tela apenas consulta o histórico e não dispara novas requisições ao fornecedor.
                </p>
                {overview.syncError && (
                  <p className="border-l-4 border-accent p-3 text-sm">{overview.syncError}</p>
                )}
                {overview.syncRuns && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-3">Início</th>
                          <th className="p-3">Situação</th>
                          <th className="p-3">Produtos</th>
                          <th className="p-3">Mensagem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.syncRuns.map((run) => (
                          <tr key={run.id} className="border-b">
                            <td className="p-3">{new Date(run.started_at).toLocaleString("pt-BR")}</td>
                            <td className="p-3 font-bold">{run.status}</td>
                            <td className="p-3">{run.products_count ?? "—"}</td>
                            <td className="p-3">{run.message ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {overview.syncRuns.length === 0 && (
                      <p className="p-4 text-sm text-muted-foreground">Ainda não existem importações registradas.</p>
                    )}
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-2 text-2xl font-black uppercase">Catálogo</h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Mostrando até 100 produtos recentes. Os valores são custos internos, não preços de venda.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3">Ref.</th>
                        <th className="p-3">Produto</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Estoque</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.products.map((item) => (
                        <tr key={item.reference} className="border-b">
                          <td className="p-3 text-muted-foreground">{item.reference}</td>
                          <td className="p-3 font-semibold">{item.name}</td>
                          <td className="p-3">{item.category}</td>
                          <td className="p-3">{item.total_stock}</td>
                          <td className="p-3">{item.active ? "Ativo" : "Inativo"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
