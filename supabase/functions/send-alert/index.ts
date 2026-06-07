import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AlertPayload {
  type: "new_registration" | "geofence_request" | "absent" | "late" | "daily_summary";
  message: string;
  recipientIds?: string[];
  employeeName?: string;
  branchName?: string;
}

async function sendWhatsApp(to: string, message: string) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_NUMBER") || "whatsapp:+14155238886";

  if (!accountSid || !authToken) return { success: false, error: "Twilio not configured" };

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
    To: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
    Body: message,
  });

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return { success: resp.ok, status: resp.status };
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { success: false, error: "Resend not configured" };

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AttendX <noreply@attendx.app>",
      to: [to],
      subject,
      html,
    }),
  });

  return { success: resp.ok, status: resp.status };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const payload: AlertPayload = await req.json();

    // Get alert settings
    const { data: settings } = await supabase
      .from("alert_settings")
      .select("*")
      .limit(1)
      .single();

    const emails: string[] = settings?.admin_emails ?? [];
    const whatsappNumbers: string[] = settings?.admin_whatsapp_numbers ?? [];

    const results: { email: unknown[]; whatsapp: unknown[] } = { email: [], whatsapp: [] };

    const subject = `AttendX Alert: ${payload.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`;
    const htmlBody = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#0f172a">AttendX Notification</h2>
        <p style="color:#475569">${payload.message}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0"/>
        <p style="color:#94a3b8;font-size:12px">This is an automated alert from AttendX.</p>
      </div>
    `;

    for (const email of emails) {
      const r = await sendEmail(email, subject, htmlBody);
      results.email.push(r);
    }

    for (const number of whatsappNumbers) {
      const r = await sendWhatsApp(number, `*AttendX Alert*\n${payload.message}`);
      results.whatsapp.push(r);
    }

    // Log alert
    await supabase.from("admin_alerts").insert({
      type: payload.type,
      message: payload.message,
      recipient_ids: payload.recipientIds ?? [],
      sent_via: [
        ...(emails.length > 0 ? ["email"] : []),
        ...(whatsappNumbers.length > 0 ? ["whatsapp"] : []),
      ],
    });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
