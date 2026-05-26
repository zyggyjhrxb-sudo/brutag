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

## Conectar el nuevo Tally a la web

Links conectados ahora:

```js
tallyFormUrl: "https://tally.so/r/J9eK1Y",
responsesCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUYPwO4VHtcH5_ZZLEcCo2FXbYO4LUsan_Vb3dAtMr9YaGXz81B9WWDs3SDVQwwDpz3OBAKwyBXL97/pub?gid=0&single=true&output=csv"
```

Si cambias de Tally o de Sheet mas adelante, en `index.html` actualiza:

```js
tallyFormUrl: "PEGA_AQUI_EL_LINK_DEL_NUEVO_TALLY",
responsesCsvUrl: "PEGA_AQUI_EL_CSV_PUBLICADO_DEL_GOOGLE_SHEET"
```

Para obtener `responsesCsvUrl`, publica el Google Sheet como CSV desde `Archivo > Compartir > Publicar en la web`.
