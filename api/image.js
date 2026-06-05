const { fetchProductImage, getApprovedPhoto } = require("../lib/google-products");

function queryValue(req, name) {
  if (req.query && req.query[name] != null) return req.query[name];
  const url = new URL(req.url || "", "https://vurtag.cl");
  return url.searchParams.get(name);
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify(payload));
}

module.exports = async function imageHandler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Método no permitido" });
  }

  const productId = String(queryValue(req, "producto") || "");
  const photoIndex = Number(queryValue(req, "foto") || 0);
  const width = clampNumber(queryValue(req, "w"), 900, 120, 900);
  const quality = clampNumber(queryValue(req, "q"), 70, 45, 82);
  const format = String(queryValue(req, "format") || "webp").toLowerCase();
  if (!productId || !Number.isInteger(photoIndex) || photoIndex < 0) {
    return sendJson(res, 400, { error: "Imagen inválida" });
  }

  try {
    const approvedPhoto = await getApprovedPhoto(productId, photoIndex);
    if (!approvedPhoto) {
      return sendJson(res, 404, { error: "Imagen no publicada" });
    }

    const image = await fetchProductImage(approvedPhoto.photoRef, {
      width,
      quality,
      format,
      accept: req.headers.accept || ""
    });
    res.statusCode = 200;
    res.setHeader("Content-Type", image.mimeType);
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.end(image.bytes);
    return null;
  } catch (error) {
    console.error(error);
    return sendJson(res, 404, { error: "No se pudo cargar la imagen" });
  }
};
