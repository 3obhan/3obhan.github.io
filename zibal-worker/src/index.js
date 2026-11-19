export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "https://3obhan.github.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (url.pathname === "/api/zibal/request" && request.method === "POST") {
      if (!env.ZIBAL_MERCHANT || !env.ORDERS) {
        return Response.json({ error: "Payment service is not configured." }, { status: 503, headers: cors });
      }
      let body;
      try { body = await request.json(); } catch {
        return Response.json({ error: "Invalid request." }, { status: 400, headers: cors });
      }

      // Product and amount are fixed on the server; never trust a price from the browser.
      if (body.product !== "book-jadooye-jabehei") {
        return Response.json({ error: "Unknown product." }, { status: 400, headers: cors });
      }

      const orderId = crypto.randomUUID();
      const amount = 3000000; // 300,000 toman in rial
      const callbackUrl = `${url.origin}/api/zibal/callback?orderId=${orderId}`;

      const gatewayResponse = await fetch("https://gateway.zibal.ir/v1/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: env.ZIBAL_MERCHANT,
          amount,
          callbackUrl,
          description: "خرید کتاب جادوی جعبه‌ای"
        })
      });

      const result = await gatewayResponse.json().catch(() => ({}));
      if (!gatewayResponse.ok || result.result !== 100 || !result.trackId) {
        return Response.json({ error: "Could not create payment.", details: result }, { status: 502, headers: cors });
      }

      await env.ORDERS.put(orderId, JSON.stringify({
        product: "book-jadooye-jabehei",
        amount,
        trackId: String(result.trackId),
        status: "pending",
        createdAt: Date.now()
      }), { expirationTtl: 86400 });

      return Response.json({
        paymentUrl: `https://gateway.zibal.ir/start/${result.trackId}`
      }, { headers: cors });
    }

    if (url.pathname === "/api/zibal/callback" && request.method === "GET") {
      const orderId = url.searchParams.get("orderId");
      const success = url.searchParams.get("success");
      const trackId = url.searchParams.get("trackId");
      if (!orderId || !trackId || !env.ZIBAL_MERCHANT || !env.ORDERS) {
        return new Response("درخواست پرداخت نامعتبر است.", { status: 400 });
      }

      const rawOrder = await env.ORDERS.get(orderId);
      if (!rawOrder) return new Response("سفارش پیدا نشد یا منقضی شده است.", { status: 404 });
      const order = JSON.parse(rawOrder);
      if (order.status === "paid") return Response.redirect("https://3obhan.github.io/book/?payment=already-verified", 303);
      if (success !== "1" || String(order.trackId) !== String(trackId)) {
        return Response.redirect("https://3obhan.github.io/book/?payment=cancelled", 303);
      }

      const verifyResponse = await fetch("https://gateway.zibal.ir/v1/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchant: env.ZIBAL_MERCHANT, trackId: Number(trackId) })
      });
      const verified = await verifyResponse.json().catch(() => ({}));

      if (!verifyResponse.ok || verified.result !== 100 || Number(verified.amount) !== order.amount) {
        return new Response("تأیید پرداخت ناموفق بود. فایل خریداری‌شده آزاد نشد.", { status: 402 });
      }

      order.status = "paid";
      order.verifiedAt = Date.now();
      await env.ORDERS.put(orderId, JSON.stringify(order), { expirationTtl: 2592000 });
      // Download delivery is intentionally not enabled until the private book file is stored securely.
      return Response.redirect("https://3obhan.github.io/book/?payment=verified", 303);
    }

    return new Response("Not found", { status: 404 });
  }
};