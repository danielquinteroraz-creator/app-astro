(() => {
  "use strict";

  const { lang, t, apply } = window.AstroI18n;
  const english = lang === "en";
  const categories = english ? window.CATEGORY_EN : window.CATEGORIES;
  const colorLabel = color => english ? window.COLOR_EN[color] : color;
  const sizeLabel = size => size === "Única" ? t("oneSize") : size;
  const products = english ? window.PRODUCTS.map(product => {
    const copy = window.PRODUCT_EN[product.id];
    const [front, alternate] = product.images;
    return {
      ...product,
      ...copy,
      images: [
        { ...front, alt: copy.name + " in " + colorLabel(product.colors[0]).toLowerCase() + ", main view" },
        { ...alternate, alt: copy.name + ", alternate view" }
      ]
    };
  }) : window.PRODUCTS;
  const productById = new Map(products.map(product => [product.id, product]));
  const cart = window.AstroCart;
  const localizedLines = () => cart.lines().map(line => ({ ...line, product: productById.get(line.id) }));
  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);
  const euro = new Intl.NumberFormat(english ? "en-IE" : "es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const money = number => euro.format(number);
  const select = selector => document.querySelector(selector);
  const productLink = product => "producto.html?id=" + encodeURIComponent(product.id);
  const categoryLink = category => "catalogo.html?cat=" + encodeURIComponent(category);
  const star = '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M10 0c.8 6.5 3.5 9.2 10 10-6.5.8-9.2 3.5-10 10C9.2 13.5 6.5 10.8 0 10 6.5 9.2 9.2 6.5 10 0Z" fill="currentColor"/></svg>';
  const logo = `<a class="logo" href="index.html" aria-label="${t("brandHome")}">ASTRO${star}</a>`;
  const installButton = placement => `<button class="install-button ${placement} under label" type="button" data-install hidden>${t("installApp")}</button>`;
  const navigation = [
    ["inicio", "index.html", t("home")],
    ["marca", "marca.html", t("brand")],
    ["tienda", "shop.html", t("shop")],
    ["catalogo", "catalogo.html", t("catalog")],
    ["contacto", "contacto.html", t("contact")]
  ];

  function renderShell() {
    const nav = navigation.map(([key, url, text]) =>
      `<a href="${url}" ${page === key ? 'aria-current="page"' : ""}>${text}</a>`).join("");
    const selector = variant => `<div class="language-selector ${variant}" role="group" aria-label="${t("language")}">
      <button type="button" data-lang="es" aria-pressed="${lang === "es"}" aria-label="${t("chooseSpanish")}">ES</button>
      <span aria-hidden="true">/</span>
      <button type="button" data-lang="en" aria-pressed="${lang === "en"}" aria-label="${t("chooseEnglish")}">EN</button>
    </div>`;
    const header = select("#cabecera");
    header.innerHTML = `<div class="header-inner">
      ${logo}
      <button class="menu-button label" type="button" aria-expanded="false" aria-controls="navegacion">${t("menu")}</button>
      <nav class="nav label" id="navegacion" aria-label="${t("mainNav")}">${nav}${selector("language-in-menu")}${installButton("install-in-menu")}</nav>
      <div class="header-actions">${selector("language-by-bag")}<a class="bag-link" href="carrito.html">
        <svg width="22" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" aria-hidden="true"><path d="M4 8h16l1 13H3L4 8Z"/><path d="M8.5 9V6a3.5 3.5 0 0 1 7 0v3"/></svg>
        <span data-cart-count>0</span>
      </a></div>
    </div>`;
    select("#pie").innerHTML = `<div class="wrap">
      <div class="footer-top"><div>${logo}<p>${t("footerTagline")}</p></div>
      <nav class="footer-nav label" aria-label="${t("footerNav")}">${navigation.slice(1).map(([, url, text]) => `<a href="${url}">${text}</a>`).join("")}${installButton("")}</nav>
      <div><p class="label">${t("madridStudio")}</p><p>${t("openDays")}<br><a class="under" href="contacto.html">${t("hoursContact")}</a></p></div></div>
      <div class="footer-bottom label"><span>© 2026 ASTRO</span><span>${t("demoLocation")}</span></div></div>`;

    const button = select(".menu-button");
    const menu = select("#navegacion");
    header.querySelectorAll("[data-lang]").forEach(control => {
      control.addEventListener("click", () => {
        if (control.dataset.lang === lang) return;
        const url = new URL(location.href);
        url.searchParams.set("lang", control.dataset.lang);
        location.replace(cart.withBag(url));
      });
    });
    const toggle = open => {
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? t("close") : t("menu");
      menu.classList.toggle("open", open);
    };
    button.addEventListener("click", () => toggle(!menu.classList.contains("open")));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && menu.classList.contains("open") && !select(".install-dialog[open]")) {
        toggle(false);
        button.focus();
      }
    });
    matchMedia("(min-width: 761px)").addEventListener("change", event => {
      if (event.matches) toggle(false);
    });
  }

  function setupInstall() {
    if (!/^https?:$/.test(location.protocol)) return;

    const standalone = matchMedia("(display-mode: standalone)");
    const safari = /Safari/.test(navigator.userAgent) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent) &&
      (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const buttons = document.querySelectorAll("[data-install]");
    let prompt;
    let installed = false;
    const sync = () => {
      for (const button of buttons) {
        button.hidden = installed || standalone.matches || navigator.standalone === true || !(prompt || safari);
      }
    };

    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      prompt = event;
      sync();
    });
    window.addEventListener("appinstalled", () => {
      installed = true;
      prompt = null;
      sync();
    });
    standalone.addEventListener("change", sync);

    for (const button of buttons) {
      button.addEventListener("click", async () => {
        if (!prompt) {
          select(".install-dialog")?.showModal();
          return;
        }
        const install = prompt;
        prompt = null;
        try {
          await install.prompt();
        } catch {
          // The browser can invalidate a deferred prompt.
        } finally {
          sync();
        }
      });
    }

    if (safari) {
      document.body.insertAdjacentHTML("beforeend", `<dialog class="install-dialog" aria-labelledby="install-title" aria-describedby="install-instructions">
        <h2 id="install-title">${t("installApp")}</h2>
        <p id="install-instructions">${t("installInstructions")}</p>
        <form method="dialog"><button class="button" autofocus>${t("close")}</button></form>
      </dialog>`);
    }
    sync();
  }

  function image(photo, eager = false) {
    return `<img src="${photo.src}" alt="${photo.alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }

  function cards(list) {
    return list.map(product => `<article class="product-card"><a href="${productLink(product)}">
      <div class="frame product-photo">${image(product.images[0])}${product.new ? `<span class="tag label">${t("newArrival")}</span>` : ""}</div>
      <div class="card-meta"><h3>${product.name}</h3><span>${money(product.price)}</span></div>
      <p class="muted card-color">${colorLabel(product.colors[0])}</p>
    </a></article>`).join("");
  }

  function renderCategories() {
    const grid = select("#categorias");
    const coverIds = ["camisa-alba", "pantalon-trazo", "abrigo-horizonte", "vestido-eclipse", "jersey-calma", "bolso-tierra"];
    const items = Object.entries(categories);
    grid.innerHTML = (page === "inicio" ? [items[2], items[0], items[3]] : items).map(([id, name]) => {
      const cover = products.find(product => product.id === coverIds[items.findIndex(([key]) => key === id)]);
      return `<a class="category-card" href="${categoryLink(id)}"><div class="frame">${image(cover.images[0])}</div><span class="category-title">${name}</span></a>`;
    }).join("");
    const featured = select("#destacados");
    if (featured) featured.innerHTML = cards(products.filter(product => product.featured));
  }

  const options = (items, label) => items.map(item => `<option value="${item}">${label(item)}</option>`).join("");

  function renderCatalog() {
    const form = select("#filtros");
    const { categoria, talla, precio, orden } = form.elements;
    categoria.insertAdjacentHTML("beforeend", Object.entries(categories).map(([id, name]) => `<option value="${id}">${name}</option>`).join(""));
    const sizes = ["XS", "S", "M", "L", "XL", "34", "36", "38", "40", "42", "44", "Única"];
    talla.insertAdjacentHTML("beforeend", options(sizes, sizeLabel));
    const initialCategory = params.get("cat");
    if (Object.hasOwn(categories, initialCategory)) categoria.value = initialCategory;
    const initialSort = params.get("orden");
    if (["recientes", "asc", "desc"].includes(initialSort)) orden.value = initialSort;

    function update() {
      const [min, max] = precio.value ? precio.value.split("-").map(Number) : [0, Infinity];
      const list = products.filter(product =>
        (!categoria.value || product.category === categoria.value) &&
        (!talla.value || product.sizes.includes(talla.value)) &&
        product.price >= min && product.price <= max
      );
      list.sort((a, b) => {
        if (orden.value === "asc") return a.price - b.price;
        if (orden.value === "desc") return b.price - a.price;
        return b.added.localeCompare(a.added);
      });
      select("#resultados").textContent = t(list.length === 1 ? "resultOne" : "resultMany", { count: list.length });
      select("#productos").innerHTML = list.length ? cards(list) : `<p class="empty-grid">${t("catalogEmpty")}</p>`;
      cart.refresh();
    }
    form.addEventListener("submit", event => event.preventDefault());
    form.addEventListener("change", update);
    form.addEventListener("reset", () => setTimeout(update, 0));
    update();
  }

  function empty(title, description, label = t("exploreCatalog"), href = "catalogo.html") {
    return `<div class="empty"><p class="empty-star" aria-hidden="true">${star}</p><h2>${title}</h2><p>${description}</p><a class="button" href="${href}">${label}</a></div>`;
  }

  function renderProduct() {
    const root = select("#ficha");
    const product = products.find(item => item.id === params.get("id"));
    if (!product) {
      document.title = t("notFoundTitle");
      root.innerHTML = `<p class="label centered">${t("error404")}</p>` + empty(t("notFound"), t("notFoundDetail")).replace("<h2>", "<h1>").replace("</h2>", "</h1>");
      return;
    }
    document.title = product.name + " | ASTRO";
    const related = products.filter(item => item.category === product.category && item.id !== product.id);
    related.push(...products.filter(item => item.category !== product.category && item.featured).slice(0, 3 - related.length));
    root.innerHTML = `<div class="breadcrumbs"><a href="catalogo.html">${t("catalog")}</a><span aria-hidden="true">/</span><a href="${categoryLink(product.category)}">${categories[product.category]}</a></div>
      <div class="product-layout">
        <section class="gallery" aria-label="${t("gallery")}">
          <div class="frame gallery-main" id="foto-principal">${image(product.images[0], true)}</div>
          <div class="thumbs">${product.images.map((photo, index) => `<button type="button" data-photo="${index}" aria-label="${t("photoLabel", { number: index + 1, alt: photo.alt })}" aria-pressed="${index === 0}">${image({ ...photo, alt: "" })}</button>`).join("")}</div>
        </section>
        <section class="product-copy"><p class="label">${categories[product.category]}</p><h1>${product.name}</h1><p class="product-price">${money(product.price)}</p><p>${product.description}</p>
          <form id="anadir" class="stack">
            <div class="variant-grid">
              <label>${t("size")}<select name="talla" required><option value="">${t("chooseSize")}</option>${options(product.sizes, sizeLabel)}</select></label>
              <label>${t("colour")}<select name="color" required>${options(product.colors, colorLabel)}</select></label>
            </div>
            <div class="purchase"><label>${t("quantity")}<input type="number" name="cantidad" min="1" max="99" value="1" required></label><button class="button">${t("addToBag")}</button></div>
            <p id="estado-bolsa" class="form-status" role="status"></p><a class="under" id="ver-bolsa" href="carrito.html" hidden>${t("viewBag")}</a>
          </form>
          <details open><summary>${t("compositionCare")}</summary><p>${product.composition}. ${product.care}</p></details>
          <details><summary>${t("deliveryReturns")}</summary><p>${t("deliveryReturnsDetail")}</p></details>
        </section>
      </div>
      <section class="related"><div class="section-head"><h2>${t("related")}</h2></div><div class="product-grid related-grid">${cards(related)}</div></section>`;

    root.querySelectorAll("[data-photo]").forEach(button => {
      button.addEventListener("click", () => {
        const photo = product.images[Number(button.dataset.photo)];
        const main = select("#foto-principal img");
        main.src = photo.src;
        main.alt = photo.alt;
        root.querySelectorAll("[data-photo]").forEach(thumb => thumb.setAttribute("aria-pressed", String(thumb === button)));
      });
    });
    select("#anadir").addEventListener("submit", event => {
      event.preventDefault();
      const values = new FormData(event.currentTarget);
      cart.add(product.id, values.get("talla"), values.get("color"), values.get("cantidad"));
      select("#estado-bolsa").textContent = t("addedToBag");
      select("#ver-bolsa").hidden = false;
    });
  }

  function totals(method) {
    const { subtotal, shipping, total } = cart.totals(method);
    return `<dl class="totals"><div><dt>${t("subtotal")}</dt><dd>${money(subtotal)}</dd></div>
      <div><dt>${method === "recogida" ? t("pickup") : t("shipping")}</dt><dd>${shipping ? money(shipping) : t("free")}</dd></div>
      <div class="total"><dt>${t("total")}</dt><dd>${money(total)}</dd></div></dl>`;
  }

  function renderCart() {
    const root = select("#bolsa");
    const lines = localizedLines();
    if (!lines.length) {
      root.innerHTML = empty(t("bagEmpty"), t("bagEmptyDetail"));
      cart.refresh();
      return;
    }
    root.innerHTML = `<div class="commerce-grid"><div class="cart-lines">${lines.map(({ product, size, color, qty }, index) =>
      `<article class="cart-line">
        <a class="frame cart-image" href="${productLink(product)}" aria-label="${t("viewProduct", { name: product.name })}">${image(product.images[0])}</a>
        <div class="line-info"><h2><a href="${productLink(product)}">${product.name}</a></h2><p>${sizeLabel(size)} · ${colorLabel(color)}</p>
          <label class="label">${t("quantity")} <input type="number" min="1" max="99" value="${qty}" data-qty="${index}" aria-label="${t("quantityLabel", { name: product.name, size: sizeLabel(size), colour: colorLabel(color) })}"></label>
          <button class="under remove" type="button" data-remove="${index}" aria-label="${t("removeLabel", { name: product.name, size: sizeLabel(size), colour: colorLabel(color) })}">${t("remove")}</button></div>
        <strong data-line-total="${index}">${money(product.price * qty)}</strong>
      </article>`).join("")}</div>
      <aside class="summary"><h2>${t("summary")}</h2><div id="totales-bolsa" aria-live="polite">${totals()}</div><p class="muted">${t("freeDelivery")}</p>
      <a class="button" href="checkout.html">${t("checkout")}</a><a class="under" href="catalogo.html">${t("keepBrowsing")}</a></aside></div>`;
    root.querySelectorAll("[data-qty]").forEach(input => {
      input.addEventListener("change", () => {
        const index = Number(input.dataset.qty);
        cart.change(index, input.value);
        const line = cart.lines()[index];
        input.value = line.qty;
        select(`[data-line-total="${index}"]`).textContent = money(line.product.price * line.qty);
        select("#totales-bolsa").innerHTML = totals();
      });
    });
    root.querySelectorAll("[data-remove]").forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.remove);
        cart.remove(index);
        renderCart();
        (select(`[data-remove="${index}"]`) || select("[data-remove]") || root.querySelector(".button"))?.focus();
      });
    });
    cart.refresh();
  }

  function renderCheckout() {
    const root = select("#checkout");
    const lines = localizedLines();
    if (!lines.length) {
      root.innerHTML = empty(t("bagEmpty"), t("checkoutEmptyDetail"));
      cart.refresh();
      return;
    }
    root.innerHTML = `<div class="commerce-grid">
      <form id="pedido" class="checkout-form stack">
        <fieldset><legend>${t("contact")}</legend><p class="muted">${t("demoData")}</p>
          <label>${t("email")}<input type="email" name="correo" placeholder="${t("exampleEmail")}" autocomplete="off" required></label>
        </fieldset>
        <fieldset><legend>${t("shippingAddress")}</legend>
          <label>${t("fullName")}<input name="nombre" autocomplete="off" required minlength="2" maxlength="100"></label>
          <label>${t("address")}<input name="direccion" autocomplete="off" required minlength="4" maxlength="150"></label>
          <div class="variant-grid"><label>${t("postalCode")}<input name="postal" inputmode="numeric" pattern="[0-9]{5}" title="${t("postalFormat")}" autocomplete="off" required></label>
          <label>${t("city")}<input name="ciudad" autocomplete="off" required minlength="2" maxlength="100"></label></div>
          <label>${t("country")}<select name="pais"><option>${t("spain")}</option></select></label>
        </fieldset>
        <fieldset><legend>${t("deliveryMethod")}</legend>
          <label class="choice"><input type="radio" name="envio" value="estandar" checked> ${t("standardDelivery")}</label>
          <label class="choice"><input type="radio" name="envio" value="recogida"> ${t("studioPickup")}</label>
        </fieldset>
        <fieldset><legend>${t("demoPayment")}</legend>
          <p class="notice" id="demo-pago">${t("paymentNotice")}</p>
          <label>${t("demoCard")}<input type="text" placeholder="DEMO •••• •••• ••••" readonly aria-describedby="demo-pago"></label>
          <div class="variant-grid"><label>${t("demoExpiry")}<input type="text" placeholder="${t("expiryPlaceholder")}" readonly></label>
          <label>${t("demoCode")}<input type="text" placeholder="•••" readonly></label></div>
          <label class="choice"><input type="checkbox" name="demo" required> ${t("demoAgreement")}</label>
        </fieldset>
        <button class="button" type="submit">${t("confirmOrder")}</button>
      </form>
      <aside class="summary"><h2>${t("yourOrder")}</h2>
        <ul class="order-lines">${lines.map(({ product, qty, size, color }) => `<li>${image(product.images[0])}<div>${product.name}<small>${qty} × ${sizeLabel(size)} · ${colorLabel(color)}</small></div><span>${money(product.price * qty)}</span></li>`).join("")}</ul>
        <div id="totales-pedido" aria-live="polite">${totals()}</div>
        <a class="under" href="carrito.html">${t("editBag")}</a>
      </aside></div>`;
    const form = select("#pedido");
    form.addEventListener("change", () => {
      const method = form.elements.envio.value;
      form.elements.direccion.required = method === "estandar";
      form.elements.postal.required = method === "estandar";
      form.elements.ciudad.required = method === "estandar";
      for (const name of ["direccion", "postal", "ciudad"]) {
        form.elements[name].setCustomValidity("");
      }
      select("#totales-pedido").innerHTML = totals(method);
    });
    form.addEventListener("submit", event => {
      event.preventDefault();
      const number = "ASTRO-DEMO-" + String(Math.floor(100000 + Math.random() * 900000));
      cart.clear();
      select(".intro h1").textContent = t("confirmed");
      root.innerHTML = empty(t("thanksForVisiting"), t("orderComplete", { number }), t("backHome"), "index.html");
      document.title = t("confirmed") + " | ASTRO";
      select("#principal").focus();
      window.scrollTo(0, 0);
      cart.refresh();
    });
  }

  function validationMessage(field) {
    const validity = field.validity;
    if (validity.badInput) return t("validationNumber");
    if (validity.valueMissing) {
      if (field.type === "checkbox") return t("validationCheckbox");
      return t(field.tagName === "SELECT" ? "validationSelect" : "validationRequired");
    }
    if (validity.typeMismatch && field.type === "email") return t("validationEmail");
    if (validity.patternMismatch) return field.title || t("validationInvalid");
    if (validity.tooShort) return t("validationShort", { count: field.minLength });
    if (validity.tooLong) return t("validationLong", { count: field.maxLength });
    if (validity.rangeUnderflow) return t("validationMin", { value: field.min });
    if (validity.rangeOverflow) return t("validationMax", { value: field.max });
    if (validity.stepMismatch) return t("validationWhole");
    return t("validationInvalid");
  }

  document.addEventListener("invalid", event => {
    const field = event.target;
    field.setCustomValidity("");
    if (!field.validity.valid) field.setCustomValidity(validationMessage(field));
  }, true);
  for (const type of ["input", "change"]) {
    document.addEventListener(type, event => event.target.setCustomValidity?.(""));
  }

  apply();
  renderShell();
  setupInstall();
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.warn("ASTRO service worker registration failed", error);
    });
  }
  const renderers = {
    inicio: renderCategories, tienda: renderCategories, catalogo: renderCatalog,
    producto: renderProduct, carrito: renderCart, checkout: renderCheckout
  };
  renderers[page]?.();
  cart.refresh();
  if (page === "carrito") document.addEventListener("astro:cart", renderCart);
  if (page === "checkout") document.addEventListener("astro:cart", renderCheckout);

  document.querySelectorAll(".demo-form").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      form.reset();
      form.querySelector(".form-status").textContent = form.dataset.success;
    });
  });
})();
