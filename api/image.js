const { fetchProductImage, getApprovedPhoto } = require("../lib/google-products");

/* sharp se carga con try/catch: si no está disponible (ej. dev local sin
   npm install), el endpoint sirve la imagen original sin comprimir. */
let sharp;
try { sharp = require("sharp"); } catch (_) {}

function queryValue(req, name) {
  if (req.query && req.query[name] != null) return req.query[name];
  const url = new URL(req.url || "", "https://vurtag.cl");
  return url.searchParams.get(name);
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify(payload));
}

/**
 * Comprime la imagen original:
 *  - Redimensiona a máximo 900×900 px (sin agrandar ni deformar)
 *  - Convierte a WebP calidad 82 (30-70 % menos peso que JPEG original)
 *  - Fallback al buffer original si sharp falla o no está instalado
 */
async function compressImage(buffer, originalMimeType) {
  if (!sharp) return { bytes: buffer, mimeType: originalMimeType };

  try {
    const compressed = await sharp(buffer)
      .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 2 })
      .toBuffer();

    return { bytes: compressed, mimeType: "image/webp" };
  } catch {
    return { bytes: buffer, mimeType: originalMimeType };
  }
}

module.exports = async function imageHandler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Método no permitido" });
  }

  const productId = String(queryValue(req, "producto") || "");
  const photoIndex = Number(queryValue(req, "foto") || 0);
  if (!productId || !Number.isInteger(photoIndex) || photoIndex < 0) {
    return sendJson(res, 400, { error: "Imagen inválida" });
  }

  try {
    const approvedPhoto = await getApprovedPhoto(productId, photoIndex);
    if (!approvedPhoto) {
      return sendJson(res, 404, { error: "Imagen no publicada" });
    }

    const image = await fetchProductImage(approvedPhoto.photoRef);
    const { bytes, mimeType } = await compressImage(image.bytes, image.mimeType);

    res.statusCode = 200;
    res.setHeader("Content-Type", mimeType);
    /* Cache largo: la imagen comprimida es estable y mucho más liviana */
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.end(bytes);
    return null;
  } catch (error) {
    console.error(error);
    return sendJson(res, 404, { error: "No se pudo cargar la imagen" });
  }
};
