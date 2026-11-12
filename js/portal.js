import { supabase } from "../supabase/supabase.js";

const page = document.body.dataset.page;

const $ = (s) => document.querySelector(s);

function displayName(user) {
  return (user?.user_metadata?.full_name || user?.email || "Usuário").trim();
}
function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join("").toUpperCase() || "U";
}
function applyStoredPreferences() {
  const root=document.documentElement;
  const theme=localStorage.getItem("tpf-theme") || "light";
  root.dataset.theme=theme;
  if(localStorage.getItem("tpf-contrast")==="on") root.dataset.contrast="on"; else delete root.dataset.contrast;
  if(localStorage.getItem("tpf-font")==="on") root.dataset.font="on"; else delete root.dataset.font;
}
applyStoredPreferences();

function setupTheme() {
  const button=$("#themeToggle");
  if(!button) return;
  button.addEventListener("click",()=>{
    const next=document.documentElement.dataset.theme==="dark"?"light":"dark";
    document.documentElement.dataset.theme=next;
    localStorage.setItem("tpf-theme",next);
  });
}
setupTheme();

function setupMobile() {
  const btn=$("#mobileMenu");
  if(!btn) return;
  const nav=document.querySelector(".portal-menu");
  btn.addEventListener("click",()=> {
    const open=nav.classList.toggle("mobile-open");
    btn.setAttribute("aria-expanded",String(open));
  });
}
setupMobile();

async function getUser() {
  const {data,error}=await supabase.auth.getUser();
  if(error || !data?.user) {
    window.location.replace("./login.html");
    return null;
  }
  return data.user;
}

function fillIdentity(user) {
  const name=displayName(user);
  const first=name.split(/\s+/)[0];
  const avatar=initials(name);
  if($("#userName")) $("#userName").textContent=name;
  if($("#firstName")) $("#firstName").textContent=first;
  if($("#avatar")) $("#avatar").textContent=avatar;
  if($("#profileAvatar")) $("#profileAvatar").textContent=avatar;
  if($("#roleLabel")) $("#roleLabel").textContent=user.user_metadata?.perfil==="servidor"?"Trabalhador público":"Aluno";
}

async function initDashboard() {
  const user=await getUser(); if(!user) return;
  const role=user.user_metadata?.perfil;
  if(page==="aluno" && role==="servidor"){ window.location.replace("./trabalhador-publico.html"); return; }
  if(page==="trabalhador" && role==="aluno"){ window.location.replace("./aluno.html"); return; }
  fillIdentity(user);
  if(page==="aluno") {
    // Preparado para substituir pelos dados reais do banco quando a tabela de presenças/rotas estiver conectada.
    $("#presencas").textContent="0";
  }
  if(page==="trabalhador") {
    $("#alunosCount").textContent="0";
    $("#veiculosCount").textContent="0";
    $("#rotasCount").textContent="0";
  }
}

function setupProfileTabs() {
  const buttons=document.querySelectorAll("[data-tab]");
  const panels=document.querySelectorAll(".tab-panel");
  buttons.forEach(btn=>btn.addEventListener("click",()=>{
    const id=btn.dataset.tab;
    buttons.forEach(b=>b.classList.toggle("active",b===btn));
    panels.forEach(p=>p.hidden=p.id!==`tab-${id}`);
  }));
}

async function initProfile() {
  const user=await getUser(); if(!user) return;
  fillIdentity(user);
  const metadata=user.user_metadata||{};
  $("#fullName").value=metadata.full_name||"";
  $("#email").value=user.email||"";
  $("#phone").value=metadata.phone||"";
  $("#perfil").value=metadata.perfil==="servidor"?"Trabalhador público":"Aluno";

  const dark=$("#darkMode"), contrast=$("#contrastMode"), font=$("#fontMode");
  dark.checked=document.documentElement.dataset.theme==="dark";
  contrast.checked=document.documentElement.dataset.contrast==="on";
  font.checked=document.documentElement.dataset.font==="on";
  dark.addEventListener("change",()=>{const v=dark.checked?"dark":"light";document.documentElement.dataset.theme=v;localStorage.setItem("tpf-theme",v)});
  contrast.addEventListener("change",()=>{if(contrast.checked)document.documentElement.dataset.contrast="on";else delete document.documentElement.dataset.contrast;localStorage.setItem("tpf-contrast",contrast.checked?"on":"off")});
  font.addEventListener("change",()=>{if(font.checked)document.documentElement.dataset.font="on";else delete document.documentElement.dataset.font;localStorage.setItem("tpf-font",font.checked?"on":"off")});

  $("#profileForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const message=$("#profileMessage"), button=$("#saveProfile");
    const fullName=$("#fullName").value.trim(), phone=$("#phone").value.trim();
    if(!fullName){message.className="message error";message.textContent="Informe seu nome completo.";return}
    button.disabled=true;message.className="message info";message.textContent="Salvando...";
    const {error}=await supabase.auth.updateUser({data:{full_name:fullName,phone}});
    if(error){message.className="message error";message.textContent="Não foi possível salvar. Tente novamente.";button.disabled=false;return}
    message.className="message success";message.textContent="Dados atualizados com sucesso.";fillIdentity({ ...user,user_metadata:{...user.user_metadata,full_name:fullName,phone}});
    button.disabled=false;
  });

  $("#logoutButton")?.addEventListener("click",async()=>{
    await supabase.auth.signOut();
    window.location.replace("./login.html");
  });
  setupProfileTabs();
}

if(page==="perfil") initProfile(); else initDashboard();

supabase.auth.onAuthStateChange((event)=>{
  if(event==="SIGNED_OUT") window.location.replace("./login.html");
});
