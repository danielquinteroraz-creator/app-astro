(() => {
  "use strict";

  const products = window.PRODUCTS;
  const categories = window.CATEGORIES;
  const cart = window.AstroCart;
  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);
  const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const money = number => euro.format(number);
  const select = selector => document.querySelector(selector);
  const productLink = product => "producto.html?id=" + encodeURIComponent(product.id);
  const categoryLink = category => "catalogo.html?cat=" + encodeURIComponent(category);
  const star = '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M10 0c.8 6.5 3.5 9.2 10 10-6.5.8-9.2 3.5-10 10C9.2 13.5 6.5 10.8 0 10 6.5 9.2 9.2 6.5 10 0Z" fill="currentColor"/></svg>';
  const logo = '<a class="logo" href="index.html" aria-label="ASTRO, inicio">ASTRO' + star + '</a>';
  const navigation = [
    ["inicio", "index.html", "Inicio"],
    ["marca", "marca.html", "Marca"],
    ["tienda", "shop.html", "Tienda"],
    ["catalogo", "catalogo.html", "Catálogo"],
    ["contacto", "contacto.html", "Contacto"]
  ];

  function renderShell() {
    const nav = navigation.map(([key, url, text]) =>
      `<a href="${url}" ${page === key ? 'aria-current="page"' : ""}>${text}</a>`).join("");
    select("#cabecera").innerHTML = `<div class="header-inner">
      ${logo}
      <button class="menu-button label" type="button" aria-expanded="false" aria-controls="navegacion">Menú</button>
      <nav class="nav label" id="navegacion" aria-label="Navegación principal">${nav}</nav>
      <a class="bag-link" href="carrito.html">
        <svg width="22" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" aria-hidden="true"><path d="M4 8h16l1 13H3L4 8Z"/><path d="M8.5 9V6a3.5 3.5 0 0 1 7 0v3"/></svg>
        <span data-cart-count>0</span>
      </a>
    </div>`;
    select("#pie").innerHTML = `<div class="wrap">
      <div class="footer-top"><div>${logo}<p>Prendas de líneas depuradas.<br>Diseñadas para el día a día.</p></div>
      <nav class="footer-nav label" aria-label="Navegación del pie">${navigation.slice(1).map(([, url, text]) => `<a href="${url}">${text}</a>`).join("")}</nav>
      <div><p class="label">Estudio Madrid</p><p>Martes a sábado<br><a class="under" href="contacto.html">Horarios y contacto</a></p></div></div>
      <div class="footer-bottom label"><span>© 2026 ASTRO</span><span>Tienda de demostración · España · EUR</span></div></div>`;

    const button = select(".menu-button");
    const menu = select("#navegacion");
    const toggle = open => {
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "Cerrar" : "Menú";
      menu.classList.toggle("open", open);
    };
    button.addEventListener("click", () => toggle(!menu.classList.contains("open")));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && menu.classList.contains("open")) {
        toggle(false);
        button.focus();
      }
    });
    matchMedia("(min-width: 761px)").addEventListener("change", event => {
      if (event.matches) toggle(false);
    });
  }

  function image(photo, eager = false) {
    return `<img src="${photo.src}" alt="${photo.alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }

  function cards(list) {
    return list.map(product => `<article class="product-card"><a href="${productLink(product)}">
      <div class="frame product-photo">${image(product.images[0])}${product.new ? '<span class="tag label">Novedad</span>' : ""}</div>
      <div class="card-meta"><h3>${product.name}</h3><span>${money(product.price)}</span></div>
      <p class="muted card-color">${product.colors[0]}</p>
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

  const options = items => items.map(item => `<option value="${item}">${item}</option>`).join("");

  function renderCatalog() {
    const form = select("#filtros");
    const { categoria, talla, precio, orden } = form.elements;
    categoria.insertAdjacentHTML("beforeend", Object.entries(categories).map(([id, name]) => `<option value="${id}">${name}</option>`).join(""));
    const sizes = ["XS", "S", "M", "L", "XL", "34", "36", "38", "40", "42", "44", "Única"];
    talla.insertAdjacentHTML("beforeend", options(sizes));
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
      select("#resultados").textContent = list.length + (list.length === 1 ? " resultado" : " resultados");
      select("#productos").innerHTML = list.length ? cards(list) : '<p class="empty-grid">Ninguna prenda coincide con esos filtros.</p>';
      cart.refresh();
    }
    form.addEventListener("submit", event => event.preventDefault());
    form.addEventListener("change", update);
    form.addEventListener("reset", () => setTimeout(update, 0));
    update();
  }

  function empty(title, description, label = "Explorar catálogo", href = "catalogo.html") {
    return `<div class="empty"><p class="empty-star" aria-hidden="true">${star}</p><h2>${title}</h2><p>${description}</p><a class="button" href="${href}">${label}</a></div>`;
  }

  function renderProduct() {
    const root = select("#ficha");
    const product = products.find(item => item.id === params.get("id"));
    if (!product) {
      document.title = "Prenda no encontrada | ASTRO";
      root.innerHTML = '<p class="label centered">Error 404</p>' + empty("Esta pieza no está disponible", "Puede que la edición haya terminado o que el enlace haya cambiado.").replace("<h2>", "<h1>").replace("</h2>", "</h1>");
      return;
    }
    document.title = product.name + " | ASTRO";
    const related = products.filter(item => item.category === product.category && item.id !== product.id);
    related.push(...products.filter(item => item.category !== product.category && item.featured).slice(0, 3 - related.length));
    root.innerHTML = `<div class="breadcrumbs"><a href="catalogo.html">Catálogo</a><span aria-hidden="true">/</span><a href="${categoryLink(product.category)}">${categories[product.category]}</a></div>
      <div class="product-layout">
        <section class="gallery" aria-label="Galería de la prenda">
          <div class="frame gallery-main" id="foto-principal">${image(product.images[0], true)}</div>
          <div class="thumbs">${product.images.map((photo, index) => `<button type="button" data-photo="${index}" aria-label="Ver foto ${index + 1}: ${photo.alt}" aria-pressed="${index === 0}">${image({ ...photo, alt: "" })}</button>`).join("")}</div>
        </section>
        <section class="product-copy"><p class="label">${categories[product.category]}</p><h1>${product.name}</h1><p class="product-price">${money(product.price)}</p><p>${product.description}</p>
          <form id="anadir" class="stack">
            <div class="variant-grid">
              <label>Talla<select name="talla" required><option value="">Elige una talla</option>${options(product.sizes)}</select></label>
              <label>Color<select name="color" required>${options(product.colors)}</select></label>
            </div>
            <div class="purchase"><label>Cantidad<input type="number" name="cantidad" min="1" max="99" value="1" required></label><button class="button">Añadir al carrito</button></div>
            <p id="estado-bolsa" class="form-status" role="status"></p><a class="under" id="ver-bolsa" href="carrito.html" hidden>Ver bolsa de compra</a>
          </form>
          <details open><summary>Composición y cuidados</summary><p>${product.composition}. ${product.care}</p></details>
          <details><summary>Envíos y devoluciones</summary><p>Envío estándar de 2 a 4 días laborables por 6 €. Gratis desde 150 €. Plazo ilustrativo de devolución de 30 días.</p></details>
        </section>
      </div>
      <section class="related"><div class="section-head"><h2>También te puede interesar</h2></div><div class="product-grid related-grid">${cards(related)}</div></section>`;

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
      select("#estado-bolsa").textContent = "La selección se ha añadido a tu bolsa.";
      select("#ver-bolsa").hidden = false;
    });
  }

  function totals(method) {
    const { subtotal, shipping, total } = cart.totals(method);
    return `<dl class="totals"><div><dt>Subtotal</dt><dd>${money(subtotal)}</dd></div>
      <div><dt>${method === "recogida" ? "Recogida" : "Envío"}</dt><dd>${shipping ? money(shipping) : "Gratis"}</dd></div>
      <div class="total"><dt>Total</dt><dd>${money(total)}</dd></div></dl>`;
  }

  function renderCart() {
    const root = select("#bolsa");
    const lines = cart.lines();
    if (!lines.length) {
      root.innerHTML = empty("Tu bolsa está vacía", "Encuentra una pieza para empezar tu selección.");
      cart.refresh();
      return;
    }
    root.innerHTML = `<div class="commerce-grid"><div class="cart-lines">${lines.map(({ product, size, color, qty }, index) =>
      `<article class="cart-line">
        <a class="frame cart-image" href="${productLink(product)}" aria-label="Ver ${product.name}">${image(product.images[0])}</a>
        <div class="line-info"><h2><a href="${productLink(product)}">${product.name}</a></h2><p>${size} · ${color}</p>
          <label class="label">Cantidad <input type="number" min="1" max="99" value="${qty}" data-qty="${index}" aria-label="Cantidad de ${product.name}, ${size}, ${color}"></label>
          <button class="under remove" type="button" data-remove="${index}" aria-label="Eliminar ${product.name}, ${size}, ${color}">Eliminar</button></div>
        <strong data-line-total="${index}">${money(product.price * qty)}</strong>
      </article>`).join("")}</div>
      <aside class="summary"><h2>Resumen</h2><div id="totales-bolsa" aria-live="polite">${totals()}</div><p class="muted">Envío estándar gratis desde 150 €.</p>
      <a class="button" href="checkout.html">Finalizar compra</a><a class="under" href="catalogo.html">Seguir explorando</a></aside></div>`;
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
    const lines = cart.lines();
    if (!lines.length) {
      root.innerHTML = empty("Tu bolsa está vacía", "Añade una pieza antes de finalizar la compra.");
      cart.refresh();
      return;
    }
    root.innerHTML = `<div class="commerce-grid">
      <form id="pedido" class="checkout-form stack">
        <fieldset><legend>Contacto</legend><p class="muted">Rellena el formulario con datos ficticios.</p>
          <label>Correo electrónico<input type="email" name="correo" placeholder="ejemplo@correo.test" autocomplete="off" required></label>
        </fieldset>
        <fieldset><legend>Dirección de envío</legend>
          <label>Nombre y apellidos<input name="nombre" autocomplete="off" required minlength="2" maxlength="100"></label>
          <label>Dirección<input name="direccion" autocomplete="off" required minlength="4" maxlength="150"></label>
          <div class="variant-grid"><label>Código postal<input name="postal" inputmode="numeric" pattern="[0-9]{5}" title="Introduce cinco dígitos" autocomplete="off" required></label>
          <label>Ciudad<input name="ciudad" autocomplete="off" required minlength="2" maxlength="100"></label></div>
          <label>País<select name="pais"><option>España</option></select></label>
        </fieldset>
        <fieldset><legend>Método de entrega</legend>
          <label class="choice"><input type="radio" name="envio" value="estandar" checked> Envío estándar · 2 a 4 días laborables</label>
          <label class="choice"><input type="radio" name="envio" value="recogida"> Recogida en el estudio · Gratis</label>
        </fieldset>
        <fieldset><legend>Pago de demostración</legend>
          <p class="notice" id="demo-pago">Esta compra es una demostración y no procesa pagos. Usa los datos ficticios que se muestran. No introduzcas números de tarjeta reales.</p>
          <label>Tarjeta de demostración<input type="text" placeholder="DEMO •••• •••• ••••" readonly aria-describedby="demo-pago"></label>
          <div class="variant-grid"><label>Caducidad demo<input type="text" placeholder="MM/AA" readonly></label>
          <label>Código demo<input type="text" placeholder="•••" readonly></label></div>
          <label class="choice"><input type="checkbox" name="demo" required> Entiendo que el pedido es de demostración.</label>
        </fieldset>
        <button class="button" type="submit">Confirmar pedido de prueba</button>
      </form>
      <aside class="summary"><h2>Tu pedido</h2>
        <ul class="order-lines">${lines.map(({ product, qty, size, color }) => `<li>${image(product.images[0])}<div>${product.name}<small>${qty} × ${size} · ${color}</small></div><span>${money(product.price * qty)}</span></li>`).join("")}</ul>
        <div id="totales-pedido" aria-live="polite">${totals()}</div>
        <a class="under" href="carrito.html">Editar bolsa</a>
      </aside></div>`;
    const form = select("#pedido");
    form.addEventListener("change", () => {
      const method = form.elements.envio.value;
      form.elements.direccion.required = method === "estandar";
      form.elements.postal.required = method === "estandar";
      form.elements.ciudad.required = method === "estandar";
      select("#totales-pedido").innerHTML = totals(method);
    });
    form.addEventListener("submit", event => {
      event.preventDefault();
      const number = "ASTRO-DEMO-" + String(Math.floor(100000 + Math.random() * 900000));
      cart.clear();
      select(".intro h1").textContent = "Pedido confirmado";
      root.innerHTML = empty("Gracias por tu visita", `Tu pedido de demostración ${number} se ha completado. No se ha realizado ningún cobro.`, "Volver al inicio", "index.html");
      document.title = "Pedido confirmado | ASTRO";
      select("#principal").focus();
      window.scrollTo(0, 0);
      cart.refresh();
    });
  }

  renderShell();
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
