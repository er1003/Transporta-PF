/* Perfis de acesso do Transporta PF: aluno e servidor/trabalhador público.
 * O perfil é gravado em user_metadata.perfil no cadastro e conferido no login. */

export const PERFIS = {
  aluno: {
    rotulo: "Aluno",
    login: "./login-aluno.html",
    cadastroLabelEmail: "E-mail",
  },
  servidor: {
    rotulo: "Servidor público",
    login: "./login-servidor.html",
    cadastroLabelEmail: "E-mail institucional",
  },
};

export const perfilValido = (p) => Object.prototype.hasOwnProperty.call(PERFIS, p);

/** Lê o perfil de um usuário do Supabase (ou null para contas antigas, sem perfil). */
export const perfilDoUsuario = (user) => {
  const p = user?.user_metadata?.perfil;
  return perfilValido(p) ? p : null;
};
