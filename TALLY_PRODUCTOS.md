# Plantilla para nuevo Tally de productos

Usa estos nombres de campos tal cual para que la web los lea sin ajustes extra.

## Campos del formulario

| Campo en Tally | Tipo recomendado | Obligatorio |
| --- | --- | --- |
| Nombre del producto | Respuesta corta | Si |
| Tipo de producto | Opcion unica | Si |
| Marca | Respuesta corta | No |
| Talla | Respuesta corta | Si |
| Estado | Opcion unica | Si |
| Precio esperado | Numero | Si |
| Descripcion del producto | Respuesta larga | Si |
| Fotos | Subida de archivos | Si |
| Instagram del vendedor | Respuesta corta | Si |
| Nombre del vendedor | Respuesta corta | No |

## Opciones recomendadas

Tipo de producto:
- Polera
- Poleron
- Pantalon
- Chaqueta
- Parka
- Zapatillas
- Jockey
- Otro

Estado:
- Nuevo
- Muy buen estado
- Buen estado
- Usado
- Con detalles

Fotos:
- Permitir solo imagenes.
- Pedir minimo 2 fotos si Tally lo permite.
- Pedir frente, espalda y detalle si tiene fallas.

## Aprobacion antes de publicar

No pongas `Publicado` dentro del formulario para el vendedor. Agrega esa columna manualmente en el Google Sheet conectado a Tally:

| Columna manual | Valores |
| --- | --- |
| Publicado | SI / NO |

Flujo:
1. El vendedor sube el producto por Tally.
2. Revisas la fila nueva en Google Sheets.
3. Editas precio, talla, descripcion o estado si hace falta.
4. Escribes `SI` en `Publicado` para que aparezca en la web.
5. Escribes `NO` o dejas la celda vacia para que no aparezca.

La web solo publica productos cuando `Publicado` dice `SI`. Si esta vacio o dice `NO`, el producto queda oculto.

## Conectar el Sheet privado a la web

La web ya no usa CSV publico. BRUTAG lee el Google Sheet privado desde `/api/products` y sirve las fotos privadas de Drive desde `/api/image`.

Columnas minimas compatibles:

```txt
Publicado
Nombre del producto
Tipo de producto
Marca
Talla
Estado
Precio esperado
Descripcion del producto
Fotos Drive
```

`Fotos Drive` acepta links o IDs de imagenes de Google Drive separados por coma o salto de linea.

En Vercel configura estos secretos:

```txt
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_SHEET_ID
GOOGLE_SHEET_NAME
GOOGLE_DRIVE_FOLDER_ID
```

Comparte el Sheet y la carpeta de fotos con `GOOGLE_SERVICE_ACCOUNT_EMAIL` como lector.
