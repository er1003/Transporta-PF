import { supabase } from "../supabase/supabase.js";
import { setupPasswordToggles, showMessage } from "./ui.js";

const form = document.getElementById("resetForm");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const button = document.getElementById("resetButton");
const message = document.getElementById("resetMessage");

setupPasswordToggles();

let recoverySessionValid = false;

function invalidLink() {
  showMessage(message, "Seu link de recuperação é inválido ou expirou. Solicite um novo e-mail.", "error");
  button.disabled = true;
}

// O Supabase lê o token do fragmento (#...) da URL e cria a sessão de recuperação.
// Esperamos o evento PASSWORD_RECOVERY/SIGNED_IN em vez de usar um atraso fixo.
async function checkRecoverySession() {
  const hash = window.location.hash;
  if (/error=|error_code=/.test(hash)) { invalidLink(); return; }

  let { data } = await supabase.auth.getSession();

  if (!data?.session && /access_token|type=recovery/.test(hash)) {
    data = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve({}), 3000);
      supabase.auth.onAuthStateChange((event, session) => {
        if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
          clearTimeout(timer);
          resolve({ session });
        }
      });
    });
  }

  if (!data?.session) { invalidLink(); return; }
  recoverySessionValid = true;
}

await checkRecoverySession();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!recoverySessionValid) {
    showMessage(message, "Solicite um novo link de recuperação.", "error");
    return;
  }
  if (password.value.length < 8) {
    showMessage(message, "A senha precisa ter pelo menos 8 caracteres.", "error");
    password.focus();
    return;
  }
  if (password.value !== confirmPassword.value) {
    showMessage(message, "As senhas não coincidem.", "error");
    confirmPassword.focus();
    return;
  }

  button.disabled = true;
  button.textContent = "Salvando...";

  try {
    const { error } = await supabase.auth.updateUser({ password: password.value });
    if (error) throw error;

    showMessage(message, "Senha alterada com sucesso! Você será redirecionado para o login.", "success");
    form.reset();
    await supabase.auth.signOut();
    setTimeout(() => window.location.replace("./login.html"), 2000);
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    showMessage(message, error?.message || "Não foi possível alterar sua senha.", "error");
    button.disabled = false;
    button.textContent = "Salvar nova senha";
  }
});
