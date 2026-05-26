# BRUTAG

Landing y catálogo de ropa usada de hombre para `https://brutag.vercel.app/`.

## Último upgrade

La web ahora tiene:

1. Página más simple: inicio, productos, colección, quiero vender y condiciones.
2. Fotos reales del polerón Grizzly con precio.
3. Compra por DM a `@brutag__` con link exacto del producto.
4. Botones de venta conectados al enlace configurado en `tallyFormUrl`.
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
tallyFormUrl: "https://tally.so/r/J9eK1Y",
responsesCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUYPwO4VHtcH5_ZZLEcCo2FXbYO4LUsan_Vb3dAtMr9YaGXz81B9WWDs3SDVQwwDpz3OBAKwyBXL97/pub?gid=0&single=true&output=csv"
```

Los botones “Vender” y “Abrir Tally” usan `tallyFormUrl`. El link `responsesCsvUrl` es la salida de respuestas en Google Sheets/CSV para publicar productos; si está vacío o el Sheet no existe, la página no muestra productos guardados de respaldo.

Para armar un formulario nuevo, usa [TALLY_PRODUCTOS.md](/Users/Agustin/BRUTAG/TALLY_PRODUCTOS.md). La web solo muestra filas donde la columna `Publicado` diga `SI`; si está vacío o dice `NO`, el producto queda oculto.

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
