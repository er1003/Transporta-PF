import { montarShell, api, el, TURNOS, STATUS, formatarData, hora, hojeISO, toast, esqueleto, estadoVazio, avisoSemPapel } from "./servidor-shell.js";

const { me, main } = await montarShell({ ativo: "embarque", titulo: "Embarque" });
const viagemId = Number(new URLSearchParams(location.search).get("viagem")) || null;
const chave = `tpf-embarque-${viagemId}`;
let viagem = null;
let ocupado = false;
const filtro = JSON.parse(sessionStorage.getItem(chave) || '{"busca":"","situacao":""}');  // sobrevive ao atualizar
const salvarFiltro = () => sessionStorage.setItem(chave, JSON.stringify(filtro));

const topo = el("div");
const lista = el("div", { "aria-live": "polite" });
const rodape = el("div");

if (me) {
  if (me.papel === "sem_papel") main.replaceChildren(avisoSemPapel());
  else if (me.papel === "motorista") main.replaceChildren(estadoVazio("🚌", "O embarque é feito pela monitora", "Como motorista, você acompanha suas viagens em “Minhas viagens”."));
  else if (!viagemId) escolherViagem();
  else abrir();
}

/* ---------- sem ?viagem=: escolhe a viagem de hoje ---------- */
async function escolherViagem() {
  main.replaceChildren(...esqueleto(2));
  try {
    const hoje = (await api("/servidor/viagens?periodo=hoje")).filter((v) => v.status !== "cancelada");
    if (hoje.length === 1 && me.papel === "monitora") return location.replace(`./servidor-embarque.html?viagem=${hoje[0].id}`);
    main.replaceChildren(el("div", { class: "page-head" }, el("h1", {}, "Embarque"), el("p", {}, "Escolha a viagem de hoje.")),
      ...(hoje.length ? hoje.map((v) => el("a", { class: "card quick", href: `./servidor-embarque.html?viagem=${v.id}`, style: "margin-bottom:12px" },
          el("span", { class: "quick-icon" }, "🚌"), el("span", {}, el("h3", {}, `${v.horario} · ${v.escola_nome || ""}`), el("p", {}, `${TURNOS[v.turno] || ""} · ${v.total_embarcados} de ${v.total_alunos} embarcados`)), el("span", { class: "arrow" }, "→")))
        : [estadoVazio("🗓️", "Nenhuma viagem para hoje", "Quando houver uma viagem atribuída a você, ela aparecerá aqui.")]));
  } catch (e) { main.replaceChildren(el("div", { class: "message error", role: "alert" }, e.message)); }
}

/* ---------- tela de embarque ---------- */
async function abrir() {
  main.replaceChildren(topo, lista, rodape);
  lista.replaceChildren(...esqueleto(3));
  await atualizar();
  setInterval(() => document.visibilityState === "visible" && !ocupado && atualizar(true), 30000);
}

async function atualizar(silencioso = false) {
  try {
    const q = new URLSearchParams();
    if (filtro.busca) q.set("busca", filtro.busca);
    if (filtro.situacao) q.set("situacao", filtro.situacao);
    const [v, dados] = await Promise.all([api(`/servidor/viagens/${viagemId}`), api(`/servidor/viagens/${viagemId}/alunos?${q}`)]);
    viagem = v;
    desenhar(dados);
  } catch (e) {
    if (e.status === 404) return main.replaceChildren(estadoVazio("🔍", "Viagem não encontrada", "Ela pode não estar atribuída a você."), el("a", { class: "btn btn-secondary", href: "./servidor-viagens.html" }, "Ver minhas viagens"));
    if (!silencioso) lista.replaceChildren(el("div", { class: "message error", role: "alert" }, e.message, " ", el("button", { class: "btn btn-secondary btn-sm", type: "button", onclick: () => atualizar() }, "Tentar de novo")));
  }
}

function podeEmbarcar() {
  return me.monitora_id && me.monitora_id === viagem.monitora_id && viagem.data_viagem === hojeISO() && !["concluida", "cancelada"].includes(viagem.status);
}

