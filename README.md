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

## Catálogo privado con Google Sheets y Drive

En la parte final de `index.html`, busca `siteIntegrations` para revisar tus links reales:

```js
productionUrl: "https://brutag.vercel.app/",
tallyFormUrl: "https://tally.so/r/J9eK1Y",
productsApiUrl: "/api/products",
responsesCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMvKo4ew3lIN973dmA_C4Akb1PTrsAV99aWYT-3uCDzUztYXX218arF1Ge4-JQOvDkUIe0bqb9WqWk/pub?gid=833914508&single=true&output=csv"
```

Los botones “Vender” y “Abrir Tally” usan `tallyFormUrl`. El catálogo se carga así:

1. Primero intenta `/api/products` (Sheet privado con credenciales en Vercel).
2. Si falla, usa `responsesCsvUrl` (Sheet publicado como CSV).
3. En ambos casos solo muestra filas donde `Publicado` diga `SI`.

El Sheet `Sube tu producto a BRUTAG - limpio` tiene estas columnas (Tally las crea automáticamente, salvo `Publicado` que la agregas tú):

```txt
ID Envío, ID Respuesta, Fecha y Hora, Talla, Categoría, Marca, Condición, Precio, Descripción, Instagram, Fotos, Publicado
```

En `Fotos` aceptamos URLs de Tally storage, links de Drive públicos, o cualquier CDN — separadas por coma o salto de línea. El nombre del producto se genera combinando `Categoría + Marca` (ej. `Polerón Grizzly`).

Para Drive privado usa `/api/image` y configura los secretos de Google en Vercel.

Configura estos secretos en Vercel:

```txt
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_SHEET_ID
GOOGLE_SHEET_NAME
GOOGLE_DRIVE_FOLDER_ID
```

Comparte el Google Sheet y la carpeta de fotos con el email de la cuenta de servicio. Usa permiso de lector.

Para armar un formulario nuevo, usa [TALLY_PRODUCTOS.md](/Users/Agustin/BRUTAG/TALLY_PRODUCTOS.md). La web solo muestra filas donde la columna `Publicado` diga `SI`; si está vacío o dice `NO`, el producto queda oculto.

## Publicar en Vercel

Este proyecto local está enlazado a Vercel y tiene remoto GitHub `zyggyjhrxb-sudo/brutag`. Para que los cambios de código aparezcan en la web pública, despliega desde Vercel/Codex/Claude o sube los cambios al repo conectado.

Los cambios de productos no requieren deploy: cambia `Publicado` a `SI` o `NO` en Google Sheets y el sitio se actualiza automáticamente.

Los secretos de Google se configuran en Vercel, no se guardan en Git.

## Cómo usarlo en Visual Studio Code

1. Abre la carpeta del proyecto en VS Code.
2. Abre `index.html`.
3. Usa Live Server o entra a `http://localhost:8000/index.html` si el servidor local está corriendo.
