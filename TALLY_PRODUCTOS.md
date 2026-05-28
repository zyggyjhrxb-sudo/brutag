# Tally + Google Sheets + BRUTAG

Guía actualizada al formulario real `https://tally.so/r/J9eK1Y` conectado al Sheet `Sube tu producto a BRUTAG - limpio`.

## Columnas que llegan al Google Sheet

Tally crea estas columnas automáticamente. No cambies los nombres a menos que también actualices el código:

| Columna en el Sheet | Origen | Obligatorio para publicar |
| --- | --- | --- |
| ID Envío | Tally lo agrega solo | No (lo ignora la web) |
| ID Respuesta | Tally lo agrega solo | No (lo ignora la web) |
| Fecha y Hora | Tally lo agrega solo | No (lo ignora la web) |
| Talla | Respuesta corta en Tally | Si |
| Categoría | Opción única en Tally | Si |
| Marca | Respuesta corta en Tally | No (pero recomendado) |
| Condición | Opción única en Tally | Si |
| Precio | Número en Tally | Si |
| Descripción | Respuesta larga en Tally | Si (mínimo 10 caracteres) |
| Instagram | Respuesta corta en Tally | Si (para contactar al vendedor) |
| Fotos | Subida de archivos en Tally | Si (mínimo 1 imagen) |
| Publicado | Columna manual del Sheet | Si (debe decir `SI` para mostrar) |

> El nombre del producto se genera automáticamente como `Categoría + Marca` (ej. `Polerón Grizzly`). No es necesario un campo "Nombre del producto" en Tally.

## Opciones recomendadas en Tally

**Categoría** (Opción única):
- Polera
- Polerón
- Pantalón
- Chaqueta
- Parka
- Zapatillas
- Jockey
- Otro

**Condición** (Opción única):
- Nuevo
- Muy buen estado
- Buen estado
- Poco uso
- Usado
- Con detalles

**Fotos**:
- Permitir solo imágenes
- Pedir mínimo 2 fotos
- Sugerir frente, espalda y detalle si tiene fallas

## Flujo completo: del vendedor a la web

1. El vendedor llena el formulario en `https://tally.so/r/J9eK1Y`.
2. Tally crea una nueva fila en el Sheet con `Publicado` vacío.
3. Revisas la fila en `Sube tu producto a BRUTAG - limpio`.
4. Si quieres publicarlo, escribes `SI` en la columna `Publicado`.
5. En menos de 15 segundos el producto aparece en `https://brutag.vercel.app/` sin redeploy.
6. Para ocultarlo, cambia `Publicado` a `NO` o deja la celda vacía. Desaparece igual de rápido.

## Cómo se conecta el Sheet a la web

La web lee el Sheet de dos formas:

1. **API privada `/api/products`** (preferida): usa la cuenta de servicio de Google si los secretos de Vercel están configurados (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`, etc.). Permite Sheet privado y fotos privadas en Drive.
2. **CSV público** (fallback actual): el Sheet está publicado en la web como CSV. La URL está en `siteIntegrations.responsesCsvUrl` dentro de `index.html`:

```txt
https://docs.google.com/spreadsheets/d/e/2PACX-1vQMvKo4ew3lIN973dmA_C4Akb1PTrsAV99aWYT-3uCDzUztYXX218arF1Ge4-JQOvDkUIe0bqb9WqWk/pub?gid=833914508&single=true&output=csv
```

Si cambias el Sheet o lo despublicas, actualiza esa constante y vuelve a desplegar.

## La columna `Publicado`

Es la única columna que tienes que agregar manualmente al Sheet (Tally no la crea). Los valores aceptados:

| Valor en `Publicado` | Resultado en la web |
| --- | --- |
| `SI` (también `Si`, `si`, `SÍ`, `Sí`, `sí`) | El producto aparece |
| `NO`, vacío, o cualquier otro texto | El producto NO aparece |

## Si quieres editar un producto

1. Cambia `Publicado` a `NO` mientras editas (opcional).
2. Edita precio, talla, descripción, condición o lo que sea en esa fila.
3. Vuelve a poner `Publicado` en `SI`.
4. El cambio aparece en la web en menos de 15 segundos.

## Si quieres publicar un producto sin pasar por Tally

Agrega una fila nueva al Sheet a mano con los mismos campos. En `Fotos` pega URLs directas a imágenes (Tally storage, Drive público, o cualquier CDN) separadas por coma o salto de línea. Pon `SI` en `Publicado`.
