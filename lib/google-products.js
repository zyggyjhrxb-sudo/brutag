const crypto = require("crypto");

let sharp = null;
try {
  sharp = require("sharp");
} catch (error) {
  sharp = null;
}

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.readonly"
].join(" ");
const DEFAULT_GOOGLE_SHEET_ID = "1ipdNIqrYMFxh68Y8RzozyOfqf5-yg8ZMf1xsffoX2VI";
const SHEET_CACHE_MS = 10 * 1000;
const MAX_IMAGE_WIDTH = 900;
const DEFAULT_IMAGE_QUALITY = 70;
const SOLD_VISIBLE_MS = 48 * 60 * 60 * 1000;
const PRODUCT_STATUS = Object.freeze({
  PUBLISHED: "Publicado",
  UNPUBLISHED: "No publicado",
  SOLD: "Vendido"
});
const STATUS_FIELD_NAMES = [
  "Estado del producto",
  "Estado publicación",
  "Estado de publicación",
  "Estado publicacion",
  "Estado producto"
];
const SOLD_SINCE_FIELD_NAMES = [
  "Vendido desde",
  "Fecha vendido",
  "Fecha de venta",
  "Vendido el"
];
const LEGACY_PUBLISH_FIELD_NAMES = [
  "Publicado",
  "Publicar",
  "Aprobado",
  "Aprobar",
  "Aprobado para publicar",
  "Publicar en web",
  "Subir a web",
  "Subir a la web"
];
const CONDITION_FIELD_NAMES = [
  "Condición del producto",
  "Condicion del producto",
  "Condición",
  "Condicion",
  "Estado",
  "Estado de la prenda",
  "Estado de conservación",
  "Estado de conservacion"
];

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

async function googleBatchUpdate(config, requests) {
  if (!requests.length) return;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.sheetId)}:batchUpdate`;
  await googleFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requests })
  });
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

function normalizeProductStatus(value) {
  const normalized = normalizeKey(value);
  if (["publicado", "publicada"].includes(normalized)) return PRODUCT_STATUS.PUBLISHED;
  if (["nopublicado", "nopublicada", "borrador", "revision", "enrevision"].includes(normalized)) {
    return PRODUCT_STATUS.UNPUBLISHED;
  }
  if (["vendido", "vendida"].includes(normalized)) return PRODUCT_STATUS.SOLD;
  return "";
}

function isTruthyControl(value) {
  return ["si", "sí", "yes", "true", "1"].includes(String(value || "").trim().toLowerCase());
}

function readPublicationStatus(product) {
  const directStatus = normalizeProductStatus(getValue(product, STATUS_FIELD_NAMES));
  if (directStatus) return directStatus;

  if (isTruthyControl(getValue(product, ["Vendido"]))) return PRODUCT_STATUS.SOLD;
  if (isTruthyControl(getValue(product, LEGACY_PUBLISH_FIELD_NAMES))) return PRODUCT_STATUS.PUBLISHED;
  if (isTruthyControl(getValue(product, ["No Publicado", "No publicado", "No publicar"]))) {
    return PRODUCT_STATUS.UNPUBLISHED;
  }

  return PRODUCT_STATUS.UNPUBLISHED;
}

function parseSheetDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const text = String(value).trim();
  if (!text) return null;

  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) return new Date(parsed);

  const dateMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dateMatch) {
    const [, day, month, year, hour = "0", minute = "0", second = "0"] = dateMatch;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
    if (!Number.isNaN(date.getTime())) return date;
  }

  return null;
}

function isSoldVisible(product, now = Date.now()) {
  const soldSince = parseSheetDate(getValue(product, SOLD_SINCE_FIELD_NAMES));
  if (!soldSince) return false;
  return now - soldSince.getTime() <= SOLD_VISIBLE_MS;
}

function shouldShowInCatalog(product, now = Date.now()) {
  const status = readPublicationStatus(product);
  if (status === PRODUCT_STATUS.PUBLISHED) return true;
  if (status === PRODUCT_STATUS.SOLD) return isSoldVisible(product, now);
  return false;
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
  if (hasWord(["camisa", "camisas"])) return "camisa";
  if (hasWord(["chaqueta", "chaquetas"])) return "chaqueta";
  if (hasWord(["parka", "parkas"])) return "parka";
  if (hasWord(["pantalon", "pantalones"])) return "pantalon";
  if (hasWord(["jeans", "jean"])) return "jeans";
  if (hasWord(["buzo", "buzos"])) return "buzo";
  if (hasWord(["short", "shorts"])) return "short";
  if (hasWord(["traje", "trajes"])) return "traje";
  if (hasWord(["zapatilla", "zapatillas"])) return "zapatilla";
  if (hasWord(["jockey", "jockeys"])) return "jockey";
  return "";
}

function categoryDisplayName(category) {
  return {
    poleron: "Polerón",
    polera: "Polera",
    camisa: "Camisa",
    chaqueta: "Chaqueta",
    parka: "Parka",
    pantalon: "Pantalón",
    jeans: "Jeans",
    buzo: "Buzo",
    short: "Short",
    traje: "Traje de baño",
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

function rowObject(headers, row) {
  return headers.reduce((product, header, index) => {
    const cleanHeader = String(header || "").trim();
    const key = cleanHeader || `__col_${index + 1}`;
    const safeKey = Object.prototype.hasOwnProperty.call(product, key) ? `${key}_${index + 1}` : key;
    product[safeKey] = row[index] || "";
    return product;
  }, {});
}

function lastUsedHeaderIndex(headers) {
  for (let index = headers.length - 1; index >= 0; index -= 1) {
    if (String(headers[index] || "").trim()) return index;
  }
  return -1;
}

function findHeaderIndex(headers, names) {
  const wanted = new Set(names.map(normalizeKey));
  return headers.findIndex((header) => wanted.has(normalizeKey(header)));
}

function columnLooksLikeCondition(headers, rows, index) {
  if (index < 0 || normalizeKey(headers[index]) !== "estadodelproducto") return false;
  return rows.some((row) => {
    const value = row[index];
    return value && !normalizeProductStatus(value);
  });
}

function hasRawProductData(product) {
  return Boolean(
    getValue(product, ["Submission ID", "Submitted at", "Marca", "Precio", "Precio esperado"])
    || getValue(product, ["Fotos Drive", "Fotos", "Foto", "Imágenes", "Imagenes", "Sube entre 2 y 6 fotos del producto. Si tiene detalles, deben mostrarse en las fotos."])
  );
}

function buildCellValue(value) {
  return value ? { userEnteredValue: { stringValue: String(value) } } : {};
}

async function readSheetProperties(config) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.sheetId)}?fields=sheets.properties(sheetId,title,index,gridProperties(rowCount,columnCount))`;
  const response = await googleFetch(url);
  const payload = await response.json();
  const sheets = payload.sheets || [];
  const preferred = config.sheetName
    ? sheets.find((sheet) => sheet.properties.title === config.sheetName)
    : null;
  const sheet = preferred || sheets[0];

  if (!sheet) throw new Error("El spreadsheet no tiene hojas disponibles");
  return sheet.properties;
}

