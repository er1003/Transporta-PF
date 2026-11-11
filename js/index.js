/* =========================================================
   TRANSPORTA PF — JAVASCRIPT DA HOME
   Menu mobile, sombra do cabeçalho ao rolar e rolagem suave
========================================================= */
(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const nav = document.getElementById("mainNav");
  const button = document.getElementById("menuButton");

  /* ---------- menu mobile ---------- */
  function setMenu(open) {
    if (!nav || !button) return;
    nav.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    const ico = button.querySelector(".ico");
    if (ico) {
      ico.classList.toggle("i-x", open);
      ico.classList.toggle("i-menu", !open);
    }
  }

  if (button) {
    button.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".site-header")) setMenu(false);
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", () => setMenu(false));
  }

  /* ---------- links âncora (fecha o menu e rola até a seção) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      setMenu(false);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  });

  /* ---------- cabeçalho ---------- */
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
