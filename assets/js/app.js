/* =========================================================
   Bonus Salus – app.js
   - Modal "Leer más"
   - Carrito (+ Vaciar)
   - Checkout en MODAL (1 columna, centrado)
   - Paso 1: Datos (sin autocompletar CP, "Calle y número" antes de CP)
   - Paso 2: Resumen (envío $99, subtotal, total)
   - "Finalizar compra" crea preferencia en MP y redirige
   ========================================================= */

(function(){
  /* =============== MODAL "LEER MÁS" =============== */
  const productModal = document.getElementById('product-modal');
  const closeBtn = document.getElementById('modal-close');
  const mTitle = document.getElementById('modal-title');
  const mImage = document.getElementById('modal-image');
  const mDesc  = document.getElementById('modal-desc');
  const mPrice = document.getElementById('modal-price');

  function openProductModal(){ if(productModal){ productModal.classList.add('open'); productModal.setAttribute('aria-hidden','false'); } }
  function closeProductModal(){ if(productModal){ productModal.classList.remove('open'); productModal.setAttribute('aria-hidden','true'); } }

  document.addEventListener('click', function(e){
    const link = e.target.closest('a.btn-outline'); // "Leer más"
    if(link){
      e.preventDefault();
      const card = link.closest('.card'); if(!card) return;
      const titleEl = card.querySelector('.card-title');
      const priceEl = card.querySelector('.price');
      const imgEl   = card.querySelector('img');
      const desc    = card.getAttribute('data-desc') || 'Descripción del producto. Ingredientes naturales, calidad comprobada y enfoque en tu bienestar.';
      if(mTitle) mTitle.textContent = titleEl ? titleEl.textContent : 'Producto';
      if(mPrice) mPrice.textContent = priceEl ? priceEl.textContent : '';
      if(mImage){ mImage.src = imgEl ? imgEl.src : ''; mImage.alt = titleEl ? titleEl.textContent : 'Imagen del producto'; }
      if(mDesc) mDesc.textContent = desc;
      openProductModal();
    }
  });
  if(closeBtn) closeBtn.addEventListener('click', closeProductModal);
  if(productModal) productModal.addEventListener('click', (e)=>{ if(e.target === productModal) closeProductModal(); });
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeProductModal(); });

  /* ======================= CARRITO ======================= */
  const CART_KEY = 'bs_cart_v1';
  const cartBadge = document.querySelector('.cart-badge');
  const ENVIO_FIJO = 99;

  const slugify = (str)=> (str||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const parsePrice = (t)=> parseFloat((t||'').replace(/[^0-9.,]/g,'').replace(',', '.')) || 0;
  const loadCart = ()=> { try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch(_){ return []; } };
  const saveCart = (items)=> localStorage.setItem(CART_KEY, JSON.stringify(items));
  const countItems = (items)=> items.reduce((s,i)=>s+i.qty,0);
  const subtotal = (items)=> items.reduce((s,i)=>s+i.price*i.qty,0);
  const formatMXN = (n)=> `$${n.toFixed(2)} MXN`;

  function updateBadge(){
    const items = loadCart();
    if(cartBadge) cartBadge.textContent = `Carrito (${countItems(items)})`;
  }

  function getProductDataFromCard(card){
    const title = card.querySelector('.card-title')?.textContent?.trim() || 'Producto';
    const priceText = card.querySelector('.price')?.textContent || '';
    const price = parsePrice(priceText);
    const img = card.querySelector('img')?.src || '';
    const desc = card.getAttribute('data-desc') || '';
    const id = slugify(title);
    return { id, title, price, img, desc };
  }

  function addToCart(product, qty=1){
    const items = loadCart();
    const idx = items.findIndex(x => x.id === product.id);
    if(idx >= 0){ items[idx].qty += qty; } else { items.push({ id: product.id, title: product.title, price: product.price, img: product.img, qty }); }
    saveCart(items); updateBadge(); renderCart();
  }
  function changeQty(id, delta){
    const items = loadCart();
    const idx = items.findIndex(x => x.id === id);
    if(idx >= 0){
      items[idx].qty += delta;
      if(items[idx].qty <= 0) items.splice(idx,1);
      saveCart(items); updateBadge(); renderCart();
    }
  }
  function removeItem(id){ const items = loadCart().filter(x => x.id !== id); saveCart(items); updateBadge(); renderCart(); }
  function clearCart(){ saveCart([]); updateBadge(); renderCart(); }

  // Render del carrito dentro de #carrito
  function renderCart(){
    const section = document.getElementById('carrito'); if(!section) return;
    const container = section.querySelector('.container') || section;
    let mount = container.querySelector('#cart-content');
    if(!mount){ mount = document.createElement('div'); mount.id = 'cart-content'; container.appendChild(mount); }

    const items = loadCart();
    if(items.length === 0){ mount.innerHTML = `<p class="lead">Tu carrito está vacío.</p>`; return; }

    const headerRow = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0 12px;">
        <strong style="font-size:1.05rem;">Tu carrito</strong>
        <button id="btn-empty-cart" style="border:1px solid var(--bordes);background:#fff;border-radius:10px;padding:6px 10px;cursor:pointer;">Vaciar carrito</button>
      </div>
    `;
    const rows = items.map(it => `
      <div class="cart-row" data-id="${it.id}" style="display:flex;align-items:center;gap:12px;border:1px solid var(--bordes);border-radius:12px;padding:10px;background:#fff;margin:8px 0;">
        <img src="${it.img}" alt="${it.title}" style="width:60px;height:60px;object-fit:cover;border-radius:10px;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;">${it.title}</div>
          <div style="color:var(--gris);font-size:.95rem;">${formatMXN(it.price)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="qty-btn" data-action="dec" aria-label="Disminuir" style="border:1px solid var(--bordes);background:#fff;border-radius:10px;padding:6px 10px;cursor:pointer;">−</button>
          <span style="min-width:24px;text-align:center;font-weight:700;">${it.qty}</span>
          <button class="qty-btn" data-action="inc" aria-label="Aumentar" style="border:1px solid var(--bordes);background:#fff;border-radius:10px;padding:6px 10px;cursor:pointer;">+</button>
        </div>
        <div style="width:110px;text-align:right;font-weight:800;">${formatMXN(it.price * it.qty)}</div>
        <button class="rm-btn" data-action="remove" aria-label="Eliminar" style="border:1px solid var(--bordes);background:#fff;border-radius:10px;padding:6px 10px;cursor:pointer;">Eliminar</button>
      </div>
    `).join('');
    const summary = `
      <div style="display:flex;justify-content:flex-end;margin-top:12px;">
        <div style="background:#fff;border:1px solid var(--bordes);border-radius:12px;padding:12px 16px;min-width:260px;">
          <div style="display:flex;justify-content:space-between;gap:12px;">
            <span style="color:var(--gris);">Subtotal</span>
            <strong>${formatMXN(subtotal(items))}</strong>
          </div>
          <div style="margin-top:10px;display:flex;gap:10px;">
            <a id="btn-go-checkout" class="btn btn-solid" href="#!" style="flex:1;text-align:center;">Continuar</a>
          </div>
        </div>
      </div>
    `;
    mount.innerHTML = headerRow + rows + summary;
  }

  // Acciones: agregar al carrito desde tarjetas
  document.addEventListener('click', function(e){
    const addBtn = e.target.closest('a.btn-solid');
    if(addBtn && addBtn.id !== 'btn-go-checkout'){
      const card = addBtn.closest('.card'); if(!card) return;
      e.preventDefault();
      const product = getProductDataFromCard(card);
      if(product.price > 0){ addToCart(product, 1); }
    }
  });

  // Acciones del carrito / checkout
  document.addEventListener('click', function(e){
    const row = e.target.closest('.cart-row');
    if(row){
      const id = row.getAttribute('data-id');
      const action = e.target.getAttribute('data-action');
      if(action){
        e.preventDefault();
        if(action === 'inc') changeQty(id, +1);
        if(action === 'dec') changeQty(id, -1);
        if(action === 'remove') removeItem(id);
        return;
      }
    }
    if(e.target && e.target.id === 'btn-empty-cart'){ e.preventDefault(); clearCart(); return; }
    if(e.target && e.target.id === 'btn-go-checkout'){ e.preventDefault(); openCheckoutModal(); }
  });

  /* ======================= CHECKOUT – MODAL (1 COLUMNA) ======================= */
  let checkoutBackdrop = null;
  let customerData = JSON.parse(localStorage.getItem('bs_customer_v1') || '{}');

  function ensureCheckoutModal(){
    if(checkoutBackdrop) return checkoutBackdrop;

    checkoutBackdrop = document.createElement('div');
    checkoutBackdrop.className = 'modal-backdrop';
    checkoutBackdrop.id = 'checkout-modal';
    checkoutBackdrop.setAttribute('aria-hidden','true');
    checkoutBackdrop.setAttribute('role','dialog');
    checkoutBackdrop.innerHTML = `
      <div class="modal" role="document">
        <header>
          <h3>Checkout</h3>
          <button class="close" id="checkout-close" aria-label="Cerrar">×</button>
        </header>
        <div class="content" id="checkout-content"><!-- step here --></div>
      </div>
    `;
    document.body.appendChild(checkoutBackdrop);

    // Eventos cerrar
    checkoutBackdrop.addEventListener('click', (e)=>{ if(e.target === checkoutBackdrop) closeCheckoutModal(); });
    checkoutBackdrop.querySelector('#checkout-close').addEventListener('click', closeCheckoutModal);
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeCheckoutModal(); });

    return checkoutBackdrop;
  }

  function openCheckoutModal(){
    if(loadCart().length === 0) return;
    ensureCheckoutModal();
    renderCheckoutStep1();
    checkoutBackdrop.classList.add('open');
    checkoutBackdrop.setAttribute('aria-hidden','false');
  }
  function closeCheckoutModal(){
    if(!checkoutBackdrop) return;
    checkoutBackdrop.classList.remove('open');
    checkoutBackdrop.setAttribute('aria-hidden','true');
  }

  // ===== PASO 1: Datos (Calle antes que CP) =====
  function renderCheckoutStep1(){
    const content = checkoutBackdrop.querySelector('#checkout-content');
    content.innerHTML = `
      <form id="checkout-form" class="co-card co-grid">
        <h4 class="co-title">Datos del cliente</h4>

        <label><strong>Nombre completo</strong><br>
          <input name="nombre" type="text" required class="co-input" value="${customerData.nombre || ''}">
        </label>

        <label><strong>Teléfono</strong><br>
          <input name="telefono" type="tel" required class="co-input" value="${customerData.telefono || ''}">
        </label>

        <label><strong>Correo electrónico</strong><br>
          <input name="email" type="email" required class="co-input" value="${customerData.email || ''}">
        </label>

        <label><strong>Calle y número</strong><br>
          <input name="calle" type="text" required class="co-input" value="${customerData.calle || ''}">
        </label>

        <label><strong>Colonia</strong><br>
          <input name="colonia" type="text" required class="co-input" value="${customerData.colonia || ''}">
        </label>

        <label><strong>Código Postal</strong><br>
          <input name="cp" type="text" inputmode="numeric" pattern="\\d{5}" maxlength="5" required class="co-input" value="${customerData.cp || ''}" placeholder="Ej. 77500">
        </label>

        <label><strong>Estado</strong><br>
          <input name="estado" type="text" required class="co-input" value="${customerData.estado || ''}">
        </label>

        <label><strong>Municipio / Alcaldía</strong><br>
          <input name="municipio" type="text" required class="co-input" value="${customerData.municipio || ''}">
        </label>

        <label><strong>Ciudad</strong><br>
          <input name="ciudad" type="text" required class="co-input" value="${customerData.ciudad || ''}">
        </label>

        <label><strong>Referencias</strong><br>
          <textarea name="referencias" rows="3" class="co-input">${customerData.referencias || ''}</textarea>
        </label>

        <div class="co-actions">
          <button type="submit" class="btn btn-solid co-btn-full" style="cursor:pointer;">Pagar</button>
        </div>
      </form>
    `;

    const form = content.querySelector('#checkout-form');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const fd = new FormData(form);
      customerData = {
        nombre: fd.get('nombre') || '',
        telefono: fd.get('telefono') || '',
        email: fd.get('email') || '',
        calle: fd.get('calle') || '',
        colonia: fd.get('colonia') || '',
        cp: fd.get('cp') || '',
        estado: fd.get('estado') || '',
        municipio: fd.get('municipio') || '',
        ciudad: fd.get('ciudad') || '',
        referencias: fd.get('referencias') || ''
      };
      localStorage.setItem('bs_customer_v1', JSON.stringify(customerData));
      renderCheckoutStep2();
    });
  }

  // ===== PASO 2: Resumen + envío $99 + "Finalizar compra" (Checkout Pro) =====
  function renderCheckoutStep2(){
    const itemsLocal = loadCart();
    const envio = ENVIO_FIJO;
    const sub = subtotal(itemsLocal);
    const total = sub + envio;

    const content = checkoutBackdrop.querySelector('#checkout-content');
    const rows = itemsLocal.map(it => `
      <div class="co-row">
        <img class="co-img" src="${it.img}" alt="${it.title}">
        <div class="co-meta">
          <div class="co-name">${it.title}</div>
          <div class="co-note">${formatMXN(it.price)} · x${it.qty}</div>
        </div>
        <div class="co-total">${formatMXN(it.price * it.qty)}</div>
      </div>
    `).join('');

    content.innerHTML = `
      <div class="co-card">
        <h4 class="co-title">Resumen de compra</h4>
        <div class="co-list">${rows || '<p class="co-sub">Tu carrito está vacío.</p>'}</div>
        <div class="co-summary">
          <div class="co-line"><span class="label">Subtotal</span><strong>${formatMXN(sub)}</strong></div>
          <div class="co-line"><span class="label">Envío</span><strong>${formatMXN(envio)}</strong></div>
          <div class="co-line total"><span class="label">Total</span><strong>${formatMXN(total)}</strong></div>
        </div>
      </div>

      <div class="co-card co-grid" style="margin-top:12px;">
        <h4 class="co-title">Datos de envío</h4>
        <div><strong>Nombre:</strong><br><span class="co-sub">${escapeHTML(customerData.nombre||'')}</span></div>
        <div><strong>Teléfono:</strong><br><span class="co-sub">${escapeHTML(customerData.telefono||'')}</span></div>
        <div><strong>Correo:</strong><br><span class="co-sub">${escapeHTML(customerData.email||'')}</span></div>
        <div><strong>Calle y número:</strong><br><span class="co-sub">${escapeHTML(customerData.calle||'')}</span></div>
        <div><strong>Colonia:</strong><br><span class="co-sub">${escapeHTML(customerData.colonia||'')}</span></div>
        <div><strong>Código Postal:</strong><br><span class="co-sub">${escapeHTML(customerData.cp||'')}</span></div>
        <div><strong>Estado:</strong><br><span class="co-sub">${escapeHTML(customerData.estado||'')}</span></div>
        <div><strong>Municipio:</strong><br><span class="co-sub">${escapeHTML(customerData.municipio||'')}</span></div>
        <div><strong>Ciudad:</strong><br><span class="co-sub">${escapeHTML(customerData.ciudad||'')}</span></div>
        <div style="grid-column:1/-1;"><strong>Referencias:</strong><br><span class="co-sub">${escapeHTML(customerData.referencias||'')}</span></div>

        <div class="co-actions" style="grid-column:1/-1; margin-top:8px;">
          <button id="btn-edit-data" class="btn btn-outline">Editar datos</button>
        </div>
      </div>

      <!-- Botón de checkout al final -->
      <div class="co-actions" style="margin-top:16px;">
        <button id="btn-finish" class="btn btn-solid co-btn-full">Finalizar compra</button>
      </div>
    `;

    content.querySelector('#btn-edit-data').addEventListener('click', function(e){
      e.preventDefault();
      renderCheckoutStep1();
    });
    content.querySelector('#btn-finish').addEventListener('click', async function(e){
      e.preventDefault();
      try{
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.textContent = 'Redirigiendo...';

        const items = itemsLocal.map(it => ({ title: it.title, qty: it.qty, price: it.price }));
        const payload = {
          items,
          shipping_cost: ENVIO_FIJO,
          customer: { nombre: customerData.nombre || '', telefono: customerData.telefono || '', email: customerData.email || '' }
        };

        const url = await createMPCheckout(payload);
        if(!url) throw new Error('No se recibió init_point');
        window.location.href = url; // Checkout Pro

      }catch(err){
        alert('No pudimos iniciar el pago. Revisa tu configuración.');
        console.error(err);
        e.currentTarget.disabled = false;
        e.currentTarget.textContent = 'Finalizar compra';
      }
    });
  }

  async function createMPCheckout(payload){
    const resp = await fetch('/api/checkout', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    if(!resp.ok){
      const err = await resp.json().catch(()=>({}));
      console.error('MP error:', err);
      return null;
    }
    const data = await resp.json();
    return data.init_point || null;
  }

  function escapeHTML(s){
    return String(s).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  /* ======================= ANIMACIONES EXTRA ======================= */
  const revealTargets = Array.from(document.querySelectorAll('.section, .card, .about'));
  revealTargets.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('reveal--visible');
        io.unobserve(entry.target);
      }
    });
  },{threshold:0.12});
  revealTargets.forEach(el => io.observe(el));

  const header = document.querySelector('header');
  const applyHeaderShadow = ()=> { if(!header) return; if(window.scrollY>2) header.classList.add('has-shadow'); else header.classList.remove('has-shadow'); };
  applyHeaderShadow();
  window.addEventListener('scroll', applyHeaderShadow, {passive:true});

  // Init
  updateBadge();
  renderCart();
})();
