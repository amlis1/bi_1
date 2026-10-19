# BI Lab — fundamentos y dashboard de Business Intelligence

Sitio educativo de dos páginas: una guía interactiva de fundamentos de BI con quiz gamificado y un dashboard analítico de datos simulados de Liga Pro 2026.

## Ejecutar en GitHub Codespaces

1. Abre el repositorio en GitHub Codespaces.
2. En la raíz del proyecto, inicia un servidor estático. Puedes usar la extensión **Live Server** de VS Code (recomendada): haz clic derecho en `index.html` y selecciona **Open with Live Server**.
3. Para ver el dashboard, navega a `dashboard.html` desde la barra superior o abre esa página directamente.

Prettier es una extensión recomendada para mantener el formato del código. No hay dependencias locales que instalar: Bootstrap 5 y Chart.js se cargan desde CDN.

## Estructura

```text
index.html
dashboard.html
css/
  styles.css
  dashboard.css
js/
  quiz.js
  dashboard.js
  data.js
img/
```

El cuestionario conserva el mejor puntaje en `localStorage`. El dashboard permite filtrar los datos hasta una jornada y ordenar la tabla de posiciones por sus columnas. Los resultados de Liga Pro son deterministas y simulados con fines educativos.
