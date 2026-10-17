# Configuração do login administrativo Akause

A rota /admin agora usa email e senha com signInWithPassword. Não necessita de SMTP ou Magic Link.

## Variável de acesso no servidor

Configure AKAUSE_ADMIN_EMAILS em Production na Vercel com os endereços autorizados, separados por vírgulas.

Exemplo (substitua pelo endereço real):

~~~text
AKAUSE_ADMIN_EMAILS=admin@akause.com.br
~~~

A lista é uma autorização adicional ao login. Não exponha senhas nem chaves secretas em variáveis VITE_*.

## Criação ou atualização da conta sem SMTP (método recomendado)

Use scripts/provision-admin.mjs com as seguintes variáveis de ambiente disponíveis somente em ambiente confiável:

- SUPABASE_URL: endereço do Auth do projeto correto.
- SUPABASE_SERVICE_ROLE_KEY: chave privilegiada do mesmo projeto, apenas no ambiente de execução.
- AKAUSE_ADMIN_EMAIL: o e-mail que consta em AKAUSE_ADMIN_EMAILS.
- AKAUSE_ADMIN_PASSWORD: senha de pelo menos 12 caracteres.
- AKAUSE_ADMIN_RESET_EXISTING=true: habilite apenas para alterar a senha de conta preexistente.

Depois execute:

~~~sh
node scripts/provision-admin.mjs
~~~

A rotina usa Supabase Auth Admin API createUser com email_confirm=true e, quando expressamente autorizado, updateUserById. A confirmação é feita pelo backend de Auth sem enviar e-mail. Não existe endpoint público de cadastro de administrador.

## SQL de verificação do cadastro

Execute apenas no SQL editor do projeto Supabase correto:

~~~sql
SELECT
  id,
  email,
  email_confirmed_at IS NOT NULL AS email_confirmado,
  encrypted_password IS NOT NULL AS tem_senha
FROM auth.users
WHERE lower(email) = lower('admin@akause.com.br');
~~~

Não recomendamos criar usuários por INSERT direto no schema interno auth: o registro deve possuir uma identidade consistente em auth.identities e o esquema pode mudar. Prefira a API Admin. Se o ambiente Lovable Cloud não fornece acesso à chave de serviço, use a administração Auth oferecida pelo provedor ou o responsável pela infraestrutura.

## Regras de acesso e RLS

A função getAdminOverview exige token válido, e-mail exato presente em AKAUSE_ADMIN_EMAILS e acesso permitido pelas políticas RLS em products e sync_runs.

Não conceda acesso administrativo a todos os usuários authenticated. Auth.user_metadata é editável pelo usuário e não deve controlar permissões. Políticas RLS administrativas devem verificar uma lista privada de IDs autorizados ou atributos app_metadata administrados apenas no servidor.

## Checklist

1. Cadastre/atualize a senha por Auth Admin API, com e-mail confirmado.
2. Confirme a allowlist AKAUSE_ADMIN_EMAILS em produção e execute novo deploy após alterar.
3. Teste /admin com senha incorreta e correta.
4. Teste com outra conta autenticada não autorizada; o painel não deve mostrar informações.
5. Teste sair, restaurar sessão e atualizar dados.
6. Garanta que chaves privadas não estejam em arquivos versionados ou variáveis VITE_*.
