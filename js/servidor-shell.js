/* Estrutura comum da área do servidor: menu lateral por papel, sessão, tema, "Sair" e utilitários. */
import { supabase } from "../supabase/supabase.js";
import { api, carregarMe, el, TURNOS, STATUS, formatarData } from "./api.js";
export { api, el, TURNOS, STATUS, formatarData, carregarMe };

const ROTULO_PAPEL = { admin: "Administrador", monitora: "Monitora", motorista: "Motorista", sem_papel: "Acesso pendente" };
const INICIO = ["🏠", "Início", "trabalhador-publico.html", "inicio"];
const PERFIL = ["👤", "Meu perfil", "perfil-configuracoes.html", "perfil"];
const MENUS = {
  monitora: [INICIO, ["🚌", "Minhas viagens", "servidor-viagens.html", "viagens"], ["✅", "Embarque", "servidor-embarque.html", "embarque"],
    ["🕘", "Histórico", "servidor-historico.html", "historico"], PERFIL],
  motorista: [INICIO, ["🚌", "Minhas viagens", "servidor-viagens.html", "viagens"], ["🕘", "Histórico", "servidor-historico.html", "historico"], PERFIL],
  admin: [INICIO, ["🚌", "Viagens", "viagens-admin.html", "viagens"], ["🕘", "Histórico", "servidor-historico.html", "historico"], PERFIL],
  sem_papel: [INICIO, PERFIL],
};

export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const hora = (iso) => (iso ? iso.slice(11, 16) : "");
export const dataLonga = () => new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

let _toast;
export function toast(texto, tipo = "success", ms = 3500) {
  _toast?.remove();
  _toast = el("div", { class: `toast ${tipo}`, role: "status", "aria-live": "polite" }, texto);
  document.body.append(_toast);
  setTimeout(() => _toast?.remove(), ms);
}

export function esqueleto(n = 3) {
  return Array.from({ length: n }, () => el("div", { class: "skeleton" }));
}

export function estadoVazio(icone, titulo, texto) {
  return el("div", { class: "card empty" }, el("div", {}, el("div", { class: "empty-icon" }, icone), el("h3", {}, titulo), texto && el("p", {}, texto)));
}

function aplicarPreferencias() {
  const root = document.documentElement;
  root.dataset.theme = localStorage.getItem("tpf-theme") || "light";
  localStorage.getItem("tpf-contrast") === "on" ? (root.dataset.contrast = "on") : delete root.dataset.contrast;
  localStorage.getItem("tpf-font") === "on" ? (root.dataset.font = "on") : delete root.dataset.font;
}

/** Cartão de viagem usado no Início e em "Minhas viagens". */
export function cartaoViagem(v, me) {
  const pct = v.total_alunos ? Math.round((100 * v.total_embarcados) / v.total_alunos) : 0;
  const minha = me.monitora_id && me.monitora_id === v.monitora_id;
  let acao = null;
  if (minha) {
    const encerrada = v.status === "concluida" || v.status === "cancelada";
    acao = el("a", { class: `btn btn-primary btn-lg`, href: `./servidor-embarque.html?viagem=${v.id}` }, encerrada ? "Ver lista de alunos" : "Abrir embarque");
  } else if (me.papel === "admin") {
    acao = el("a", { class: "btn btn-secondary btn-sm", href: "./viagens-admin.html" }, "Gerenciar viagens");
  }
  const meta = (r, val) => el("div", {}, el("span", {}, r), val || "—");
  return el("article", { class: "card viagem-card" },
    el("div", { class: "viagem-top" },
      el("h3", {}, `${v.horario || "--:--"} · ${v.escola_nome || "Escola não informada"}`),
      el("span", { class: `badge ${v.status}` }, STATUS[v.status] || v.status)),
    el("div", { class: "viagem-meta" },
      meta("Data", formatarData(v.data_viagem)), meta("Turno", TURNOS[v.turno]),
      meta("Ônibus", v.veiculo_placa && `${v.veiculo_placa}${v.veiculo_modelo ? " · " + v.veiculo_modelo : ""}`),
      meta("Motorista", v.motorista_nome), meta("Monitora", v.monitora_nome),
      (v.origem || v.destino) && meta("Trajeto", [v.origem, v.destino].filter(Boolean).join(" → "))),
    el("div", {}, el("div", { class: "prog-label" }, el("span", {}, `${v.total_embarcados} de ${v.total_alunos} alunos embarcados`), el("span", {}, `${v.total_pendentes} pendentes`)),
      el("div", { class: "progress", role: "progressbar", "aria-valuenow": pct, "aria-valuemin": 0, "aria-valuemax": 100 }, el("span", { style: `width:${pct}%` }))),
    acao && el("div", { class: "viagem-actions" }, acao));
}

