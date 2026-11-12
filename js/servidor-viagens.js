import { montarShell, cartaoViagem, api, el, esqueleto, estadoVazio, avisoSemPapel } from "./servidor-shell.js";

const { me, main } = await montarShell({ ativo: "viagens", titulo: "Minhas viagens" });
const lista = el("div", { "aria-live": "polite" });
const chips = el("div", { class: "chips", role: "group", "aria-label": "Período" });

let periodo = location.hash === "#proximas" ? "proximas" : "hoje";  // sobrevive a "atualizar a página"

if (me) {
  if (me.papel === "sem_papel") main.replaceChildren(avisoSemPapel());
  else { desenharBase(); carregar(); }
}

function desenharBase() {
  const rotulos = [["hoje", "Hoje"], ["proximas", "Próximas"]];
  chips.replaceChildren(...rotulos.map(([id, r]) => el("button", {
    class: "chip", type: "button", "aria-pressed": String(periodo === id),
    onclick: () => { periodo = id; location.hash = id; desenharBase(); carregar(); } }, r)));
  main.replaceChildren(
    el("div", { class: "page-head" }, el("h1", {}, "Minhas viagens"),
      el("p", {}, me.papel === "admin" ? "Visão de todas as viagens. Para criar ou editar, use “Viagens”." : "Somente as viagens atribuídas a você.")),
    chips, lista);
}

async function carregar() {
  lista.replaceChildren(...esqueleto(2));
  try {
    const viagens = await api(`/servidor/viagens?periodo=${periodo}`);
    lista.replaceChildren(...(viagens.length
      ? viagens.map((v) => cartaoViagem(v, me))
      : [estadoVazio("🗓️", periodo === "hoje" ? "Nenhuma viagem para hoje" : "Nenhuma viagem programada",
          "Quando houver uma viagem atribuída a você, ela aparecerá aqui.")]));
  } catch (e) {
    lista.replaceChildren(el("div", { class: "message error", role: "alert" }, e.message,
      " ", el("button", { class: "btn btn-secondary btn-sm", type: "button", onclick: carregar }, "Tentar de novo")));
  }
}
