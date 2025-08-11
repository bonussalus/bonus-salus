import mercadopago from "mercadopago";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN
  });

  try {
    const preference = {
      items: req.body.items, // array de productos del carrito
      back_urls: {
        success: `${req.headers.origin}/checkout/success.html`,
        failure: `${req.headers.origin}/checkout/failure.html`,
        pending: `${req.headers.origin}/checkout/pending.html`
      },
      auto_return: "approved"
    };

    const response = await mercadopago.preferences.create(preference);
    res.status(200).json({ id: response.body.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando preferencia de pago" });
  }
}
