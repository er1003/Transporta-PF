import { supabase } from "../supabase/supabase.js";

/* Portal (aluno, servidor, perfil, viagens-admin): sessão, identidade, menu mobile
 * e formulário de conta. Tema/contraste/fonte vêm do global.js (window.TPF),
 * que é a única fonte de verdade das preferências. */

const page = document.body.dataset.page;
const $ = (s) => document.querySelector(s);

const HOME = {
  aluno: "./aluno.html",
  servidor: "./trabalhador-publico.html",
};

function displayName(user) {
  return (user?.user_metadata?.full_name || user?.email || "Usuário").trim();
}
function initials(name) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function setupMobile() {
  const btn = $("#mobileMenu");
  const nav = document.querySelector(".portal-menu");
  if (!btn || !nav) return;
  btn.setAttribute("aria-expanded", "false");
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("mobile-open");
    btn.setAttribute("aria-expanded", String(open));
  });
  // fecha o menu ao escolher uma opção
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) {
      nav.classList.remove("mobile-open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    window.location.replace("./login.html");
    return null;
  }
  return data.user;
}

export function fillIdentity(user) {
  const name = displayName(user);
  const first = name.split(/\s+/)[0];
  const avatar = initials(name);
  if ($("#userName")) $("#userName").textContent = name;
  if ($("#firstName")) $("#firstName").textContent = first;
  if ($("#avatar")) $("#avatar").textContent = avatar;
  if ($("#profileAvatar")) $("#profileAvatar").textContent = avatar;
  if ($("#roleLabel"))
    $("#roleLabel").textContent =
      user.user_metadata?.perfil === "servidor"
        ? "Trabalhador público"
        : "Aluno";
}

/** Formulário "Dados pessoais" + preferências + sair. Usado em perfil-configuracoes e na aba Conta do aluno. */
function setupAccount(user) {
  const form = $("#profileForm");
  if (!form) return;
  const metadata = user.user_metadata || {};
  $("#fullName").value = metadata.full_name || "";
  $("#email").value = user.email || "";
  $("#phone").value = metadata.phone || "";
  $("#perfil").value =
    metadata.perfil === "servidor" ? "Trabalhador público" : "Aluno";

  // Preferências (global.js)
  const dark = $("#darkMode"),
    contrast = $("#contrastMode"),
    font = $("#fontMode");
  const syncPrefs = () => {
    const s = window.TPF?.get() || {};
    if (dark) dark.checked = window.TPF?.isDark() ?? false;
    if (contrast) contrast.checked = !!s.contrast;
    if (font) font.checked = !!s.font;
  };
  syncPrefs();
  document.addEventListener("tpf:settings", syncPrefs);
  dark?.addEventListener("change", () =>
    window.TPF?.update({ theme: dark.checked ? "dark" : "light" }),
  );
  contrast?.addEventListener("change", () =>
    window.TPF?.update({ contrast: contrast.checked }),
  );
  font?.addEventListener("change", () =>
    window.TPF?.update({ font: font.checked }),
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = $("#profileMessage"),
      button = $("#saveProfile");
    const fullName = $("#fullName").value.trim(),
      phone = $("#phone").value.trim();
    if (!fullName) {
      message.className = "message error";
      message.textContent = "Informe seu nome completo.";
      return;
    }
    button.disabled = true;
    message.className = "message info";
    message.textContent = "Salvando...";
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, phone },
    });
    button.disabled = false;
    if (error) {
      message.className = "message error";
      message.textContent = "Não foi possível salvar. Tente novamente.";
      return;
    }
    message.className = "message success";
    message.textContent = "Dados atualizados com sucesso.";
    user = {
      ...user,
      user_metadata: { ...user.user_metadata, full_name: fullName, phone },
    };
    fillIdentity(user);
  });

  $("#logoutButton")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.replace("./login.html");
  });

  // Sub-abas (somente na página perfil-configuracoes)
  const buttons = document.querySelectorAll(".profile-nav [data-tab]");
  const panels = document.querySelectorAll(".tab-panel");
  buttons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = btn.dataset.tab;
      buttons.forEach((b) => b.classList.toggle("active", b === btn));
      panels.forEach((p) => (p.hidden = p.id !== `tab-${id}`));
    }),
  );
}

async function initPage() {
  const user = await getUser();
  if (!user) return null;
  const role = user.user_metadata?.perfil;

  // Cada perfil só vê o próprio painel
  if (page === "aluno" && role === "servidor") {
    window.location.replace(HOME.servidor);
    return null;
  }
  if ((page === "trabalhador" || page === "viagens" || page === "editor") && role === "aluno") {
    window.location.replace(HOME.aluno);
    return null;
  }
  // Alunos usam a aba "Conta" dentro da própria tela
  if (page === "perfil" && role === "aluno") {
    window.location.replace(HOME.aluno + "#conta");
    return null;
  }

  // Links "voltar ao painel" conforme o perfil
  const home = role === "servidor" ? HOME.servidor : HOME.aluno;
  document.querySelectorAll("[data-home]").forEach((a) => (a.href = home));

  fillIdentity(user);
  if (page === "perfil" || page === "aluno") setupAccount(user);
  if (page === "trabalhador") {
    // Preparado para os dados reais (alunos/veículos/rotas) vindos do Backend.
    $("#alunosCount").textContent = "0";
    $("#veiculosCount").textContent = "0";
    $("#rotasCount").textContent = "0";
  }
  return user;
}

setupMobile();

/** Resolve com o usuário logado (ou null, já redirecionando). Outros módulos aguardam isto. */
export const userReady = initPage();

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") window.location.replace("./login.html");
});
