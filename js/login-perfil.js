import { supabase } from "../supabase/supabase.js";
import { setupPasswordToggles, showMessage } from "./ui.js";
import { PERFIS, perfilValido, perfilDoUsuario } from "./perfil.js";

// A página define o perfil em <body data-perfil="aluno|servidor">
const perfil = document.body.dataset.perfil;
if (!perfilValido(perfil)) throw new Error("Perfil de login inválido: " + perfil);
const outro = perfil === "aluno" ? "servidor" : "aluno";

const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const message = document.getElementById("message");
const loginButton = document.getElementById("loginButton");

setupPasswordToggles();

/** Confere se a conta pertence a este portal. Contas antigas (sem perfil) são adotadas pelo portal usado. */
async function acessoPermitido(user) {
  const atual = perfilDoUsuario(user);
  if (atual === perfil) return true;
  if (atual === null) {
    await supabase.auth.updateUser({ data: { perfil } });
    return true;
  }
  return false;
}

async function recusar() {
  await supabase.auth.signOut();
  const rotulo = PERFIS[outro].rotulo.toLowerCase();
  showMessage(message, `Esta conta é de ${rotulo}. Use o login de ${rotulo}. `, "error");
  const link = document.createElement("a");
  link.href = PERFIS[outro].login;
  link.textContent = `Ir para o login de ${rotulo}`;
  message.appendChild(link);
}

// Quem já está logado vai direto ao painel (se o perfil bater)
supabase.auth.getSession().then(async ({ data }) => {
  const user = data?.session?.user;
  if (!user) return;
  if (await acessoPermitido(user)) window.location.replace(perfil === "aluno" ? "./aluno.html" : "./trabalhador-publico.html");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const emailValue = email.value.trim();
  const passwordValue = password.value;

  if (!emailValue || !passwordValue) {
    showMessage(message, "Informe seu e-mail e sua senha.", "error");
    (emailValue ? password : email).focus();
    return;
  }
  if (!email.checkValidity()) {
    showMessage(message, "Informe um e-mail válido.", "error");
    email.focus();
    return;
  }

  showMessage(message, "Verificando acesso...", "loading");
  loginButton.disabled = true;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailValue,
      password: passwordValue,
    });
    if (error) throw error;
    if (!data.session) throw new Error("Sessão não criada.");

    if (!(await acessoPermitido(data.user))) {
      await recusar();
      loginButton.disabled = false;
      return;
    }

    showMessage(message, "Acesso autorizado! Redirecionando...", "success");
    window.location.replace(perfil === "aluno" ? "./aluno.html" : "./trabalhador-publico.html");
  } catch (error) {
    console.error(error);
    const unconfirmed = /not confirmed/i.test(error?.message || "");
    showMessage(
      message,
      unconfirmed
        ? "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada."
        : "Não foi possível entrar. Verifique seu e-mail e senha.",
      "error"
    );
    loginButton.disabled = false;
  }
});
