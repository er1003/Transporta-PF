/* Utilitários de interface compartilhados pelas telas de acesso */

/** Mostra/oculta senha em todos os botões [data-target] (ou no botão informado). */
export function setupPasswordToggles(scope = document) {
  scope.querySelectorAll(".toggle-password, #togglePassword").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.dataset.target
        ? document.getElementById(button.dataset.target)
        : button.closest(".password-wrapper")?.querySelector("input");
      if (!input) return;

      const show = input.type === "password";
      input.type = show ? "text" : "password";

      const ico = button.querySelector(".ico");
      if (ico) {
        ico.classList.toggle("i-eye-off", show);
        ico.classList.toggle("i-eye", !show);
      }
      button.setAttribute("aria-pressed", String(show));
      button.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
    });
  });
}

/** Exibe uma mensagem de status (info | success | error | loading). Texto vazio limpa. */
export function showMessage(el, text, type = "info") {
  el.textContent = text;
  el.className = text ? `message ${type}` : "message";
}

/** Monta uma URL absoluta para outra página da mesma pasta, funcione onde o site estiver hospedado. */
export function pageUrl(file) {
  return new URL(file, window.location.href).href;
}
