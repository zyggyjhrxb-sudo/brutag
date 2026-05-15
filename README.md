# BRUTAG

Landing y catálogo de ropa usada de hombre para `https://brutag.vercel.app/`.

## Último upgrade

La web ahora tiene:

1. Página más simple: inicio, drop, quiero vender y condiciones.
2. Fotos reales del polerón Grizzly con precio.
3. Compra por DM a `@brutag__` con link exacto del producto.
4. Botón de venta conectado a la encuesta de venta.
5. Condiciones claras para comprar y vender en BRUTAG.
6. Paleta dark/gold inspirada en la referencia visual.

## Google

La URL publica de BRUTAG es:

```txt
https://brutag.vercel.app/
```

Si mas adelante cambias a un dominio propio, reemplaza `https://brutag.vercel.app/` en:

1. `index.html`
2. `robots.txt`
3. `sitemap.xml`

Para Google Search Console, copia el código de verificación y reemplaza:

```html
PEGA_AQUI_TU_CODIGO_DE_GOOGLE_SEARCH_CONSOLE
```

Para Google Analytics o Google Tag Manager, busca los comentarios dentro del `<head>` de `index.html` y pega los IDs reales:

```txt
G-XXXXXXXXXX
GTM-XXXXXXX
```

## Encuesta, Tally y ManyChat

En la parte final de `index.html`, busca `siteIntegrations` para revisar tus links reales:

```js
productionUrl: "https://brutag.vercel.app/",
tallyFormUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQOflr6BkjVFsDVU0gsXR5xZydYfVS7fYqXF0P0MUS6XCuw_ViF6TU3OkcZ52xt5lPt541RcYqfGja/pubhtml?gid=0&single=true"
```

El botón “Quiero vender” abre la encuesta conectada. Cuando tengas un link directo de Tally, reemplaza `tallyFormUrl` por ese enlace.

## Publicar en Vercel

Este proyecto local no tiene remoto Git conectado ni Vercel CLI instalado. Para que los cambios aparezcan en la web pública, sube estos archivos al proyecto de Vercel que ya apunta a `brutag.vercel.app`:

1. `index.html`
2. `robots.txt`
3. `sitemap.xml`
4. `vercel.json`

Si tu Vercel está conectado a GitHub, copia estos cambios al repositorio conectado y haz deploy desde Vercel.

## Cómo usarlo en Visual Studio Code

1. Abre la carpeta del proyecto en VS Code.
2. Abre `index.html`.
3. Usa Live Server o entra a `http://localhost:8000/index.html` si el servidor local está corriendo.
