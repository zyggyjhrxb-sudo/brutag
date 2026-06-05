const ALLOWED_HOSTS = [
  "drive.google.com",
  "lh3.googleusercontent.com",
  "storage.tally.so",
  "storage.googleapis.com",
  "docs.google.com",
];

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

module.exports = async function proxyHandler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const rawUrl =
    (req.query && req.query.url) ||
    new URL(req.url || "", "https://vurtag.cl").searchParams.get("url") ||
    "";

  let targetUrl;
  try {
    targetUrl = new URL(decodeURIComponent(rawUrl));
  } catch {
    return sendJson(res, 400, { error: "Invalid URL" });
  }

  const allowed = ALLOWED_HOSTS.some(
    (h) => targetUrl.hostname === h || targetUrl.hostname.endsWith("." + h)
  );
  if (!allowed) {
    return sendJson(res, 403, { error: "Host not allowed" });
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Vurtag/1.0)" },
      redirect: "follow",
    });

    if (!upstream.ok) {
      return sendJson(res, 502, { error: "Upstream error" });
    }

    const ct = upstream.headers.get("content-type") || "image/jpeg";
    if (!ct.startsWith("image/")) {
      return sendJson(res, 400, { error: "Not an image" });
    }

    const buf = await upstream.arrayBuffer();
    res.statusCode = 200;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.end(Buffer.from(buf));
  } catch {
    return sendJson(res, 500, { error: "Proxy error" });
  }
};
