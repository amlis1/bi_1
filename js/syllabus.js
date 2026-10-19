/* Actualiza las cuentas regresivas de las evaluaciones en hora de Ecuador. */
(() => {
  "use strict";

  const countdownCards = document.querySelectorAll(".schedule-card[data-deadline]");
  const units = [
    { divisor: 86400000, label: "d" },
    { divisor: 3600000, label: "h" },
    { divisor: 60000, label: "min" },
    { divisor: 1000, label: "s" }
  ];

  function updateCountdowns() {
    const now = Date.now();
    countdownCards.forEach((card) => {
      const output = card.querySelector(".countdown-value");
      const remaining = Date.parse(card.dataset.deadline) - now;
      if (Number.isNaN(remaining)) {
        output.textContent = "Fecha por confirmar";
        return;
      }
      if (remaining <= 0) {
        output.textContent = "Plazo finalizado";
        card.classList.add("schedule-complete");
        return;
      }
      let remainder = remaining;
      const parts = units.map(({ divisor, label }) => {
        const value = Math.floor(remainder / divisor);
        remainder %= divisor;
        return `${value}${label}`;
      });
      output.textContent = parts.join(" ");
    });
  }

  updateCountdowns();
  if (countdownCards.length) window.setInterval(updateCountdowns, 1000);
})();
