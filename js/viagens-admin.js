import { api, carregarMe, el, TURNOS, STATUS, formatarData } from "./api.js";

const $ = (s) => document.querySelector(s);

/* ---------- controle de acesso: somente administrador ---------- */
// O papel vem do servidor (/api/me), não do navegador. A API também recusa quem não é admin (403).
try {
  const me = await carregarMe();
  if (me.papel !== "admin") {
    window.location.replace("./trabalhador-publico.html");
    throw new Error("Acesso restrito ao administrador.");
  }
} catch (e) {
  if (e.message.startsWith("Acesso restrito")) throw e;
  document.body.prepend(Object.assign(document.createElement("p"), { className: "message error", textContent: e.message }));
  throw e;
}

/* ---------- estado ---------- */
const estado = { escolas: [], veiculos: [], motoristas: [], monitoras: [], alunos: [], viagemId: null, viagemAlunos: null };

function mensagem(alvo, texto, tipo = "info") {
  alvo.textContent = texto || "";
  alvo.className = texto ? `message ${tipo}` : "message";
}
const global = (t, tipo) => { mensagem($("#globalMessage"), t, tipo); if (t) window.scrollTo({ top: 0, behavior: "smooth" }); };

function preencherSelect(select, itens, rotulo, vazio = "Selecione") {
  select.replaceChildren(el("option", { value: "" }, vazio));
  for (const i of itens) select.append(el("option", { value: i.id }, rotulo(i)));
}

/* ---------- carga de dados (tudo do banco) ---------- */
async function carregarCadastros() {
  const [escolas, veiculos, motoristas, monitoras, alunos] = await Promise.all([
    api("/escolas"), api("/veiculos"), api("/motoristas"), api("/monitoras"), api("/alunos"),
  ]);
  estado.escolas = escolas.filter((x) => x.ativo);
  estado.veiculos = veiculos.filter((x) => x.ativo);
  estado.motoristas = motoristas.filter((x) => x.ativo);
  estado.monitoras = monitoras.filter((x) => x.ativo);
  estado.alunos = alunos.filter((x) => x.ativo);

  preencherSelect($("#fEscola"), estado.escolas, (e) => e.nome);
  preencherSelect($("#fVeiculo"), estado.veiculos, (v) => `${v.placa}${v.modelo ? " · " + v.modelo : ""} (${v.capacidade} lugares)`);
  preencherSelect($("#fMotorista"), estado.motoristas, (m) => m.nome);
  preencherSelect($("#fMonitora"), estado.monitoras, (m) => m.nome);
  preencherSelect($("#filtroEscola"), estado.escolas, (e) => e.nome, "Todas");
  preencherSelect($("#aeEscola"), estado.escolas, (e) => e.nome);
  preencherSelect($("#aeAluno"), estado.alunos, (a) => a.nome);
  preencherSelect($("#mtMotorista"), estado.motoristas, (m) => m.nome);

  const faltando = [];
  if (!estado.escolas.length) faltando.push("escolas");
  if (!estado.veiculos.length) faltando.push("ônibus");
  if (!estado.motoristas.length) faltando.push("motoristas");
  if (!estado.monitoras.length) faltando.push("monitoras");
  if (faltando.length) global(`Faltam cadastros para criar viagens: ${faltando.join(", ")}.`, "info");
}

/* ---------- listagem ---------- */
async function carregarViagens() {
  const q = new URLSearchParams();
  const f = { data: $("#filtroData").value, escola_id: $("#filtroEscola").value, turno: $("#filtroTurno").value, status: $("#filtroStatus").value };
  for (const [k, v] of Object.entries(f)) if (v) q.set(k, v);
  const lista = $("#listaViagens");
  try {
    const viagens = await api("/viagens" + (q.toString() ? "?" + q : ""));
    lista.replaceChildren();
    if (!viagens.length) {
      lista.append(el("div", { class: "card empty" }, el("div", {},
        el("div", { class: "empty-icon" }, "🚌"),
        el("h3", {}, "Nenhuma viagem encontrada"),
        el("p", {}, "Crie uma nova viagem ou ajuste os filtros."))));
      return;
    }
    for (const v of viagens) lista.append(cartaoViagem(v));
  } catch (e) {
    lista.replaceChildren();
    global(e.message, "error");
  }
}

