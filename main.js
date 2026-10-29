/* 24 ETHNO AVENUE — shared front-end logic
   Cart is persisted in localStorage so it survives navigation between pages. */

const CART_KEY = "24ea_cart";
const WISH_KEY = "24ea_wishlist";
/* TODO: replace with the real production domain (used for canonical / og:url on the product page) */
const SITE_URL = "https://24ethnoavenue.ua";

/* Real photos are 1000×1250 (4:5); a few are 938×1250. Explicit width/height
   let the browser reserve the space before the image loads (no layout shift). */
function imgDims(src) {
  return /p(?:8|9|12)-\d/.test(src) ? 'width="938" height="1250"' : 'width="1000" height="1250"';
}

/* Update a <meta>/<link> tag in <head> (used by the product page for per-product SEO). */
function setHead(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/* ---------- Cart storage ---------- */
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch (e) { return []; }
}
function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* private mode / storage disabled */ }
  updateCartBadge();
}
function addToCart(productId, size, color, qty = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.productId === productId && i.size === size && i.color === color);
  if (existing) existing.qty += qty;
  else cart.push({ productId, size, color, qty });
  saveCart(cart);
}
function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}
function updateCartLine(index, patch) {
  const cart = getCart();
  Object.assign(cart[index], patch);
  saveCart(cart);
}
function cartLinesWithData() {
  return getCart().map((line, index) => {
    const product = PRODUCTS.find(p => p.id === line.productId);
    return { ...line, index, product };
  }).filter(l => l.product);
}
function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}
function cartSubtotal() {
  return cartLinesWithData().reduce((sum, l) => sum + l.product.price * l.qty, 0);
}
function updateCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    const n = cartCount();
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
  });
}

/* ---------- Wishlist (stars) ---------- */
function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WISH_KEY)) || []; }
  catch (e) { return []; }
}
function isWished(id) { return getWishlist().includes(Number(id)); }
function toggleWishlist(id) {
  id = Number(id);
  const list = getWishlist();
  const i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1); else list.push(id);
  try { localStorage.setItem(WISH_KEY, JSON.stringify(list)); } catch (e) {}
  updateWishlistBadge();
  return i < 0; // true = just added
}
function updateWishlistBadge() {
  const n = getWishlist().length;
  document.querySelectorAll("[data-wishlist-count]").forEach(el => {
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
  });
  const wished = getWishlist();
  document.querySelectorAll("[data-wish-id]").forEach(b => b.classList.toggle("active", wished.includes(Number(b.dataset.wishId))));
}
/* Star buttons: product cards, product page and the home hero */
function onStarClick(btn, id, event) {
  if (event) { event.preventDefault(); event.stopPropagation(); }
  const added = toggleWishlist(id);
  document.querySelectorAll(`[data-wish-id="${id}"]`).forEach(b => b.classList.toggle("active", added));
  showToast(added ? "Added to wishlist" : "Removed from wishlist");
}

/* ---------- Toast ---------- */
function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 2400);
}

/* ---------- Icons ---------- */
const ICON_BAG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`;
const ICON_STAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 3.5Z" stroke-linejoin="round"/></svg>`;
const ICON_INSTA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1"/></svg>`;

/* Full brand size run — products list only the sizes they actually have in
   stock; any size in this master list that's missing from p.sizes renders
   as a struck-through, disabled swatch instead of being hidden entirely. */
const SIZE_ORDER = ["XS", "S", "M", "L"];

