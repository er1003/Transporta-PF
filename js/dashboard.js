import { supabase } from "../supabase/supabase.js";

const userName = document.getElementById("userName");
const userAvatar = document.getElementById("userAvatar");
const welcomeName = document.getElementById("welcomeName");
const logoutButton = document.getElementById("logoutButton");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
const menuToggle = document.getElementById("menuToggle");

const goToLogin = () => window.location.replace("./login.html");

/* ---------- autenticação ---------- */
async function verificarUsuario() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    goToLogin();
    return;
  }

  const user = data.user;
  const fullName = (user.user_metadata?.full_name || "").trim();
  const display = fullName || user.email || "Usuário";

  userName.textContent = display;
  // Corrigido: avatar e saudação antes nunca eram preenchidos
  userAvatar.textContent = display.charAt(0).toUpperCase();
  welcomeName.textContent = fullName ? fullName.split(/\s+/)[0] + "!" : "seja bem-vindo!";
}

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") goToLogin();
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert("Erro ao sair: " + error.message);
    logoutButton.disabled = false;
  } else {
    goToLogin();
  }
});

/* ---------- menu lateral (mobile) — antes não tinha nenhum código ---------- */
function setMenu(open) {
  sidebar.classList.toggle("open", open);
  overlay.classList.toggle("show", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  const ico = menuToggle.querySelector(".ico");
  if (ico) { ico.classList.toggle("i-x", open); ico.classList.toggle("i-menu", !open); }
}
menuToggle.addEventListener("click", () => setMenu(!sidebar.classList.contains("open")));
overlay.addEventListener("click", () => setMenu(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
window.matchMedia("(min-width: 761px)").addEventListener("change", () => setMenu(false));

/* itens ainda não implementados não navegam */
document.querySelectorAll(".nav-link.is-soon").forEach((a) =>
  a.addEventListener("click", (e) => e.preventDefault())
);

verificarUsuario();
