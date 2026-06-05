const siteIntegrations = {
      productionUrl: "https://vurtag.cl/",
      instagramDmUrl: "https://ig.me/m/vurtag.cl",
      instagramProfileUrl: "https://www.instagram.com/vurtag.cl/",
      tallyFormUrl: "https://tally.so/r/J9eK1Y",
      productsApiUrl: "/api/products",
      responsesCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMvKo4ew3lIN973dmA_C4Akb1PTrsAV99aWYT-3uCDzUztYXX218arF1Ge4-JQOvDkUIe0bqb9WqWk/pub?gid=833914508&single=true&output=csv"
    };

    const localProductBackup = [];

    const toast = document.querySelector("#toast");
    const toastMessage = document.querySelector("#toast-message");
    const tallyLinks = document.querySelectorAll(".tally-link");
    const productTypeLinks = document.querySelectorAll(".product-type-link");
    let toastTimer;
    const moreProductsButton = document.querySelector("#more-products-button");
    const moreProductsModal = document.querySelector("#more-products-modal");
    const buyModal = document.querySelector("#buy-modal");
    const buyMessageBox = document.querySelector("#buy-message-box");
    const copyBuyMessageButton = document.querySelector("#copy-buy-message");
    const openInstagramDm = document.querySelector("#open-instagram-dm");
    const availableProducts = document.querySelector(".available-products");
    const conditionsButton = document.querySelector("#conditions-button");
    const conditionsModal = document.querySelector("#conditions-modal");
    const publishGuideButton = document.querySelector("#publish-guide-button");
    const publishGuideModal = document.querySelector("#publish-guide-modal");
    const photoModal = document.querySelector("#photo-modal");
    const photoModalImage = document.querySelector("#photo-modal-image");
    const productDetailModal = document.querySelector("#product-detail-modal");
    const productDetailGallery = document.querySelector("#product-detail-gallery");
    const productDetailTitle = document.querySelector("#product-detail-title");
    const productDetailPrice = document.querySelector("#product-detail-price");
    const productDetailList = document.querySelector("#product-detail-list");
    const productDetailBuy = document.querySelector("#product-detail-buy");
    let currentBuyMessage = "";
    let loadedProducts = [];
    let activeProductCategory = "all";
    let isHomepageMode = true;
    let noCatTimer = null;
    let lastProductsHash = "";
    const publishFieldNames = [
      "Estado de publicación",
      "Estado de publicacion",
      "Publicación",
      "Publicacion",
      "Publicado",
      "Aprobado",
      "Status"
    ];

    function productLink(productId) {
      const url = new URL(siteIntegrations.productionUrl);
      url.searchParams.set("producto", productId);
      url.hash = productId;
      return url.href;
    }

    function openModal(modal) {
      if (!modal) return;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
    }

    function closeModal(modal) {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }

    function scrollToSection(sectionId) {
      const section = document.querySelector(`#${sectionId}`) || document.querySelector("#catalogo");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
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

    function buildBuyMessage(productName, productId) {
      const productUrl = productLink(productId);
      return `Hola VURTAG, quiero comprar este producto: ${productName}.\nLink: ${productUrl}\n¿Aún está disponible?`;
    }

    function instagramUrlWithMessage(message) {
      return `${siteIntegrations.instagramDmUrl}?text=${encodeURIComponent(message)}`;
    }

    function isDesktop() {
      return window.matchMedia("(min-width: 840px)").matches;
    }

    function openBuyFlow(productName, productId) {
      currentBuyMessage = buildBuyMessage(productName, productId);

      if (buyMessageBox) {
        buyMessageBox.textContent = currentBuyMessage;
      }

      const dmUrl = instagramUrlWithMessage(currentBuyMessage);
      if (openInstagramDm) {
        openInstagramDm.href = dmUrl;
      }

      const fallbackCopied = fallbackCopyMessage(currentBuyMessage);

      copyMessage(currentBuyMessage).then((copied) => {
        const messageReady = copied || fallbackCopied;
        showToast(messageReady ? "Mensaje con link copiado. Pégalo en el DM de VURTAG." : "Copia el mensaje y pégalo en el DM de VURTAG.");
      }).catch(() => {
        showToast(fallbackCopied ? "Mensaje con link copiado. Pégalo en el DM de VURTAG." : "Copia el mensaje y pégalo en el DM de VURTAG.");
      });

      openModal(buyModal);
    }

    function showToast(message) {
      window.clearTimeout(toastTimer);
      toastMessage.textContent = message;
      toast.classList.add("is-visible");
      toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 5200);
    }

    function showNoCategoryNotification() {
      const overlay = document.getElementById("no-cat-overlay");
      if (!overlay) return;
      overlay.removeAttribute("hidden");
      clearTimeout(noCatTimer);
      noCatTimer = window.setTimeout(() => overlay.setAttribute("hidden", ""), 3000);
    }

    function fallbackCopyMessage(message) {
      const field = document.createElement("textarea");
      field.value = message;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-999px";
      field.style.top = "0";
      document.body.appendChild(field);
      field.select();

      try {
        return document.execCommand("copy");
      } catch (error) {
        return false;
      } finally {
        field.remove();
      }
    }

    async function copyMessage(message) {
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(message);
          return true;
        } catch (error) {
          return fallbackCopyMessage(message);
        }
      }

      return fallbackCopyMessage(message);
    }

    function requestedProductId() {
      const params = new URLSearchParams(window.location.search);
      return params.get("producto") || window.location.hash.replace("#", "");
    }

    function findProduct(productId) {
      const safeProductId = String(productId || "").replace(/[^a-z0-9-]/gi, "");
      if (!safeProductId) return null;

      return document.getElementById(safeProductId) || document.querySelector(`.available-products .product-grid[id^="${safeProductId}-"]`);
    }

    function scrollToRequestedProduct() {
      const product = findProduct(requestedProductId());
      if (!product) return false;

      const productGrid = product.closest(".product-grid") || product;
      productGrid.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      productGrid.classList.add("is-linked-product");
      window.setTimeout(() => productGrid.classList.remove("is-linked-product"), 5200);
      return true;
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
      if (hasWord(["chaleco", "chalecos"])) return "chaleco";
      if (hasWord(["polar", "polares"])) return "polar";
      if (hasWord(["chaqueta", "chaquetas"])) return "chaqueta";
      if (hasWord(["parka", "parkas"])) return "parka";
      if (hasWord(["pantalon", "pantalones"])) return "pantalon";
      if (hasWord(["jeans", "jean"])) return "jeans";
      if (hasWord(["buzo", "buzos"])) return "buzo";
      if (hasWord(["short", "shorts"])) return "short";
      if (hasWord(["traje", "trajes"])) return "traje";
      if (hasWord(["zapatilla", "zapatillas"])) return "zapatilla";
      if (hasWord(["zapato", "zapatos"])) return "zapato";
      if (hasWord(["jockey", "jockeys"])) return "jockey";
      if (hasWord(["gorro", "gorros"])) return "gorro";
      if (hasWord(["accesorio", "accesorios"])) return "accesorio";
      if (hasWord(["vestido", "vestidos"])) return "vestido";
      if (hasWord(["chomba", "chombas"])) return "chomba";
      return "";
    }

    function categoryDisplayName(category) {
      return {
        poleron: "Polerón",
        polera: "Polera",
        camisa: "Camisa",
        chaleco: "Chaleco",
        polar: "Polar",
        chaqueta: "Chaqueta",
        parka: "Parka",
        pantalon: "Pantalón",
        jeans: "Jeans",
        buzo: "Buzo",
        short: "Short",
        traje: "Traje de baño",
        zapatilla: "Zapatillas",
        zapato: "Zapatos",
        jockey: "Jockey",
        gorro: "Gorros",
        accesorio: "Accesorios",
        vestido: "Vestido",
        chomba: "Chomba"
      }[category] || "";
    }

    function formatProductType(value) {
      const category = categoryFromText(value);
      return categoryDisplayName(category) || titleCase(value);
    }

    function productCategory(product) {
      return categoryFromText(getValue(product, ["Tipo", "Tipo de producto", "Producto", "Categoría", "Categoria", "¿Qué tipo de producto quieres vender?"]));
    }

    function createMoreProductsCard(count) {
      const label = count > 10 ? `Ver más productos disponibles (${count - 10} más)` : "Ver más productos disponibles";
      return `<button class="product-more-card" type="button" data-open-more-products>${label}</button>`;
    }

    function attachMoreProductCards(scope = document) {
      scope.querySelectorAll("[data-open-more-products]").forEach((button) => {
        if (button.dataset.moreAttached === "true") return;
        button.dataset.moreAttached = "true";
        button.addEventListener("click", () => openModal(moreProductsModal));
      });
    }

    function splitDetailText(text) {
      const parts = String(text || "").split(":");
      if (parts.length < 2) return { label: "", value: String(text || "").trim() };
      return {
        label: parts.shift().trim(),
        value: parts.join(":").trim()
      };
    }

    function openProductDetail(card) {
      if (!card || !productDetailModal) return;

      const title = card.querySelector(".product-info h3")?.textContent?.trim() || "Producto VURTAG";
      const price = card.querySelector(".price")?.textContent?.trim() || "Precio por DM";
      const buyButton = card.querySelector(".buy-button");
      const productName = buyButton?.dataset.productName || title;
      const productId = buyButton?.dataset.productId || card.id || productIdFromName(productName);
      const images = [...card.querySelectorAll(".product-gallery img")]
        .map((image) => ({
          src: image.currentSrc || image.src,
          alt: image.alt || title
        }))
        .filter((image) => image.src);
      const detailTexts = [...card.querySelectorAll(".product-summary-list li, .product-extra-details li")]
        .map((item) => item.textContent.trim())
        .filter(Boolean);

      if (productDetailTitle) productDetailTitle.textContent = title;
      if (productDetailPrice) productDetailPrice.textContent = price;
      if (productDetailBuy) {
        productDetailBuy.href = instagramUrlWithMessage(buildBuyMessage(productName, productId));
        productDetailBuy.dataset.productName = productName;
        productDetailBuy.dataset.productId = productId;
      }

      if (productDetailList) {
        productDetailList.innerHTML = "";
        detailTexts.forEach((text) => {
          const detail = splitDetailText(text);
          const item = document.createElement("li");
          if (detail.label) {
            const label = document.createElement("strong");
            label.textContent = `${detail.label}: `;
            item.append(label, document.createTextNode(detail.value));
          } else {
            item.textContent = detail.value;
          }
          productDetailList.appendChild(item);
        });
      }

      if (productDetailGallery) {
        productDetailGallery.innerHTML = "";
        images.forEach((image) => {
          const button = document.createElement("button");
          button.type = "button";
          button.setAttribute("aria-label", `Ampliar ${image.alt}`);
          const img = document.createElement("img");
          img.src = image.src;
          img.alt = image.alt;
          button.appendChild(img);
          button.addEventListener("click", () => {
            if (!photoModal || !photoModalImage) return;
            photoModalImage.src = image.src;
            photoModalImage.alt = image.alt;
            openModal(photoModal);
          });
          productDetailGallery.appendChild(button);
        });
      }

      openModal(productDetailModal);
    }

    function attachProductDetailButtons(scope = document) {
      scope.querySelectorAll(".product-details-button").forEach((button) => {
        if (button.dataset.detailsAttached === "true") return;
        button.dataset.detailsAttached = "true";
        button.addEventListener("click", () => {
          openProductDetail(button.closest(".product-grid"));
        });
      });
    }

    function syncProductPanelHeights(scope = document) {
      const isWide = window.matchMedia("(min-width: 769px)").matches;
      const productCards = [...scope.querySelectorAll(".available-products .product-grid")];

      productCards.forEach((card) => {
        const gallery = card.querySelector(".product-gallery");
        const info = card.querySelector(".product-info");
        if (!gallery || !info) return;

        info.style.height = "";
        info.style.maxHeight = "";

        if (!isWide) return;

        const galleryHeight = Math.round(gallery.getBoundingClientRect().height);
        if (!galleryHeight) return;

        info.style.height = `${galleryHeight}px`;
        info.style.maxHeight = `${galleryHeight}px`;
      });
    }

    function queueProductPanelSync(scope = document) {
      window.requestAnimationFrame(() => {
        syncProductPanelHeights(scope);
        window.setTimeout(() => syncProductPanelHeights(scope), 250);
      });
    }

    function renderEmptyCatalog() {
      if (!availableProducts) return false;
      availableProducts.innerHTML = "";
      document.getElementById("sk-grid")?.remove();
      return false;
    }

    function getProductsHash(products, category) {
      return (isHomepageMode ? "home" : "full") + "|" + category + "|" + products.map((p) =>
        [getValue(p, ["Nombre","Nombre del producto"]), getValue(p, ["Precio","Precio esperado"]), getValue(p, ["Fotos","Foto"])].join(":")
      ).join("|");
    }

    let filterViewActive = false; // Evita que el polling sobreescriba la vista filtrada

    function renderAvailableProducts() {
      if (!availableProducts) return false;
      if (filterViewActive) return true; // No sobreescribir vista de filtros activa
      if (!loadedProducts.length) return renderEmptyCatalog();

      const filteredProducts = activeProductCategory === "all"
        ? loadedProducts
        : loadedProducts.filter((product) => productCategory(product) === activeProductCategory);

      if (!filteredProducts.length) {
        showNoCategoryNotification();
        return false;
      }

      // Si los datos no cambiaron, no tocar el DOM
      const hash = getProductsHash(filteredProducts, activeProductCategory);
      if (hash === lastProductsHash && availableProducts.children.length > 0) return true;
      lastProductsHash = hash;

      // Si hay un producto específico en la URL, mostrar todos para que sea alcanzable
      const hasLinkedProduct = Boolean(requestedProductId());
      const visibleProducts = (isHomepageMode && !hasLinkedProduct) ? filteredProducts.slice(0, 10) : filteredProducts;
      const productHtml = visibleProducts.map(createProductHtml).filter(Boolean).join("");
      if (!productHtml) return renderEmptyCatalog();

      availableProducts.innerHTML = `${productHtml}${(isHomepageMode && filteredProducts.length > 10) ? createMoreProductsCard(filteredProducts.length) : ""}`;
      document.getElementById("sk-grid")?.remove();
      attachBuyButtons(availableProducts);
      attachPhotoZoom(availableProducts);
      attachProductDetailButtons(availableProducts);
      attachMoreProductCards(availableProducts);
      queueProductPanelSync(availableProducts);
      window.requestAnimationFrame(scrollToRequestedProduct);
      // Retry scroll después de que el DOM esté completamente pintado
      window.setTimeout(scrollToRequestedProduct, 600);
      // Actualizar filtros con productos reales (diferido para evitar TDZ de let)
      window.setTimeout(() => { if (typeof renderFilterChips === "function") renderFilterChips(); }, 0);
      return true;
    }

    function filterStaticProducts(category) {
      const productCards = [...document.querySelectorAll(".available-products .product-grid")];
      if (!productCards.length) return renderEmptyCatalog();

      let visibleCount = 0;
      productCards.forEach((card) => {
        const cardCategory = card.dataset.productCategory || categoryFromText(card.dataset.productTypeSection || card.id);
        const shouldShow = category === "all" || cardCategory === category;
        card.hidden = !shouldShow;
        if (shouldShow) visibleCount += 1;
      });

      if (!visibleCount) {
        showNoCategoryNotification();
        productCards.forEach((card) => {
          card.hidden = false;
        });
        return false;
      }

      queueProductPanelSync();
      return true;
    }

    function applyProductCategory(category) {
      const prevCategory = activeProductCategory;
      const prevMode = isHomepageMode;
      isHomepageMode = false;
      activeProductCategory = category || "all";
      const hasCategory = loadedProducts.length ? renderAvailableProducts() : filterStaticProducts(activeProductCategory);
      if (!hasCategory) {
        // Restaurar estado anterior si no hay productos en esa categoría
        isHomepageMode = prevMode;
        activeProductCategory = prevCategory;
      } else {
        scrollToSection("drop");
      }
    }

    function attachPhotoZoom(scope = document) {
      scope.querySelectorAll(".photo-zoom").forEach((button) => {
        if (button.dataset.photoAttached === "true") return;
        button.dataset.photoAttached = "true";

        button.addEventListener("click", () => {
          if (!photoModal || !photoModalImage) return;
          photoModalImage.src = button.dataset.photoSrc || button.querySelector("img")?.src || "";
          photoModalImage.alt = button.dataset.photoAlt || button.querySelector("img")?.alt || "Foto ampliada del producto";
          openModal(photoModal);
        });
      });
    }

    function attachBuyButtons(scope = document) {
      scope.querySelectorAll(".buy-button").forEach((button) => {
        const productName = button.dataset.productName || "Producto VURTAG";
        const productId = button.dataset.productId || productIdFromName(productName);
        const message = buildBuyMessage(productName, productId);
        button.href = instagramUrlWithMessage(message);

        if (button.dataset.buyAttached === "true") return;
        button.dataset.buyAttached = "true";

        button.addEventListener("click", (event) => {
          event.preventDefault();
          openBuyFlow(productName, productId);
        });
      });
    }

    attachBuyButtons();
    attachPhotoZoom();
    attachProductDetailButtons();
    attachMoreProductCards();
    queueProductPanelSync();
    window.addEventListener("resize", () => queueProductPanelSync());
    window.addEventListener("load", () => queueProductPanelSync());
    window.requestAnimationFrame(scrollToRequestedProduct);

    productTypeLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        const category = link.dataset.category || categoryFromText(link.dataset.target);
        if (!category) return;
        event.preventDefault();
        applyProductCategory(category);
      });
    });

    tallyLinks.forEach((link) => {
      if (link.dataset.productType) {
        return;
      }

      link.href = siteIntegrations.tallyFormUrl;
      link.addEventListener("click", (event) => {
        if (!siteIntegrations.tallyFormUrl) {
          event.preventDefault();
          showToast("La encuesta todavia no tiene un enlace conectado.");
        }
      });
    });

    document.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", () => closeModal(document.querySelector(`#${button.dataset.closeModal}`)));
    });

    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal(modal);
      });
    });

    document.querySelectorAll("[data-close-and-scroll]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        closeModal(moreProductsModal);
        scrollToSection(link.dataset.closeAndScroll);
      });
    });

    document.querySelectorAll("[data-close-and-category]").forEach((button) => {
      button.addEventListener("click", () => {
        closeModal(moreProductsModal);
        applyProductCategory(button.dataset.closeAndCategory);
      });
    });

    if (moreProductsButton) {
      moreProductsButton.addEventListener("click", () => openModal(moreProductsModal));
    }

    if (conditionsButton) {
      conditionsButton.addEventListener("click", () => openModal(conditionsModal));
    }

    if (publishGuideButton) {
      publishGuideButton.addEventListener("click", () => openModal(publishGuideModal));
    }

    const noCatClose = document.getElementById("no-cat-close");
    if (noCatClose) {
      noCatClose.addEventListener("click", () => {
        clearTimeout(noCatTimer);
        const overlay = document.getElementById("no-cat-overlay");
        if (overlay) overlay.setAttribute("hidden", "");
      });
    }
    document.getElementById("no-cat-overlay")?.addEventListener("click", (e) => {
      if (e.target.id === "no-cat-overlay") {
        clearTimeout(noCatTimer);
        document.getElementById("no-cat-overlay").setAttribute("hidden", "");
      }
    });

    if (copyBuyMessageButton) {
      copyBuyMessageButton.addEventListener("click", async () => {
        if (!currentBuyMessage) return;
        const copied = await copyMessage(currentBuyMessage);
        showToast(copied ? "Mensaje copiado otra vez. Pégalo en el DM." : currentBuyMessage);
      });
    }

    if (productDetailBuy) {
      productDetailBuy.addEventListener("click", (event) => {
        event.preventDefault();
        closeModal(productDetailModal);
        openBuyFlow(productDetailBuy.dataset.productName || "Producto VURTAG", productDetailBuy.dataset.productId || "producto");
      });
    }

    function parseCsv(csvText) {
      const rows = [];
      let row = [];
      let cell = "";
      let insideQuotes = false;

      for (let i = 0; i < csvText.length; i += 1) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"' && insideQuotes && nextChar === '"') {
          cell += '"';
          i += 1;
        } else if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === "," && !insideQuotes) {
          row.push(cell.trim());
          cell = "";
        } else if ((char === "\n" || char === "\r") && !insideQuotes) {
          if (cell || row.length) {
            row.push(cell.trim());
            rows.push(row);
            row = [];
            cell = "";
          }
          if (char === "\r" && nextChar === "\n") i += 1;
        } else {
          cell += char;
        }
      }

      if (cell || row.length) {
        row.push(cell.trim());
        rows.push(row);
      }

      return rows;
    }

    function normalizeKey(value) {
      return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
    }

    function escapeHtml(value) {
      return String(value || "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[character]));
    }

    function shouldPublish(value) {
      const normalized = normalizeKey(value);
      return normalized === "aprobado" || normalized === "vendido";
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

    function isPublishValue(value) {
      return ["si", "no", "yes", "true", "false"].includes(normalizeKey(value));
    }

    function isImageValue(value) {
      const text = String(value || "").trim();
      return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(text) || /storage\.tally\.so/i.test(text);
    }

    function isInstagramValue(value) {
      return /^@[\w.]+$/.test(String(value || "").trim()) || /instagram\.com/i.test(String(value || ""));
    }

    function isPriceValue(value) {
      const text = String(value || "").trim();
      if (!text) return false;
      if (isImageValue(text) || isPublishValue(text) || isInstagramValue(text)) return false;
      return /\d/.test(text) && !/estado|nuevo|uso|detalle/i.test(text);
    }

    function isStatusValue(value) {
      const normalized = normalizeKey(value);
      return [
        "nuevo",
        "nueva",
        "buenestado",
        "muybuenestado",
        "pocouso",
        "usado",
        "usada",
        "condetalles",
        "detalles"
      ].includes(normalized);
    }

    function isTermsValue(value) {
      const text = String(value || "").toLowerCase();
      return /acepto\s+los\s+t[eé]rminos|t[eé]rminos\s+y\s+condiciones/i.test(text) || /^true$|^false$/i.test(String(value || "").trim());
    }

    function compactProductCells(product) {
      return (product.__cells || [])
        .map((value) => String(value || "").trim())
        .filter(Boolean);
    }

    function findCompactValue(product, predicate) {
      return compactProductCells(product).find(predicate) || "";
    }

    function inferProductName(type, brand, description, fallbackName) {
      const directName = titleCase(fallbackName);
      if (directName) return directName;

      if (type && brand) return [type, brand].join(" ");

      const cleanDescription = titleCase(description)
        .replace(/\s+/g, " ")
        .replace(/\.$/, "")
        .trim();
      if (!cleanDescription) return "";

      const words = cleanDescription.split(" ").filter(Boolean);
      const category = categoryFromText(cleanDescription);
      if (category) {
        const categoryLabel = categoryDisplayName(category) || titleCase(category);
        const maxWords = category === "pantalon" ? 3 : 2;
        const productWords = words.slice(0, maxWords);
        if (productWords.length) productWords[0] = categoryLabel;
        return productWords.join(" ") || categoryLabel;
      }

      return words.slice(0, 3).join(" ") || [type, brand].filter(Boolean).join(" ");
    }

    function findLocalProductBackup(productName, description) {
      const productKey = normalizeKey([productName, description].filter(Boolean).join(" "));
      return localProductBackup.find((product) => {
        const backupName = normalizeKey(getValue(product, ["Nombre", "Nombre del producto"]));
        return backupName && productKey.includes(backupName);
      }) || null;
    }

    function normalizeSheetProduct(product) {
      const directType = formatProductType(getValue(product, ["Tipo", "Tipo de producto", "Producto", "Categoría", "Categoria", "¿Qué tipo de producto quieres vender?", "Que tipo de producto quieres vender"]));
      const directBrand = titleCase(getValue(product, ["Marca"]));
      const directSize = formatSize(getValue(product, ["Talla", "Talla del producto"]));
      const directStatus = capitalizeFirst(getValue(product, ["Estado", "Estado del producto", "Condición", "Condicion", "Condición del producto", "Condicion del producto"]));
      const directPrice = getValue(product, ["Precio", "Precio esperado"]);
      const directDescription = getValue(product, ["Descripción", "Descripcion", "Descripción del producto", "Descripcion del producto"]);
      const directPhotos = getValue(product, ["Fotos", "Foto", "Imágenes", "Imagenes", "Sube entre 2 y 6 fotos del producto. Si tiene detalles, deben mostrarse en las fotos.", "Sube entre 2 y 6 fotos del producto", "Sube fotos", "Fotos del producto"]);
      const directPublished = getValue(product, publishFieldNames);

      const status = directStatus || capitalizeFirst(findCompactValue(product, isStatusValue));
      const price = isPriceValue(directPrice)
        ? directPrice
        : findCompactValue(product, isPriceValue);
      const description = (!isPriceValue(directDescription) && !isStatusValue(directDescription) && !isInstagramValue(directDescription) && !isImageValue(directDescription) && !isTermsValue(directDescription))
        ? capitalizeFirst(directDescription)
        : capitalizeFirst(findCompactValue(product, (value) => (
          !isPriceValue(value)
          && !isStatusValue(value)
          && !isInstagramValue(value)
          && !isPublishValue(value)
          && !isImageValue(value)
          && !isTermsValue(value)
          && String(value || "").trim().length > 2
        )));
      const photos = directPhotos || compactProductCells(product).filter(isImageValue).join("\n");
      const inferredType = directType || categoryDisplayName(categoryFromText(description));
      const productName = inferProductName(
        inferredType,
        directBrand,
        description,
        getValue(product, ["Nombre", "Nombre del producto"])
      );
      const localBackup = findLocalProductBackup(productName, description);
      const backupSize = localBackup ? formatSize(getValue(localBackup, ["Talla"])) : "";

      return {
        ...product,
        Nombre: productName,
        Tipo: inferredType || directType,
        Marca: directBrand,
        Talla: directSize || backupSize,
        Estado: status,
        Precio: price,
        Descripción: description,
        Fotos: photos,
        Publicado: directPublished,
        __productIndex: product.__productIndex
      };
    }

    function createSheetProduct(headers, row, rowIndex) {
      return normalizeSheetProduct(headers.reduce((product, header, index) => {
        const cleanHeader = String(header || "").trim();
        const key = cleanHeader || `__col_${index + 1}`;
        const safeKey = Object.prototype.hasOwnProperty.call(product, key) ? `${key}_${index + 1}` : key;
        product[safeKey] = row[index] || "";
        return product;
      }, {
        __cells: row,
        __headers: headers,
        __productIndex: rowIndex
      }));
    }

    function hasPublishableProductData(product) {
      const photos = getImages(getValue(product, ["Fotos", "Foto", "Imágenes", "Imagenes"]));
      const name = getValue(product, ["Nombre", "Nombre del producto"]);
      const description = getValue(product, ["Descripción", "Descripcion", "Descripción del producto", "Descripcion del producto"]);
      const price = getValue(product, ["Precio", "Precio esperado"]);

      return photos.length > 0 && Boolean(name || description || price);
    }

    function getImages(value) {
      return String(value || "")
        .split(/,|\n/)
        .map((image) => image.trim())
        .filter(Boolean)
        .slice(0, 4);
    }

    function formatPrice(value) {
      const raw = String(value || "").trim();
      if (!raw) return "";

      // Queda solo dígitos, puntos y comas
      let clean = raw.replace(/[^0-9.,]/g, "");
      if (!clean) return raw;

      // Si termina en decimales (1-2 dígitos después de punto o coma)
      // → centavos no existen en CLP, los sacamos
      // Ej: "25000.00" → "25000" | "25000,5" → "25000"
      clean = clean.replace(/[.,]\d{1,2}$/, "");

      // Sacamos todos los separadores de miles que quedan
      const digits = clean.replace(/[.,]/g, "");
      const amount = Number(digits);

      if (!amount || isNaN(amount)) return raw;

      // En CLP no existen precios < $1.000 para ropa usada.
      // Si alguien escribió "25" → $25.000, "10" → $10.000, etc.
      if (amount > 0 && amount < 1000) {
        return `$${(amount * 1000).toLocaleString("es-CL")}`;
      }

      return `$${amount.toLocaleString("es-CL")}`;
    }

    function formatSize(value) {
      return String(value || "").trim().toLocaleUpperCase("es-CL");
    }

    function capitalizeFirst(value) {
      const text = String(value || "").trim();
      if (!text) return "";

      const lowerText = text.toLocaleLowerCase("es-CL");
      return lowerText.charAt(0).toLocaleUpperCase("es-CL") + lowerText.slice(1);
    }

    function titleCase(value) {
      return String(value || "")
        .trim()
        .toLocaleLowerCase("es-CL")
        .replace(/(^|[\s/&-])([a-záéíóúñ])/gi, (match, prefix, letter) => `${prefix}${letter.toLocaleUpperCase("es-CL")}`);
    }

    function createProductHtml(product, index) {
      if (!hasPublishableProductData(product)) return "";

      const type = titleCase(getValue(product, ["Tipo", "Tipo de producto", "Producto", "Categoría", "Categoria"]) || "Producto");
      const brand = titleCase(getValue(product, ["Marca"]) || "");
      const size = formatSize(getValue(product, ["Talla"]));
      const status = capitalizeFirst(getValue(product, ["Estado", "Estado del producto", "Condición", "Condicion"]));
      const price = getValue(product, ["Precio", "Precio esperado"]);
      const description = capitalizeFirst(getValue(product, ["Descripción", "Descripcion", "Descripción del producto", "Descripcion del producto"]));
      const photos = getImages(getValue(product, ["Fotos", "Foto", "Imágenes", "Imagenes"]));

      const productName = titleCase(getValue(product, ["Nombre", "Nombre del producto"])) || [type, brand].filter(Boolean).join(" ") || `Producto VURTAG ${index + 1}`;
      const productIndex = Number.isInteger(product.__productIndex) ? product.__productIndex : index;
      const productId = getValue(product, ["Id", "ID", "Producto ID", "Product ID"]) || productIdFromName(productName, productIndex);
      const category = productCategory(product);
      const imageFigures = photos.map((photo) => `
            <figure>
              <button class="photo-zoom" type="button" data-photo-src="${escapeHtml(photo)}" data-photo-alt="${escapeHtml(productName)}">
                <img src="${escapeHtml(photo)}" alt="${escapeHtml(productName)}" decoding="async" loading="lazy">
                <span class="photo-preview">Vista previa</span>
              </button>
            </figure>`).join("");

      const displayPrice = formatPrice(price);
      const buyMessage = buildBuyMessage(productName, productId);
      const buyUrl = instagramUrlWithMessage(buyMessage);

      const isSold = product.Vendido === true;
      const tagHtml = isSold
        ? `<span class="tag tag-sold">Vendido</span>`
        : `<span class="tag">Disponible</span>`;
      const actionsHtml = isSold
        ? `<button class="button" type="button" disabled aria-disabled="true">No disponible</button>
              <button class="button secondary product-details-button" type="button">Ver más</button>`
        : `<a class="button buy-button" href="${escapeHtml(buyUrl)}" target="_blank" rel="noopener" data-product-name="${escapeHtml(productName)}" data-product-id="${escapeHtml(productId)}">Comprar</a>
              <button class="button secondary add-to-cart-btn" type="button" data-product-name="${escapeHtml(productName)}" data-product-id="${escapeHtml(productId)}" data-product-price="${escapeHtml(displayPrice || '')}" data-product-photo="${escapeHtml(photos[0] || '')}">Carrito</button>
              <button class="button secondary product-details-button" type="button">Ver más</button>`;

      return `
        <div class="product-grid${isSold ? " product-sold" : ""}" id="${escapeHtml(productId)}" data-product-type-section="${escapeHtml(type)}" data-product-category="${escapeHtml(category)}">
          <div class="product-gallery">${imageFigures}
          </div>

          <article class="product-info">
            <div class="tag-row">
              ${tagHtml}
            </div>
            <h3>${escapeHtml(productName)}</h3>
            <div class="product-summary-row">
              <div class="price">${escapeHtml(displayPrice || "Precio por DM")}</div>
            </div>
            <ul class="detail-list product-summary-list">
              <li><strong>Talla:</strong> ${escapeHtml(size || "Por confirmar")}</li>
            </ul>
            <ul class="detail-list product-extra-details" hidden>
              <li><strong>Estado:</strong> ${escapeHtml(status || "Por confirmar")}</li>
              <li><strong>Stock:</strong> ${isSold ? "Vendido" : "Disponible"}</li>
              <li><strong>Descripción:</strong> ${escapeHtml(description || "Producto disponible en VURTAG")}</li>
            </ul>
            <div class="actions">
              ${actionsHtml}
            </div>
          </article>
        </div>`;
    }

    function rawBackupProducts() {
      return localProductBackup
        .map((product, rowIndex) => normalizeSheetProduct({ ...product, __cells: Object.values(product), __headers: Object.keys(product), __productIndex: rowIndex }));
    }

    function publishableBackupProducts() {
      return rawBackupProducts()
        .filter((product) => shouldPublish(getValue(product, publishFieldNames)))
        .filter(hasPublishableProductData);
    }

    function productMatchKey(product) {
      return normalizeKey(getValue(product, ["Nombre", "Nombre del producto"]));
    }

    function mergeSheetWithBackup(sheetProducts) {
      // Sheet "manda" sobre el backup hardcodeado:
      // - Si una fila del Sheet matchea por nombre con un producto del backup,
      //   el SI/NO y los campos del Sheet ganan (permite ocultar el polerón con NO)
      // - Si una fila del Sheet no matchea, se agrega como producto nuevo (si SI)
      // - Si un producto del backup no aparece en el Sheet, se mantiene con su SI por defecto
      const sheetByKey = new Map();
      for (const product of sheetProducts) {
        const key = productMatchKey(product);
        if (key) sheetByKey.set(key, product);
      }

      const merged = [];
      const usedSheetKeys = new Set();

      for (const backup of rawBackupProducts()) {
        const key = productMatchKey(backup);
        const override = key ? sheetByKey.get(key) : null;
        if (override) {
          usedSheetKeys.add(key);
          if (shouldPublish(getValue(override, publishFieldNames))) merged.push(override);
        } else if (shouldPublish(getValue(backup, publishFieldNames))) {
          merged.push(backup);
        }
      }

      for (const product of sheetProducts) {
        const key = productMatchKey(product);
        if (key && usedSheetKeys.has(key)) continue;
        if (shouldPublish(getValue(product, publishFieldNames))) merged.push(product);
      }

      return merged.filter(hasPublishableProductData);
    }

    function useBackupProducts(reason) {
      const backup = publishableBackupProducts();
      if (!backup.length) {
        loadedProducts = [];
        renderEmptyCatalog();
        return;
      }
      if (reason) console.info(`[VURTAG] usando productos de respaldo: ${reason}`);
      loadedProducts = backup;
      renderAvailableProducts();
    }

    const PRODUCT_CACHE_KEY = "vurtag_products_v3";
    const PRODUCT_CACHE_TTL = 5 * 60 * 1000; // 5 min — cacheable between visits

    function saveProductsToCache(products) {
      try {
        localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify({ products, savedAt: Date.now() }));
      } catch {}
    }

    function loadProductsFromCache() {
      try {
        const raw = localStorage.getItem(PRODUCT_CACHE_KEY);
        if (!raw) return null;
        const { products, savedAt } = JSON.parse(raw);
        if (Date.now() - savedAt > PRODUCT_CACHE_TTL) return null;
        return Array.isArray(products) ? products : null;
      } catch { return null; }
    }

    let isFetchingProducts = false;

    async function loadProductsFromSheet() {
      if (!availableProducts || isFetchingProducts) return;
      isFetchingProducts = true;
      try {

      // 1. Intenta la API privada (Google Sheets con credenciales en Vercel)
      let sheetProducts = [];
      let dataSourceOk = false; // rastrea si alguna fuente respondió exitosamente

      if (siteIntegrations.productsApiUrl) {
        try {
          const response = await fetch(siteIntegrations.productsApiUrl);
          if (response.ok) {
            dataSourceOk = true;
            const payload = await response.json();
            sheetProducts = (Array.isArray(payload.products) ? payload.products : [])
              .map((product, index) => normalizeSheetProduct({
                ...product,
                __productIndex: Number.isInteger(product.__productIndex) ? product.__productIndex : index
              }))
              .filter(hasPublishableProductData);
          }
        } catch (error) {
          console.warn("[VURTAG] API privada no disponible:", error.message);
        }
      }

      // 2. Si la API no dio nada, intenta el CSV público (Google Sheets publicado)
      if (!sheetProducts.length && siteIntegrations.responsesCsvUrl) {
        try {
          const csvResponse = await fetch(siteIntegrations.responsesCsvUrl);
          if (csvResponse.ok) {
            dataSourceOk = true;
            const csvText = await csvResponse.text();
            const rows = parseCsv(csvText).filter((r) => r.some(Boolean));
            if (rows.length > 1) {
              const headers = rows[0];
              sheetProducts = rows.slice(1)
                .map((row, index) => createSheetProduct(headers, row, index))
                .filter((p) => shouldPublish(getValue(p, publishFieldNames)))
                .filter(hasPublishableProductData);
            }
          }
        } catch (error) {
          console.warn("[VURTAG] CSV público no disponible:", error.message);
        }
      }

      // Si ninguna fuente respondió (error de red), no tocar nada
      if (!dataSourceOk) return;

      // 3. Mezcla con backup
      const merged = mergeSheetWithBackup(sheetProducts);

      if (merged.length > 0) {
        // Hay productos: guardar en caché y mostrar
        loadedProducts = merged;
        saveProductsToCache(merged);
        renderAvailableProducts();
      } else {
        // API respondió OK pero sin productos — limpiar display
        // NO guardamos caché vacío: evita que un fallo puntual borre los productos en la próxima recarga
        loadedProducts = [];
        renderEmptyCatalog();
      }
      } finally {
        isFetchingProducts = false;
      }
    }

    // Limpia cachés de versiones anteriores
    try { localStorage.removeItem("vurtag_products_v1"); } catch {}
    try { localStorage.removeItem("vurtag_products_v2"); } catch {}

    // Si hay caché válida, mostrar de inmediato (el skeleton se oculta al renderizar)
    const cachedProducts = loadProductsFromCache();
    if (cachedProducts && cachedProducts.length) {
      loadedProducts = cachedProducts;
      renderAvailableProducts();
    }

    // Siempre fetch inmediato al cargar
    loadProductsFromSheet();

    // Polling cada 2 segundos — near real-time sync con Google Sheets
    setInterval(loadProductsFromSheet, 30 * 1000); // Cada 30s — no sobreescribe vista filtrada

    // Refresca también cuando el usuario vuelve al tab
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) loadProductsFromSheet();
    });

    /* ============================================================
       CARRITO DE COMPRAS
    ============================================================ */
    let cart = [];

    function cartSave() {
      try { localStorage.setItem("vurtag_cart", JSON.stringify(cart)); } catch {}
      try {
        const sess = JSON.parse(localStorage.getItem("vurtag_session") || "null");
        if (sess?.email) {
          const users = JSON.parse(localStorage.getItem("vurtag_users") || "{}");
          if (users[sess.email]) { users[sess.email].cart = cart; localStorage.setItem("vurtag_users", JSON.stringify(users)); }
        }
      } catch {}
    }

    function cartLoad() {
      try {
        const raw = localStorage.getItem("vurtag_cart");
        if (raw) cart = JSON.parse(raw) || [];
      } catch {}
    }

    cartLoad();

    function cartItemHtml(item, idx) {
      const imgHtml = item.photo
        ? `<img class="cart-item-img" src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.name)}" loading="lazy">`
        : `<div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;color:#999;font-size:0.65rem;">Sin foto</div>`;
      return `
        <div class="cart-item" data-cart-index="${idx}">
          ${imgHtml}
          <div class="cart-item-info">
            <span class="cart-item-name">${escapeHtml(item.name)}</span>
            <span class="cart-item-price">${escapeHtml(item.price || "Precio por DM")}</span>
          </div>
          <button class="cart-item-remove" type="button" data-remove-idx="${idx}" aria-label="Quitar del carrito">×</button>
        </div>`;
    }

    function renderCartPanel() {
      const cartItems = document.getElementById("cart-items");
      const cartEmptyMsg = document.getElementById("cart-empty-msg");
      const cartFoot = document.getElementById("cart-panel-foot");
      const cartBadge = document.getElementById("cart-badge");
      if (!cartItems) return;

      const count = cart.length;

      // Badge
      if (cartBadge) {
        if (count > 0) {
          cartBadge.textContent = count;
          cartBadge.removeAttribute("hidden");
        } else {
          cartBadge.setAttribute("hidden", "");
        }
      }

      if (!count) {
        cartItems.innerHTML = `<p class="cart-empty-msg">El carrito está vacío.</p>`;
        if (cartFoot) cartFoot.setAttribute("hidden", "");
        return;
      }

      cartItems.innerHTML = cart.map((item, idx) => cartItemHtml(item, idx)).join("");
      if (cartFoot) cartFoot.removeAttribute("hidden");
    }

    function addToCart(item) {
      // Evitar duplicados por id
      const exists = cart.some((c) => c.id === item.id);
      if (exists) {
        showToast(`"${item.name}" ya está en el carrito.`);
        return;
      }
      cart.push(item);
      cartSave();
      renderCartPanel();
      showToast(`"${item.name}" agregado al carrito.`);
    }

    function removeFromCart(idx) {
      cart.splice(idx, 1);
      cartSave();
      renderCartPanel();
    }

    function clearCart() {
      cart = [];
      cartSave();
      renderCartPanel();
    }

    function buildCartMessage() {
      if (!cart.length) return "";
      const lines = cart.map((item, i) => {
        const url = productLink(item.id);
        return `${i + 1}. ${item.name}${item.price ? " — " + item.price : ""}\n   Link: ${url}`;
      });
      return `Hola VURTAG, quiero comprar estos productos:\n${lines.join("\n")}\n¿Están disponibles?`;
    }

    function openCartModal() {
      renderCartPanel();
      const modal = document.getElementById("cart-modal");
      if (modal) modal.removeAttribute("hidden");
    }

    function closeCartModal() {
      const modal = document.getElementById("cart-modal");
      if (modal) modal.setAttribute("hidden", "");
    }

    // Cart button en header
    const cartBtn = document.getElementById("cart-btn");
    if (cartBtn) cartBtn.addEventListener("click", openCartModal);

    // Cerrar carrito
    document.getElementById("cart-panel-close")?.addEventListener("click", closeCartModal);
    document.getElementById("cart-backdrop")?.addEventListener("click", closeCartModal);

    // Quitar producto del carrito (delegación)
    document.getElementById("cart-items")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove-idx]");
      if (btn) removeFromCart(Number(btn.dataset.removeIdx));
    });

    // Vaciar carrito
    document.getElementById("cart-clear-btn")?.addEventListener("click", () => {
      clearCart();
    });

    // Checkout carrito
    document.getElementById("cart-checkout-btn")?.addEventListener("click", async () => {
      const message = buildCartMessage();
      if (!message) return;

      const box = document.getElementById("cart-buy-message-box");
      if (box) box.textContent = message;

      const igLink = document.getElementById("cart-open-ig");
      if (igLink) igLink.href = instagramUrlWithMessage(message);

      await copyMessage(message).catch(() => fallbackCopyMessage(message));

      closeCartModal();
      openModal(document.getElementById("cart-buy-modal"));
    });

    // Copiar otra vez en modal carrito
    document.getElementById("cart-copy-again")?.addEventListener("click", async () => {
      const message = buildCartMessage();
      if (!message) return;
      await copyMessage(message).catch(() => fallbackCopyMessage(message));
      showToast("Mensaje copiado otra vez.");
    });

    // Agregar al carrito desde tarjetas de producto (delegación de eventos)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".add-to-cart-btn");
      if (!btn) return;
      addToCart({
        name: btn.dataset.productName || "Producto",
        id: btn.dataset.productId || "",
        price: btn.dataset.productPrice || "",
        photo: btn.dataset.productPhoto || ""
      });
    });

    // Inicializar badge al cargar
    renderCartPanel();

    /* ============================================================
       MENÚ HAMBURGUESA
    ============================================================ */
    function openHamburger() {
      const overlay = document.getElementById("hamburger-overlay");
      if (overlay) overlay.removeAttribute("hidden");
    }
    function closeHamburger() {
      const overlay = document.getElementById("hamburger-overlay");
      if (overlay) overlay.setAttribute("hidden", "");
    }

    document.getElementById("hamburger-btn")?.addEventListener("click", openHamburger);
    document.getElementById("hamburger-close-btn")?.addEventListener("click", closeHamburger);
    document.getElementById("hamburger-backdrop")?.addEventListener("click", closeHamburger);

    // "Ver más productos" desde hamburguesa
    document.getElementById("hamburger-explore-btn")?.addEventListener("click", () => {
      closeHamburger();
      openModal(moreProductsModal);
    });

    /* ============================================================
       EFECTO SCROLL: VURTAG letra a letra según posición de scroll
    ============================================================ */
    const topBrandBar = document.getElementById("top-brand-bar");
    const brandTypedEl = document.getElementById("brand-typed");
    const siteNav = document.getElementById("site-nav");
    const BRAND_WORD = "VURTAG";
    const SCROLL_START = 90;     // scroll donde aparece la primera letra
    const SCROLL_PER_LETTER = 100; // ~1 notch de rueda = 1 letra
    let brandActive = false;
    let lastLetterCount = -1;

    function updateBrandBar(scrollY) {
      if (!topBrandBar || !brandTypedEl) return;

      if (scrollY < SCROLL_START) {
        if (brandActive) {
          brandActive = false;
          lastLetterCount = -1;
          topBrandBar.classList.remove("is-active");
          brandTypedEl.textContent = "";
          siteNav?.classList.remove("nav--hidden");
        }
        return;
      }

      if (!brandActive) {
        brandActive = true;
        topBrandBar.classList.add("is-active");
        siteNav?.classList.add("nav--hidden");
      }

      const count = Math.min(BRAND_WORD.length, Math.max(0,
        Math.floor((scrollY - SCROLL_START) / SCROLL_PER_LETTER)
      ));
      if (count !== lastLetterCount) {
        lastLetterCount = count;
        brandTypedEl.textContent = count > 0
          ? BRAND_WORD.slice(0, count).split("").join(" ")
          : "";
      }
    }

    window.addEventListener("scroll", () => updateBrandBar(window.scrollY), { passive: true });

    /* ============================================================
       AUTENTICACIÓN (localStorage — funciona en este dispositivo)
    ============================================================ */
    async function authHash(str) {
      const buf = new TextEncoder().encode(str);
      const h = await crypto.subtle.digest("SHA-256", buf);
      return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2,"0")).join("");
    }
    const getAuthUsers = () => { try { return JSON.parse(localStorage.getItem("vurtag_users") || "{}"); } catch { return {}; } };
    const getAuthSession = () => { try { return JSON.parse(localStorage.getItem("vurtag_session") || "null"); } catch { return null; } };

    async function authRegister(name, email, password) {
      const users = getAuthUsers();
      if (users[email]) return { error: "Este email ya tiene una cuenta." };
      if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };
      const pw = await authHash(email + password);
      const fecha = new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" });
      users[email] = { name, email, pw, cart: [], createdAt: fecha };
      localStorage.setItem("vurtag_users", JSON.stringify(users));
      const sess = { name, email };
      localStorage.setItem("vurtag_session", JSON.stringify(sess));
      // Notificar por correo a vurtag.26@gmail.com via EmailJS
      try {
        if (window.emailjs) {
          emailjs.send("vurtag_service", "vurtag_nuevo_usuario", {
            to_email: "vurtag.26@gmail.com",
            user_name: name || "(sin nombre)",
            user_email: email,
            fecha_registro: fecha
          });
        }
      } catch(e) { console.warn("[VURTAG] EmailJS no configurado:", e.message); }
      return { ok: true, sess };
    }

    async function authLogin(email, password) {
      const users = getAuthUsers();
      const u = users[email];
      if (!u) return { error: "No existe una cuenta registrada con estos datos. Primero debes crear una cuenta." };
      const pw = await authHash(email + password);
      if (u.pw !== pw) return { error: "Contraseña incorrecta." };
      const sess = { name: u.name, email };
      localStorage.setItem("vurtag_session", JSON.stringify(sess));
      if (u.cart?.length) { cart = u.cart; cartSave(); renderCartPanel(); }
      return { ok: true, sess };
    }

    function authLogout() {
      const sess = getAuthSession();
      if (sess?.email) {
        const users = getAuthUsers();
        if (users[sess.email]) { users[sess.email].cart = cart; localStorage.setItem("vurtag_users", JSON.stringify(users)); }
      }
      localStorage.removeItem("vurtag_session");
      cart = []; cartSave(); renderCartPanel();
      updateAuthUI(null);
    }

    function updateAuthUI(sess) {
      const loginBtn = document.getElementById("nav-login-btn");
      const userEl = document.getElementById("nav-user");
      const userNameEl = document.getElementById("nav-user-name");
      const hambLoginBtn = document.getElementById("hamburger-login-btn");
      if (sess) {
        loginBtn?.setAttribute("hidden", "");
        userEl?.removeAttribute("hidden");
        if (userNameEl) userNameEl.textContent = sess.name || sess.email;
        if (hambLoginBtn) hambLoginBtn.textContent = "Cerrar sesión";
      } else {
        loginBtn?.removeAttribute("hidden");
        userEl?.setAttribute("hidden", "");
        if (hambLoginBtn) hambLoginBtn.textContent = "Iniciar sesión";
      }
    }

    // Auth modal
    const authModal = document.getElementById("auth-modal");
    let authMode = "login";

    function openAuthModal(mode = "login") {
      authMode = mode;
      const isLogin = mode === "login";
      document.getElementById("auth-title").textContent = isLogin ? "Iniciar sesión" : "Crear cuenta";
      document.getElementById("auth-submit").textContent = isLogin ? "Entrar" : "Crear cuenta";
      document.getElementById("auth-mode-toggle").textContent = isLogin ? "Crear una cuenta" : "Ya tengo cuenta";
      const nameRow = document.getElementById("auth-name-row");
      isLogin ? nameRow?.setAttribute("hidden","") : nameRow?.removeAttribute("hidden");
      document.getElementById("auth-error")?.setAttribute("hidden","");
      document.getElementById("auth-email").value = "";
      document.getElementById("auth-password").value = "";
      openModal(authModal);
    }

    document.getElementById("nav-login-btn")?.addEventListener("click", () => openAuthModal("login"));

    document.getElementById("auth-mode-toggle")?.addEventListener("click", () => {
      openAuthModal(authMode === "login" ? "register" : "login");
    });

    document.getElementById("auth-submit")?.addEventListener("click", async () => {
      const email = (document.getElementById("auth-email")?.value || "").trim();
      const password = document.getElementById("auth-password")?.value || "";
      const name = (document.getElementById("auth-name")?.value || "").trim();
      const errEl = document.getElementById("auth-error");
      const btn = document.getElementById("auth-submit");

      if (!email || !password) {
        errEl.textContent = "Completa todos los campos."; errEl.removeAttribute("hidden"); return;
      }

      btn.textContent = "..."; btn.disabled = true;
      const result = authMode === "register"
        ? (name ? await authRegister(name, email, password) : { error: "Ingresa tu nombre." })
        : await authLogin(email, password);
      btn.disabled = false;

      if (result.error) {
        errEl.textContent = result.error; errEl.removeAttribute("hidden");
        btn.textContent = authMode === "login" ? "Entrar" : "Crear cuenta";
      } else {
        closeModal(authModal);
        updateAuthUI(result.sess);
      }
    });

    document.getElementById("auth-form")?.addEventListener("submit", e => e.preventDefault());
    document.getElementById("nav-logout-btn")?.addEventListener("click", authLogout);

    // Restaurar sesión al cargar
    const _initSess = getAuthSession();
    if (_initSess) {
      updateAuthUI(_initSess);
      const _initUsers = getAuthUsers();
      const _initUser = _initUsers[_initSess.email];
      if (_initUser?.cart?.length) { cart = _initUser.cart; cartSave(); renderCartPanel(); }
    }

    /* ============================================================
       CATALOG OVERLAY: muestra todos los productos
    ============================================================ */
    const catalogOverlay = document.getElementById("catalog-overlay");
    const catalogOverlayProducts = document.getElementById("catalog-overlay-products");

    function openCatalogOverlay() {
      if (!catalogOverlay || !catalogOverlayProducts) return;
      if (!loadedProducts.length) {
        applyProductCategory("all");
        return;
      }
      const html = loadedProducts.map((p, i) => createProductHtml(p, i)).filter(Boolean).join("");
      catalogOverlayProducts.innerHTML = html || "<p style='padding:32px;text-align:center'>Sin productos disponibles.</p>";
      attachBuyButtons(catalogOverlayProducts);
      attachPhotoZoom(catalogOverlayProducts);
      attachProductDetailButtons(catalogOverlayProducts);
      catalogOverlay.removeAttribute("hidden");
      catalogOverlay.scrollTop = 0;
      document.body.style.overflow = "hidden";
    }

    function closeCatalogOverlay() {
      if (!catalogOverlay) return;
      catalogOverlay.setAttribute("hidden", "");
      document.body.style.overflow = "";
    }

    document.getElementById("catalog-overlay-close")?.addEventListener("click", closeCatalogOverlay);
    document.getElementById("hero-catalog-btn")?.addEventListener("click", openCatalogOverlay);

    /* ── Swipe para cerrar modales ──────────────────────────────────
       En móvil: deslizar hacia la derecha cierra el catalog overlay.
       En el modal de categorías: deslizar hacia abajo lo cierra.
    ────────────────────────────────────────────────────────────── */
    (function setupSwipeClose() {
      function onSwipeRight(el, cb) {
        if (!el) return;
        let x0 = 0, y0 = 0, scrollTop0 = 0;
        el.addEventListener("touchstart", (e) => {
          x0 = e.touches[0].clientX;
          y0 = e.touches[0].clientY;
          scrollTop0 = el.scrollTop || 0;
        }, { passive: true });
        el.addEventListener("touchend", (e) => {
          const dx = e.changedTouches[0].clientX - x0;
          const dy = Math.abs(e.changedTouches[0].clientY - y0);
          const scrolled = Math.abs((el.scrollTop || 0) - scrollTop0);
          // Ignorar si es scroll vertical o si el usuario no deslizó lo suficiente
          if (scrolled > 10) return;
          if (dx > 72 && dy < Math.abs(dx) * 0.55) cb();
        }, { passive: true });
      }

      function onSwipeDown(el, cb) {
        if (!el) return;
        let x0 = 0, y0 = 0;
        el.addEventListener("touchstart", (e) => {
          x0 = e.touches[0].clientX;
          y0 = e.touches[0].clientY;
        }, { passive: true });
        el.addEventListener("touchend", (e) => {
          const dy = e.changedTouches[0].clientY - y0;
          const dx = Math.abs(e.changedTouches[0].clientX - x0);
          if (dy > 72 && dx < Math.abs(dy) * 0.55) cb();
        }, { passive: true });
      }

      // Catalog overlay: swipe derecha = volver
      onSwipeRight(catalogOverlay, closeCatalogOverlay);

      // Modal de categorías: swipe hacia abajo = cerrar
      onSwipeDown(moreProductsModal, () => {
        if (moreProductsModal && !moreProductsModal.getAttribute("aria-hidden").includes("true")) {
          closeModal(moreProductsModal);
        }
      });
    })();
    document.getElementById("open-catalog-overlay-btn")?.addEventListener("click", () => {
      closeModal(moreProductsModal);
      openCatalogOverlay();
    });

    // "Comprar" en hamburguesa → sección de productos
    document.getElementById("hamburger-comprar-btn")?.addEventListener("click", () => {
      closeHamburger();
      scrollToSection("drop");
    });

    // Login desde hamburguesa (visible solo en móvil)
    document.getElementById("hamburger-login-btn")?.addEventListener("click", () => {
      closeHamburger();
      const sess = getAuthSession();
      if (sess) { authLogout(); } else { openAuthModal("login"); }
    });

    /* ============================================================
       SECCIÓN FILTROS: Encuentra tu producto
    ============================================================ */
    let filterSelCategory = "";
    let filterSelSize = "";

    const FILTER_CAT_LABELS = {
      poleron: "Polerón", polera: "Polera", camisa: "Camisa",
      chaleco: "Chaleco", polar: "Polar",
      chaqueta: "Chaqueta", parka: "Parka", pantalon: "Pantalón",
      jeans: "Jeans", buzo: "Buzo", short: "Short",
      traje: "Traje de baño", zapatilla: "Zapatillas",
      zapato: "Zapatos", jockey: "Jockey", gorro: "Gorros",
      accesorio: "Accesorios", vestido: "Vestido", chomba: "Chomba"
    };

    function sortSizes(a, b) {
      const clothingOrder = ["XXS","XS","S","M","L","XL","XXL","XXXL"];
      const ai = clothingOrder.indexOf(a.toUpperCase());
      const bi = clothingOrder.indexOf(b.toUpperCase());
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      const an = parseFloat(a), bn = parseFloat(b);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      return a.localeCompare(b);
    }

    function getFilteredProducts() {
      const manualSize = (document.getElementById("filter-size-input")?.value || "").trim().toUpperCase();
      return loadedProducts.filter(p => {
        const catOk = !filterSelCategory || productCategory(p) === filterSelCategory;
        const prodSize = formatSize(getValue(p, ["Talla"])).toUpperCase();
        const sizeActive = filterSelSize || manualSize;
        const sizeOk = !sizeActive
          ? true
          : (filterSelSize && prodSize === filterSelSize.toUpperCase())
            || (manualSize && prodSize.includes(manualSize));
        return catOk && sizeOk;
      });
    }

    function renderFilterChips() {
      if (!loadedProducts.length) return;

      // Conteos por categoría
      const catCounts = {};
      loadedProducts.forEach(p => {
        const cat = productCategory(p);
        if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
      });

      // Conteos por talla (según categoría seleccionada)
      const sizeSource = filterSelCategory
        ? loadedProducts.filter(p => productCategory(p) === filterSelCategory)
        : loadedProducts;
      const sizeCounts = {};
      sizeSource.forEach(p => {
        const sz = formatSize(getValue(p, ["Talla"]));
        if (sz) sizeCounts[sz] = (sizeCounts[sz] || 0) + 1;
      });

      // Renderizar categorías
      const catEl = document.getElementById("filter-categories");
      if (catEl) {
        const catEntries = Object.entries(catCounts).filter(([,c]) => c > 0);
        if (catEntries.length) {
          catEl.innerHTML = catEntries.map(([cat, count]) => `
            <button class="filter-chip${filterSelCategory === cat ? " is-active" : ""}"
                    type="button" data-filter-cat="${escapeHtml(cat)}">
              ${escapeHtml(FILTER_CAT_LABELS[cat] || cat)}
              <span class="filter-chip-count">${count}</span>
            </button>`).join("");
          catEl.querySelectorAll("[data-filter-cat]").forEach(btn => {
            btn.addEventListener("click", () => {
              filterSelCategory = filterSelCategory === btn.dataset.filterCat ? "" : btn.dataset.filterCat;
              filterSelSize = "";
              renderFilterChips();
            });
          });
        } else {
          catEl.innerHTML = '<p class="filter-empty-note">Sin categorías disponibles.</p>';
        }
      }

      // Renderizar tallas
      const sizeEl = document.getElementById("filter-sizes");
      if (sizeEl) {
        const sizeEntries = Object.entries(sizeCounts).sort(([a],[b]) => sortSizes(a,b));
        if (sizeEntries.length) {
          sizeEl.innerHTML = sizeEntries.map(([sz, count]) => `
            <button class="filter-chip${filterSelSize === sz ? " is-active" : ""}"
                    type="button" data-filter-size="${escapeHtml(sz)}">
              ${escapeHtml(sz)}
              <span class="filter-chip-count">${count}</span>
            </button>`).join("");
          sizeEl.querySelectorAll("[data-filter-size]").forEach(btn => {
            btn.addEventListener("click", () => {
              filterSelSize = filterSelSize === btn.dataset.filterSize ? "" : btn.dataset.filterSize;
              const inp = document.getElementById("filter-size-input");
              if (inp) inp.value = "";
              renderFilterChips();
            });
          });
        } else {
          sizeEl.innerHTML = '<p class="filter-empty-note">Selecciona una categoría primero.</p>';
        }
      }

      // Actualizar contadores
      const countEl = document.getElementById("filter-count");
      if (countEl) countEl.textContent = getFilteredProducts().length;

      const activeCount = [filterSelCategory, filterSelSize].filter(Boolean).length
        + ((document.getElementById("filter-size-input")?.value || "").trim() ? 1 : 0);
      const activeEl = document.getElementById("filter-active-count");
      if (activeEl) activeEl.textContent = activeCount === 1 ? "1 seleccionado" : `${activeCount} seleccionados`;
    }

    function applyFilterSearch() {
      const filtered = getFilteredProducts();
      const container = document.getElementById("catalogo");
      if (!container) return;

      // Actualizar título de la sección de productos
      const sectionTitle = document.querySelector("#drop .section-head h2");
      const manualSize = (document.getElementById("filter-size-input")?.value || "").trim();
      const labels = [
        filterSelCategory ? (FILTER_CAT_LABELS[filterSelCategory] || filterSelCategory) : null,
        filterSelSize || manualSize || null
      ].filter(Boolean);

      if (sectionTitle) {
        sectionTitle.textContent = labels.length
          ? `Resultados para: ${labels.join(" · ")}`
          : "Productos disponibles";
      }

      if (!filtered.length) {
        container.innerHTML = `
          <div class="filter-no-results-card">
            <button class="filter-no-results-close" type="button"
                    onclick="clearFiltersAndRestore();this.closest('.filter-no-results-card').remove()">×</button>
            <p class="filter-no-results-text">No encontramos productos con esos filtros.<br>Intenta con otra categoría o talla.</p>
            <button class="button secondary" type="button"
                    onclick="clearFiltersAndRestore()">Ver todos los productos</button>
          </div>`;
        scrollToSection("drop");
        return;
      }

      filterViewActive = true; // Bloquea el polling para no sobreescribir
      isHomepageMode = false;
      activeProductCategory = "all";
      lastProductsHash = "";

      const html = filtered.map(createProductHtml).filter(Boolean).join("");
      container.innerHTML = html;
      attachBuyButtons(container);
      attachPhotoZoom(container);
      attachProductDetailButtons(container);
      attachMoreProductCards(container);
      scrollToSection("drop");
    }

    function clearFiltersAndRestore() {
      filterViewActive = false; // Habilitar polling nuevamente
      filterSelCategory = "";
      filterSelSize = "";
      const inp = document.getElementById("filter-size-input");
      if (inp) inp.value = "";
      // Restaurar título sección productos
      const sectionTitle = document.querySelector("#drop .section-head h2");
      if (sectionTitle) sectionTitle.textContent = "Productos disponibles";
      // Restaurar contadores
      const activeEl = document.getElementById("filter-active-count");
      if (activeEl) activeEl.textContent = "0 seleccionados";
      const countEl = document.getElementById("filter-count");
      if (countEl) countEl.textContent = loadedProducts.length || 0;
      renderFilterChips();
      isHomepageMode = true;
      activeProductCategory = "all";
      lastProductsHash = "";
      renderAvailableProducts();
    }

    document.getElementById("filter-apply-btn")?.addEventListener("click", applyFilterSearch);
    document.getElementById("filter-clear-btn")?.addEventListener("click", clearFiltersAndRestore);

    /* Input de talla: debounce 300ms para no re-renderizar en cada tecla */
    (function () {
      let _sizeTimer;
      document.getElementById("filter-size-input")?.addEventListener("input", () => {
        filterSelSize = "";
        clearTimeout(_sizeTimer);
        _sizeTimer = setTimeout(renderFilterChips, 300);
      }, { passive: true });
      document.getElementById("filter-size-input")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { clearTimeout(_sizeTimer); applyFilterSearch(); }
      });
    })();

    /* ============================================================
       MOBILE UTILITIES — funciones extra para UX y rendimiento
    ============================================================ */

    /* ── Compresión client-side de imágenes ──────────────────────
       Comprime un File de imagen antes de enviarlo:
         · Redimensiona a máx `maxPx` px por lado (sin agrandar)
         · Convierte a WebP si el browser lo soporta, sino JPEG
         · Calidad configurable (0.0 – 1.0; defecto 0.7)
       Uso:
         const result = await compressImageFile(file, 900, 0.7);
         formData.append("foto", result.blob, "foto.webp");
    ── */
    async function compressImageFile(file, maxPx = 900, quality = 0.7) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
        reader.onload = (e) => {
          const img = new Image();
          img.onerror = () => reject(new Error("Imagen inválida"));
          img.onload = () => {
            const scale = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
            const w = Math.round(img.naturalWidth * scale);
            const h = Math.round(img.naturalHeight * scale);

            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, w, h);

            const supportsWebP = canvas.toDataURL("image/webp").startsWith("data:image/webp");
            const format = supportsWebP ? "image/webp" : "image/jpeg";

            canvas.toBlob(
              (blob) => {
                if (!blob) { reject(new Error("Compresión fallida")); return; }
                resolve({
                  blob,
                  format,
                  width: w,
                  height: h,
                  originalSize: file.size,
                  compressedSize: blob.size,
                  savedPercent: Math.round((1 - blob.size / file.size) * 100)
                });
              },
              format,
              quality
            );
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    /* ── IntersectionObserver: lazy-init de secciones ─────────────
       Las secciones bajo el fold (#filtros, #vender) solo inicializan
       su lógica cuando el usuario está a punto de verlas.
       Mejora el Interaction to Next Paint en carga inicial.
    ── */
    (function initLazySections() {
      if (!("IntersectionObserver" in window)) return;

      let filtersInitialized = false;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            if (entry.target.id === "filtros" && !filtersInitialized) {
              filtersInitialized = true;
              if (typeof renderFilterChips === "function") renderFilterChips();
            }
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: "300px 0px" }
      );

      const lazySections = ["filtros", "vender"];
      lazySections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    })();

    /* ── Body lock: bloquear scroll del fondo cuando modal abierto ─
       Usa la clase CSS modal-open (definida en el bloque de estilos)
    ── */
    (function initBodyLock() {
      const LOCK = "modal-open";
      const lock = () => document.body.classList.add(LOCK);
      const unlock = () => document.body.classList.remove(LOCK);

      /* Observar cambios de visibilidad en modales y overlays */
      const targets = [
        document.getElementById("catalog-overlay"),
        document.getElementById("cart-modal"),
        document.getElementById("auth-modal"),
        document.getElementById("hamburger-overlay")
      ].filter(Boolean);

      const mo = new MutationObserver(() => {
        const anyOpen = targets.some((el) => {
          if (el.classList.contains("modal")) return el.classList.contains("is-open");
          return !el.hasAttribute("hidden");
        });
        anyOpen ? lock() : unlock();
      });

      targets.forEach((el) => mo.observe(el, { attributes: true, attributeFilter: ["hidden", "class"] }));
    })();

    /* ── Touch: mejorar feedback táctil en botones de producto ─────*/
    document.addEventListener("touchstart", (e) => {
      const btn = e.target.closest(".button, .filter-chip, .hamburger-nav-item");
      if (btn) btn.style.opacity = "0.75";
    }, { passive: true });

    document.addEventListener("touchend", (e) => {
      const btn = e.target.closest(".button, .filter-chip, .hamburger-nav-item");
      if (btn) setTimeout(() => { btn.style.opacity = ""; }, 150);
    }, { passive: true });