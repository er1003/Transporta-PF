import { montarShell, cartaoViagem, api, el, dataLonga, esqueleto, estadoVazio, avisoSemPapel, formatarData, TURNOS } from "./servidor-shell.js";

const { me, main } = await montarShell({ ativo: "inicio", titulo: "Início" });
if (me) iniciar();

function stat(icone, titulo, valor, legenda) {
  return el("article", { class: "card stat" }, el("div", { class: "stat-icon" }, icone),
    el("div", {}, el("h3", {}, titulo), el("strong", {}, String(valor)), el("small", {}, legenda)));
}

async function iniciar() {
  if (me.papel === "sem_papel") {
    main.replaceChildren(cabecalho(), avisoSemPapel());
    return;
  }
  await carregar();
  // Mantém os números em dia enquanto a página está aberta (ex.: outra pessoa registrou embarques).
  setInterval(() => document.visibilityState === "visible" && carregar(true), 30000);
}

function cabecalho() {
  const primeiro = (me.nome || "").split(" ")[0] || "servidor";
  const papel = { admin: "Administrador", monitora: "Monitora", motorista: "Motorista" }[me.papel] || "Servidor";
  return el("div", { class: "page-head" }, el("span", { class: "eyebrow" }, dataLonga()),
    el("h1", {}, `Olá, ${primeiro}`), el("p", {}, `${papel} · resumo do seu dia`));
}

async function carregar(silencioso = false) {
  if (!silencioso) main.replaceChildren(cabecalho(), ...esqueleto(2));
  try {
    const [hoje, proximas] = await Promise.all([api("/servidor/viagens?periodo=hoje"), api("/servidor/viagens?periodo=proximas")]);
    desenhar(hoje, proximas);
  } catch (e) {
    if (!silencioso) main.replaceChildren(cabecalho(), el("div", { class: "message error", role: "alert" }, e.message));
  }
}

function desenhar(hoje, proximas) {
  const ativas = hoje.filter((v) => v.status !== "cancelada");
  const alunos = ativas.reduce((s, v) => s + v.total_alunos, 0);
  const emb = ativas.reduce((s, v) => s + v.total_embarcados, 0);
  const emAndamento = ativas.filter((v) => v.status === "em_andamento").length;
  let stats;
  if (me.papel === "monitora") {
    stats = [stat("🚌", "Viagens hoje", ativas.length, "atribuídas a você"), stat("🎒", "Alunos", alunos, "nas viagens de hoje"),
      stat("✅", "Embarcados", emb, "já confirmados"), stat("⏳", "Pendentes", alunos - emb, "ainda não embarcaram")];
  } else if (me.papel === "motorista") {
    const prox = ativas.find((v) => v.status !== "concluida");
    stats = [stat("🚌", "Viagens hoje", ativas.length, "atribuídas a você"), stat("▶️", "Em andamento", emAndamento, "neste momento"),
      stat("🎒", "Alunos", alunos, "nas viagens de hoje"), stat("🕒", "Próxima saída", prox ? prox.horario : "—", prox ? prox.escola_nome || "" : "nenhuma pendente")];
  } else {
    stats = [stat("🚌", "Viagens hoje", ativas.length, "na operação"), stat("▶️", "Em andamento", emAndamento, "neste momento"),
      stat("✅", "Embarcados", emb, `de ${alunos} alunos`), stat("⏳", "Pendentes", alunos - emb, "ainda não embarcaram")];
  }

  const blocoHoje = hoje.length
    ? hoje.map((v) => cartaoViagem(v, me))
    : [estadoVazio("🗓️", "Nenhuma viagem para hoje", me.papel === "admin" ? "Crie viagens em “Viagens”." : "Quando houver uma viagem atribuída a você, ela aparecerá aqui.")];

  const blocoProx = proximas.length
    ? el("div", { class: "card" }, ...proximas.slice(0, 5).map((v) =>
        el("div", { class: "linha-aluno-hist" }, el("span", {}, `${formatarData(v.data_viagem)} às ${v.horario} · ${v.escola_nome || ""}`), el("span", {}, TURNOS[v.turno] || ""))),
        proximas.length > 5 && el("p", { class: "contador", style: "margin:10px 0 0" }, `+ ${proximas.length - 5} viagem(ns) — veja em “Minhas viagens”.`))
    : estadoVazio("📅", "Nenhuma viagem programada", "Não há viagens futuras atribuídas.");

  main.replaceChildren(cabecalho(),
    el("div", { class: "grid grid-4" }, ...stats),
    el("h2", { class: "section-title" }, "Viagens de hoje"), ...blocoHoje,
    el("h2", { class: "section-title" }, "Próximas viagens"), blocoProx);
}
