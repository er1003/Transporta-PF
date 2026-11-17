import { userReady } from "./portal.js";
import { CIDADE, LINHAS, PONTOS, DADOS_DE_EXEMPLO } from "./data/pontos.js";

/* Tela do aluno: navegação por abas, mapa de pontos/horários, controle de viagens.
 * A conta (dados, preferências, sair) é tratada por portal.js. */

const $ = (s) => document.querySelector(s);
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGOS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Cria elemento com texto seguro (sem innerHTML). */
function el(tag, attrs = {}, ...filhos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  n.append(...filhos.filter((f) => f != null && f !== false));
  return n;
}

const user = await userReady;
if (user) iniciar(user);

function iniciar(user) {
  /* ---------- armazenamento local (por usuário) ---------- */
  const KEY_VIAGENS = `tpf-viagens:${user.id}`;
  const KEY_FAV = `tpf-ponto-favorito:${user.id}`;
  const ler = (k, padrao) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : padrao;
    } catch { return padrao; }
  };
  const gravar = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado */ }
  };

  let viagens = ler(KEY_VIAGENS, []);
  let favorito = ler(KEY_FAV, null);

  const pontoPorId = (id) => PONTOS.find((p) => p.id === id);
  const linhaPorId = (id) => LINHAS.find((l) => l.id === id);

  /* ---------- horários ---------- */
  const minutos = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  /** Próximo horário do ponto a partir de agora (ou o primeiro de amanhã). */
  function proximoHorario(ponto) {
    const ag = new Date();
    const agora = ag.getHours() * 60 + ag.getMinutes();
    const ord = [...ponto.horarios].sort();
    const hoje = ord.find((h) => minutos(h) >= agora);
    return hoje ? { hora: hoje, amanha: false } : { hora: ord[0], amanha: true };
  }

  /* ---------- navegação por abas ---------- */
  const views = document.querySelectorAll(".view");
  const links = document.querySelectorAll("[data-view-link]");
  let mapa = null;

  function mostrar(nome) {
    if (![...views].some((v) => v.dataset.view === nome)) nome = "inicio";
    views.forEach((v) => (v.hidden = v.dataset.view !== nome));
    links.forEach((a) => {
      if (a.closest(".portal-menu")) a.classList.toggle("active", a.dataset.viewLink === nome);
    });
    window.scrollTo({ top: 0 });
    if (nome === "mapa") {
      iniciarMapa();
      // o Leaflet precisa recalcular o tamanho depois que o container fica visível
      setTimeout(() => mapa?.invalidateSize(), 50);
    }
  }
  const viewDoHash = () => location.hash.replace("#", "") || "inicio";
  window.addEventListener("hashchange", () => mostrar(viewDoHash()));
  /* ---------- MAPA ---------- */
  const marcadores = new Map();
  const temPosicao = (p) => typeof p.lat === "number" && typeof p.lng === "number";

  // aviso: dados de exemplo OU pontos ainda sem posição
  const semPos = PONTOS.filter((p) => !temPosicao(p)).length;
  const nota = $("#demoNote");
  if (DADOS_DE_EXEMPLO) nota.hidden = false;
  else if (semPos) { nota.hidden = false; nota.replaceChildren(el("strong", {}, `${semPos} de ${PONTOS.length} pontos ainda sem posição no mapa.`), " Eles aparecem na lista com seus horários; a posição é marcada em ", el("a", { href: "./pontos-editor.html" }, "Marcar pontos no mapa"), " (servidor)."); }
  else nota.hidden = true;
  let filtroTexto = "";
  let filtroLinha = "";

  const selectLinha = $("#filtroLinha");
  LINHAS.forEach((l) => selectLinha.append(el("option", { value: l.id }, l.nome)));
  selectLinha.addEventListener("change", () => { filtroLinha = selectLinha.value; atualizarMapaELista(); });
  $("#buscaPonto").addEventListener("input", (e) => { filtroTexto = e.target.value.trim().toLowerCase(); atualizarMapaELista(); });

  const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const pontosFiltrados = () =>
    PONTOS.filter((p) => {
      if (filtroLinha && !p.linhas.includes(filtroLinha)) return false;
      if (!filtroTexto) return true;
      return semAcento(`${p.nome} ${p.endereco || ""}`).includes(semAcento(filtroTexto));
    });

  function conteudoPopup(p) {
    const prox = proximoHorario(p);
    const box = el("div", { class: "popup" },
      el("strong", {}, p.nome),
      p.endereco ? el("div", { class: "popup-end" }, p.endereco) : null,
      p.aprox ? el("div", { class: "popup-end" }, "Posição aproximada") : null,
      el("div", { class: "popup-prox" }, `Próximo: ${prox.hora}${prox.amanha ? " (amanhã)" : ""}`),
      ...p.linhas.map((id) => el("div", { class: "popup-hor" },
        el("span", { class: "tag", style: `--c:${linhaPorId(id).cor}` }, linhaPorId(id).nome), " ",
        p.horariosPorLinha[id].join(" · "))),
      el("button", { type: "button", class: "popup-fav", onclick: () => definirFavorito(p.id) },
        favorito === p.id ? "★ Ponto favorito" : "☆ Marcar como favorito"));
    return box;
  }

  function iniciarMapa() {
    if (mapa) return;
    if (typeof L === "undefined") { $("#mapFallback").hidden = false; $("#map").hidden = true; atualizarMapaELista(); return; }
    mapa = L.map("map", { scrollWheelZoom: true }).setView(CIDADE.centro, CIDADE.zoom);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);
    PONTOS.filter(temPosicao).forEach((p) => {
      const cor = p.linhas.length > 1 ? "#031745" : linhaPorId(p.linhas[0])?.cor || "#0a7a96";
      const icone = L.divIcon({
        className: "pin-wrap",
        html: `<span class="pin" style="--c:${cor}">🚌</span>`,
        iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -30],
      });
      const m = L.marker([p.lat, p.lng], { icon: icone, title: p.nome, keyboard: true });
      m.bindPopup(() => conteudoPopup(p));
      marcadores.set(p.id, m);
    });
    atualizarMapaELista();
  }

  function atualizarMapaELista() {
    const lista = pontosFiltrados();
    const ids = new Set(lista.map((p) => p.id));
    if (mapa) {
      marcadores.forEach((m, id) => {
        if (ids.has(id)) m.addTo(mapa); else m.remove();
      });
      const comPos = lista.filter(temPosicao);
      if (comPos.length > 1) mapa.fitBounds(L.latLngBounds(comPos.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 15 });
      else if (comPos.length === 1) mapa.setView([comPos[0].lat, comPos[0].lng], 15);
    }
    $("#stopsCount").textContent = lista.length;
    $("#stopsEmpty").hidden = lista.length > 0;
    const ul = $("#stopsList");
    ul.replaceChildren(...lista.map((p) => {
      const prox = proximoHorario(p);
      return el("li", { class: "stop-row" },
        el("button", { type: "button", class: "stop-fav", "aria-pressed": String(favorito === p.id), "aria-label": favorito === p.id ? `Remover ${p.nome} dos favoritos` : `Marcar ${p.nome} como favorito`, onclick: () => definirFavorito(p.id) }, favorito === p.id ? "★" : "☆"),
        el("button", { type: "button", class: "stop", onclick: () => focarPonto(p) },
          el("span", { class: "stop-main" },
            el("strong", {}, p.nome),
            el("small", {}, p.endereco || (temPosicao(p) ? "" : "Posição ainda não definida no mapa")),
            el("span", { class: "stop-tags" }, ...p.linhas.map((id) => el("span", { class: "tag", style: `--c:${linhaPorId(id).cor}` }, linhaPorId(id).nome)))),
          el("span", { class: "stop-next" }, el("small", {}, "Próximo"), el("strong", {}, prox.hora))));
    }));
  }

  function focarPonto(p) {
    const m = marcadores.get(p.id);
    if (mapa && m && temPosicao(p)) {
      document.getElementById("map").scrollIntoView({ behavior: "smooth", block: "center" });
      mapa.flyTo([p.lat, p.lng], 16, { duration: 0.8 });
      m.openPopup();
    } else {
      window.alert(`${p.nome}\n` + p.linhas.map((id) => `${linhaPorId(id).nome}: ${p.horariosPorLinha[id].join(", ")}`).join("\n"));
    }
  }

  function definirFavorito(id) {
    favorito = favorito === id ? null : id;
    gravar(KEY_FAV, favorito);
    atualizarMapaELista();
    atualizarInicio();
    marcadores.forEach((m) => m.closePopup());
  }

  /* ---------- INÍCIO ---------- */
  function atualizarInicio() {
    const { total, mes } = contagens();
    $("#statTotal").textContent = total;
    $("#statMes").textContent = `${mes} neste mês`;
    const p = favorito && pontoPorId(favorito);
    $("#statFavorito").textContent = p ? p.nome : "—";
    if (p) {
      const prox = proximoHorario(p);
      $("#statProximo").textContent = prox.hora;
      $("#statProximoInfo").textContent = prox.amanha ? "Amanhã · " + p.nome : "Hoje · " + p.nome;
    } else {
      $("#statProximo").textContent = "—";
      $("#statProximoInfo").textContent = "Escolha um ponto favorito no mapa";
    }
  }

  /* ---------- VIAGENS ---------- */
  const hojeISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const fmtData = (iso) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };

  function contagens() {
    const hoje = hojeISO();
    const prefixo = hoje.slice(0, 7);
    return { total: viagens.length, mes: viagens.filter((v) => v.data.startsWith(prefixo)).length };
  }

  const selPonto = $("#vPonto");
  PONTOS.forEach((p) => selPonto.append(el("option", { value: p.id }, p.nome)));
  $("#vData").value = hojeISO();
  $("#vData").max = hojeISO();

  function renderViagens() {
    const { total, mes } = contagens();
    $("#vTotal").textContent = total;
    $("#vMes").textContent = mes;
    $("#vMesNome").textContent = `${MESES_LONGOS[new Date().getMonth()]} de ${new Date().getFullYear()}`;

    const ord = [...viagens].sort((a, b) => b.data.localeCompare(a.data) || b.criado - a.criado);
    const ult = ord[0];
    $("#vUltima").textContent = ult ? fmtData(ult.data) : "—";
    $("#vUltimaInfo").textContent = ult ? `${ult.sentido === "ida" ? "Ida" : "Volta"} · ${pontoPorId(ult.ponto)?.nome || "Ponto removido"}` : "Nenhum registro";

    $("#vVazio").hidden = ord.length > 0;
    $("#vLista").replaceChildren(...ord.slice(0, 50).map((v) =>
      el("li", { class: "list-item" },
        el("span", { class: "dot" }),
        el("div", { class: "grow" },
          el("strong", {}, `${fmtData(v.data)} · ${v.sentido === "ida" ? "Ida" : "Volta"}`),
          el("small", {}, pontoPorId(v.ponto)?.nome || "Ponto removido")),
        el("button", { type: "button", class: "btn btn-secondary btn-sm", "aria-label": `Remover viagem de ${fmtData(v.data)}`, onclick: () => remover(v.id) }, "Remover"))));

    // gráfico: últimos 6 meses
    const base = new Date();
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      meses.push({ chave, rotulo: MESES[d.getMonth()], n: viagens.filter((v) => v.data.startsWith(chave)).length });
    }
    const max = Math.max(1, ...meses.map((m) => m.n));
    $("#vBars").setAttribute("aria-label", "Viagens por mês: " + meses.map((m) => `${m.rotulo} ${m.n}`).join(", "));
    $("#vBars").replaceChildren(...meses.map((m) =>
      el("div", { class: "bar" },
        el("span", { class: "bar-n" }, String(m.n)),
        el("span", { class: "bar-fill", style: `height:${(m.n / max) * 100}%` }),
        el("span", { class: "bar-l" }, m.rotulo))));
    atualizarInicio();
  }

  function remover(id) {
    if (!window.confirm("Remover este registro de viagem?")) return;
    viagens = viagens.filter((v) => v.id !== id);
    gravar(KEY_VIAGENS, viagens);
    renderViagens();
  }

  $("#viagemForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = $("#viagemMessage");
    const data = $("#vData").value, ponto = selPonto.value, sentido = $("#vSentido").value;
    const erro = (t) => { msg.className = "message error"; msg.textContent = t; };
    if (!data) return erro("Informe a data da viagem.");
    if (data > hojeISO()) return erro("A data não pode estar no futuro.");
    if (!ponto) return erro("Selecione o ponto de embarque.");
    if (viagens.some((v) => v.data === data && v.sentido === sentido && v.ponto === ponto))
      return erro("Essa viagem já foi registrada.");
    viagens.push({ id: `${Date.now()}${Math.random().toString(36).slice(2, 6)}`, data, ponto, sentido, criado: Date.now() });
    gravar(KEY_VIAGENS, viagens);
    msg.className = "message success";
    msg.textContent = "Viagem registrada!";
    renderViagens();
  });

  renderViagens();
  mostrar(viewDoHash()); // por último: precisa de todo o estado acima já declarado
  // atualiza "próximo ônibus" a cada minuto
  setInterval(atualizarInicio, 60000);
}
