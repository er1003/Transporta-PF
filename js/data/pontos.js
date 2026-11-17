/* Pontos e horários do transporte (Porto Ferreira – SP).
 *
 * FONTE DOS HORÁRIOS: PDF "LINHA_LESTE.PDF" (linhas Leste, Norte, Oeste e Sul) — horários APROXIMADOS de
 * passagem pelos bairros, transcritos da tabela de cada linha. Cada bairro vira um "ponto" no mapa.
 * Os horários abaixo seguem as 19 saídas da Integração em cada linha.
 *
 * COORDENADAS: o PDF não traz coordenadas. Só a Integração usa a coordenada informada da cidade.
 * Os demais pontos ficam "sem posição" até serem marcados em html/pontos-editor.html; o editor gera
 * o conteúdo de js/data/posicoes.js, que é lido aqui.
 */
import { POSICOES } from "./posicoes.js";

export const DADOS_DE_EXEMPLO = false;
export const CIDADE = { nome: "Porto Ferreira – SP", centro: [-21.85389, -47.47917], zoom: 15 };

// Saídas da Integração (iguais nas 4 linhas)
const PARTIDAS = ["05:20", "06:00", "06:50", "07:40", "08:30", "09:20", "10:10", "11:00", "11:50", "12:40", "13:50", "14:40", "15:30", "16:20", "17:10", "18:00", "18:50", "19:40", "22:00"];

