/* Quiz gamificado: preguntas, puntuación, rachas y mejor resultado local. */
(() => {
  "use strict";

  const questions = [
    { question: "¿Cuál es el propósito principal de Business Intelligence?", options: ["Automatizar todas las decisiones humanas", "Convertir datos en información útil para decidir", "Almacenar cualquier dato sin contexto", "Reemplazar los sistemas transaccionales"], answer: 1, explanation: "BI transforma datos en información comprensible que apoya mejores decisiones." },
    { question: "¿Qué describe mejor una decisión data-driven?", options: ["Una decisión basada únicamente en la intuición", "Una decisión que evita medir resultados", "Una decisión guiada por evidencia y contexto", "Una decisión que siempre toma un algoritmo"], answer: 2, explanation: "Una decisión data-driven utiliza evidencia y contexto; la experiencia humana sigue siendo valiosa." },
    { question: "En la jerarquía DIKW, ¿qué se obtiene al organizar datos con contexto?", options: ["Información", "Sabiduría", "Una fuente", "Una transacción"], answer: 0, explanation: "Al organizar y dar contexto a los datos obtenemos información." },
    { question: "¿Qué ocurre durante la fase Extract de ETL?", options: ["Se publican los indicadores", "Se recuperan datos desde sus fuentes", "Se eliminan todos los datos históricos", "Se redactan recomendaciones"], answer: 1, explanation: "Extract conecta con los sistemas de origen y recupera sus datos." },
    { question: "Una tarea típica de Transform en ETL es…", options: ["Conectar con una API sin leer sus datos", "Mostrar un gráfico de barras", "Normalizar fechas y eliminar duplicados", "Crear una contraseña de usuario"], answer: 2, explanation: "Transform limpia, normaliza, valida y combina datos para prepararlos." },
    { question: "¿Cuál es el destino habitual de la fase Load?", options: ["Un almacén de datos listo para análisis", "La papelera de reciclaje", "Un sensor que genera eventos", "El navegador del usuario"], answer: 0, explanation: "Load carga los datos preparados en un destino analítico, como un data warehouse." },
    { question: "En retail, ¿qué combinación ayudaría a planificar inventario estacional?", options: ["Ventas históricas, tienda y estacionalidad", "Solo el color del logotipo", "Contraseñas y direcciones personales", "El número total de empleados, sin más contexto"], answer: 0, explanation: "Ventas históricas segmentadas por tienda y temporada ayudan a anticipar demanda." },
    { question: "¿Qué herramienta se usa para orquestar flujos de trabajo de datos?", options: ["Apache Airflow", "Un editor de imágenes", "Una hoja de estilos CSS", "Un lector PDF"], answer: 0, explanation: "Apache Airflow permite definir, programar y supervisar flujos de trabajo." },
    { question: "¿Por qué importa validar la calidad de los datos antes de analizarlos?", options: ["Para aumentar el tamaño de los archivos", "Para evitar que errores distorsionen los resultados", "Para impedir que se creen informes", "Para sustituir el contexto del negocio"], answer: 1, explanation: "Datos incompletos o inconsistentes pueden llevar a conclusiones y decisiones equivocadas." },
    { question: "¿Qué nivel DIKW responde mejor a “¿qué deberíamos hacer?”", options: ["Datos", "Información", "Conocimiento", "Sabiduría"], answer: 3, explanation: "La sabiduría aplica conocimiento, contexto y propósito para orientar la acción." }
  ];
  const badges = [
    { minimum: 0, name: "Novato BI", detail: "Todo gran analista empieza con una pregunta." },
    { minimum: 400, name: "Analista", detail: "Ya conviertes señales en información útil." },
    { minimum: 800, name: "Experto ETL", detail: "Tus datos están listos para transformar decisiones." },
    { minimum: 1200, name: "Data Master", detail: "Dominas el camino del dato a la acción." }
  ];
  const stage = document.querySelector("#quiz-stage");
  const feedback = document.querySelector("#quiz-feedback");
  const progressBar = document.querySelector("#quiz-progress-bar");
  const progressTrack = document.querySelector(".quiz-progress");
  const stepLabel = document.querySelector("#quiz-step-label");
  const scoreLabel = document.querySelector("#quiz-score");
  const streakLabel = document.querySelector("#streak-count");
  const bestScore = document.querySelector("#best-score");
  if (!stage || !feedback || !progressBar || !progressTrack || !stepLabel || !scoreLabel || !streakLabel || !bestScore) return;

  let currentIndex = 0;
  let score = 0;
  let streak = 0;
  let answered = false;
  const bestStorageKey = "biLabQuizBestScore";

  function renderQuestion() {
    const current = questions[currentIndex];
    answered = false;
    feedback.textContent = "";
    feedback.className = "quiz-feedback";
    stepLabel.innerHTML = `PREGUNTA ${String(currentIndex + 1).padStart(2, "0")} <span>/ ${questions.length}</span>`;
    const progress = Math.round((currentIndex / questions.length) * 100);
    progressBar.style.width = `${progress}%`;
    progressTrack.setAttribute("aria-valuenow", String(currentIndex));
    stage.innerHTML = `<h3 class="question-text">${current.question}</h3><div class="quiz-options">${current.options.map((option, index) => `<button class="quiz-option" type="button" data-option="${index}"><span class="option-letter">${String.fromCharCode(65 + index)}</span><span>${option}</span></button>`).join("")}</div>`;
    stage.querySelectorAll(".quiz-option").forEach((button) => button.addEventListener("click", () => selectAnswer(Number(button.dataset.option))));
  }

  function selectAnswer(selectedIndex) {
    if (answered) return;
    answered = true;
    const current = questions[currentIndex];
    const correct = selectedIndex === current.answer;
    const options = stage.querySelectorAll(".quiz-option");
    options.forEach((button, index) => {
      button.disabled = true;
      if (index === current.answer) button.classList.add("correct");
      if (index === selectedIndex && !correct) button.classList.add("incorrect");
    });
    if (correct) {
      streak += 1;
      score += 100 + Math.max(0, streak - 1) * 25;
      streakLabel.classList.remove("streak-pop");
      void streakLabel.offsetWidth;
      streakLabel.classList.add("streak-pop");
      feedback.className = "quiz-feedback";
      feedback.innerHTML = `<strong>¡Correcto!</strong> ${current.explanation}${streak > 1 ? ` Bonus de racha: +${(streak - 1) * 25} pts.` : ""}`;
    } else {
      streak = 0;
      feedback.className = "quiz-feedback is-wrong";
      feedback.innerHTML = `<strong>No exactamente.</strong> ${current.explanation}`;
    }
    streakLabel.textContent = String(streak);
    scoreLabel.innerHTML = `PUNTAJE <b>${score.toLocaleString("es-ES")}</b>`;
    const progress = Math.round(((currentIndex + 1) / questions.length) * 100);
    progressBar.style.width = `${progress}%`;
    progressTrack.setAttribute("aria-valuenow", String(currentIndex + 1));
    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "retry-button mt-3";
    nextButton.textContent = currentIndex === questions.length - 1 ? "Ver mi resultado →" : "Siguiente pregunta →";
    nextButton.addEventListener("click", () => {
      currentIndex += 1;
      if (currentIndex < questions.length) renderQuestion();
      else renderResult();
    });
    feedback.append(nextButton);
  }

  function renderResult() {
    const badge = [...badges].reverse().find((item) => score >= item.minimum);
    const resultProgress = 100;
    progressBar.style.width = `${resultProgress}%`;
    progressTrack.setAttribute("aria-valuenow", String(questions.length));
    stepLabel.textContent = "RETO COMPLETADO";
    feedback.textContent = "";
    const previousBest = Number(localStorage.getItem(bestStorageKey) || 0);
    const isNewBest = score > previousBest;
    if (isNewBest) localStorage.setItem(bestStorageKey, String(score));
    stage.innerHTML = `<div class="quiz-result"><div class="result-mark" aria-hidden="true">✳</div><h3>¡Reto completado!</h3><p>${badge.detail}</p><div class="result-points">${score.toLocaleString("es-ES")}<span> pts</span></div><span class="result-badge">✦ ${badge.name}</span><br><button class="retry-button" type="button" id="retry-quiz">Intentarlo de nuevo ↻</button></div>`;
    stage.querySelector("#retry-quiz").addEventListener("click", restartQuiz);
    if (isNewBest) bestScore.innerHTML = "✦ ¡Nuevo récord personal! <strong>" + score.toLocaleString("es-ES") + " puntos</strong>";
    updateBestScore();
  }

  function updateBestScore() {
    const value = Number(localStorage.getItem(bestStorageKey) || 0);
    if (value > 0) bestScore.innerHTML = `Tu mejor puntaje <strong>${value.toLocaleString("es-ES")} pts</strong>`;
  }

  function restartQuiz() {
    currentIndex = 0;
    score = 0;
    streak = 0;
    streakLabel.textContent = "0";
    scoreLabel.innerHTML = "PUNTAJE <b>0</b>";
    renderQuestion();
  }

  updateBestScore();
  renderQuestion();
})();
