/* Alterna el tema del sitio y conserva la preferencia entre páginas y visitas. */
(() => {
  "use strict";

  const storageKey = "biLabTheme";
  const toggleButtons = document.querySelectorAll(".theme-toggle");

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    toggleButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(isDark));
      button.setAttribute("aria-label", `Cambiar a tema ${isDark ? "claro" : "oscuro"}`);
      const label = button.querySelector(".theme-toggle-label");
      const icon = button.querySelector(".theme-toggle-icon");
      if (label) label.textContent = `Tema ${isDark ? "claro" : "oscuro"}`;
      if (icon) icon.textContent = isDark ? "☀" : "☾";
    });
    window.dispatchEvent(new CustomEvent("bi-theme-change", { detail: { theme: isDark ? "dark" : "light" } }));
  }

  let savedTheme = "light";
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "dark" || stored === "light") savedTheme = stored;
  } catch (error) {
    console.warn("No se pudo leer la preferencia de tema del navegador.", error);
  }
  applyTheme(savedTheme);

  toggleButtons.forEach((button) => button.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
      localStorage.setItem(storageKey, nextTheme);
    } catch (error) {
      console.warn("No se pudo guardar la preferencia de tema del navegador.", error);
    }
  }));
})();
