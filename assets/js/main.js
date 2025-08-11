/* main.js — Bonus Salus
   Integra tu carrito existente con Mercado Pago (Checkout Pro) vía /api/checkout
   - Detecta el carrito en localStorage con llaves comunes
   - Mapea campos (title/name, price/unit_price, qty/quantity)
   - Enlaza botón "Finalizar compra" sin romper tu lógica actual
*/

(() => {
  // ====== CONFIGURACIÓN BÁSICA ======
  // Si tu carrito usa otra key, agrégala aquí:
  const CART_KEYS = ['bs_cart', 'cart', 'bonusCart', 'cartItems', 'shoppingCart'];

  // Intenta leer nombre/email/teléfono de un form (opcional)
  const CUSTOMER_FIELDS = {
    nombre: ['#nombre', '#name', '[name="nombre"]', '[name="name"]'],
    email:  ['#email', '[name="email"]'],
    telefono: ['#telefono', '#phone', '[name="telefono"]', '[name="phone"]']
  };

  // Selectores de botones para finalizar compra
  const CHECKOUT_BUTTON_SELECTORS = [
    '#checkoutBtn',
    '.btn-finalizar-compra',
    '[data-action="finalizar-compra"]'
  ];

  // ====== UTILIDADES ======
  function $(sel) { return document.querySelector(sel); }

  function getFirstValue(selectors) {
    for (const s of selectors) {
      const el = $(s);
      if (el && el.value) return el.value.trim();
    }
    return '';
  }

  function toNumber(n, def = 0) {
    const x = Number((n ?? '').toString().replace(/[^\d.-]/g, ''));
    return Number.isFinite(x) ? x : def;
  }

  // Detecta y carga el carrito
  function loadCart() {
    for (const key of CART_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const items = JSON.parse(raw);
        if (Array.isArray(items) && items.length >= 0) {
          return { key, items };
        }
      } catch (e) { /* ignore parse errors */ }
    }
    return { key: null, items: [] };
  }

  // Normaliza un item del carrito a { title, qty, price }
  function normalizeItem(it = {}) {
    const title =
      it.title ??
      it.name ??
      it.productName ??
      it.nombre ??
      it.descripcion ??
      'Producto';

    const qty = toNumber(it.qty ?? it.quantity ?? it.cantidad ?? 1, 1);

    // Busca precio en distintos campos comunes
    const priceCandidate =
      it.price ??
      it.unit_price ??
      it.unitPrice ??
      it.precio ??
      it.amount ??
      it.total_unit_price ??
      0;

    const price = toNumber(priceCandidate, 0);
    return { title: String(title), qty, price };
  }

  // Convierte array de items a formato esperado por /api/checkout
  function mapItemsForMP(items = []) {
    return items.map(normalizeItem).filter(i => i.qty > 0 && i.price >= 0);
  }

  // Lee datos del cliente (si existen inputs en tu página)
  function getCustomerFromForm() {
    return {
      nombre: getFirstValue(CUSTOMER_FIELDS.nombre) || 'Cliente',
      email: getFirstValue(CUSTOMER_FIELDS.email) || 'cliente@example.com',
      telefono: getFirstValue(CUSTOMER_FIELDS.telefono) || ''
    };
  }

  // ====== LLAMADA A TU API / MERCADO PAGO ======
  async function iniciarCheckout({ items, shipping_cost = 0, customer }) {
    const resp = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ items, shipping_cost, customer })
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.init_point) {
      console.error('Error /api/checkout:', { status: resp.status, data });
      throw new Error('No se pudo iniciar el pago');
    }
    return data.init_point; // Producción
  }

  // ====== FLUJO PRINCIPAL: FINALIZAR COMPRA ======
  async function finalizarCompraMP() {
    try {
      const { items: rawItems } = loadCart();
      if (!rawItems || rawItems.length === 0) {
        alert('Tu carrito está vacío');
        return;
      }

      const items = mapItemsForMP(rawItems);
      if (!items.length) {
        alert('No hay productos válidos en el carrito');
        return;
      }

      // Envío lo integraremos con Skydropx después (por ahora 0)
      const shipping_cost = 0;

      // Toma datos del formulario si existen
      const customer = getCustomerFromForm();

      const url = await iniciarCheckout({ items, shipping_cost, customer });
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error iniciando el pago');
    }
  }

  // ====== ENLACE DE BOTONES ======
  function attachCheckoutButtons() {
    for (const sel of CHECKOUT_BUTTON_SELECTORS) {
      const btn = $(sel);
      if (btn) {
        btn.addEventListener('click', finalizarCompraMP);
      }
    }
  }

  // ====== LIMPIEZA DEL CARRITO (para usar en success.html si quieres) ======
  function clearCart() {
    CART_KEYS.forEach(k => localStorage.removeItem(k));
  }

  // Exponer helpers si los quieres usar en otros scripts
  window.BonusSalusCheckout = {
    finalizarCompraMP,
    clearCart,
    loadCart,
    mapItemsForMP
  };

  // Auto-enlazar botones al cargar
  document.addEventListener('DOMContentLoaded', attachCheckoutButtons);
})();