function desenhar(d) {
  const pct = d.total ? Math.round((100 * d.embarcados) / d.total) : 0;
  const aviso = !podeEmbarcar() && me.monitora_id === viagem.monitora_id
    ? (viagem.status === "concluida" ? "Esta viagem foi concluída. A lista está somente para consulta."
      : viagem.status === "cancelada" ? "Esta viagem foi cancelada."
      : `O embarque só pode ser registrado no dia da viagem (${formatarData(viagem.data_viagem)}).`) : null;
  const busca = el("input", { type: "search", id: "busca", placeholder: "Digite o nome do aluno", value: filtro.busca, autocomplete: "off", "aria-label": "Buscar aluno pelo nome" });
  let t;
  busca.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { filtro.busca = busca.value.trim(); salvarFiltro(); atualizar(); }, 250); });
  const chip = (id, r, n) => el("button", { class: "chip", type: "button", "aria-pressed": String(filtro.situacao === id),
    onclick: () => { filtro.situacao = id; salvarFiltro(); atualizar(); } }, `${r} (${n})`);

  const novoTopo = el("div", {},
    el("a", { href: "./servidor-viagens.html", class: "contador" }, "← Minhas viagens"),
    el("div", { class: "page-head", style: "margin-top:8px" },
      el("h1", {}, `${viagem.horario} · ${viagem.escola_nome || "Escola"}`),
      el("p", {}, `${TURNOS[viagem.turno] || ""} · ${formatarData(viagem.data_viagem)} · Ônibus ${viagem.veiculo_placa || "—"} · Motorista ${viagem.motorista_nome || "—"} · `,
        el("span", { class: `badge ${viagem.status}` }, STATUS[viagem.status] || viagem.status))),
    el("div", { class: "sticky-resumo" },
      el("div", { class: "prog-label" }, el("span", {}, `${d.embarcados} de ${d.total} embarcados`), el("span", {}, `${d.pendentes} pendentes`)),
      el("div", { class: "progress", role: "progressbar", "aria-valuenow": pct, "aria-valuemin": 0, "aria-valuemax": 100 }, el("span", { style: `width:${pct}%` }))),
    aviso && el("div", { class: "message info", role: "status", style: "margin-top:12px" }, aviso),
    el("div", { class: "field", style: "margin-top:16px" }, el("label", { for: "busca" }, "Buscar aluno"), busca),
    el("div", { class: "chips", role: "group", "aria-label": "Filtrar por situação" },
      chip("", "Todos", d.total), chip("pendentes", "Pendentes", d.pendentes), chip("embarcados", "Embarcados", d.embarcados)));
  const tinhaFoco = document.activeElement?.id === "busca";
  topo.replaceChildren(novoTopo);
  if (tinhaFoco) { const b = document.getElementById("busca"); b.focus(); b.setSelectionRange(b.value.length, b.value.length); }

  lista.replaceChildren(...(d.alunos.length ? d.alunos.map(linha) : [
    d.total === 0 ? estadoVazio("🎒", "Nenhum aluno vinculado a esta viagem", "Peça ao administrador para vincular os alunos.")
      : estadoVazio("🔍", "Nenhum aluno encontrado", "Confira o nome digitado ou o filtro escolhido.")]));

  rodape.replaceChildren(podeEmbarcar() ? el("div", { style: "margin-top:24px" },
    el("button", { class: "btn btn-secondary btn-lg", type: "button", onclick: () => concluir(d.pendentes) }, "Concluir viagem")) : "");
}

function linha(a) {
  const botao = el("button", { class: "btn btn-primary btn-lg", type: "button", "aria-label": `Confirmar embarque de ${a.nome}` }, "Confirmar embarque");
  botao.addEventListener("click", () => confirmar(a, botao));
  return el("div", { class: `aluno-row ${a.embarcado ? "embarcado" : ""}` },
    el("div", {}, el("div", { class: "nome" }, a.nome), el("div", { class: "sub" }, [a.escola_nome, TURNOS[a.turno]].filter(Boolean).join(" · "))),
    el("div", { class: "lado" },
      a.embarcado
        ? el("span", { class: "badge embarcado" }, `✓ Embarcado às ${hora(a.embarcado_em)}`)
        : el("span", { class: "badge pendente" }, "○ Pendente"),
      !a.embarcado && podeEmbarcar() && botao));
}

async function confirmar(aluno, botao) {
  if (ocupado) return;
  ocupado = true; botao.disabled = true; botao.textContent = "Registrando…";
  try {
    // A tela só passa a mostrar "embarcado" depois que o servidor confirma que gravou no banco.
    const r = await api(`/servidor/viagens/${viagemId}/embarques`, { method: "POST", body: { aluno_id: aluno.id } });
    toast(`✓ ${r.aluno.nome} embarcou às ${hora(r.aluno.embarcado_em)}`, "success");
  } catch (e) {
    toast(e.status === 409 ? "Este aluno já estava marcado como embarcado." : e.message, e.status === 409 ? "info" : "error", 5000);
  } finally {
    ocupado = false;
    await atualizar(true);  // relê do banco: contadores e lista sempre refletem o que foi gravado
  }
}

async function concluir(pendentes) {
  const msg = pendentes ? `Ainda há ${pendentes} aluno(s) pendente(s). Concluir a viagem mesmo assim? Depois disso não será possível registrar embarques.`
    : "Todos embarcaram. Concluir a viagem?";
  if (!confirm(msg)) return;
  try { await api(`/servidor/viagens/${viagemId}/concluir`, { method: "POST" }); toast("Viagem concluída.", "success"); }
  catch (e) { toast(e.message, "error", 5000); }
  await atualizar();
}