/* ---------- Product card renderer ---------- */
function productCard(p, eager = false) {
  const badges = [];
  if (p.isNew) badges.push(`<span class="badge badge-new">New Arrival</span>`);
  if (p.isSale) badges.push(`<span class="badge badge-sale">Sale</span>`);
  const priceHtml = p.isSale
    ? `<span class="old">${formatUAH(p.oldPrice)}</span>${formatUAH(p.price)}`
    : formatUAH(p.price);
  const nameEsc = p.name.replace(/'/g, "\\'");
  return `
    <a class="product-card" href="product.html?id=${p.id}">
      <div class="product-thumb">
        <div class="thumb-clip">
          <img src="${p.images[0]}" ${imgDims(p.images[0])} alt="${p.name}" ${eager ? "" : 'loading="lazy" decoding="async"'}>
          <img class="img-alt" src="${p.images[1] || p.images[0]}" ${imgDims(p.images[1] || p.images[0])} alt="" loading="lazy" decoding="async">
        </div>
        <div class="product-badges">${badges.join("")}</div>
        <button class="card-star ${isWished(p.id) ? "active" : ""}" type="button" title="Add to wishlist" data-wish-id="${p.id}" onclick="onStarClick(this, ${p.id}, event)">${ICON_STAR}</button>
        <div class="thumb-inset"><img src="${p.images[2] || p.images[0]}" ${imgDims(p.images[2] || p.images[0])} alt="" loading="lazy" decoding="async"></div>
        <button class="card-add-btn card-add-floating" type="button" aria-label="Add “${p.name}” to cart" onclick="event.preventDefault();event.stopPropagation();addToCart(${p.id}, '${p.sizes[0]}', '${p.colors[0]}', 1); showToast('“${nameEsc}” added to cart');">Add</button>
      </div>
      <div class="product-info">
        <div class="p-name">${p.name}</div>
        <div class="p-sub">Ukrainian Mood</div>
        <div class="p-meta">
          <span class="p-price">${priceHtml}</span>
          <span class="p-colors">${p.colors.length} ${p.colors.length === 1 ? "color" : "colors"}</span>
        </div>
      </div>
    </a>`;
}

/* eagerCount = how many cards sit above the fold and should not be lazy-loaded */
function renderGrid(containerId, products, eagerCount = 0) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = products.map((p, i) => productCard(p, i < eagerCount)).join("") || `<div class="empty-state">${new URLSearchParams(location.search).get("wishlist") ? "Your wishlist is empty — tap the ☆ on any product to save it here." : "No products found"}</div>`;
}

function renderCategoryGrid(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c => `
    <a class="cat-card" href="catalog.html?cat=${c.id}">
      <img src="${c.image}" ${imgDims(c.image)} alt="${c.title}" loading="lazy" decoding="async">
      <span class="cat-label">${c.title}</span>
    </a>`).join("");
}

function renderInstaGrid(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = INSTAGRAM_FEED.map(item => `
    <a class="insta-tile" href="${item.url}" target="_blank" rel="noopener noreferrer" aria-label="Open the 24 Ethno Avenue Instagram">
      <img src="${item.image}" ${imgDims(item.image)} alt="24 Ethno Avenue look on Instagram" loading="lazy" decoding="async">
      <span class="insta-icon">${ICON_INSTA}</span>
    </a>`).join("");
}

