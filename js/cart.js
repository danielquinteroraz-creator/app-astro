(() => {
  "use strict";

  const key = "astro-bolsa-v1";
  const queryKey = "bolsa";
  const isLocalFile = location.protocol === "file:";
  const { lang, t, persistAcrossLinks } = window.AstroI18n;
  const productById = new Map(window.PRODUCTS.map(product => [product.id, product]));

  function quantity(value) {
    return Math.min(99, Math.max(1, Math.floor(Number(value) || 1)));
  }

  function parse(value) {
    try {
      const stored = JSON.parse(value || "[]");
      if (!Array.isArray(stored)) return [];
      return stored.flatMap(line => {
        if (!line || typeof line !== "object") return [];
        const product = productById.get(line.id);
        if (!product || !product.sizes.includes(line.size) || !product.colors.includes(line.color)) return [];
        return [{ id: line.id, size: line.size, color: line.color, qty: quantity(line.qty) }];
      });
    } catch {
      return [];
    }
  }

  function load() {
    const query = new URLSearchParams(location.search);
    if (isLocalFile && query.has(queryKey)) return parse(query.get(queryKey));
    try {
      return parse(localStorage.getItem(key));
    } catch {
      return [];
    }
  }

  let lines = load();

  function updateHeader() {
    const count = lines.reduce((sum, line) => sum + line.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach(node => {
      node.textContent = count;
      node.closest("a").setAttribute("aria-label", t(count === 1 ? "bagOne" : "bagMany", { count }));
    });
  }

  // Los navegadores pueden aislar localStorage para cada archivo. En ese caso,
  // los enlaces locales transportan únicamente las referencias de los artículos.
  function withBag(url) {
    if (isLocalFile) url.searchParams.set(queryKey, JSON.stringify(lines));
    return url;
  }

  function syncLinks() {
    if (!isLocalFile && !persistAcrossLinks) return;
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute("href");
      if (!/^[a-z]+\.html(?:[?#]|$)/.test(href)) return;
      const url = withBag(new URL(href, location.href));
      if (persistAcrossLinks) url.searchParams.set("lang", lang);
      link.setAttribute("href", url.pathname.split("/").pop() + url.search + url.hash);
    });
  }

  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(lines));
    } catch {
      // La sesión actual conserva la bolsa aunque el almacenamiento esté bloqueado.
    }
    if (isLocalFile) {
      try {
        const url = new URL(location.href);
        url.searchParams.set(queryKey, JSON.stringify(lines));
        history.replaceState(history.state, "", url);
      } catch {
        // Los enlaces conservan el estado si el navegador limita el historial local.
      }
    }
    updateHeader();
    syncLinks();
  }

  window.AstroCart = {
    lines: () => lines.map(line => ({ ...line, product: productById.get(line.id) })),
    withBag,
    add(id, size, color, qty) {
      const product = productById.get(id);
      if (!product || !product.sizes.includes(size) || !product.colors.includes(color)) return;
      const match = lines.find(line => line.id === id && line.size === size && line.color === color);
      if (match) match.qty = quantity(match.qty + quantity(qty));
      else lines.push({ id, size, color, qty: quantity(qty) });
      save();
    },
    change(index, qty) {
      if (!lines[index]) return;
      lines[index].qty = quantity(qty);
      save();
    },
    remove(index) {
      if (!lines[index]) return;
      lines.splice(index, 1);
      save();
    },
    clear() {
      lines = [];
      save();
    },
    totals(method = "estandar") {
      const subtotal = lines.reduce((sum, line) => sum + productById.get(line.id).price * line.qty, 0);
      const shipping = subtotal === 0 || subtotal >= 150 || method === "recogida" ? 0 : 6;
      return { subtotal, shipping, total: subtotal + shipping };
    },
    refresh() {
      updateHeader();
      syncLinks();
    }
  };

  window.addEventListener("storage", event => {
    if (event.key !== key && event.key !== null) return;
    lines = load();
    updateHeader();
    document.dispatchEvent(new Event("astro:cart"));
  });
})();