async function syncStatusControlColumns({ config, sheetId, headers, rows }) {
  const originalHeaders = headers.slice();
  const firstEstadoIndex = findHeaderIndex(headers, ["Estado del producto"]);
  const conditionIndex = columnLooksLikeCondition(headers, rows, firstEstadoIndex) ? firstEstadoIndex : -1;
  const legacyPublishedIndex = findHeaderIndex(headers, ["Publicado"]);
  const legacyUnpublishedIndex = findHeaderIndex(headers, ["No Publicado", "No publicado"]);
  const legacySoldIndex = findHeaderIndex(headers, ["Vendido"]);
  let statusIndex = headers.findIndex((header, index) => (
    normalizeKey(header) === "estadodelproducto" && index !== conditionIndex
  ));

  if (statusIndex < 0 && legacyPublishedIndex >= 0) statusIndex = legacyPublishedIndex;
  if (statusIndex < 0) statusIndex = lastUsedHeaderIndex(headers) + 1;

  let soldSinceIndex = findHeaderIndex(headers, SOLD_SINCE_FIELD_NAMES);
  if (soldSinceIndex < 0 && legacyUnpublishedIndex >= 0 && legacyUnpublishedIndex !== statusIndex) {
    soldSinceIndex = legacyUnpublishedIndex;
  }
  if (soldSinceIndex < 0) soldSinceIndex = Math.max(statusIndex + 1, lastUsedHeaderIndex(headers) + 1);

  const requests = [];
  const pendingHeaderUpdates = [];
  const pendingRowUpdates = [];
  const nowIso = new Date().toISOString();

  if (conditionIndex >= 0 && headers[conditionIndex] !== "Condición del producto") {
    requests.push({
      updateCells: {
        start: { sheetId, rowIndex: 0, columnIndex: conditionIndex },
        rows: [{ values: [{ userEnteredValue: { stringValue: "Condición del producto" } }] }],
        fields: "userEnteredValue"
      }
    });
    pendingHeaderUpdates.push([conditionIndex, "Condición del producto"]);
  }

  if (headers[statusIndex] !== "Estado del producto") {
    requests.push({
      updateCells: {
        start: { sheetId, rowIndex: 0, columnIndex: statusIndex },
        rows: [{
          values: [{
            userEnteredValue: { stringValue: "Estado del producto" },
            note: "Control de publicación VURTAG. Usa solo: Publicado, No publicado o Vendido."
          }]
        }],
        fields: "userEnteredValue,note"
      }
    });
    pendingHeaderUpdates.push([statusIndex, "Estado del producto"]);
  }

  if (headers[soldSinceIndex] !== "Vendido desde") {
    requests.push({
      updateCells: {
        start: { sheetId, rowIndex: 0, columnIndex: soldSinceIndex },
        rows: [{
          values: [{
            userEnteredValue: { stringValue: "Vendido desde" },
            note: "Timestamp automático usado por VURTAG para ocultar vendidos después de 48 horas."
          }]
        }],
        fields: "userEnteredValue,note"
      }
    });
    pendingHeaderUpdates.push([soldSinceIndex, "Vendido desde"]);
  }

  rows.forEach((row, rowIndex) => {
    const product = rowObject(originalHeaders, row);
    if (!hasRawProductData(product)) return;

    const status = readPublicationStatus(product);
    const soldSince = status === PRODUCT_STATUS.SOLD
      ? (row[soldSinceIndex] || nowIso)
      : "";
    const statusChanged = String(row[statusIndex] || "") !== status;
    const soldSinceChanged = String(row[soldSinceIndex] || "") !== soldSince;

    if (statusChanged || soldSinceChanged) {
      pendingRowUpdates.push({ row, status, soldSince });
    }
    if (statusChanged) {
      requests.push({
        updateCells: {
          start: { sheetId, rowIndex: rowIndex + 1, columnIndex: statusIndex },
          rows: [{ values: [buildCellValue(status)] }],
          fields: "userEnteredValue"
        }
      });
    }
    if (soldSinceChanged) {
      requests.push({
        updateCells: {
          start: { sheetId, rowIndex: rowIndex + 1, columnIndex: soldSinceIndex },
          rows: [{ values: [buildCellValue(soldSince)] }],
          fields: "userEnteredValue"
        }
      });
    }
  });

  if (!requests.length) return;

  requests.push({
    repeatCell: {
      range: { sheetId, startRowIndex: 1, startColumnIndex: statusIndex, endColumnIndex: statusIndex + 1 },
      cell: {
        dataValidation: {
          condition: {
            type: "ONE_OF_LIST",
            values: [
              { userEnteredValue: PRODUCT_STATUS.PUBLISHED },
              { userEnteredValue: PRODUCT_STATUS.UNPUBLISHED },
              { userEnteredValue: PRODUCT_STATUS.SOLD }
            ]
          },
          strict: true,
          showCustomUi: true
        }
      },
      fields: "dataValidation"
    }
  });

  requests.push({
    repeatCell: {
      range: { sheetId, startRowIndex: 1, startColumnIndex: soldSinceIndex, endColumnIndex: soldSinceIndex + 1 },
      cell: {},
      fields: "dataValidation"
    }
  });

  requests.push({
    updateDimensionProperties: {
      range: { sheetId, dimension: "COLUMNS", startIndex: soldSinceIndex, endIndex: soldSinceIndex + 1 },
      properties: { hiddenByUser: true },
      fields: "hiddenByUser"
    }
  });

  if (legacySoldIndex >= 0 && legacySoldIndex !== statusIndex && legacySoldIndex !== soldSinceIndex) {
    requests.push({
      updateDimensionProperties: {
        range: { sheetId, dimension: "COLUMNS", startIndex: legacySoldIndex, endIndex: legacySoldIndex + 1 },
        properties: { hiddenByUser: true },
        fields: "hiddenByUser"
      }
    });
  }

  await googleBatchUpdate(config, requests);

  pendingHeaderUpdates.forEach(([index, value]) => {
    headers[index] = value;
  });
  pendingRowUpdates.forEach(({ row, status, soldSince }) => {
    row[statusIndex] = status;
    row[soldSinceIndex] = soldSince;
  });
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
  const productName = titleCase(getValue(product, ["Nombre", "Nombre del producto"])) || [type, brand].filter(Boolean).join(" ") || `Producto VURTAG ${rowIndex + 1}`;
  const productId = productIdFromName(productName, rowIndex);
  const photoSource = getValue(product, ["Fotos Drive", "Fotos", "Foto", "Imágenes", "Imagenes", "Sube entre 2 y 6 fotos del producto. Si tiene detalles, deben mostrarse en las fotos.", "Sube entre 2 y 6 fotos del producto", "Sube fotos", "Fotos del producto"]);
  const photoRefs = splitPhotoValues(photoSource)
    .map(createPhotoRef)
    .filter(Boolean);
  const publicationStatus = readPublicationStatus(product);
  const maybeCondition = getValue(product, ["Estado del producto"]);
  const condition = capitalizeFirst(
    getValue(product, CONDITION_FIELD_NAMES)
    || (normalizeProductStatus(maybeCondition) ? "" : maybeCondition)
  );
  const soldSince = getValue(product, SOLD_SINCE_FIELD_NAMES);

  return {
    Id: productId,
    Nombre: productName,
    Tipo: type || categoryDisplayName(categoryFromText(description)),
    Marca: brand,
    Talla: formatSize(getValue(product, ["Talla", "Talla del producto"])),
    Estado: condition,
    EstadoPublicacion: publicationStatus,
    "Estado del producto": publicationStatus,
    VendidoDesde: soldSince,
    "Vendido desde": soldSince,
    Precio: getValue(product, ["Precio", "Precio esperado"]),
    Descripción: description,
    Fotos: photoRefs.map((_, photoIndex) => `/api/image?producto=${encodeURIComponent(productId)}&foto=${photoIndex}`).join("\n"),
    Publicado: publicationStatus === PRODUCT_STATUS.PUBLISHED ? "SI" : "NO",
    __productIndex: rowIndex,
    __photoRefs: photoRefs
  };
}

