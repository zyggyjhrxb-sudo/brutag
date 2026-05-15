# BRUTAG

Landing y catálogo de ropa usada de hombre para `https://brutag.vercel.app/`.

## Último upgrade

La web ahora tiene:

1. Home con posicionamiento claro de BRUTAG.
2. Catálogo con filtros reales por categoría.
3. Botones de reserva por DM con mensaje y link de producto.
4. Sección para vender ropa a BRUTAG.
5. FAQ para bajar dudas antes del DM.
6. Preparación para Google, Tally, ManyChat y eventos de Analytics.

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

## Tally y ManyChat

En la parte final de `index.html`, busca `siteIntegrations` y pega tus links reales:

```js
productionUrl: "https://brutag.vercel.app/",
manyChatUrl: "",
tallyFormUrl: ""
```

Si `manyChatUrl` tiene un link, los botones de compra abrirán ese flujo. Si `tallyFormUrl` tiene un link, el botón “Vender a BRUTAG” abrirá tu formulario de Tally.

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
