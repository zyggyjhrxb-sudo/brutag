const crypto = require("crypto");

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/drive.readonly"
].join(" ");
const DEFAULT_GOOGLE_SHEET_ID = "1ipdNIqrYMFxh68Y8RzozyOfqf5-yg8ZMf1xsffoX2VI";
const SHEET_CACHE_MS = 3 * 60 * 1000;

let tokenCache = null;
let productCache = null;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta configurar ${name}`);
  return value;
}

function optionalEnv(name, fallback = "") {
  return process.env[name] || fallback;
}

function googleConfig() {
  return {
    clientEmail: requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    privateKey: readPrivateKey(),
    sheetId: optionalEnv("GOOGLE_SHEET_ID", DEFAULT_GOOGLE_SHEET_ID),
    sheetName: optionalEnv("GOOGLE_SHEET_NAME"),
    driveFolderId: optionalEnv("GOOGLE_DRIVE_FOLDER_ID")
  };
}

function readPrivateKey() {
  const rawKey = requiredEnv("GOOGLE_PRIVATE_KEY");
  const trimmedKey = rawKey.trim();
  const unquotedKey = (
    (trimmedKey.startsWith("\"") && trimmedKey.endsWith("\""))
    || (trimmedKey.startsWith("'") && trimmedKey.endsWith("'"))
  ) ? trimmedKey.slice(1, -1) : trimmedKey;
  return unquotedKey.includes("\\n") ? unquotedKey.replace(/\\n/g, "\n") : unquotedKey;
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createJwt(config) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: config.clientEmail,
    scope: GOOGLE_SCOPES,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now
  };
  const body = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = crypto.createSign("RSA-SHA256").update(body).sign(config.privateKey);
  return `${body}.${base64Url(signature)}`;
}

async function getAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60 * 1000) {
    return tokenCache.accessToken;
  }

  const config = googleConfig();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: createJwt(config)
    }).toString()
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "No se pudo autenticar con Google");
  }

  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000
  };
  return tokenCache.accessToken;
}

async function googleFetch(url, options = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`Google API ${response.status}: ${message || response.statusText}`);
  }

  return response;
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getValue(product, keys) {
  const normalizedProduct = Object.entries(product).reduce((acc, [key, value]) => {
    acc[normalizeKey(key)] = value;
    return acc;
  }, {});

  for (const key of keys) {
    const value = normalizedProduct[normalizeKey(key)];
    if (value) return value;
  }

  return "";
}

function shouldPublish(value) {
  const normalized = normalizeKey(value);
  if (!normalized) return true;                              // vacío = publicar por defecto
  if (["no", "false"].includes(normalized)) return false;   // "NO" = ocultar
  return true;                                               // "SI", "YES", etc. = publicar
}

function titleCase(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es-CL")
    .replace(/(^|[\s/&-])([a-záéíóúñ])/gi, (match, prefix, letter) => `${prefix}${letter.toLocaleUpperCase("es-CL")}`);
}

function capitalizeFirst(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const lowerText = text.toLocaleLowerCase("es-CL");
  return lowerText.charAt(0).toLocaleUpperCase("es-CL") + lowerText.slice(1);
}

function formatSize(value) {
  return String(value || "").trim().toLocaleUpperCase("es-CL");
}

function categoryFromText(value) {
  const words = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const hasWord = (matches) => words.some((word) => matches.includes(word));
  if (hasWord(["poleron", "polerones"])) return "poleron";
  if (hasWord(["polera", "poleras"])) return "polera";
  if (hasWord(["pantalon", "pantalones"])) return "pantalon";
  if (hasWord(["chaqueta", "chaquetas"])) return "chaqueta";
  if (hasWord(["parka", "parkas"])) return "parka";
  if (hasWord(["zapatilla", "zapatillas"])) return "zapatilla";
  if (hasWord(["jockey", "jockeys"])) return "jockey";
  return "";
}

function categoryDisplayName(category) {
  return {
    poleron: "Polerón",
    polera: "Polera",
    pantalon: "Pantalón",
    chaqueta: "Chaqueta",
    parka: "Parka",
    zapatilla: "Zapatillas",
    jockey: "Jockey"
  }[category] || "";
}

function productIdFromName(productName, index = null) {
  const baseId = String(productName || "producto")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return Number.isInteger(index) ? `${baseId || "producto"}-${index + 1}` : baseId || "producto";
}

function extractDriveFileId(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{20,})/,
    /[?&]id=([a-zA-Z0-9_-]{20,})/,
    /\/d\/([a-zA-Z0-9_-]{20,})/,
    /^([a-zA-Z0-9_-]{20,})$/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return "";
}

function isAllowedRemoteImageUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    const allowedHosts = new Set([
      "storage.tally.so",
      "images.tally.so"
    ]);
    const hasImageExtension = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url.href);
    return url.protocol === "https:" && (allowedHosts.has(url.hostname) || hasImageExtension);
  } catch (error) {
    return false;
  }
}

function createPhotoRef(value) {
  const fileId = extractDriveFileId(value);
  if (fileId) return { type: "drive", value: fileId };
  if (isAllowedRemoteImageUrl(value)) return { type: "url", value: String(value).trim() };
  return null;
}

function splitPhotoValues(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((photo) => photo.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function normalizeSheetProduct(product, rowIndex) {
  const type = titleCase(getValue(product, ["Tipo", "Tipo de producto", "Producto", "Categoría", "Categoria", "¿Qué tipo de producto quieres vender?", "Que tipo de producto quieres vender"]));
  const brand = titleCase(getValue(product, ["Marca"]));
  const description = capitalizeFirst(getValue(product, ["Descripción", "Descripcion", "Descripción del producto", "Descripcion del producto"]));
  const productName = titleCase(getValue(product, ["Nombre", "Nombre del producto"])) || [type, brand].filter(Boolean).join(" ") || `Producto BRUTAG ${rowIndex + 1}`;
  const productId = productIdFromName(productName, rowIndex);
  const photoSource = getValue(product, ["Fotos Drive", "Fotos", "Foto", "Imágenes", "Imagenes", "Sube entre 2 y 6 fotos del producto. Si tiene detalles, deben mostrarse en las fotos.", "Sube entre 2 y 6 fotos del producto", "Sube fotos", "Fotos del producto"]);
  const photoRefs = splitPhotoValues(photoSource)
    .map(createPhotoRef)
    .filter(Boolean);

  return {
    Id: productId,
    Nombre: productName,
    Tipo: type || categoryDisplayName(categoryFromText(description)),
    Marca: brand,
    Talla: formatSize(getValue(product, ["Talla", "Talla del producto"])),
    Estado: capitalizeFirst(getValue(product, ["Estado", "Estado del producto", "Condición", "Condicion", "Condición del producto", "Condicion del producto"])),
    Precio: getValue(product, ["Precio", "Precio esperado"]),
    Descripción: description,
    Fotos: photoRefs.map((_, photoIndex) => `/api/image?producto=${encodeURIComponent(productId)}&foto=${photoIndex}`).join("\n"),
    Publicado: "SI",
    __productIndex: rowIndex,
    __photoRefs: photoRefs
  };
}

function createSheetProduct(headers, row, rowIndex) {
  const product = headers.reduce((acc, header, index) => {
    const cleanHeader = String(header || "").trim();
    const key = cleanHeader || `__col_${index + 1}`;
    const safeKey = Object.prototype.hasOwnProperty.call(acc, key) ? `${key}_${index + 1}` : key;
    acc[safeKey] = row[index] || "";
    return acc;
  }, {});

  return normalizeSheetProduct(product, rowIndex);
}

function hasPublishableProductData(product) {
  return product.__photoRefs.length > 0 && Boolean(product.Nombre || product.Descripción || product.Precio);
}

async function readSheetValues() {
  const config = googleConfig();
  const sheetRange = config.sheetName
    ? `'${config.sheetName.replace(/'/g, "''")}'!A:Z`
    : "A:Z";
  const range = encodeURIComponent(sheetRange);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.sheetId)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;
  const response = await googleFetch(url);
  const payload = await response.json();
  return payload.values || [];
}

