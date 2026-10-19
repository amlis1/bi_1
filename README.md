# BI Lab — fundamentos, dashboard y sílabo de Business Intelligence

Sitio educativo con una guía interactiva de fundamentos de BI, un dashboard analítico de Liga Pro 2026 y un portal interactivo para el sílabo de la asignatura de BI en la UTC.

## Ejecutar en GitHub Codespaces

1. Abre el repositorio en GitHub Codespaces.
2. En la raíz del proyecto, inicia un servidor estático. Puedes usar la extensión **Live Server** de VS Code (recomendada): haz clic derecho en `index.html` y selecciona **Open with Live Server**.
3. Usa la barra de navegación para abrir `dashboard.html` o el portal `syllabus.html`.

Prettier es una extensión recomendada para mantener el formato del código. No hay dependencias locales que instalar: Bootstrap 5, Chart.js y jsPDF se cargan desde CDN.

## Estructura

```text
index.html
dashboard.html
syllabus.html
css/
  styles.css
  dashboard.css
  syllabus.css
js/
  quiz.js
  dashboard.js
  data.js
  theme.js
  report.js
  syllabus.js
img/
```

El cuestionario conserva el mejor puntaje en `localStorage`. El selector de tema claro/negro guarda la preferencia entre páginas. El dashboard permite filtrar los datos hasta una jornada, ordenar la tabla de posiciones, exportar a PDF los indicadores, las gráficas y la clasificación filtrados, o imprimir el dashboard con el filtro activo. El portal del sílabo ofrece cuentas regresivas hasta las evaluaciones; las fechas se muestran en hora de Ecuador (UTC−5). Los resultados de Liga Pro son deterministas y simulados con fines educativos.
