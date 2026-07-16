// Edge Function: envía un correo de confirmación cuando llega una inscripción FIEB.
// Se dispara con un Database Webhook (INSERT en public.fieb_inscripciones).
//
// Secrets requeridos (Edge Functions > Secrets):
//   BREVO_API_KEY   - API key de Brevo (https://app.brevo.com > Settings > API Keys)
//   SENDER_EMAIL    - correo remitente verificado en Brevo (ej. contacto@johnferlaverde.com o tu gmail verificado)
//   SENDER_NAME     - nombre del remitente (ej. "FIEB - Festival Internacional de Eufonios y Bombardinos")
//   FIEB_WEBHOOK_SECRET - cadena secreta inventada por ti; debe coincidir con el header x-fieb-secret del webhook

Deno.serve(async (req) => {
  try {
    // Seguridad: solo aceptar llamadas del webhook (comparte el secreto)
    const secret = Deno.env.get("FIEB_WEBHOOK_SECRET");
    if (secret && req.headers.get("x-fieb-secret") !== secret) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
    }

    const payload = await req.json();
    if (payload.type !== "INSERT" || payload.table !== "fieb_inscripciones") {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const r = payload.record ?? {};
    if (!r.correo || r.acepta_datos !== true) {
      // Sin correo o sin autorización de datos: no se envía nada.
      return new Response(JSON.stringify({ skipped: true, reason: "sin correo o sin consentimiento" }), { status: 200 });
    }

    const nombre = String(r.nombre ?? "").split(/\s+/)[0] || "músico";
    const instrumento = r.instrumento ? String(r.instrumento).toLowerCase() : "tu instrumento";

    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1A2744;">
        <div style="background: #1A2744; padding: 28px 24px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #F4EDE0; margin: 0; font-size: 22px; letter-spacing: 1px;">FIEB</h1>
          <p style="color: #D49A2E; margin: 6px 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
            Festival Internacional de Eufonios y Bombardinos
          </p>
        </div>
        <div style="background: #F4EDE0; padding: 28px 24px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">¡Hola, ${nombre}!</p>
          <p style="font-size: 15px; line-height: 1.6;">
            Recibimos tu inscripción al <strong>FIEB</strong> con ${instrumento}.
            Muy pronto te contactaremos con los detalles de fechas, sede, niveles y cupos.
          </p>
          <p style="font-size: 15px; line-height: 1.6;">
            Mientras tanto, síguenos en la página de Facebook del festival para no perderte ninguna novedad.
          </p>
          <p style="font-size: 14px; color: #4A5168; margin-top: 24px;">
            — John Fernando Laverde<br>
            Organizador · FIEB
          </p>
          <hr style="border: 0; border-top: 1px solid rgba(26,39,68,0.15); margin: 20px 0;">
          <p style="font-size: 11px; color: #6B7288; line-height: 1.5;">
            Recibes este correo porque te inscribiste en el festival y autorizaste el tratamiento de tus datos
            (Ley 1581 de 2012). Si fue un error, responde a este correo y eliminaremos tu registro.
          </p>
        </div>
      </div>
    `;

    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": Deno.env.get("BREVO_API_KEY") ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: Deno.env.get("SENDER_NAME") ?? "FIEB",
          email: Deno.env.get("SENDER_EMAIL") ?? "",
        },
        to: [{ email: r.correo, name: r.nombre ?? undefined }],
        subject: "¡Recibimos tu inscripción al FIEB! 🎺",
        htmlContent: html,
      }),
    });

    const result = await resp.text();
    if (!resp.ok) {
      console.error("Brevo error:", resp.status, result);
      return new Response(JSON.stringify({ error: "fallo el envio", detail: result }), { status: 502 });
    }

    return new Response(JSON.stringify({ sent: true }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
