# Memoria de Trabajo — VURTAG

> Antes el proyecto se llamaba **BRUTAG**. La marca actual es **VURTAG**.
> Esta memoria reemplaza a `MEMORIA_BRUTAG.md`. Última actualización: 2026-06-01.

## Qué es VURTAG

Landing + catálogo de **ropa usada de hombre**. Estética **dark/gold**, masculina, limpia, con **compra directa por DM**.

- Instagram oficial: **@vurtag.cl** (antes `@brutag__`).
- URL pública actual: **https://brutag.vercel.app/** (el dominio aún usa el nombre viejo).
- Repo GitHub: **`zyggyjhrxb-sudo/brutag`**, enlazado a Vercel.

## Stack técnico

- Un solo archivo: **`index.html`** (~4390 líneas), HTML + CSS + JS vanilla, todo embebido.
- **Sí es responsive**: tiene `<meta viewport>` y ~27 media queries. El trabajo de móvil es *afinar*, no construir de cero.
- Favicon "VTG" embebido como SVG en el `<head>`.
- Paleta en variables CSS: `--black:#11110f`, `--panel:#1c1b18`, `--panel-2:#26231e`, `--gold:#cdb06f`.
- Deploy: Vercel + GitHub. Los cambios de **código** requieren deploy; los cambios de **productos** no.

## Catálogo (cómo se llena solo)

1. El cliente sube producto vía **Tally** → `tallyFormUrl: https://tally.so/r/J9eK1Y`.
2. Tally escribe en un **Google Sheet** (`GOOGLE_SHEET_ID=1ipdNIqrYMFxh68Y8RzozyOfqf5-yg8ZMf1xsffoX2VI`).
3. La web carga primero `/api/products` (Sheet privado con credenciales en Vercel) y si falla usa el CSV publicado (`responsesCsvUrl`).
4. **Solo muestra filas con la columna `Publicado` = `SI`.** Vacío o `NO` = oculto.
5. El nombre del producto se arma con `Categoría + Marca` (ej. "Polerón Grizzly").

Secretos configurados en Vercel (no en Git): `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_NAME`, `GOOGLE_DRIVE_FOLDER_ID`.

## Pendientes / inconsistencias a resolver

- **Unificar marca a VURTAG**: `canonical`, `og:url` y `og:image` en `index.html` todavía apuntan a `brutag.vercel.app`. Repo y dominio siguen como "brutag".
- **Google Search Console**: el `<meta name="google-site-verification">` sigue con `PEGA_AQUI_TU_CODIGO...` sin reemplazar.
- **Analytics**: placeholders `G-XXXXXXXXXX` / `GTM-XXXXXXX` sin IDs reales.
- **Dominio propio**: evaluar pasar de `brutag.vercel.app` a un dominio VURTAG.
- **Responsive móvil**: afinar para que la vista de celular calce con la de computador (ver media queries existentes).

## Preferencias de trabajo del usuario

- Avanzar con decisión en diseño, contenido, código y publicación. Si una mejora es claramente necesaria, asumir aprobación y hacerla.
- No detenerse a preguntar por decisiones pequeñas de estilo, estructura, texto o ajustes técnicos normales.
- Mantener siempre la estética dark/gold, masculina, limpia, con compra por DM.
- **Límite**: autorizaciones de GitHub, Vercel, credenciales o comandos con permisos elevados NO se aprueban solas; el usuario las acepta manualmente cuando el sistema lo pide.

## Skills útiles para editar la página

- `/theme-factory` — aplicar colores y fuentes (look) al HTML.
- `/web-artifacts-builder` — rehacer secciones complejas con React/Tailwind/shadcn.
- `/brand-guidelines` — mantener identidad de marca coherente.
- `/canvas-design` — crear imágenes/pósters (PNG/PDF) para el sitio.
- `/algorithmic-art` — generar fondos/arte con código.
- Edición directa de `index.html` (HTML/CSS/JS) con las herramientas de archivo — es lo principal para ajustes y para lo responsive (media queries).
