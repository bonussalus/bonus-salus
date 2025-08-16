/* =========================================================
   Shipping Meta (no visible al cliente)
   - Calcula L x W x H, peso real, volumétrico y facturable
   - Sin modificar app.js: intercepta fetch a /api/checkout y agrega shipping_meta
   - Regla: UNA SOLA FILA horizontal
     L = suma de largos por cantidad
     W = máximo ancho
     H = máximo alto
     Peso real = suma de pesos (g)/1000
     Volumétrico = (L*W*H)/DIVISOR (5000 por defecto)
========================================================= */

(function () {
  // --- Configuración ---
  var CART_KEY = 'bs_cart_v1';
  var VOLUMETRIC_DIVISOR = 5000; // cámbialo a 6000 si tu paquetería lo usa
  // Embalaje opcional (se suma a todo)
  var PACKING = { l: 0, w: 0, h: 0, weight_g: 0 };

  // Mapa de dimensiones/peso por producto (slugs como los de app.js)
  // l = largo (cm), w = ancho (cm), h = alto (cm), weight_g = gramos
  var PRODUCT_DIMENSIONS = {
    'shampoo-de-romero':     { l: 8.0,  w: 8.0,  h: 22.0, weight_g: 545 },
    'crema-de-neem':         { l: 6.5,  w: 4.0,  h: 18.5, weight_g: 267 },
    'extracto-de-guanabana': { l: 4.0,  w: 4.0,  h: 9.0,  weight_g: 80  },
    'extracto-de-neem':      { l: 4.0,  w: 4.0,  h: 9.0,  weight_g: 80  },
    'extracto-de-moringa':   { l: 4.0,  w: 4.0,  h: 9.0,  weight_g: 80  },
    'capsulas-de-neem':      { l: 4.5,  w: 4.5,  h: 9.5,  weight_g: 40  },
    'unguento-herbal':       { l: 6.0,  w: 6.0,  h: 9.0,  weight_g: 168 }
  };

  function safeParse(json) {
    try { return JSON.parse(json); } catch (_) { return null; }
  }

  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }

  // Cálculo del paquete con regla de una fila
  function computePackage(items, opts) {
    opts = opts || {};
    var divisor = Number(opts.volumetricDivisor || VOLUMETRIC_DIVISOR);
    var pad = opts.padding || PACKING;

    var L = 0, W = 0, H = 0, weight_g_total = 0;

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var dim = PRODUCT_DIMENSIONS[it.id];
      var qty = Number(it.qty || 1);
      if (!dim || qty <= 0) continue;

      L += (dim.l * qty);
      W = Math.max(W, dim.w);
      H = Math.max(H, dim.h);
      weight_g_total += (dim.weight_g * qty);
    }

    if (L === 0 && W === 0 && H === 0 && weight_g_total === 0) return null;

    L += Number(pad.l || 0);
    W += Number(pad.w || 0);
    H += Number(pad.h || 0);
    weight_g_total += Number(pad.weight_g || 0);

    var peso_real_kg = +(weight_g_total / 1000).toFixed(2);
    var peso_vol_kg  = +((L * W * H) / divisor).toFixed(2);
    var peso_fact_kg = +(Math.max(peso_real_kg, peso_vol_kg)).toFixed(2);

    return {
      L_cm: +L.toFixed(1),
      W_cm: +W.toFixed(1),
      H_cm: +H.toFixed(1),
      peso_real_kg: peso_real_kg,
      peso_vol_kg:  peso_vol_kg,
      peso_facturable_kg: peso_fact_kg,
      divisor: divisor
    };
  }

  // Interceptar fetch solo para /api/checkout
  var _origFetch = window.fetch;
  window.fetch = function (input, init) {
    init = init || {};
    var url = '';

    if (typeof input === 'string') {
      url = input;
    } else if (input && typeof input.url === 'string') {
      url = input.url;
    }

    // Solo tocamos /api/checkout (relativo o absoluto)
    var isCheckout = url && /\/api\/checkout(\?|$)/.test(url);
    if (!isCheckout) {
      return _origFetch(input, init);
    }

    // Intentar leer body JSON actual para no romper nada
    var bodyObj = {};
    if (init.body && typeof init.body === 'string') {
      bodyObj = safeParse(init.body) || {};
    }

    // Si ya viene shipping_meta, no lo pisamos
    if (!bodyObj.shipping_meta) {
      var cartItems = loadCart();
      var meta = computePackage(cartItems, {
        volumetricDivisor: VOLUMETRIC_DIVISOR,
        padding: PACKING
      });
      if (meta) {
        bodyObj.shipping_meta = meta; // <- agregado en caliente
      }
    }

    // Asegurar header JSON
    var headers = new Headers(init.headers || {});
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    var newInit = Object.assign({}, init, {
      method: init.method || 'POST',
      headers: headers,
      body: JSON.stringify(bodyObj)
    });

    return _origFetch(input, newInit);
  };
})();
