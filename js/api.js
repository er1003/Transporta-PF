/* Cliente do Backend Flask (Backend/app.py) e utilitários usados por viagens-admin.js. */

// Em desenvolvimento a API roda em http://127.0.0.1:5000 (python -m Backend.app).
export const API_URL = window.TPF_API_URL || "http://127.0.0.1:5000/api";

export const TURNOS = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };
export const STATUS = {
  planejada: "Planejada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

/** fetch JSON. `body` (objeto) é serializado. Lança Error com a mensagem da API. */
export async function api(caminho, { method = "GET", body } = {}) {
  let resposta;
  try {
    resposta = await fetch(API_URL + caminho, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Verifique se o Backend está em execução.");
  }
  let dados = null;
  try { dados = await resposta.json(); } catch { /* resposta sem corpo */ }
  if (!resposta.ok) throw new Error(dados?.message || `Erro ${resposta.status} na requisição.`);
  return dados;
}

/** Cria um elemento DOM. onclick/onchange viram listeners; filhos falsos são ignorados. */
export function el(tag, attrs = {}, ...filhos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (v === true) n.setAttribute(k, "");
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  n.append(...filhos.flat().filter((f) => f != null && f !== false));
  return n;
}

/** "2026-11-16" → "16/11/2026" */
export function formatarData(iso) {
  if (!iso) return "—";
  const [a, m, d] = String(iso).slice(0, 10).split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
}
