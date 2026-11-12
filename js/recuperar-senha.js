import { supabase } from "../supabase/supabase.js";
import { showMessage, pageUrl } from "./ui.js";

const form = document.getElementById("recoveryForm");
const emailInput = document.getElementById("email");
const button = document.getElementById("recoveryButton");
const buttonText = document.getElementById("buttonText");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  if (!email || !emailInput.checkValidity()) {
    showMessage(message, "Informe um endereço de e-mail válido.", "error");
    emailInput.focus();
    return;
  }

  button.disabled = true;
  buttonText.textContent = "Enviando...";
  showMessage(message, "Solicitando recuperação de senha...", "loading");

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // funciona mesmo se o site estiver em uma subpasta
      redirectTo: pageUrl("./redefinir-senha.html"),
    });
    if (error) throw error;

    showMessage(
      message,
      "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha. Confira também o spam.",
      "success"
    );
    form.reset();
  } catch (error) {
    console.error("Erro na recuperação de senha:", error);
    const rateLimit = /rate limit/i.test(error?.message || "");
    showMessage(
      message,
      rateLimit
        ? "O limite de envio de e-mails foi atingido. Aguarde antes de tentar novamente."
        : "Não foi possível solicitar a recuperação. Verifique sua conexão e tente novamente.",
      "error"
    );
  } finally {
    button.disabled = false;
    buttonText.textContent = "Enviar link de recuperação";
  }
});
