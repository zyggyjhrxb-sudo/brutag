const { getApprovedProducts, publicProduct } = require("../lib/google-products");

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.end(JSON.stringify(payload));
}

module.exports = async function productsHandler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Método no permitido" });
  }

  try {
    const products = await getApprovedProducts();
    return sendJson(res, 200, {
      products: products.map(publicProduct),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, 503, {
      error: "No se pudo leer el catálogo privado de BRUTAG"
    });
  }
};