async function getApprovedProducts({ forceRefresh = false } = {}) {
  if (!forceRefresh && productCache && productCache.expiresAt > Date.now()) {
    return productCache.products;
  }

  const rows = (await readSheetValues()).filter((row) => row.some(Boolean));
  const headers = rows.shift() || [];
  const products = rows
    .map((row, rowIndex) => ({ raw: row, product: createSheetProduct(headers, row, rowIndex) }))
    .filter(({ raw }) => shouldPublish(getValue(headers.reduce((acc, header, index) => {
      acc[header || `__col_${index + 1}`] = raw[index] || "";
      return acc;
    }, {}), [
      "Publicado",
      "Publicar",
      "Aprobado",
      "Aprobar",
      "Aprobado para publicar",
      "Publicar en web",
      "Subir a web",
      "Subir a la web"
    ])))
    .map(({ product }) => product)
    .filter(hasPublishableProductData);

  productCache = {
    products,
    expiresAt: Date.now() + SHEET_CACHE_MS
  };
  return products;
}

function publicProduct(product) {
  const { __photoRefs, ...safeProduct } = product;
  return safeProduct;
}

async function getApprovedPhoto(productId, photoIndex) {
  const products = await getApprovedProducts();
  const product = products.find((item) => item.Id === productId);
  if (!product) return null;

  const photoRef = product.__photoRefs[photoIndex];
  if (!photoRef) return null;
  return { photoRef, product };
}

