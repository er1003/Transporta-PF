import { montarShell, api, el, TURNOS, STATUS, formatarData, hora, hojeISO, esqueleto, estadoVazio, avisoSemPapel } from "./servidor-shell.js";

const { me, main } = await montarShell({ ativo: "historico", titulo: "Histórico" });
const f = el("div");
const resumo = el("div");
const lista = el("div", { "aria-live": "polite" });

function isoDias(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

if (me) {
  if (me.papel === "sem_papel") main.replaceChildren(avisoSemPapel());
  else iniciar();
}

function campo(id, rotulo, ctl) { return el("div", { class: "field" }, el("label", { for: id }, rotulo), ctl); }

function iniciar() {
  const de = el("input", { type: "date", id: "hDe", value: isoDias(-30) });
  const ate = el("input", { type: "date", id: "hAte", value: hojeISO() });
  const escola = el("select", { id: "hEscola" }, el("option", { value: "" }, "Todas"));
  const turno = el("select", { id: "hTurno" }, el("option", { value: "" }, "Todos"), ...Object.entries(TURNOS).map(([v, r]) => el("option", { value: v }, r)));
  const msg = el("div", { class: "message", role: "alert" });
  let escolasCarregadas = false;
  const consultar = async () => {
    if (de.value && ate.value && de.value > ate.value) { msg.textContent = "A data inicial não pode ser depois da final."; msg.className = "message error"; return; }
    msg.textContent = ""; msg.className = "message";
    lista.replaceChildren(...esqueleto(2));
    const q = new URLSearchParams();
    for (const [k, c] of [["de", de], ["ate", ate], ["escola_id", escola], ["turno", turno]]) if (c.value) q.set(k, c.value);
    try {
      const r = await api(`/servidor/historico?${q}`);
      if (!escolasCarregadas) { r.escolas.forEach((e) => escola.append(el("option", { value: e.id }, e.nome))); escolasCarregadas = true; }
      desenhar(r);
    } catch (e) { lista.replaceChildren(el("div", { class: "message error", role: "alert" }, e.message)); }
  };
  [de, ate, escola, turno].forEach((c) => c.addEventListener("change", consultar));
  main.replaceChildren(
    el("div", { class: "page-head" }, el("h1", {}, "Histórico"),
      el("p", {}, me.papel === "admin" ? "Viagens e embarques de toda a operação. Somente consulta." : "Suas viagens anteriores e os registros de embarque. Somente consulta.")),
    el("div", { class: "card", style: "margin-bottom:16px" }, el("div", { class: "form-grid" }, campo("hDe", "De", de), campo("hAte", "Até", ate), campo("hEscola", "Escola", escola), campo("hTurno", "Turno", turno)), msg),
    resumo, lista);
  consultar();
}

function stat(icone, t, v, leg) {
  return el("article", { class: "card stat" }, el("div", { class: "stat-icon" }, icone), el("div", {}, el("h3", {}, t), el("strong", {}, String(v)), el("small", {}, leg)));
}

function desenhar(r) {
  const s = r.resumo;
  resumo.replaceChildren(el("div", { class: "grid grid-4", style: "margin-bottom:16px" },
    stat("🚌", "Viagens", s.viagens, `${s.concluidas} concluídas`), stat("🎒", "Alunos", s.alunos, "vinculados às viagens"),
    stat("✅", "Embarcados", s.embarcados, "registros de embarque"), stat("⏳", "Pendentes", s.pendentes, "não embarcaram")));
  lista.replaceChildren(...(r.viagens.length ? r.viagens.map(cartao) : [estadoVazio("🕘", "Nenhuma viagem no período", "Ajuste as datas ou os filtros para ver outros registros.")]));
}

function cartao(v) {
  const detalhe = el("div", { hidden: true, style: "margin-top:8px" });
  const podeAlunos = me.papel === "admin" || me.monitora_id === v.monitora_id;
  const botao = el("button", { class: "btn btn-secondary btn-sm", type: "button", "aria-expanded": "false" }, "Ver alunos");
  let carregado = false;
  botao.addEventListener("click", async () => {
    const abrir = detalhe.hidden;
    detalhe.hidden = !abrir; botao.textContent = abrir ? "Ocultar alunos" : "Ver alunos"; botao.setAttribute("aria-expanded", String(abrir));
    if (abrir && !carregado) {
      detalhe.replaceChildren("Carregando…");
      try {
        const d = await api(`/servidor/viagens/${v.id}/alunos`);
        detalhe.replaceChildren(...(d.alunos.length ? d.alunos.map((a) => el("div", { class: "linha-aluno-hist" },
          el("strong", {}, a.nome),
          a.embarcado ? el("span", {}, `✓ Embarcou em ${formatarData(a.embarcado_em.slice(0, 10))} às ${hora(a.embarcado_em)}${a.registrado_por ? " · registrado por " + a.registrado_por : ""}`)
            : el("span", {}, "○ Não embarcou"))) : ["Nenhum aluno vinculado."]));
        carregado = true;
      } catch (e) { detalhe.replaceChildren(el("div", { class: "message error" }, e.message)); }
    }
  });
  return el("article", { class: "card viagem-card" },
    el("div", { class: "viagem-top" }, el("h3", {}, `${formatarData(v.data_viagem)} às ${v.horario} · ${v.escola_nome || ""}`), el("span", { class: `badge ${v.status}` }, STATUS[v.status] || v.status)),
    el("div", { class: "viagem-meta" },
      el("div", {}, el("span", {}, "Turno"), TURNOS[v.turno] || "—"), el("div", {}, el("span", {}, "Ônibus"), v.veiculo_placa || "—"),
      el("div", {}, el("span", {}, "Motorista"), v.motorista_nome || "—"), el("div", {}, el("span", {}, "Monitora"), v.monitora_nome || "—"),
      el("div", {}, el("span", {}, "Embarcados"), `${v.total_embarcados} de ${v.total_alunos} · ${v.total_pendentes} pendentes`)),
    podeAlunos ? el("div", {}, el("div", { class: "viagem-actions" }, botao), detalhe) : el("small", { class: "contador" }, "A lista de alunos não está disponível para o seu perfil."));
}