/* ---------- Catalog page ---------- */
function initCatalogPage() {
  const grid = document.getElementById("catalogGrid");
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  const state = {
    cats: params.get("cat") ? [params.get("cat")] : [],
    sizes: [],
    colors: [],
    minPrice: null,
    maxPrice: null,
    sort: "popular",
    wishOnly: !!params.get("wishlist"),
  };

  const allSizes = [...new Set(PRODUCTS.flatMap(p => p.sizes))];
  const allColors = [...new Set(PRODUCTS.flatMap(p => p.colors))];
  const activeCat = state.cats[0] || "";
  const activeCatObj = CATEGORIES.find(c => c.id === activeCat);

  const treeEl = document.getElementById("categoryTree");
  if (treeEl) {
    treeEl.innerHTML = `
      <a href="catalog.html" class="${!activeCat ? "active" : "muted"}">All Products</a>
      ${CATEGORIES.map(c => `<a href="catalog.html?cat=${c.id}" class="${c.id === activeCat ? "active" : ""}">${c.title} <span style="color:var(--muted);font-weight:400;">(${PRODUCTS.filter(p => p.category === c.id).length})</span></a>`).join("")}
      <div class="tree-divider"></div>
      <a href="catalog.html?sale=1" class="muted ${params.get("sale") ? "active" : ""}">Sale</a>
    `;
  }
  document.getElementById("catalogTitle").textContent = activeCatObj ? activeCatObj.title : "Catalog";
  document.getElementById("breadcrumbCat").textContent = activeCatObj ? activeCatObj.title : "Catalog";
  document.getElementById("watermarkText").textContent = activeCatObj ? activeCatObj.title : "Ukrainian Mood";
  document.title = `${activeCatObj ? activeCatObj.title : "Catalog"} — 24 Ethno Avenue`;
  if (params.get("sale")) state.saleOnly = true;
  if (state.wishOnly) {
    document.getElementById("catalogTitle").textContent = "Wishlist";
    document.getElementById("breadcrumbCat").textContent = "Wishlist";
    document.title = "Wishlist — 24 Ethno Avenue";
  }

  document.getElementById("sizeFilterOptions").innerHTML = allSizes.map(s => `
    <label class="filter-option">
      <input type="checkbox" value="${s}" data-filter="size"> ${s}
    </label>`).join("");

  document.getElementById("colorFilterOptions").innerHTML = allColors.map(c => `
    <label class="filter-option">
      <input type="checkbox" value="${c}" data-filter="color"> ${c}
    </label>`).join("");

  function readState() {
    state.sizes = [...document.querySelectorAll('[data-filter="size"]:checked')].map(i => i.value);
    state.colors = [...document.querySelectorAll('[data-filter="color"]:checked')].map(i => i.value);
    state.minPrice = document.getElementById("minPrice").value || null;
    state.maxPrice = document.getElementById("maxPrice").value || null;
    state.sort = document.getElementById("sortSelect").value;
  }

  function apply() {
    readState();
    let list = PRODUCTS.filter(p => {
      if (state.cats.length && !state.cats.includes(p.category)) return false;
      if (state.saleOnly && !p.isSale) return false;
      if (state.wishOnly && !isWished(p.id)) return false;
      if (state.sizes.length && !p.sizes.some(s => state.sizes.includes(s))) return false;
      if (state.colors.length && !p.colors.some(c => state.colors.includes(c))) return false;
      if (state.minPrice && p.price < Number(state.minPrice)) return false;
      if (state.maxPrice && p.price > Number(state.maxPrice)) return false;
      return true;
    });
    if (state.sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (state.sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (state.sort === "new") list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));

    renderGrid("catalogGrid", list, 3);
    document.getElementById("resultCount").textContent = `${list.length} item${list.length === 1 ? "" : "s"}`;
    renderChips(state);
  }

  function renderChips(state) {
    const chips = [];
    state.sizes.forEach(s => chips.push({ label: `Size ${s}`, type: "size", value: s }));
    state.colors.forEach(c => chips.push({ label: c, type: "color", value: c }));
    const el = document.getElementById("activeChips");
    el.innerHTML = chips.map(c => `
      <span class="chip" data-type="${c.type}" data-value="${c.value}">${c.label} <button type="button" aria-label="Remove">✕</button></span>
    `).join("");
    el.querySelectorAll(".chip button").forEach(btn => {
      btn.addEventListener("click", () => {
        const chip = btn.closest(".chip");
        const input = document.querySelector(`[data-filter="${chip.dataset.type}"][value="${CSS.escape(chip.dataset.value)}"]`);
        if (input) input.checked = false;
        apply();
      });
    });
  }

  document.querySelectorAll('[data-filter]').forEach(i => i.addEventListener("change", apply));
  document.getElementById("minPrice").addEventListener("input", debounce(apply, 300));
  document.getElementById("maxPrice").addEventListener("input", debounce(apply, 300));
  document.getElementById("sortSelect").addEventListener("change", apply);
  document.getElementById("clearFilters").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll('[data-filter]').forEach(i => i.checked = false);
    document.getElementById("minPrice").value = "";
    document.getElementById("maxPrice").value = "";
    apply();
  });

  document.querySelectorAll(".filter-title").forEach(t => {
    t.addEventListener("click", () => t.closest(".filter-block").classList.toggle("collapsed"));
  });

  apply();
}

