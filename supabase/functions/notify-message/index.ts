import "@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const TO_EMAIL = 'silviagb2@gmail.com';

Deno.serve(async (req) => {
  const payload = await req.json();
  const record = payload.record;

  const { session_id, content, created_at } = record;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Portfolio <onboarding@resend.dev>',
      to: TO_EMAIL,
      subject: `Nuevo mensaje en tu portfolio`,
      html: `
        <p><strong>Session ID:</strong> ${session_id}</p>
        <p><strong>Mensaje:</strong> ${content}</p>
        <p><strong>Fecha:</strong> ${created_at}</p>
      `,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
