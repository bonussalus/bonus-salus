// api/checkout.js
// Crea una preferencia en Mercado Pago y devuelve el init_point
// Requiere variable de entorno: MP_ACCESS_TOKEN

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) return res.status(500).json({ error: 'Falta MP_ACCESS_TOKEN en variables de entorno' });

    const { items = [], shipping_cost = 0, customer = {} } = req.body || {};

    const mpItems = items.map(p => ({
      title: p.title || 'Producto',
      quantity: Number(p.qty || 1),
      currency_id: 'MXN',
      unit_price: Number(p.price || 0)
    }));

    const prefBody = {
      items: mpItems,
      shipments: { cost: Number(shipping_cost || 0), mode: 'not_specified' },
      payer: {
        name: customer.nombre || '',
        email: customer.email || '',
        phone: { area_code: '', number: customer.telefono || '' }
      },
      back_urls: {
        success: 'https://TU_DOMINIO.vercel.app/checkout/success.html',
        pending: 'https://TU_DOMINIO.vercel.app/checkout/pending.html',
        failure: 'https://TU_DOMINIO.vercel.app/checkout/failure.html'
      },
      auto_return: 'approved',
      statement_descriptor: 'BONUS SALUS',
      binary_mode: true
    };

    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prefBody)
    });

    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: data });

    res.status(200).json({ init_point: data.init_point || data.sandbox_init_point || '' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
}
