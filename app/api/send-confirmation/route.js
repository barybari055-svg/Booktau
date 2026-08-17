import { createClient } from '@supabase/supabase-js';

// Server-only secrets -- deliberately NOT prefixed NEXT_PUBLIC_, so these
// never reach the browser bundle. Only this route (and Next's server
// runtime) can see them.
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

function isTwilioConfigured() {
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { booking_id, phone } = body || {};
  if (!booking_id || !phone) {
    return Response.json({ error: 'missing booking_id or phone' }, { status: 400 });
  }

  // Not configured yet (e.g. local dev, or before Twilio is set up in
  // production) -- decline quietly rather than erroring. A missing
  // confirmation SMS should never be treated as a failed booking.
  if (!isTwilioConfigured()) {
    console.log('[send-confirmation] Twilio not configured, skipping.');
    return Response.json({ sent: false, reason: 'not_configured' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[send-confirmation] Supabase env vars missing.');
    return Response.json({ sent: false, reason: 'not_configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Never trust client-supplied message content. The only thing we trust
  // from the request is "which booking, which phone" -- the actual text
  // is always built from what the database says is true. A booking_id
  // with the wrong phone (or one that doesn't exist) returns nothing here,
  // which is what stops this route from being usable to text arbitrary
  // numbers.
  const { data, error } = await supabase
    .rpc('get_booking_for_confirmation', { p_booking_id: booking_id, p_phone: phone })
    .maybeSingle();

  if (error || !data) {
    return Response.json({ sent: false, reason: 'not_found' }, { status: 404 });
  }

  const message = `Booktau: your ${data.service_name} at ${data.shop_name} is confirmed for ${data.booking_date} at ${data.booking_time}.`;

  try {
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    const params = new URLSearchParams({ To: phone, From: TWILIO_FROM_NUMBER, Body: message });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    if (!res.ok) {
      console.error('[send-confirmation] Twilio error:', res.status, await res.text());
      return Response.json({ sent: false, reason: 'provider_error' }, { status: 502 });
    }

    return Response.json({ sent: true });
  } catch (err) {
    console.error('[send-confirmation] Failed to send SMS:', err);
    return Response.json({ sent: false, reason: 'exception' }, { status: 500 });
  }
}
