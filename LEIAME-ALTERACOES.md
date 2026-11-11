# Transporta PF — o que foi corrigido e redesenhado

## Bugs corrigidos
- **Cadastro**: `emailRedirectTo` gerava uma URL inválida (`http://host../html/login.html`) → o link do e-mail de confirmação quebrava.
- **Acessibilidade**: "Fonte acessível" e "Reduzir animações" nunca funcionavam (o JS gravava `data-font="on"`/`data-motion="on"`, o CSS esperava `legible`/`off`).
- **Painel**: botão de menu mobile não tinha código (menu não abria); avatar ficava sempre "U"; saudação nunca mostrava o nome.
- **Home**: no celular o menu (Recursos/Como funciona/Vantagens) simplesmente sumia — agora há menu hambúrguer.
- **Login**: `<div>` não fechada aninhava o botão dentro do campo de senha.
- **HTML**: `<?xml ...?>` dentro do `<body>`; favicon apontando para arquivo inexistente (`assets/icon.png`) e pasta `assests` (typo) renomeada para `assets`; SVG de ~30 KB repetido inline em 2 páginas (agora `<img>`).
- **Logo** invisível no tema escuro (cor fixa navy) — agora se adapta.
- **Recuperação/redefinição de senha**: URL de retorno agora funciona mesmo em subpasta; redefinir usa o evento do Supabase em vez de `setTimeout(300)`.
- Links mortos do painel (`href="#"`) agora marcados "Em breve"; `console.log` e botão "Esqueceu a senha" via JS removidos.
- **Backend**: chaves estrangeiras do SQLite estavam desligadas; PUT de aluno/viagem sem tratamento de erro (500); DELETE de motorista/veículo em uso agora retorna 409.

## Redesign
Design system único em `global/global.css` (tokens, tema claro/escuro, alto contraste, ícones SVG no lugar de emojis). Todas as páginas (inclusive login, cadastro, painel e termos) agora compartilham o tema escuro e o painel de acessibilidade. `css/login|cadastro|recuperar-senha|redefinir-senha|termos|privacidade.css` foram unificados no global.

## Atenção (precisa de você)
- Termos e Política de Privacidade ainda têm o texto **[INSIRA O E-MAIL OFICIAL]**.
- A pasta `Backend/venv` (binários Windows, 15 MB) foi removida do pacote; recrie com `python -m venv`.
- O front-end usa só o Supabase; o Backend Flask não é chamado por nenhuma página.

## Login separado: aluno × servidor/trabalhador público
- `html/login.html` virou o **seletor** ("Sou aluno" / "Sou servidor / trabalhador público").
- Novas telas: `html/login-aluno.html` e `html/login-servidor.html` (mesma lógica em `js/login-perfil.js`, perfil definido por `<body data-perfil="...">`). O antigo `js/login.js` foi removido.
- `js/perfil.js`: definição dos perfis (rótulos e página de login de cada um).
- **Cadastro** ganhou "Tipo de conta" e grava `perfil` em `user_metadata` do Supabase; aceita `?perfil=aluno|servidor`.
- No login, se a conta é do outro perfil, a sessão é encerrada e o usuário é direcionado ao login correto. Contas antigas (sem perfil) são adotadas pelo portal em que entrarem pela primeira vez.
- **Limitação:** `user_metadata` é editável pelo próprio usuário, então isso é separação de interface, não controle de acesso. Para restringir de verdade (ex.: só servidor ver/editar alunos), crie uma tabela `perfis` no Supabase com RLS (ou use `app_metadata`, que só o servidor altera) e valide o domínio do e-mail institucional (ex.: `.gov.br`) no servidor.