function debounce(fn, wait) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

/* ---------- Product detail page ---------- */
function initProductPage() {
  const root = document.getElementById("productRoot");
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id")) || PRODUCTS[0].id;
  const p = PRODUCTS.find(pr => pr.id === id) || PRODUCTS[0];

  document.title = `${p.name} — 24 Ethno Avenue`;
  /* Per-product SEO: description, canonical and social tags (static page ships generic defaults) */
  const productUrl = `${SITE_URL}/product.html?id=${p.id}`;
  const fullDesc = `${p.name} — ${p.description}`;
  const productDesc = fullDesc.length > 160 ? fullDesc.slice(0, 157).replace(/\s+\S*$/, "") + "…" : fullDesc;
  setHead('meta[name="description"]', "content", productDesc);
  setHead('link[rel="canonical"]', "href", productUrl);
  setHead('meta[property="og:title"]', "content", document.title);
  setHead('meta[property="og:description"]', "content", productDesc);
  setHead('meta[property="og:url"]', "content", productUrl);
  setHead('meta[name="twitter:title"]', "content", document.title);
  setHead('meta[name="twitter:description"]', "content", productDesc);

  let activeImage = 0;
  let activeSize = p.sizes[0];
  let activeColor = p.colors[0];

  // Parse real composition percentages ("80% wool, 15% polyester...") for the editorial stat callouts
  const compMatches = [...p.composition.matchAll(/(\d{1,3})%\s*([A-Za-z]+)/g)].slice(0, 2);
  const compositionStats = compMatches.length
    ? compMatches.map(m => ({ num: m[1], label: m[2].toLowerCase() }))
    : [{ num: 100, label: "natural materials" }];

  // Split "80% wool, 20% polyester. Embroidery — wool and cotton thread."
  // into standalone bullet lines for the .pd-desc-list, matching the
  // "Fabric: ... / Lining: ... / handmade embroidery" pattern from the reference.
  function buildDescBullets() {
    const bullets = [];
    const compParts = p.composition.split(/\.\s*/).map(s => s.trim()).filter(Boolean);
    compParts.forEach((part, i) => {
      bullets.push(i === 0 ? `Fabric: ${part}` : part);
    });
    if (p.care) bullets.push(`Care: ${p.care.replace(/\.$/, "")}`);
    bullets.push("A combination of hand and machine embroidery");
    bullets.push("Made in Ukraine");
    return bullets;
  }

  function render() {
    root.innerHTML = `
      <div class="pd-rail">
        ${p.images.map((img, i) => `<img src="${img}" ${imgDims(img)} data-i="${i}" alt="${p.name} — photo ${i + 1}" class="${i === activeImage ? "active" : ""}">`).join("")}
        <div class="pd-rail-arrows">
          <button type="button" data-dir="-1" aria-label="Previous photo">←</button>
          <button type="button" data-dir="1" aria-label="Next photo">→</button>
        </div>
      </div>
      <div class="pd-gallery-col">
        <div class="pd-gallery-main">
          <img id="pdMainImg" src="${p.images[activeImage]}" ${imgDims(p.images[activeImage])} alt="${p.name}" fetchpriority="high">
          <div class="pd-stats">
            ${compositionStats.map(s => `<div class="stat"><span class="stat-num">${s.num}<sup>%</sup></span><span class="stat-label">${s.label}</span></div>`).join("")}
          </div>
        </div>
        <nav class="pd-nav">
          <button type="button" data-dir="-1" ${p.images.length < 2 ? "disabled" : ""}>◂ Prev</button>
          <button type="button" data-dir="1" ${p.images.length < 2 ? "disabled" : ""}>Next ▸</button>
        </nav>
      </div>
      <div class="pd-info">
        <span class="eyebrow">${CATEGORIES.find(c => c.id === p.category)?.title || ""}</span>
        <h1>${p.name}</h1>
        <div class="pd-price">${p.isSale ? `<span class="old">${formatUAH(p.oldPrice)}</span>` : ""}${formatUAH(p.price)}</div>
        <p class="pd-desc">${p.description}</p>
        <ul class="pd-desc-list">
          ${buildDescBullets().map(b => `<li>${b}</li>`).join("")}
        </ul>

        <div class="option-group">
          <div class="option-label"><span>Color</span><span class="sel">${activeColor}</span></div>
          <div class="color-dots" id="colorSwatches">
            ${p.colors.map(c => `<button type="button" class="color-dot ${c === activeColor ? "active" : ""}" data-color="${c}" title="${c}" aria-label="Color: ${c}"><span class="fill" style="background:${COLOR_HEX[c] || "#ccc"}"></span></button>`).join("")}
          </div>
        </div>

        <div class="option-group">
          <div class="option-label"><span>Size</span><span class="sel">${activeSize}</span></div>
          <div class="swatches" id="sizeSwatches">
            ${SIZE_ORDER.map(s => {
              const available = p.sizes.includes(s);
              if (!available) return `<button type="button" class="swatch disabled" data-size="${s}" disabled title="Out of stock">${s}</button>`;
              return `<button type="button" class="swatch ${s === activeSize ? "active" : ""}" data-size="${s}">${s}</button>`;
            }).join("")}
          </div>
        </div>

        <div class="pd-actions">
          <button class="btn btn-accent" id="buyNowBtn">Buy now</button>
          <button class="btn btn-outline" id="addToCartBtn">Add to cart</button>
          <button class="icon-btn pd-star ${isWished(p.id) ? "active" : ""}" style="border:1px solid var(--line);width:48px;height:48px;flex:0 0 auto;" title="Add to wishlist" aria-label="Add to wishlist" data-wish-id="${p.id}" onclick="onStarClick(this, ${p.id}, event)">${ICON_STAR}</button>
        </div>
        <p class="pd-note">Free delivery across Ukraine on orders over ₴4,000. Exchanges and returns within 14 days.</p>

        <div class="accordion">
          <div class="accordion-item open">
            <div class="accordion-head">Composition &amp; Care <span class="chev">+</span></div>
            <div class="accordion-body"><p>${p.composition}<br>${p.care}</p></div>
          </div>
          <div class="accordion-item">
            <div class="accordion-head">Size Guide <span class="chev">+</span></div>
            <div class="accordion-body"><p>Sizes follow the European size chart. If you're between sizes, we recommend sizing up. A detailed measurement chart will be sent by our manager after checkout.</p></div>
          </div>
          <div class="accordion-item">
            <div class="accordion-head">Shipping &amp; Returns <span class="chev">+</span></div>
            <div class="accordion-body"><p>We ship via Nova Poshta within 1–3 business days. Showroom pickup is available the same day. Returns and exchanges within 14 days, provided tags remain attached.</p></div>
          </div>
        </div>
        <p class="pd-source">Original collection photography: <a href="https://instagram.com/24ethnoavenue" target="_blank" rel="noopener noreferrer">@24ethnoavenue</a></p>
      </div>`;

    root.querySelectorAll(".pd-rail img").forEach(img => img.addEventListener("click", () => { activeImage = Number(img.dataset.i); render(); }));
    root.querySelectorAll(".pd-rail-arrows button, .pd-nav button").forEach(btn => btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const dir = Number(btn.dataset.dir);
      activeImage = (activeImage + dir + p.images.length) % p.images.length;
      render();
    }));
    root.querySelectorAll("#colorSwatches .color-dot").forEach(b => b.addEventListener("click", () => { activeColor = b.dataset.color; render(); }));
    root.querySelectorAll("#sizeSwatches .swatch:not(.disabled)").forEach(b => b.addEventListener("click", () => { activeSize = b.dataset.size; render(); }));
    root.querySelectorAll(".accordion-head").forEach(h => h.addEventListener("click", () => h.closest(".accordion-item").classList.toggle("open")));
    document.getElementById("addToCartBtn").addEventListener("click", () => {
      addToCart(p.id, activeSize, activeColor, 1);
      showToast(`“${p.name}” added to cart`);
    });
    document.getElementById("buyNowBtn").addEventListener("click", () => {
      addToCart(p.id, activeSize, activeColor, 1);
      location.href = "checkout.html";
    });
  }
  render();

  const related = PRODUCTS.filter(pr => pr.category === p.category && pr.id !== p.id).slice(0, 4);
  renderGrid("relatedGrid", related.length ? related : PRODUCTS.filter(pr => pr.id !== p.id).slice(0, 4));

  document.querySelectorAll("[data-breadcrumb-cat]").forEach(el => {
    el.textContent = CATEGORIES.find(c => c.id === p.category)?.title || "";
    el.href = `catalog.html?cat=${p.category}`;
  });
  document.querySelectorAll("[data-breadcrumb-name]").forEach(el => el.textContent = p.name);
}

/* ---------- Cart page ---------- */
function initCartPage() {
  const root = document.getElementById("cartRoot");
  if (!root) return;

  function render() {
    const lines = cartLinesWithData();
    if (!lines.length) {
      root.innerHTML = `
        <div class="cart-empty">
          <h2 class="display" style="font-size:26px;">Your Cart is Empty</h2>
          <p>Looks like you haven't added anything yet. Browse the catalog — you might find something you love.</p>
          <a href="catalog.html" class="btn btn-primary">Browse Catalog</a>
        </div>`;
      document.getElementById("summarySide").style.display = "none";
      return;
    }
    document.getElementById("summarySide").style.display = "";
    root.innerHTML = lines.map(l => `
      <div class="cart-item" data-index="${l.index}">
        <img src="${l.product.images[0]}" ${imgDims(l.product.images[0])} alt="${l.product.name}">
        <div>
          <div class="ci-name"><a href="product.html?id=${l.product.id}">${l.product.name}</a></div>
          <div class="ci-meta">
            <span>Color:
              <select data-role="color" aria-label="Color">
                ${l.product.colors.map(c => `<option ${c === l.color ? "selected" : ""}>${c}</option>`).join("")}
              </select>
            </span>
            <span>Size:
              <select data-role="size" aria-label="Size">
                ${l.product.sizes.map(s => `<option ${s === l.size ? "selected" : ""}>${s}</option>`).join("")}
              </select>
            </span>
          </div>
          <div class="qty-control">
            <button type="button" data-role="dec" aria-label="Decrease quantity">−</button>
            <span>${l.qty}</span>
            <button type="button" data-role="inc" aria-label="Increase quantity">+</button>
          </div>
          <div><a class="ci-remove" data-role="remove">Remove</a></div>
        </div>
        <div class="ci-price">${formatUAH(l.product.price * l.qty)}</div>
      </div>
    `).join("");

    root.querySelectorAll(".cart-item").forEach(item => {
      const index = Number(item.dataset.index);
      item.querySelector('[data-role="inc"]').addEventListener("click", () => {
        const cart = getCart(); cart[index].qty += 1; saveCart(cart); render(); renderSummary();
      });
      item.querySelector('[data-role="dec"]').addEventListener("click", () => {
        const cart = getCart();
        cart[index].qty = Math.max(1, cart[index].qty - 1);
        saveCart(cart); render(); renderSummary();
      });
      item.querySelector('[data-role="remove"]').addEventListener("click", () => {
        removeFromCart(index); render(); renderSummary();
      });
      item.querySelector('[data-role="color"]').addEventListener("change", (e) => {
        updateCartLine(index, { color: e.target.value }); render(); renderSummary();
      });
      item.querySelector('[data-role="size"]').addEventListener("change", (e) => {
        updateCartLine(index, { size: e.target.value }); render(); renderSummary();
      });
    });
  }

  function renderSummary() {
    const subtotal = cartSubtotal();
    const shipping = subtotal > 0 && subtotal < 4000 ? 150 : 0;
    const total = subtotal + shipping;
    document.getElementById("sumSubtotal").textContent = formatUAH(subtotal);
    document.getElementById("sumShipping").textContent = shipping ? formatUAH(shipping) : "Free";
    document.getElementById("sumTotal").textContent = formatUAH(total);
  }

  document.getElementById("promoBtn")?.addEventListener("click", () => showToast("The promo code won't be applied — this is a demo cart"));

  render();
  renderSummary();
}

/* ---------- Checkout page ---------- */
function initCheckoutPage() {
  const root = document.getElementById("checkoutSummary");
  if (!root) return;
  const lines = cartLinesWithData();
  if (!lines.length) {
    document.getElementById("checkoutForm").innerHTML = `
      <div class="cart-empty"><h2 class="display" style="font-size:24px;">Cart is Empty</h2>
      <p>Add items before checking out.</p>
      <a href="catalog.html" class="btn btn-primary">Browse Catalog</a></div>`;
  }
  root.innerHTML = lines.map(l => `
    <div class="mini-line">
      <img src="${l.product.images[0]}" ${imgDims(l.product.images[0])} alt="">
      <div>
        <div class="mi-name">${l.product.name}</div>
        <div class="mi-meta">${l.color}, ${l.size} · ×${l.qty}</div>
      </div>
      <div class="mi-price">${formatUAH(l.product.price * l.qty)}</div>
    </div>`).join("");
  const subtotal = cartSubtotal();
  const shipping = subtotal > 0 && subtotal < 4000 ? 150 : 0;
  document.getElementById("coSubtotal").textContent = formatUAH(subtotal);
  document.getElementById("coShipping").textContent = shipping ? formatUAH(shipping) : "Free";
  document.getElementById("coTotal").textContent = formatUAH(subtotal + shipping);

  document.querySelectorAll(".radio-card input").forEach(r => {
    r.addEventListener("change", () => {
      document.querySelectorAll(".radio-card").forEach(c => c.classList.remove("selected"));
      r.closest(".radio-card").classList.add("selected");
    });
  });

  const form = document.getElementById("orderForm");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!lines.length) { showToast("Cart is empty"); return; }
    try { localStorage.removeItem(CART_KEY); } catch (e) {}
    document.getElementById("checkoutMain").innerHTML = `
      <div class="cart-empty" style="padding-top:20px;">
        <span class="eyebrow">Thank you!</span>
        <h2 class="display" style="font-size:30px;margin-top:10px;">Order #24-${Math.floor(1000 + Math.random() * 9000)} received</h2>
        <p>We'll be in touch within one business day to confirm delivery and payment details.</p>
        <a href="index.html" class="btn btn-primary">Back to Home</a>
      </div>`;
    updateCartBadge();
  });
}

/* ---------- Global init ---------- */
function initHeaderFooter() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  toggle?.addEventListener("click", () => nav.classList.toggle("open"));

  document.querySelectorAll(".footer-form").forEach(f => {
    f.addEventListener("submit", (e) => { e.preventDefault(); showToast("Thanks for subscribing!"); f.reset(); });
  });
  updateCartBadge();
  updateWishlistBadge();
}

document.addEventListener("DOMContentLoaded", () => {
  initHeaderFooter();
  renderCategoryGrid("homeCategoryGrid");
  renderInstaGrid("homeInstaGrid");
  renderInstaGrid("aboutInstaGrid");
  if (document.getElementById("featuredGrid")) {
    renderGrid("featuredGrid", PRODUCTS.filter(p => p.isNew || p.isSale).slice(0, 4));
  }
  initCatalogPage();
  initProductPage();
  initCartPage();
  initCheckoutPage();
});
