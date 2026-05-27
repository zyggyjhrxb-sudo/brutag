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
productsApiUrl: "/api/products"
```

Los botones “Vender” y “Abrir Tally” usan `tallyFormUrl`. El catálogo público se carga desde `/api/products`, que lee un Google Sheet privado y muestra solo filas donde `Publicado` diga `SI`.

Importa [brutag-productos-template.csv](/Users/Agustin/BRUTAG/brutag-productos-template.csv) en Google Sheets para partir con las columnas correctas:

```txt
Publicado, Nombre del producto, Tipo de producto, Marca, Talla, Estado, Precio esperado, Descripcion del producto, Fotos Drive
```

En `Fotos Drive`, pega links o IDs de archivos de imagen en Drive separados por coma o salto de línea. Las fotos no necesitan quedar públicas: BRUTAG las sirve mediante `/api/image` solo si el producto está aprobado.

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
