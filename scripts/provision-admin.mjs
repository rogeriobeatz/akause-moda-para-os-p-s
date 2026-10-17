/**
 * Provisionamento manual de administrador, sem SMTP e sem SQL em auth.users.
 *
 * Variáveis obrigatórias:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   AKAUSE_ADMIN_EMAIL
 *   AKAUSE_ADMIN_PASSWORD
 *
 * Para uma conta criada anteriormente via Magic Link, autorize
 * explicitamente a atualização com AKAUSE_ADMIN_RESET_EXISTING=true.
 *
 * Execute somente em ambiente administrativo confiável:
 *   node scripts/provision-admin.mjs
 *
 * Nunca exponha SUPABASE_SERVICE_ROLE_KEY ao navegador, nem salve senhas
 * em arquivos versionados ou na saída do terminal.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env["SUPABASE_URL"]?.trim();
const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
const email = process.env["AKAUSE_ADMIN_EMAIL"]?.trim().toLowerCase();
const password = process.env["AKAUSE_ADMIN_PASSWORD"];
const allowReset = process.env["AKAUSE_ADMIN_RESET_EXISTING"] === "true";

if (!url || !serviceKey || !email || !password) {
  throw new Error(
    "Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AKAUSE_ADMIN_EMAIL e AKAUSE_ADMIN_PASSWORD.",
  );
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Informe um e-mail válido em AKAUSE_ADMIN_EMAIL.");
}
if (password.length < 12) {
  throw new Error("Use uma senha com pelo menos 12 caracteres.");
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findExistingUser() {
  const perPage = 200;
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.trim().toLowerCase() === email);
    if (found) return found;
    if (data.users.length < perPage) return null;
  }
}

const existing = await findExistingUser();

if (existing) {
  if (!allowReset) {
    throw new Error(
      "Este e-mail já existe no Supabase Auth. Para cadastrar a senha na mesma conta, execute novamente com AKAUSE_ADMIN_RESET_EXISTING=true.",
    );
  }

  const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (error) throw error;
  if (!data.user?.email_confirmed_at) {
    throw new Error("A atualização ocorreu, mas não foi possível confirmar a verificação do e-mail.");
  }

  console.log("Conta existente atualizada e e-mail confirmado:", data.user.email);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "Administrador Akause" },
  });
  if (error) throw error;
  if (!data.user?.email_confirmed_at) {
    throw new Error("Conta criada, mas a confirmação do e-mail não foi verificada.");
  }

  console.log("Conta administrativa criada e e-mail confirmado:", data.user.email);
}

console.log(
  "Confirme que o endereço consta em AKAUSE_ADMIN_EMAILS no ambiente de produção.",
);