// Cada linha: bairros na ordem do trajeto, com os 19 horários de passagem.
const T = (s) => s.trim().split(/\s+/);
export const LINHAS = [
  {
    id: "LESTE", nome: "Linha Leste", cor: "#6b2fa0",
    bairros: [
      ["Vila Sibilla", T("05:25 06:06 06:56 07:46 08:36 09:26 10:16 11:06 11:56 12:46 13:56 14:46 15:36 16:26 17:16 18:06 18:56 19:46 22:06")],
      ["Sérgio Dorneles", T("05:32 06:14 07:04 07:54 08:44 09:34 10:24 11:14 12:04 12:54 14:04 14:54 15:44 16:34 17:24 18:14 19:04 19:54 22:14")],
      ["Jd. Independência", T("05:37 06:20 07:10 08:00 08:50 09:40 10:30 11:20 12:10 13:00 14:10 15:00 15:50 16:40 17:30 18:20 19:10 20:00 22:20")],
      ["José Gomes", T("05:43 06:27 07:17 08:07 08:57 09:47 10:37 11:27 12:17 13:07 14:17 15:07 15:57 16:47 17:37 18:27 19:17 20:07 22:27")],
      ["Santa Luzia", T("05:45 06:30 07:20 08:10 09:00 09:50 10:40 11:30 12:20 13:10 14:20 15:10 16:00 16:50 17:40 18:30 19:20 20:10 22:30")],
      ["Granjeiros", T("05:46 06:31 07:21 08:11 09:01 09:51 10:41 11:31 12:21 13:11 14:21 15:11 16:01 16:51 17:41 18:31 19:21 20:11 22:31")],
      ["Porto Novo", T("05:48 06:33 07:23 08:13 09:03 09:53 10:43 11:33 12:23 13:13 14:23 15:13 16:03 16:53 17:43 18:33 19:23 20:13 22:33")],
      ["Centro", T("05:54 06:45 07:35 08:25 09:15 10:05 10:55 11:45 12:35 13:25 14:35 15:25 16:15 17:05 17:55 18:45 19:35 20:25 22:45")],
    ],
  },
  {
    id: "NORTE", nome: "Linha Norte", cor: "#c7861c",
    bairros: [
      ["Santa Cruz", T("05:24 06:05 06:55 07:45 08:35 09:25 10:15 11:05 11:55 12:45 13:55 14:45 15:35 16:25 17:15 18:05 18:55 19:45 22:05")],
      ["Paschoal Salzano", T("05:25 06:06 06:56 07:46 08:36 09:26 10:16 11:06 11:56 12:46 13:56 14:46 15:36 16:26 17:16 18:06 18:56 19:46 22:06")],
      ["Centenário", T("05:27 06:09 06:59 07:49 08:39 09:29 10:19 11:09 11:59 12:49 13:59 14:49 15:39 16:29 17:19 18:09 18:59 19:49 22:09")],
      ["Vila Real", T("05:31 06:15 07:05 07:55 08:45 09:35 10:25 11:15 12:05 12:55 14:05 14:55 15:45 16:35 17:25 18:15 19:05 19:55 22:15")],
      ["Porto Bello I", T("05:32 06:17 07:07 07:57 08:47 09:37 10:27 11:17 12:07 12:57 14:07 14:57 15:47 16:37 17:27 18:17 19:07 19:57 22:17")],
      ["Paulo Calisto", T("05:36 06:19 07:09 07:59 08:49 09:39 10:29 11:19 12:09 12:59 14:09 14:59 15:49 16:39 17:29 18:19 19:09 19:59 22:19")],
      ["Porto Bello II", T("05:40 06:22 07:12 08:02 08:52 09:42 10:32 11:22 12:12 13:02 14:12 15:02 15:52 16:42 17:32 18:22 19:12 20:02 22:22")],
      ["Santo Afonso", T("05:43 06:26 07:16 08:06 08:56 09:46 10:36 11:26 12:16 13:06 14:16 15:06 15:56 16:46 17:36 18:26 19:16 20:06 22:26")],
      ["Cristo", T("05:50 06:35 07:25 08:15 09:05 09:55 10:45 11:35 12:25 13:15 14:25 15:15 16:05 16:55 17:45 18:35 19:25 20:15 22:35")],
      ["Centro", T("05:55 06:42 07:32 08:22 09:12 10:02 10:52 11:42 12:32 13:22 14:32 15:22 16:12 17:02 17:52 18:42 19:32 20:22 22:42")],
    ],
  },
  {
    id: "OESTE", nome: "Linha Oeste", cor: "#1d4ed8",
    bairros: [
      ["Anésia", T("05:29 06:09 06:59 07:49 08:39 09:29 10:19 11:09 11:59 12:49 13:59 14:49 15:39 16:29 17:19 18:09 18:59 19:49 22:09")],
      // ⚠ A coluna 08:30 do PDF traz valores fora do padrão (Águas Claras 08:52, São Manoel 09:14, Jd. Dalva 09:39,
      //   Rodoviária 10:12, Centro 10:50). Corrigidos pelo intervalo das demais saídas: 08:43, 08:52, 08:55, 09:03, 09:08.
      //   CONFIRMAR com a prefeitura/empresa.
      ["Águas Claras", T("05:33 06:13 07:03 07:53 08:43 09:33 10:23 11:13 12:03 12:53 14:03 14:53 15:43 16:33 17:23 18:13 19:03 19:53 22:13")],
      ["São Manoel", T("05:40 06:22 07:12 08:02 08:52 09:42 10:32 11:22 12:12 13:02 14:12 15:02 15:52 16:42 17:32 18:22 19:12 20:02 22:22")],
      ["Jd. Dalva", T("05:43 06:25 07:15 08:05 08:55 09:45 10:35 11:25 12:15 13:05 14:15 15:05 15:55 16:45 17:35 18:25 19:15 20:05 22:25")],
      ["Rodoviária", T("05:50 06:33 07:23 08:13 09:03 09:53 10:43 11:33 12:23 13:13 14:23 15:13 16:03 16:53 17:43 18:33 19:23 20:13 22:33")],
      ["Centro", T("05:55 06:38 07:28 08:18 09:08 09:58 10:48 11:38 12:28 13:18 14:28 15:18 16:08 16:58 17:48 18:38 19:28 20:18 22:38")],
    ],
  },
  {
    id: "SUL", nome: "Linha Sul", cor: "#d6249f",
    bairros: [
      ["Rodoviária", T("05:26 06:06 06:56 07:46 08:36 09:26 10:16 11:06 11:56 12:46 13:56 14:46 15:36 16:26 17:16 18:06 18:56 19:46 22:06")],
      ["Primavera", T("05:29 06:10 07:00 07:50 08:40 09:30 10:20 11:10 12:00 12:50 14:00 14:50 15:40 16:30 17:20 18:10 19:00 19:50 22:10")],
      ["Atacadão", T("05:33 06:14 07:04 07:54 08:44 09:34 10:24 11:14 12:04 12:54 14:04 14:54 15:44 16:34 17:24 18:14 19:04 19:54 22:14")],
      ["Santa Maria", T("05:40 06:20 07:10 08:00 08:50 09:40 10:30 11:20 12:10 13:00 14:10 15:00 15:50 16:40 17:30 18:20 19:10 20:00 22:20")],
      ["Recreio Bela Vista", T("05:42 06:25 07:15 08:05 08:55 09:45 10:35 11:25 12:15 13:05 14:15 15:05 15:55 16:45 17:35 18:25 19:15 20:05 22:25")],
      ["Aeroporto", T("05:44 06:27 07:17 08:07 08:57 09:47 10:37 11:27 12:17 13:07 14:17 15:07 15:57 16:47 17:37 18:27 19:17 20:07 22:27")],
      ["CEFER", T("05:47 06:30 07:20 08:10 09:00 09:50 10:40 11:30 12:20 13:10 14:20 15:10 16:00 16:50 17:40 18:30 19:20 20:10 22:30")],
      ["Santa Rosa", T("05:50 06:34 07:24 08:14 09:04 09:54 10:44 11:34 12:24 13:14 14:24 15:14 16:04 16:54 17:44 18:34 19:24 20:14 22:34")],
      ["Serra D'Água", T("05:53 06:37 07:27 08:17 09:07 09:57 10:47 11:37 12:27 13:17 14:27 15:17 16:07 16:57 17:47 18:37 19:27 20:17 22:37")],
      ["Centro", T("05:56 06:43 07:33 08:23 09:13 10:03 10:53 11:43 12:33 13:23 14:33 15:23 16:13 17:03 17:53 18:43 19:33 20:23 22:43")],
    ],
  },
];

/* ---------- monta os pontos (um por bairro; bairros iguais em várias linhas viram um só) ---------- */
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const mapa = new Map();
const adicionar = (nome, linhaId, horarios, extra = {}) => {
  const id = slug(nome);
  if (!mapa.has(id)) mapa.set(id, { id, nome, endereco: "", lat: null, lng: null, aprox: false, linhas: [], horariosPorLinha: {}, ...extra });
  const p = mapa.get(id);
  p.linhas.push(linhaId);
  p.horariosPorLinha[linhaId] = horarios;
};

LINHAS.forEach((l) => adicionar("Integração (terminal)", l.id, PARTIDAS, { lat: CIDADE.centro[0], lng: CIDADE.centro[1], aprox: true, endereco: "Terminal de integração · saídas de cada linha" }));
LINHAS.forEach((l) => l.bairros.forEach(([nome, horarios]) => adicionar(nome, l.id, horarios)));

export const PONTOS = [...mapa.values()].map((p) => {
  const pos = POSICOES[p.id];
  if (pos) { p.lat = pos[0]; p.lng = pos[1]; p.aprox = false; }
  // União ordenada de todos os horários do ponto (usada em "próximo ônibus")
  p.horarios = [...new Set(Object.values(p.horariosPorLinha).flat())].sort();
  return p;
});