/** Monta a moldura da página. Retorna { me, main }. `me` é null se o servidor não respondeu. */
export async function montarShell({ ativo, titulo }) {
  aplicarPreferencias();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) { location.replace("./login.html"); throw new Error("sem sessão"); }

  const app = document.getElementById("app");
  const main = el("main", { class: "app-content", id: "conteudo" }, esqueleto());
  const nav = el("nav", { class: "side-nav", "aria-label": "Menu principal" });
  const nomeEl = el("strong", {}, data.user.user_metadata?.full_name || data.user.email || "Servidor");
  const papelEl = el("small", {}, "");
  const sidebar = el("aside", { class: "sidebar", id: "sidebar" },
    el("a", { class: "portal-brand", href: "./trabalhador-publico.html" }, el("span", { class: "brand-mark" }, "T"), el("span", {}, "Transporta ", el("strong", {}, "PF"))),
    el("div", { class: "side-user" }, el("div", { class: "avatar" }, (nomeEl.textContent || "S").trim().slice(0, 2).toUpperCase()), el("div", {}, nomeEl, papelEl)),
    nav,
    el("button", { class: "side-out", type: "button", id: "sair" }, el("span", { class: "ico" }, "🚪"), "Sair do sistema"));
  const overlay = el("div", { class: "sidebar-overlay", id: "overlay" });
  const menuBtn = el("button", { class: "portal-icon menu-btn", type: "button", "aria-label": "Abrir menu", "aria-expanded": "false" }, "☰");
  const temaBtn = el("button", { class: "portal-icon", type: "button", "aria-label": "Alternar tema claro/escuro" }, "◐");
  app.replaceChildren(el("div", { class: "app" }, sidebar, overlay,
    el("div", { class: "app-main" }, el("header", { class: "app-top" }, menuBtn, el("h2", {}, titulo), temaBtn), main)));
  document.title = `${titulo} | Transporta PF`;

  const alternar = (abrir) => {
    sidebar.classList.toggle("open", abrir); overlay.classList.toggle("open", abrir);
    menuBtn.setAttribute("aria-expanded", String(abrir));
  };
  menuBtn.addEventListener("click", () => alternar(!sidebar.classList.contains("open")));
  overlay.addEventListener("click", () => alternar(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && alternar(false));
  temaBtn.addEventListener("click", () => {
    const novo = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = novo; localStorage.setItem("tpf-theme", novo);
  });
  document.getElementById("sair").addEventListener("click", async () => {
    await supabase.auth.signOut().catch(() => {}); location.replace("./login.html");
  });

  const desenharMenu = (papel) => {
    nav.replaceChildren(...(MENUS[papel] || MENUS.sem_papel).map(([ico, rot, href, id]) =>
      el("a", { href: `./${href}`, class: id === ativo ? "active" : "", "aria-current": id === ativo ? "page" : false }, el("span", { class: "ico" }, ico), rot)));
  };

  try {
    const me = await carregarMe();
    papelEl.textContent = ROTULO_PAPEL[me.papel] || "Servidor";
    desenharMenu(me.papel);
    return { me, main };
  } catch (e) {
    desenharMenu("sem_papel");
    papelEl.textContent = "Sem conexão";
    main.replaceChildren(el("div", { class: "card empty" }, el("div", {},
      el("div", { class: "empty-icon" }, "⚠️"), el("h3", {}, "Não foi possível carregar seus dados"),
      el("p", {}, e.message), el("button", { class: "btn btn-primary", type: "button", onclick: () => location.reload() }, "Tentar novamente"))));
    return { me: null, main };
  }
}

export function avisoSemPapel() {
  return el("div", { class: "card empty" }, el("div", {},
    el("div", { class: "empty-icon" }, "🔒"), el("h3", {}, "Seu acesso ainda não foi liberado"),
    el("p", {}, "Sua conta existe, mas ainda não está ligada a um cadastro de monitora ou motorista. Peça ao administrador para cadastrar o e-mail que você usou para entrar.")));
}