function validateImageMimeType(mimeType) {
  const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  if (!allowedImageTypes.has(mimeType)) {
    throw new Error("El archivo no es una imagen permitida");
  }
}

async function fetchDriveImage(fileId) {
  const config = googleConfig();
  const metadataUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,parents&supportsAllDrives=true`;
  const metadataResponse = await googleFetch(metadataUrl);
  const metadata = await metadataResponse.json();

  validateImageMimeType(metadata.mimeType);

  if (config.driveFolderId && !((metadata.parents || []).includes(config.driveFolderId))) {
    throw new Error("La imagen no pertenece a la carpeta autorizada");
  }

  const mediaUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
  const mediaResponse = await googleFetch(mediaUrl);
  const bytes = Buffer.from(await mediaResponse.arrayBuffer());

  return {
    bytes,
    mimeType: metadata.mimeType,
    name: metadata.name || "brutag-producto"
  };
}

async function fetchRemoteImage(url) {
  if (!isAllowedRemoteImageUrl(url)) {
    throw new Error("URL de imagen no permitida");
  }

  const response = await fetch(url, {
    headers: { "User-Agent": "BRUTAG-Catalog/1.0" }
  });
  if (!response.ok) {
    throw new Error(`No se pudo cargar imagen remota: ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > 12 * 1024 * 1024) {
    throw new Error("Imagen remota demasiado pesada");
  }

  const mimeType = String(response.headers.get("content-type") || "").split(";")[0].trim();
  validateImageMimeType(mimeType);

  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    bytes,
    mimeType,
    name: "brutag-tally-producto"
  };
}

async function fetchProductImage(photoRef) {
  if (photoRef.type === "drive") return fetchDriveImage(photoRef.value);
  if (photoRef.type === "url") return fetchRemoteImage(photoRef.value);
  throw new Error("Referencia de imagen inválida");
}

module.exports = {
  fetchProductImage,
  getApprovedPhoto,
  getApprovedProducts,
  publicProduct
};
