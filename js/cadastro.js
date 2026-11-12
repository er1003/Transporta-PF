import { supabase } from "../supabase/supabase.js";
import { setupPasswordToggles, showMessage, pageUrl } from "./ui.js";
import { PERFIS, perfilValido } from "./perfil.js";

const signupForm = document.getElementById("signupForm");
const nameInput = document.getElementById("name");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const confirmPassword = document.getElementById("confirmPassword");
const terms = document.getElementById("terms");
const signupMessage = document.getElementById("signupMessage");
const passwordFeedback = document.getElementById("passwordFeedback");
const termsFeedback = document.getElementById("termsFeedback");
const signupButton = document.getElementById("signupButton");

const HINT = "Utilize pelo menos 8 caracteres.";

setupPasswordToggles();

/* ---------- tipo de conta (aluno | servidor) ---------- */
const perfilRadios = document.querySelectorAll('input[name="perfil"]');
const emailLabel = document.getElementById("signupEmailLabel");
const loginLink = document.getElementById("loginLink");
const perfilAtual = () => document.querySelector('input[name="perfil"]:checked').value;

function aplicarPerfil() {
  const p = perfilAtual();
  emailLabel.textContent = PERFIS[p].cadastroLabelEmail;
  signupEmail.placeholder = p === "servidor" ? "nome@orgao.gov.br" : "seuemail@exemplo.com";
  loginLink.href = PERFIS[p].login;
}
perfilRadios.forEach((r) => r.addEventListener("change", aplicarPerfil));

// ?perfil=servidor na URL (vindo da tela de login) pré-seleciona o tipo de conta
const perfilUrl = new URLSearchParams(window.location.search).get("perfil");
if (perfilValido(perfilUrl)) {
  document.querySelector(`input[name="perfil"][value="${perfilUrl}"]`).checked = true;
}
aplicarPerfil();

function setFeedback(text, type = "") {
  passwordFeedback.textContent = text;
  passwordFeedback.className = ("input-hint " + type).trim();
}

// Valida as senhas; "touched" controla se já mostramos erros de campo vazio.
function verificarSenhas() {
  const pw = signupPassword.value;
  const confirmation = confirmPassword.value;

  signupPassword.classList.remove("invalid", "valid");
  confirmPassword.classList.remove("invalid", "valid");

  if (!pw && !confirmation) {
    setFeedback(HINT);
    return false;
  }
  if (pw.length < 8) {
    setFeedback("Utilize pelo menos 8 caracteres.", "error");
    signupPassword.classList.add("invalid");
    return false;
  }
  if (!confirmation) {
    setFeedback("Confirme sua senha.");
    return false;
  }
  if (pw !== confirmation) {
    setFeedback("As senhas não coincidem.", "error");
    signupPassword.classList.add("invalid");
    confirmPassword.classList.add("invalid");
    return false;
  }
  setFeedback("As senhas coincidem.", "success");
  signupPassword.classList.add("valid");
  confirmPassword.classList.add("valid");
  return true;
}

signupPassword.addEventListener("input", verificarSenhas);
confirmPassword.addEventListener("input", verificarSenhas);
terms.addEventListener("change", () => { termsFeedback.textContent = ""; });

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;
  const perfil = perfilAtual();

  showMessage(signupMessage, "");
  termsFeedback.textContent = "";

  if (!name) {
    showMessage(signupMessage, "Informe seu nome completo.", "error");
    nameInput.focus();
    return;
  }
  if (!email || !signupEmail.checkValidity()) {
    showMessage(signupMessage, "Informe um e-mail válido.", "error");
    signupEmail.focus();
    return;
  }
  if (!verificarSenhas()) {
    showMessage(signupMessage, "Verifique as senhas antes de continuar.", "error");
    signupPassword.focus();
    return;
  }
  if (!terms.checked) {
    termsFeedback.textContent = "Você precisa aceitar os termos e a política de privacidade.";
    terms.focus();
    return;
  }

  signupButton.disabled = true;
  signupButton.textContent = "Criando conta...";
  showMessage(signupMessage, "Enviando seus dados...", "loading");

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, perfil },
        // Corrigido: antes gerava "http://host../html/login.html" (URL inválida)
        emailRedirectTo: pageUrl(PERFIS[perfil].login),
      },
    });
    if (error) throw error;

    if (data.session) {
      showMessage(signupMessage, "Cadastro realizado com sucesso!", "success");
      window.location.replace("./dashboard.html");
      return;
    }

    showMessage(
      signupMessage,
      "Cadastro realizado! Verifique seu e-mail para confirmar sua conta.",
      "success"
    );
    signupForm.reset();
    aplicarPerfil();
    setFeedback(HINT);
    signupPassword.classList.remove("valid");
    confirmPassword.classList.remove("valid");
  } catch (error) {
    console.error("Erro no cadastro:", error);
    const jaExiste = /already|registered/i.test(error?.message || "");
    showMessage(
      signupMessage,
      jaExiste
        ? "Este e-mail já está cadastrado. Tente fazer login."
        : "Não foi possível realizar o cadastro: " + (error?.message || "erro desconhecido"),
      "error"
    );
  } finally {
    signupButton.disabled = false;
    signupButton.textContent = "Criar minha conta";
  }
});
