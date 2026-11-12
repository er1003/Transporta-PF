/* =========================================================
   TRANSPORTA PF — JAVASCRIPT GLOBAL
   Tema, acessibilidade (injetada em todas as páginas) e reveal.
   Carregar com <script src="../global/global.js"></script>
========================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const STORAGE_KEY = "transporta_pf_settings";

  const DEFAULTS = {
    fontSize: 100,
    theme: "",          // "", "light" ou "dark" ("" = segue o sistema)
    contrast: false,
    font: false,
    spacing: false,
    links: false,
    motion: false,
  };

  /* ---------- armazenamento (à prova de falhas) ---------- */
  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return { ...DEFAULTS, ...(saved ? JSON.parse(saved) : {}) };
    } catch (e) {
      return { ...DEFAULTS };
    }
  }
  function save(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { /* modo privado */ }
  }

  const systemDark = () =>
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  /* ---------- aplicação ---------- */
  function setFlag(name, on) {
    if (on) root.dataset[name] = "on"; else delete root.dataset[name];
  }

  function apply(s) {
    root.style.fontSize = s.fontSize + "%";
    root.dataset.theme = s.theme || (systemDark() ? "dark" : "light");
    ["contrast", "font", "spacing", "links", "motion"].forEach((k) => setFlag(k, s[k]));

    document.querySelectorAll(".switch[data-setting]").forEach((b) => {
      b.setAttribute("aria-pressed", String(!!s[b.dataset.setting]));
    });
    updateThemeUI();
  }

  function isDark() { return root.dataset.theme === "dark"; }

  function updateThemeUI() {
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-label", isDark() ? "Ativar tema claro" : "Ativar tema escuro");
      const ico = btn.querySelector(".ico");
      if (ico) { ico.classList.toggle("i-sun", isDark()); ico.classList.toggle("i-moon", !isDark()); }
    });
    const row = document.querySelector('.switch[data-setting="dark"]');
    if (row) row.setAttribute("aria-pressed", String(isDark()));
  }

  /* ---------- painel de acessibilidade ---------- */
  const PANEL_HTML = `
    <section id="accessibilityPanel" class="a11y-panel" aria-label="Opções de acessibilidade">
      <h2>Acessibilidade</h2>
      <div class="a11y-row"><span>Tema escuro</span>
        <button class="switch" type="button" data-setting="dark" aria-pressed="false" aria-label="Tema escuro"></button></div>
      <div class="a11y-row"><span>Contraste alto</span>
        <button class="switch" type="button" data-setting="contrast" aria-pressed="false" aria-label="Contraste alto"></button></div>
      <div class="a11y-row"><span>Fonte acessível</span>
        <button class="switch" type="button" data-setting="font" aria-pressed="false" aria-label="Fonte acessível"></button></div>
      <div class="a11y-row"><span>Espaçamento ampliado</span>
        <button class="switch" type="button" data-setting="spacing" aria-pressed="false" aria-label="Espaçamento ampliado"></button></div>
      <div class="a11y-row"><span>Destacar links</span>
        <button class="switch" type="button" data-setting="links" aria-pressed="false" aria-label="Destacar links"></button></div>
      <div class="a11y-row"><span>Reduzir animações</span>
        <button class="switch" type="button" data-setting="motion" aria-pressed="false" aria-label="Reduzir animações"></button></div>
      <div class="a11y-row"><span>Tamanho da fonte</span>
        <div class="font-controls">
          <button id="fontDecrease" type="button" aria-label="Diminuir fonte">A−</button>
          <button id="fontIncrease" type="button" aria-label="Aumentar fonte">A+</button>
        </div></div>
      <button id="resetAccessibility" class="reset-accessibility" type="button">Restaurar padrão</button>
    </section>
    <button id="accessibilityButton" class="a11y-fab" type="button"
      aria-label="Abrir acessibilidade" aria-expanded="false" aria-controls="accessibilityPanel">
      <span class="ico i-access" aria-hidden="true"></span>
    </button>`;

  function mountAccessibility(s) {
    if (!document.getElementById("accessibilityButton")) {
      const box = document.createElement("div");
      box.className = "a11y";
      box.innerHTML = PANEL_HTML;
      document.body.appendChild(box);
    }
    const fab = document.getElementById("accessibilityButton");
    const panel = document.getElementById("accessibilityPanel");

    const toggle = (open) => {
      const o = typeof open === "boolean" ? open : !panel.classList.contains("open");
      panel.classList.toggle("open", o);
      fab.setAttribute("aria-expanded", String(o));
      fab.setAttribute("aria-label", o ? "Fechar acessibilidade" : "Abrir acessibilidade");
    };
    fab.addEventListener("click", () => toggle());
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggle(false); });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".a11y")) toggle(false);
    });

    document.querySelectorAll(".switch[data-setting]").forEach((b) => {
      b.addEventListener("click", () => {
        const key = b.dataset.setting;
        if (key === "dark") {
          s.theme = isDark() ? "light" : "dark";
        } else {
          s[key] = !s[key];
        }
        save(s); apply(s);
      });
    });

    const step = (d) => {
      s.fontSize = Math.min(150, Math.max(80, s.fontSize + d));
      save(s); apply(s);
    };
    document.getElementById("fontIncrease").addEventListener("click", () => step(10));
    document.getElementById("fontDecrease").addEventListener("click", () => step(-10));

    document.getElementById("resetAccessibility").addEventListener("click", () => {
      Object.assign(s, DEFAULTS);
      save(s); apply(s);
    });
  }

  /* ---------- botão de tema do cabeçalho (opcional) ---------- */
  function mountThemeButtons(s) {
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        s.theme = isDark() ? "light" : "dark";
        save(s); apply(s);
      });
    });
  }

  /* ---------- reveal ---------- */
  function mountReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    const reduced =
      root.dataset.motion === "on" ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach((e) => io.observe(e));
  }

  /* ---------- init ---------- */
  const settings = load();
  apply(settings); // aplica já (evita "piscar" de tema)

  document.addEventListener("DOMContentLoaded", () => {
    mountAccessibility(settings);
    mountThemeButtons(settings);
    apply(settings);
    mountReveal();
  });
})();
