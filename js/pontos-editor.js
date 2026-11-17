import { userReady } from "./portal.js";
import { CIDADE, LINHAS, PONTOS } from "./data/pontos.js";
import { POSICOES } from "./data/posicoes.js";

/* Ferramenta para posicionar cada ponto no mapa e gerar js/data/posicoes.js. */
const $ = (s) => document.querySelector(s);
const KEY = "tpf-posicoes-rascunho";

function el(tag, attrs = {}, ...filhos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v != null && v !== false) n.setAttribute(k, v);
  }
  n.append(...filhos.filter((f) => f != null && f !== false));
  return n;
}

const user = await userReady;
if (user) iniciar();

function iniciar() {
  // posições atuais = arquivo posicoes.js + rascunho do navegador (o rascunho vence)
  let pos = { ...POSICOES };
  try { Object.assign(pos, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* sem rascunho */ }
  // Integração começa na coordenada da cidade (aproximada), mas só entra no arquivo se você confirmar/mover
  const salvar = () => { try { localStorage.setItem(KEY, JSON.stringify(pos)); } catch { /* modo privado */ } };

  const arredondar = (n) => Math.round(n * 1e6) / 1e6;
  const coordDe = (p) => pos[p.id] || (p.aprox ? [p.lat, p.lng] : null);
  const marcado = (p) => !!pos[p.id];
  let atual = (PONTOS.find((p) => !marcado(p)) || PONTOS[0]).id;
  const marcadores = new Map();
  let mapa = null;

  const msg = (t, tipo = "info") => { const m = $("#editorMsg"); m.textContent = t || ""; m.className = t ? `message ${tipo}` : "message"; };

  function conteudo() {
    const linhas = {};
    Object.keys(pos).sort().forEach((k) => (linhas[k] = pos[k]));
    const corpo = Object.entries(linhas).map(([k, v]) => `  ${JSON.stringify(k)}: [${v[0]}, ${v[1]}],`).join("\n");
    return `/* Posições dos pontos no mapa: { "id-do-ponto": [latitude, longitude] }.\n * Gerado em html/pontos-editor.html. */\nexport const POSICOES = {\n${corpo}\n};\n`;
  }

  function desenharLista() {
    const feitos = PONTOS.filter(marcado).length;
    $("#progresso").textContent = `${feitos} de ${PONTOS.length} pontos marcados`;
    const p = PONTOS.find((x) => x.id === atual);
    $("#selecionado").textContent = p ? `· marcando: ${p.nome}` : "";
    $("#lista").replaceChildren(...PONTOS.map((p) =>
      el("li", {}, el("button", { type: "button", class: "stop" + (p.id === atual ? " is-current" : ""), "aria-current": p.id === atual ? "true" : null, onclick: () => selecionar(p.id) },
        el("span", { class: "stop-main" },
          el("strong", {}, p.nome),
          el("span", { class: "stop-tags" }, ...p.linhas.map((id) => el("span", { class: "tag", style: `--c:${LINHAS.find((l) => l.id === id).cor}` }, LINHAS.find((l) => l.id === id).nome)))),
        el("span", { class: "stop-next" }, el("strong", {}, marcado(p) ? "✓" : "○"))))));
  }

  function icone(p) {
    const cor = p.linhas.length > 1 ? "#031745" : LINHAS.find((l) => l.id === p.linhas[0]).cor;
    return L.divIcon({ className: "pin-wrap", html: `<span class="pin" style="--c:${cor}">${p.id === atual ? "★" : "🚌"}</span>`, iconSize: [34, 34], iconAnchor: [17, 34] });
  }

  function desenharMarcador(p) {
    marcadores.get(p.id)?.remove();
    const c = coordDe(p);
    if (!mapa || !c) return;
    const m = L.marker(c, { icon: icone(p), draggable: true, title: p.nome, keyboard: true });
    m.bindTooltip(p.nome);
    m.on("dragend", () => { const ll = m.getLatLng(); pos[p.id] = [arredondar(ll.lat), arredondar(ll.lng)]; salvar(); desenharLista(); msg(`${p.nome}: posição ajustada.`, "success"); });
    m.on("click", () => selecionar(p.id));
    m.addTo(mapa);
    marcadores.set(p.id, m);
  }

  function selecionar(id) {
    atual = id;
    PONTOS.forEach(desenharMarcador);
    desenharLista();
    const c = coordDe(PONTOS.find((p) => p.id === id));
    if (c && mapa) mapa.panTo(c);
  }

  function marcar(lat, lng) {
    const p = PONTOS.find((x) => x.id === atual);
    pos[p.id] = [arredondar(lat), arredondar(lng)];
    salvar();
    desenharMarcador(p);
    msg(`${p.nome} marcado.`, "success");
    const prox = PONTOS.find((x) => !marcado(x));
    if (prox) { atual = prox.id; PONTOS.forEach(desenharMarcador); }
    desenharLista();
  }

  if (typeof L === "undefined") { $("#mapFallback").hidden = false; $("#map").hidden = true; }
  else {
    mapa = L.map("map").setView(CIDADE.centro, CIDADE.zoom);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(mapa);
    mapa.on("click", (e) => marcar(e.latlng.lat, e.latlng.lng));
    PONTOS.forEach(desenharMarcador);
    setTimeout(() => mapa.invalidateSize(), 50);
  }
  desenharLista();

  $("#btnCopiar").addEventListener("click", async () => {
    const texto = conteudo();
    try { await navigator.clipboard.writeText(texto); msg("Copiado! Cole em js/data/posicoes.js.", "success"); }
    catch { msg("Não foi possível copiar automaticamente. Use \"Baixar posicoes.js\".", "error"); }
  });
  $("#btnBaixar").addEventListener("click", () => {
    const a = el("a", { href: URL.createObjectURL(new Blob([conteudo()], { type: "text/javascript" })), download: "posicoes.js" });
    document.body.append(a); a.click(); a.remove();
    msg("Arquivo baixado. Substitua js/data/posicoes.js por ele.", "success");
  });
  $("#btnLimpar").addEventListener("click", () => {
    if (!window.confirm("Apagar todas as marcações feitas neste navegador?")) return;
    pos = {}; salvar(); PONTOS.forEach(desenharMarcador); desenharLista(); msg("Marcações apagadas.", "info");
  });
}