function meta(rotulo, valor) {
  return el("div", {}, el("span", {}, rotulo), valor || "—");
}

function cartaoViagem(v) {
  const encerrada = v.status === "concluida" || v.status === "cancelada";
  const acoes = el("div", { class: "viagem-actions" },
    el("button", { class: "btn btn-secondary btn-sm", type: "button", onclick: () => abrirAlunos(v) }, "Alunos"),
    !encerrada && el("button", { class: "btn btn-secondary btn-sm", type: "button", onclick: () => abrirForm(v) }, "Editar"),
    !encerrada && el("button", { class: "btn btn-danger btn-sm", type: "button", onclick: () => cancelar(v) }, "Cancelar viagem"),
    el("button", { class: "btn btn-danger btn-sm", type: "button", onclick: () => excluir(v) }, "Excluir"));
  return el("article", { class: "card viagem-card" },
    el("div", { class: "viagem-top" },
      el("h3", {}, `${formatarData(v.data_viagem)} às ${v.horario || "--:--"} · ${v.escola_nome || "Sem escola"}`),
      el("span", { class: `badge ${v.status}` }, STATUS[v.status] || v.status)),
    el("div", { class: "viagem-meta" },
      meta("Turno", TURNOS[v.turno]),
      meta("Ônibus", v.veiculo_placa && `${v.veiculo_placa}${v.veiculo_modelo ? " · " + v.veiculo_modelo : ""}`),
      meta("Motorista", v.motorista_nome),
      meta("Monitora", v.monitora_nome),
      meta("Alunos", `${v.total_alunos}${v.veiculo_capacidade ? " / " + v.veiculo_capacidade : ""}`),
      meta("Embarcados", `${v.total_embarcados} · pendentes ${v.total_pendentes}`),
      (v.origem || v.destino) && meta("Trajeto", [v.origem, v.destino].filter(Boolean).join(" → "))),
    acoes);
}

/* ---------- formulário criar/editar ---------- */
function abrirForm(v = null) {
  fecharAlunos();
  estado.viagemId = v ? v.id : null;
  $("#formTitle").textContent = v ? `Editar viagem #${v.id}` : "Nova viagem";
  $("#fData").value = v?.data_viagem || "";
  $("#fHorario").value = v?.horario || "";
  $("#fEscola").value = v?.escola_id ?? "";
  $("#fTurno").value = v?.turno || "";
  $("#fVeiculo").value = v?.veiculo_id ?? "";
  $("#fMotorista").value = v?.motorista_id ?? "";
  $("#fMonitora").value = v?.monitora_id ?? "";
  $("#fStatus").value = v && v.status !== "cancelada" ? v.status : "planejada";
  $("#fOrigem").value = v?.origem || "";
  $("#fDestino").value = v?.destino || "";
  mensagem($("#formMessage"), "");
  $("#formPanel").hidden = false;
  $("#formPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  $("#fData").focus();
}
function fecharForm() { $("#formPanel").hidden = true; estado.viagemId = null; }

function lerForm() {
  const n = (id) => ($(id).value ? Number($(id).value) : null);
  return {
    data_viagem: $("#fData").value, horario: $("#fHorario").value,
    escola_id: n("#fEscola"), turno: $("#fTurno").value,
    veiculo_id: n("#fVeiculo"), motorista_id: n("#fMotorista"), monitora_id: n("#fMonitora"),
    status: $("#fStatus").value, origem: $("#fOrigem").value.trim() || null, destino: $("#fDestino").value.trim() || null,
  };
}

function validarForm(d) {
  const faltam = [];
  if (!d.data_viagem) faltam.push("data");
  if (!d.horario) faltam.push("horário");
  if (!d.escola_id) faltam.push("escola");
  if (!d.turno) faltam.push("turno");
  if (!d.veiculo_id) faltam.push("ônibus");
  if (!d.motorista_id) faltam.push("motorista");
  if (!d.monitora_id) faltam.push("monitora");
  return faltam.length ? `Preencha: ${faltam.join(", ")}.` : null;
}

$("#viagemForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const dados = lerForm();
  const erro = validarForm(dados);
  if (erro) return mensagem($("#formMessage"), erro, "error");
  const botao = $("#saveForm");
  botao.disabled = true;
  mensagem($("#formMessage"), "Salvando...", "info");
  try {
    const criando = !estado.viagemId;
    const salva = await api(criando ? "/viagens" : `/viagens/${estado.viagemId}`, { method: criando ? "POST" : "PUT", body: dados });
    fecharForm();
    global(criando ? "Viagem criada. Agora vincule os alunos." : "Viagem atualizada com sucesso.", "success");
    await carregarViagens();
    if (criando) abrirAlunos(salva);
  } catch (e) {
    mensagem($("#formMessage"), e.message, "error"); // inclui mensagens de conflito do servidor
  } finally {
    botao.disabled = false;
  }
});
$("#cancelForm").addEventListener("click", fecharForm);
$("#novaViagem").addEventListener("click", () => abrirForm());