function createSheetProduct(headers, row, rowIndex) {
  return normalizeSheetProduct(rowObject(headers, row), rowIndex);
}

function hasPublishableProductData(product) {
  return product.__photoRefs.length > 0 && Boolean(product.Nombre || product.Descripción || product.Precio);
}

async function readSheetValues(config, sheetTitle) {
  const sheetRange = sheetTitle
    ? `'${sheetTitle.replace(/'/g, "''")}'!A:Z`
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

  const config = googleConfig();
  const sheetProperties = await readSheetProperties(config);
  const rows = (await readSheetValues(config, sheetProperties.title)).filter((row) => row.some(Boolean));
  const headers = rows.shift() || [];

  try {
    await syncStatusControlColumns({
      config,
      sheetId: sheetProperties.sheetId,
      headers,
      rows
    });
  } catch (error) {
    console.warn("[VURTAG] No se pudo sincronizar columnas de estado:", error.message);
  }

  const products = rows
    .map((row, rowIndex) => createSheetProduct(headers, row, rowIndex))
    .filter(hasPublishableProductData)
    .filter((product) => shouldShowInCatalog(product));

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

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

async function optimizeImage(image, options = {}) {
  if (!sharp || image.mimeType === "image/gif") return image;

  const width = clampNumber(options.width, MAX_IMAGE_WIDTH, 120, MAX_IMAGE_WIDTH);
  const quality = clampNumber(options.quality, DEFAULT_IMAGE_QUALITY, 45, 82);
  const acceptsWebp = String(options.accept || "").includes("image/webp");
  const requestedFormat = String(options.format || "").toLowerCase();
  const outputFormat = requestedFormat === "jpeg" || requestedFormat === "jpg"
    ? "jpeg"
    : (requestedFormat === "png" ? "png" : (requestedFormat === "webp" || acceptsWebp ? "webp" : "jpeg"));

  try {
    let pipeline = sharp(image.bytes, { failOn: "none" })
      .rotate()
      .resize({ width, withoutEnlargement: true, fit: "inside" });

    if (outputFormat === "png") {
      pipeline = pipeline.png({ compressionLevel: 9, quality });
    } else if (outputFormat === "jpeg") {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else {
      pipeline = pipeline.webp({ quality });
    }

    const bytes = await pipeline.toBuffer();
    return {
      ...image,
      bytes,
      mimeType: outputFormat === "png" ? "image/png" : `image/${outputFormat}`,
      name: image.name || "vurtag-producto"
    };
  } catch (error) {
    console.warn("[VURTAG] No se pudo optimizar imagen:", error.message);
    return image;
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
    name: metadata.name || "vurtag-producto"
  };
}

async function fetchRemoteImage(url) {
  if (!isAllowedRemoteImageUrl(url)) {
    throw new Error("URL de imagen no permitida");
  }

  const response = await fetch(url, {
    headers: { "User-Agent": "VURTAG-Catalog/1.0" }
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
    name: "vurtag-tally-producto"
  };
}

async function fetchProductImage(photoRef, options = {}) {
  let image;
  if (photoRef.type === "drive") image = await fetchDriveImage(photoRef.value);
  else if (photoRef.type === "url") image = await fetchRemoteImage(photoRef.value);
  else throw new Error("Referencia de imagen inválida");

  return optimizeImage(image, options);
}

module.exports = {
  fetchProductImage,
  getApprovedPhoto,
  getApprovedProducts,
  publicProduct
};
