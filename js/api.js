/* Cliente da API Flask (Backend/). Reaproveita a sessão do Supabase já usada pelo portal:
 * o token vai no cabeçalho Authorization para a API validar o perfil quando o controle de
 * acesso do backend for ligado (combinar com o responsável pela autenticação). */
import { supabase } from "../supabase/supabase.js";

// Para outro endereço, defina window.TPF_API_URL antes de carregar o módulo.
export const API_URL = window.TPF_API_URL || "http://127.0.0.1:5000/api";

export async function api(caminho, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(API_URL + caminho, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw new Error("Não foi possível conectar ao servidor. Verifique se o backend está em execução.");
  }
  const json = await resposta.json().catch(() => null);
  if (resposta.status === 401 && !location.pathname.endsWith("login.html")) {
    // Sessão vencida ou token recusado pelo servidor: volta ao login em vez de deixar a tela "muda".
    await supabase.auth.signOut().catch(() => {});
    location.replace("./login.html");
  }
  if (!resposta.ok) {
    const erro = new Error(json?.message || `Erro ${resposta.status} ao falar com o servidor.`);
    erro.status = resposta.status;
    throw erro;
  }
  return json;
}

export const TURNOS = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };
export const STATUS = {
  planejada: "Planejada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

/** Cria elemento DOM sem usar innerHTML (evita injeção de HTML vinda do banco). */
export function el(tag, props = {}, ...filhos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
  }
  for (const f of filhos.flat()) if (f != null && f !== false) n.append(f.nodeType ? f : document.createTextNode(f));
  return n;
}

export const formatarData = (iso) => (iso ? iso.split("-").reverse().join("/") : "");

let _me = null;
/** Quem é o usuário logado e qual o papel (admin | monitora | motorista | sem_papel), vindo do servidor. */
export async function carregarMe() {
  if (!_me) _me = await api("/me");
  return _me;
}
