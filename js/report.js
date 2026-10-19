/* Exporta una instantánea en PDF de los indicadores, gráficos y tabla visibles. */
(() => {
  "use strict";

  const exportButton = document.querySelector("#export-pdf");
  const status = document.querySelector("#export-status");
  const roundFilter = document.querySelector("#round-filter");
  if (!exportButton || !status || !roundFilter) return;

  function setExportStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }

  function fitImage(doc, image, x, y, maxWidth, maxHeight) {
    const properties = doc.getImageProperties(image);
    const scale = Math.min(maxWidth / properties.width, maxHeight / properties.height);
    const width = properties.width * scale;
    const height = properties.height * scale;
    doc.addImage(image, "PNG", x + (maxWidth - width) / 2, y + (maxHeight - height) / 2, width, height);
  }

  function getChartImage(id) {
    const canvas = document.querySelector(`#${id}`);
    if (!canvas || !window.Chart.getChart(canvas)) {
      throw new Error(`La gráfica "${id}" todavía no está disponible.`);
    }
    return canvas.toDataURL("image/png", 1);
  }

  function captureChartsForReport() {
    const chartIds = ["goals-chart", "results-chart", "points-chart", "possession-chart"];
    const charts = chartIds.map((id) => {
      const canvas = document.querySelector(`#${id}`);
      const chart = canvas && window.Chart.getChart(canvas);
      if (!chart) throw new Error(`La gráfica "${id}" todavía no está disponible.`);
      return chart;
    });
    const previousDefaultColor = window.Chart.defaults.color;
    const scaleColors = charts.map((chart) => Object.values(chart.options.scales || {}).map((scale) => ({
      ticks: scale.ticks?.color,
      grid: scale.grid?.color
    })));
    const useLightColors = document.documentElement.dataset.theme === "dark";

    try {
      if (useLightColors) {
        window.Chart.defaults.color = "#78857b";
        charts.forEach((chart) => {
          Object.values(chart.options.scales || {}).forEach((scale) => {
            if (scale.ticks) scale.ticks.color = "#78857b";
            if (scale.grid && scale.grid.display !== false) scale.grid.color = "#edf0eb";
          });
        });
        charts.forEach((chart) => chart.update("none"));
      }
      return Object.fromEntries(chartIds.map((id) => [id, getChartImage(id)]));
    } finally {
      if (useLightColors) {
        window.Chart.defaults.color = previousDefaultColor;
        charts.forEach((chart, chartIndex) => {
          Object.values(chart.options.scales || {}).forEach((scale, scaleIndex) => {
            const saved = scaleColors[chartIndex][scaleIndex];
            if (scale.ticks) scale.ticks.color = saved.ticks;
            if (scale.grid && scale.grid.display !== false) scale.grid.color = saved.grid;
          });
        });
        charts.forEach((chart) => chart.update("none"));
      }
    }
  }

  function collectStandings() {
    return [...document.querySelectorAll("#standings-body tr")].map((row) =>
      [...row.querySelectorAll("td")].map((cell) => cell.textContent.trim().replace(/\s+/g, " "))
    );
  }

  function exportReport() {
    if (!window.jspdf?.jsPDF || typeof window.Chart !== "function") {
      throw new Error("No se pudieron cargar las librerías de exportación. Comprueba tu conexión e inténtalo de nuevo.");
    }
    const doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    if (typeof doc.autoTable !== "function") {
      throw new Error("No se pudo iniciar el generador de tablas PDF. Recarga la página e inténtalo de nuevo.");
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const roundLabel = roundFilter.value === "all" ? "Todo el torneo" : `Hasta la jornada ${roundFilter.value}`;
    const createdAt = new Intl.DateTimeFormat("es-EC", { dateStyle: "long", timeStyle: "short" }).format(new Date());

    doc.setFillColor(20, 41, 31);
    doc.rect(0, 0, pageWidth, 43, "F");
    doc.setTextColor(200, 241, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("BI LAB  /  INFORME ANALÍTICO", margin, 12);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Liga Pro 2026", margin, 23);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(207, 219, 208);
    doc.text(`${roundLabel}  ·  Generado el ${createdAt}`, margin, 32);

    const kpis = [
      ["GOLES", document.querySelector("#kpi-goals").textContent],
      ["LÍDER", document.querySelector("#kpi-leader").textContent],
      ["GOLES / PARTIDO", document.querySelector("#kpi-average").textContent],
      ["GOLEADOR", `${document.querySelector("#kpi-scorer").textContent} (${document.querySelector("#kpi-scorer-note").textContent})`],
      ["PARTIDOS", document.querySelector("#kpi-matches").textContent]
    ];
    const gap = 4;
    const cardWidth = (pageWidth - margin * 2 - gap * (kpis.length - 1)) / kpis.length;
    kpis.forEach(([label, value], index) => {
      const x = margin + index * (cardWidth + gap);
      doc.setFillColor(245, 247, 241);
      doc.roundedRect(x, 48, cardWidth, 20, 2, 2, "F");
      doc.setTextColor(110, 126, 112);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(label, x + 3, 55);
      doc.setTextColor(35, 53, 40);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const lines = doc.splitTextToSize(value, cardWidth - 6);
      doc.text(lines[0], x + 3, 63);
    });

    const chartImages = captureChartsForReport();
    const chartCards = [
      { id: "goals-chart", x: margin, y: 73 },
      { id: "results-chart", x: pageWidth / 2 + 2, y: 73 },
      { id: "points-chart", x: margin, y: 139 },
      { id: "possession-chart", x: pageWidth / 2 + 2, y: 139 }
    ];
    const chartWidth = (pageWidth - margin * 2 - 4) / 2;
    chartCards.forEach(({ id, x, y }) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 233, 225);
      doc.roundedRect(x, y, chartWidth, 60, 2, 2, "FD");
      fitImage(doc, chartImages[id], x + 3, y + 2, chartWidth - 6, 56);
    });
    doc.setTextColor(120, 132, 121);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Los valores corresponden a los partidos incluidos en el filtro seleccionado. Datos simulados con fines educativos.", margin, 204);

    doc.addPage("a4", "landscape");
    doc.setTextColor(31, 53, 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("Tabla de posiciones", margin, 19);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(104, 119, 107);
    doc.text(`${roundLabel}  ·  ${document.querySelector("#kpi-matches").textContent} partidos jugados`, margin, 26);
    doc.autoTable({
      startY: 34,
      head: [["#", "Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "DG", "PTS"]],
      body: collectStandings(),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8, cellPadding: 3, textColor: [63, 78, 66], lineColor: [228, 233, 225], lineWidth: 0.15 },
      headStyles: { fillColor: [28, 73, 52], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [247, 249, 244] },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 67 }, 9: { fontStyle: "bold", textColor: [53, 91, 55] } },
      margin: { left: margin, right: margin }
    });

    const filename = `liga-pro-2026-${roundFilter.value === "all" ? "torneo-completo" : `jornada-${roundFilter.value}`}.pdf`;
    doc.save(filename);
  }

  exportButton.addEventListener("click", () => {
    exportButton.disabled = true;
    setExportStatus("Preparando el informe PDF…");
    try {
      exportReport();
      setExportStatus("Informe PDF exportado correctamente.");
    } catch (error) {
      console.error("No se pudo exportar el informe de Liga Pro.", error);
      setExportStatus(error instanceof Error ? error.message : "Ocurrió un error al exportar el informe.", true);
    } finally {
      exportButton.disabled = false;
    }
  });
})();
