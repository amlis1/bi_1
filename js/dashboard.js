/* Calcula indicadores y mantiene las cuatro visualizaciones sincronizadas. */
(() => {
  "use strict";
  const data = window.LigaProData;
  if (!data || !window.Chart) {
    console.error("No se pudieron cargar los datos de Liga Pro o Chart.js.");
    return;
  }
  Chart.defaults.font.family = '"DM Sans", sans-serif';
  const isDarkTheme = () => document.documentElement.dataset.theme === "dark";
  Chart.defaults.color = isDarkTheme() ? "#c1ccc2" : "#78857b";
  Chart.defaults.animation.duration = 650;

  const teamById = new Map(data.teams.map((team) => [team.id, team]));
  const filter = document.querySelector("#round-filter");
  const tableBody = document.querySelector("#standings-body");
  if (!filter || !tableBody) return;
  const colors = { home: "#78a34b", away: "#5d9eb2", draw: "#e1b85f", grid: isDarkTheme() ? "#344237" : "#edf0eb" };
  const charts = {};
  let sortKey = "points";
  let sortDirection = -1;
  let selectedRound = "all";
  const sortLabels = new Map([...document.querySelectorAll(".sort-button")].map((button) => [button.dataset.sort, button.textContent.trim()]));

  function getFilteredMatches() {
    return selectedRound === "all" ? data.matches : data.matches.filter((match) => match.round <= Number(selectedRound));
  }

  function calculateStandings(matches) {
    const table = new Map(data.teams.map((team) => [team.id, {
      team, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, possessionTotal: 0
    }]));
    matches.forEach((match) => {
      const home = table.get(match.home);
      const away = table.get(match.away);
      home.played += 1; away.played += 1;
      home.goalsFor += match.homeGoals; home.goalsAgainst += match.awayGoals;
      away.goalsFor += match.awayGoals; away.goalsAgainst += match.homeGoals;
      home.possessionTotal += match.homePossession; away.possessionTotal += match.awayPossession;
      if (match.homeGoals > match.awayGoals) { home.wins += 1; home.points += 3; away.losses += 1; }
      else if (match.homeGoals < match.awayGoals) { away.wins += 1; away.points += 3; home.losses += 1; }
      else { home.draws += 1; away.draws += 1; home.points += 1; away.points += 1; }
    });
    table.forEach((row) => { row.goalDifference = row.goalsFor - row.goalsAgainst; });
    return [...table.values()].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.team.name.localeCompare(b.team.name, "es"));
  }

  function getSortedStandings(matches) {
    const standings = calculateStandings(matches);
    const naturalOrder = new Map(standings.map((row, index) => [row.team.id, index]));
    standings.sort((a, b) => {
      const difference = typeof a[sortKey] === "string" ? a[sortKey].localeCompare(b[sortKey], "es") : a[sortKey] - b[sortKey];
      return difference === 0 ? naturalOrder.get(a.team.id) - naturalOrder.get(b.team.id) : difference * sortDirection;
    });
    return standings;
  }

  function renderStandings(matches) {
    const standings = getSortedStandings(matches);
    tableBody.innerHTML = standings.map((row, index) => `<tr class="${index === 0 && sortKey === "points" && sortDirection === -1 ? "leader-row" : ""}"><td>${String(index + 1).padStart(2, "0")}</td><td class="team-cell"><span class="team-logo" style="--team-color:${row.team.color};background:${row.team.color}22;color:${row.team.color}" aria-hidden="true">${row.team.short}</span>${row.team.name}</td><td>${row.played}</td><td>${row.wins}</td><td>${row.draws}</td><td>${row.losses}</td><td>${row.goalsFor}</td><td>${row.goalsAgainst}</td><td>${row.goalDifference > 0 ? "+" : ""}${row.goalDifference}</td><td class="points-cell">${row.points}</td></tr>`).join("");
    document.querySelectorAll(".sort-button").forEach((button) => {
      const active = button.dataset.sort === sortKey;
      button.classList.toggle("active", active);
      button.removeAttribute("aria-sort");
      if (active) {
        button.setAttribute("aria-sort", sortDirection === -1 ? "descending" : "ascending");
        button.innerHTML = `${sortLabels.get(button.dataset.sort)} <span aria-hidden="true">${sortDirection === -1 ? "↓" : "↑"}</span>`;
      } else {
        button.textContent = sortLabels.get(button.dataset.sort);
      }
    });
  }

  function goalTotals(matches) {
    const totals = new Map(data.teams.map((team) => [team.id, 0]));
    matches.forEach((match) => {
      totals.set(match.home, totals.get(match.home) + match.homeGoals);
      totals.set(match.away, totals.get(match.away) + match.awayGoals);
    });
    return totals;
  }

  function getScorer(matches) {
    return Object.entries(data.getScorerTotals(matches)).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))[0] || ["—", 0];
  }

  function updateKpis(matches, standings) {
    const goals = matches.reduce((sum, match) => sum + match.homeGoals + match.awayGoals, 0);
    const avg = matches.length ? goals / matches.length : 0;
    const leader = standings[0];
    const [scorer, scorerGoals] = getScorer(matches);
    document.querySelector("#kpi-goals").textContent = String(goals);
    document.querySelector("#kpi-goals-note").textContent = selectedRound === "all" ? "A través de todos los partidos" : `Acumulado hasta jornada ${selectedRound}`;
    document.querySelector("#kpi-leader").textContent = leader ? leader.team.name : "—";
    document.querySelector("#kpi-leader-note").textContent = leader ? `${leader.points} pts · ${leader.played} PJ` : "Líder en puntos";
    document.querySelector("#kpi-average").textContent = avg.toFixed(2).replace(".", ",");
    document.querySelector("#kpi-scorer").textContent = scorer;
    document.querySelector("#kpi-scorer-note").textContent = `${scorerGoals} goles anotados`;
    document.querySelector("#kpi-matches").textContent = String(matches.length);
    document.querySelector("#kpi-matches-note").textContent = `${new Set(matches.map((match) => match.round)).size} jornadas completadas`;
  }

  function chartTooltip(title, labelFormatter) {
    return { backgroundColor: "#172a1e", titleColor: "#d3edaa", bodyColor: "#fff", padding: 10, cornerRadius: 4, displayColors: true,
      callbacks: { title: (items) => title(items), label: (context) => labelFormatter(context) } };
  }

  function createCharts() {
    charts.goals = new Chart(document.querySelector("#goals-chart"), {
      type: "bar", data: { labels: [], datasets: [{ label: "Goles", data: [], backgroundColor: [], borderRadius: 3, borderSkipped: false, maxBarThickness: 31 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: chartTooltip((items) => items[0].label, (item) => ` ${item.raw} goles`) },
        scales: { x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 8 }, maxRotation: 0, minRotation: 0 } }, y: { beginAtZero: true, border: { display: false, dash: [3, 3] }, grid: { color: colors.grid }, ticks: { stepSize: 2, font: { size: 8 } } } } }
    });
    charts.results = new Chart(document.querySelector("#results-chart"), {
      type: "doughnut", data: { labels: ["Victoria local", "Victoria visitante", "Empate"], datasets: [{ data: [0, 0, 0], backgroundColor: [colors.home, colors.away, colors.draw], borderColor: "#fff", borderWidth: 3, hoverOffset: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: "76%", plugins: { legend: { display: false }, tooltip: chartTooltip(() => "Resultado", (item) => ` ${item.label}: ${item.raw} partidos`) } }
    });
    charts.points = new Chart(document.querySelector("#points-chart"), {
      type: "line", data: { labels: [], datasets: [] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, plugins: { legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 6, padding: 15, font: { size: 8 } } }, tooltip: chartTooltip((items) => items[0].label, (item) => ` ${item.dataset.label}: ${item.raw} pts`) },
        scales: { x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 8 } } }, y: { beginAtZero: true, border: { display: false, dash: [3, 3] }, grid: { color: colors.grid }, ticks: { stepSize: 5, font: { size: 8 } } } } }
    });
    charts.possession = new Chart(document.querySelector("#possession-chart"), {
      type: "bar", data: { labels: [], datasets: [{ label: "Posesión", data: [], backgroundColor: [], borderRadius: 2, barThickness: 9 }] },
      options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: chartTooltip((items) => items[0].label, (item) => ` ${item.raw}% de posesión`) },
        scales: { x: { min: 0, max: 70, grid: { color: colors.grid }, border: { display: false }, ticks: { callback: (value) => `${value}%`, stepSize: 20, font: { size: 7 } } }, y: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 8 } } } } }
    });
  }

  function updateCharts(matches, standings) {
    const totals = goalTotals(matches);
    const topScorers = [...data.teams].sort((a, b) => totals.get(b.id) - totals.get(a.id) || a.name.localeCompare(b.name, "es")).slice(0, 8);
    charts.goals.data.labels = topScorers.map((team) => team.name);
    charts.goals.data.datasets[0].data = topScorers.map((team) => totals.get(team.id));
    charts.goals.data.datasets[0].backgroundColor = topScorers.map((team, index) => index === 0 ? "#71974a" : `${team.color}c9`);
    charts.goals.update();

    const outcomes = [0, 0, 0];
    matches.forEach((match) => { if (match.homeGoals > match.awayGoals) outcomes[0] += 1; else if (match.homeGoals < match.awayGoals) outcomes[1] += 1; else outcomes[2] += 1; });
    charts.results.data.datasets[0].data = outcomes;
    charts.results.update();
    document.querySelector("#result-total").textContent = String(matches.length);
    document.querySelector("#results-legend").innerHTML = charts.results.data.labels.map((label, index) => `<span class="legend-item"><i class="legend-swatch" style="background:${charts.results.data.datasets[0].backgroundColor[index]}"></i>${label}</span>`).join("");

    const topThree = [...standings].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference).slice(0, 3);
    const availableRounds = selectedRound === "all" ? 10 : Number(selectedRound);
    charts.points.data.labels = Array.from({ length: availableRounds }, (_, index) => `J${index + 1}`);
    charts.points.data.datasets = topThree.map((row, teamIndex) => ({
      label: row.team.name, data: Array.from({ length: availableRounds }, (_, roundIndex) => calculateStandings(matches.filter((match) => match.round <= roundIndex + 1)).find((item) => item.team.id === row.team.id).points),
      borderColor: [row.team.color, "#d8a94e", "#619bb2"][teamIndex], backgroundColor: [row.team.color, "#d8a94e", "#619bb2"][teamIndex] + "18", tension: .34, fill: false, pointRadius: 2, pointHoverRadius: 4, borderWidth: 2
    }));
    charts.points.update();

    const possession = data.teams.map((team) => {
      const played = matches.filter((match) => match.home === team.id || match.away === team.id);
      const total = played.reduce((sum, match) => sum + (match.home === team.id ? match.homePossession : match.awayPossession), 0);
      return { team, average: played.length ? total / played.length : team.possession };
    }).sort((a, b) => b.average - a.average);
    charts.possession.data.labels = possession.map((item) => item.team.short);
    charts.possession.data.datasets[0].data = possession.map((item) => Math.round(item.average));
    charts.possession.data.datasets[0].backgroundColor = possession.map((item, index) => index === 0 ? "#78a34b" : `${item.team.color}c9`);
    charts.possession.update();
  }

  function refreshDashboard() {
    const matches = getFilteredMatches();
    const standings = calculateStandings(matches);
    updateKpis(matches, standings);
    updateCharts(matches, standings);
    renderStandings(matches);
  }

  function updateChartTheme() {
    const dark = isDarkTheme();
    Chart.defaults.color = dark ? "#c1ccc2" : "#78857b";
    colors.grid = dark ? "#344237" : "#edf0eb";
    Object.values(charts).forEach((chart) => {
      Object.values(chart.options.scales || {}).forEach((scale) => {
        if (scale.ticks) scale.ticks.color = dark ? "#c1ccc2" : "#78857b";
        if (scale.grid && scale.grid.display !== false) scale.grid.color = colors.grid;
      });
      chart.update();
    });
  }

  filter.addEventListener("change", () => { selectedRound = filter.value; refreshDashboard(); });
  document.querySelectorAll(".sort-button").forEach((button) => button.addEventListener("click", () => {
    const nextKey = button.dataset.sort;
    if (sortKey === nextKey) sortDirection *= -1;
    else { sortKey = nextKey; sortDirection = nextKey === "team" ? 1 : -1; }
    renderStandings(getFilteredMatches());
  }));
  window.addEventListener("bi-theme-change", updateChartTheme);
  createCharts();
  refreshDashboard();
})();
