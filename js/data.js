/* Datos simulados deterministas para diez equipos y diez jornadas de Liga Pro. */
(() => {
  "use strict";

  const teams = [
    { id: "condores", name: "Cóndores FC", short: "CON", city: "Quito", color: "#9bd15b", strength: 82, possession: 56, scorers: ["Mateo Rivas", "Nicolás Vélez", "Bruno Cedeño"] },
    { id: "portuarios", name: "Portuarios", short: "POR", city: "Guayaquil", color: "#55a9c4", strength: 79, possession: 54, scorers: ["Diego Mena", "Kevin Loor", "Ángel Sornoza"] },
    { id: "aurora", name: "Aurora SC", short: "AUR", city: "Cuenca", color: "#e8b85d", strength: 76, possession: 52, scorers: ["Tomás Paredes", "Luis Arce", "Gabriel León"] },
    { id: "union", name: "Unión Andina", short: "UAN", city: "Ambato", color: "#da765d", strength: 74, possession: 50, scorers: ["Emilio Vaca", "Joaquín Mora", "Santiago Vera"] },
    { id: "real-valle", name: "Real del Valle", short: "RDV", city: "Sangolquí", color: "#8d7ac5", strength: 72, possession: 51, scorers: ["Andrés Cárdenas", "Pablo Solís", "Enzo Lema"] },
    { id: "atletico-pacifico", name: "Atlético Pacífico", short: "PAC", city: "Manta", color: "#4f9c78", strength: 70, possession: 49, scorers: ["Javier Zambrano", "Damián Quiñónez", "Alan Mina"] },
    { id: "mineros", name: "Mineros del Sur", short: "MIN", city: "Loja", color: "#b98752", strength: 68, possession: 48, scorers: ["Cristian Jara", "Felipe Ochoa", "Marco Chamba"] },
    { id: "academia", name: "Academia Norte", short: "ACN", city: "Ibarra", color: "#7392b7", strength: 66, possession: 47, scorers: ["Esteban Rosero", "David Játiva", "Mauro Ponce"] },
    { id: "deportivo-costa", name: "Deportivo Costa", short: "DCO", city: "Esmeraldas", color: "#c36a83", strength: 64, possession: 46, scorers: ["Jhon Quiñónez", "Alexis Mina", "Brayan Preciado"] },
    { id: "fuerza-oriente", name: "Fuerza Oriente", short: "FDO", city: "Puyo", color: "#78a78c", strength: 62, possession: 45, scorers: ["Darío Grefa", "Joel Vargas", "Ismael Andy"] }
  ];
  const goalPatterns = [
    [2, 0, 1, 2, 1], [1, 2, 0, 1, 2], [3, 1, 1, 0, 2], [0, 2, 2, 1, 1], [2, 1, 0, 3, 1],
    [1, 0, 2, 1, 2], [2, 3, 1, 0, 1], [1, 1, 2, 2, 0], [0, 2, 1, 1, 3], [2, 1, 3, 0, 1]
  ];

  function getPairings() {
    const rotation = teams.map((team) => team.id);
    const rounds = [];
    for (let round = 0; round < 9; round += 1) {
      const fixtures = [];
      for (let match = 0; match < 5; match += 1) {
        let home = rotation[match];
        let away = rotation[rotation.length - 1 - match];
        if ((round + match) % 2 === 1) [home, away] = [away, home];
        fixtures.push({ home, away });
      }
      rounds.push(fixtures);
      rotation.splice(1, 0, rotation.pop());
    }
    rounds.push(rounds[0].map(({ home, away }) => ({ home: away, away: home })));
    return rounds;
  }

  function createMatches() {
    const matches = [];
    getPairings().forEach((fixtures, roundIndex) => {
      fixtures.forEach(({ home, away }, fixtureIndex) => {
        const homeTeam = teams.find((team) => team.id === home);
        const awayTeam = teams.find((team) => team.id === away);
        const variation = (roundIndex * 3 + fixtureIndex * 2) % 5 - 2;
        const homeGoals = Math.max(0, Math.min(4, goalPatterns[roundIndex][fixtureIndex] + (homeTeam.strength > awayTeam.strength ? 1 : 0) + (variation === 2 ? 1 : 0) - (variation === -2 ? 1 : 0)));
        const awayGoals = Math.max(0, Math.min(4, goalPatterns[(roundIndex + 3) % 10][(fixtureIndex + 2) % 5] + (awayTeam.strength > homeTeam.strength + 8 ? 1 : 0) - (variation === 1 ? 1 : 0)));
        const homePossession = Math.max(37, Math.min(67, homeTeam.possession + variation + (fixtureIndex % 2)));
        const date = new Date(Date.UTC(2026, 1, 7 + (roundIndex * 7)));
        date.setUTCDate(date.getUTCDate() + fixtureIndex);
        matches.push({
          id: `J${roundIndex + 1}-${fixtureIndex + 1}`, round: roundIndex + 1,
          date: date.toISOString().slice(0, 10), home, away, homeGoals, awayGoals,
          homePossession, awayPossession: 100 - homePossession,
          homeShots: homeGoals + 5 + ((roundIndex + fixtureIndex) % 6),
          awayShots: awayGoals + 4 + ((roundIndex * 2 + fixtureIndex) % 5),
          attendance: 7200 + ((roundIndex * 1453 + fixtureIndex * 931) % 16800)
        });
      });
    });
    return matches;
  }

  function getScorerTotals(matches) {
    const totals = {};
    matches.forEach((match, matchIndex) => {
      [[match.home, match.homeGoals], [match.away, match.awayGoals]].forEach(([teamId, goals]) => {
        const team = teams.find((item) => item.id === teamId);
        for (let goal = 0; goal < goals; goal += 1) {
          const scorer = team.scorers[(matchIndex + goal * 2 + team.strength) % team.scorers.length];
          totals[scorer] = (totals[scorer] || 0) + 1;
        }
      });
    });
    return totals;
  }

  const matches = createMatches();
  window.LigaProData = { teams, matches, getScorerTotals, scorerTotals: getScorerTotals(matches) };
})();