/* ---------- cancelar / excluir ---------- */
async function cancelar(v) {
  if (!confirm(`Cancelar a viagem de ${formatarData(v.data_viagem)} às ${v.horario}? O histórico é mantido.`)) return;
  try { await api(`/viagens/${v.id}/cancelar`, { method: "POST" }); global("Viagem cancelada.", "success"); carregarViagens(); }
  catch (e) { global(e.message, "error"); }
}
async function excluir(v) {
  if (!confirm(`Excluir definitivamente a viagem de ${formatarData(v.data_viagem)} às ${v.horario}?`)) return;
  try { await api(`/viagens/${v.id}`, { method: "DELETE" }); global("Viagem excluída.", "success"); carregarViagens(); }
  catch (e) { global(e.message, "error"); }
}

/* ---------- alunos da viagem ---------- */
let viagemAtual = null;
let disponiveis = [];
const marcados = new Set();

async function abrirAlunos(v) {
  fecharForm();
  viagemAtual = v;
  $("#alunosTitle").textContent = `Alunos · ${formatarData(v.data_viagem)} ${v.horario || ""} · ${v.escola_nome || ""}`;
  $("#alunoBusca").value = "";
  mensagem($("#alunosMessage"), "");
  try {
    disponiveis = await api(`/viagens/${v.id}/alunos-disponiveis`);
  } catch (e) { return global(e.message, "error"); }
  marcados.clear();
  disponiveis.filter((a) => a.vinculado).forEach((a) => marcados.add(a.id));
  const somenteLeitura = v.status === "concluida" || v.status === "cancelada";
  $("#salvarAlunos").hidden = somenteLeitura;
  renderAlunos(somenteLeitura);
  $("#alunosPanel").hidden = false;
  $("#alunosPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}
function fecharAlunos() { $("#alunosPanel").hidden = true; viagemAtual = null; }

function renderAlunos(somenteLeitura = viagemAtual && ["concluida", "cancelada"].includes(viagemAtual.status)) {
  const termo = $("#alunoBusca").value.trim().toLowerCase();
  const lista = $("#alunoLista");
  lista.replaceChildren();
  const visiveis = disponiveis.filter((a) => a.nome.toLowerCase().includes(termo));
  if (!visiveis.length) {
    lista.append(el("p", { class: "contador", style: "padding:14px" },
      disponiveis.length ? "Nenhum aluno encontrado." : "Nenhum aluno elegível. Defina escola e turno dos alunos em “Cadastros de apoio”."));
  }
  for (const a of visiveis) {
    const cb = el("input", { type: "checkbox", disabled: somenteLeitura });
    cb.checked = marcados.has(a.id);
    cb.addEventListener("change", () => { cb.checked ? marcados.add(a.id) : marcados.delete(a.id); atualizarContador(); });
    lista.append(el("label", {}, cb, a.nome,
      el("small", {}, a.escola_nome ? `${a.escola_nome} · ${TURNOS[a.turno] || ""}` : "Escola/turno não definidos")));
  }
  atualizarContador();
}
function atualizarContador() {
  const cap = viagemAtual?.veiculo_capacidade;
  const c = $("#alunoContador");
  c.textContent = `${marcados.size} selecionado(s)${cap ? ` de ${cap} lugares` : ""}`;
  c.classList.toggle("cheio", Boolean(cap) && marcados.size > cap);
}
$("#alunoBusca").addEventListener("input", () => renderAlunos());
$("#fecharAlunos").addEventListener("click", fecharAlunos);
$("#salvarAlunos").addEventListener("click", async () => {
  const botao = $("#salvarAlunos");
  botao.disabled = true;
  try {
    const r = await api(`/viagens/${viagemAtual.id}/alunos`, { method: "PUT", body: { aluno_ids: [...marcados] } });
    mensagem($("#alunosMessage"), r.message, "success");
    carregarViagens();
  } catch (e) {
    mensagem($("#alunosMessage"), e.message, "error");
  } finally { botao.disabled = false; }
});

/* ---------- filtros ---------- */
["#filtroData", "#filtroEscola", "#filtroTurno", "#filtroStatus"].forEach((s) => $(s).addEventListener("change", carregarViagens));
$("#limparFiltros").addEventListener("click", () => {
  ["#filtroData", "#filtroEscola", "#filtroTurno", "#filtroStatus"].forEach((s) => ($(s).value = ""));
  carregarViagens();
});

/* ---------- cadastros de apoio (provisório) ---------- */
const apoio = (t, tipo) => mensagem($("#apoioMessage"), t, tipo);
$("#escolaForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const nome = $("#nEscola").value.trim();
  if (!nome) return apoio("Informe o nome da escola.", "error");
  try { await api("/escolas", { method: "POST", body: { nome } }); $("#nEscola").value = ""; apoio("Escola cadastrada.", "success"); await carregarCadastros(); }
  catch (e) { apoio(e.message, "error"); }
});
$("#monitoraForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const nome = $("#nMonNome").value.trim();
  if (!nome) return apoio("Informe o nome da monitora.", "error");
  try {
    await api("/monitoras", { method: "POST", body: { nome, email: $("#nMonEmail").value.trim(), auth_user_id: $("#nMonUid").value.trim() } });
    ["#nMonNome", "#nMonEmail", "#nMonUid"].forEach((s) => ($(s).value = ""));
    apoio("Monitora cadastrada.", "success"); await carregarCadastros();
  } catch (e) { apoio(e.message, "error"); }
});
$("#motoristaAcessoForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const id = $("#mtMotorista").value, email = $("#mtEmail").value.trim();
  if (!id || !email) return apoio("Selecione o motorista e informe o e-mail.", "error");
  try { await api(`/acesso/motorista/${id}`, { method: "PUT", body: { email } }); $("#mtEmail").value = ""; apoio("E-mail salvo. No primeiro acesso, o motorista será vinculado automaticamente.", "success"); }
  catch (e) { apoio(e.message, "error"); }
});
$("#alunoEscolaForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const aluno = $("#aeAluno").value, escola = $("#aeEscola").value;
  if (!aluno || !escola) return apoio("Selecione aluno e escola.", "error");
  try { await api(`/escolas/aluno/${aluno}`, { method: "PUT", body: { escola_id: Number(escola), turno: $("#aeTurno").value } }); apoio("Escola e turno do aluno atualizados.", "success"); }
  catch (e) { apoio(e.message, "error"); }
});

/* ---------- início ---------- */
try {
  await carregarCadastros();
  await carregarViagens();
} catch (e) {
  global(e.message, "error");
}
