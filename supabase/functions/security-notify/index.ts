/**
 * Security Notification Edge Function
 * 
 * Sends email notifications for security-related changes using Resend.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  event_type: 
    | "password_changed"
    | "2fa_enabled"
    | "2fa_disabled"
    | "passkey_added"
    | "passkey_removed"
    | "recovery_codes_regenerated"
    | "email_changed"
    | "session_timeout_changed"
    | "new_device_login";
  metadata?: Record<string, unknown>;
}

const eventTemplates: Record<string, { subject: string; heading: string; message: string }> = {
  password_changed: {
    subject: "Your Privxx password was changed",
    heading: "Password Changed",
    message: "Your account password was successfully changed. If you did not make this change, please secure your account immediately.",
  },
  "2fa_enabled": {
    subject: "Two-Factor Authentication enabled on Privxx",
    heading: "2FA Enabled",
    message: "Two-Factor Authentication has been enabled on your account. Your account is now more secure.",
  },
  "2fa_disabled": {
    subject: "Two-Factor Authentication disabled on Privxx",
    heading: "2FA Disabled",
    message: "Two-Factor Authentication has been disabled on your account. We recommend keeping 2FA enabled for maximum security.",
  },
  passkey_added: {
    subject: "New passkey added to your Privxx account",
    heading: "Passkey Added",
    message: "A new passkey was registered to your account. You can now use it to sign in without a password.",
  },
  passkey_removed: {
    subject: "Passkey removed from your Privxx account",
    heading: "Passkey Removed",
    message: "A passkey was removed from your account. If you did not make this change, please secure your account immediately.",
  },
  recovery_codes_regenerated: {
    subject: "Recovery codes regenerated on Privxx",
    heading: "Recovery Codes Regenerated",
    message: "Your 2FA recovery codes have been regenerated. Your old codes are no longer valid. Please save your new codes securely.",
  },
  email_changed: {
    subject: "Email address changed on Privxx",
    heading: "Email Changed",
    message: "Your account email address was changed. If you did not make this change, please contact support immediately.",
  },
  session_timeout_changed: {
    subject: "Session timeout settings changed on Privxx",
    heading: "Session Settings Changed",
    message: "Your session timeout settings have been updated.",
  },
  new_device_login: {
    subject: "New device sign-in to your Privxx account",
    heading: "New Device Sign-In",
    message: "Your account was accessed from a new device. If this was you, you can ignore this email. If you don't recognize this activity, please secure your account immediately.",
  },
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { event_type, metadata }: NotifyRequest = await req.json();

    if (!event_type || !eventTemplates[event_type]) {
      return new Response(
        JSON.stringify({ error: "Invalid event_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user's notification preferences
    const { data: prefData } = await supabase
      .from("notification_preferences")
      .select("security_alerts, new_device_login")
      .eq("user_id", user.id)
      .maybeSingle();

    // If preference exists and security_alerts is false, skip sending (except for new_device_login which has its own toggle)
    if (event_type === "new_device_login") {
      if (prefData && prefData.new_device_login === false) {
        console.log(`User ${user.id} has new device login notifications disabled, skipping`);
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: "notifications_disabled" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (prefData && prefData.security_alerts === false) {
      console.log(`User ${user.id} has security email notifications disabled, skipping`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "notifications_disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const template = eventTemplates[event_type];
    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e5e5e5; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #121218; border-radius: 12px; border: 1px solid #2a2a35; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px;">🔐 Privxx Security Alert</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 16px 0; color: #f5f5f5; font-size: 20px;">${template.heading}</h2>
      <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
        ${template.message}
      </p>
      <div style="background-color: #1a1a22; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #71717a; font-size: 14px;">
          <strong style="color: #a1a1aa;">Account:</strong> ${user.email}<br>
          <strong style="color: #a1a1aa;">Time:</strong> ${timestamp}
        </p>
      </div>
      <p style="margin: 0; color: #71717a; font-size: 14px;">
        If you did not make this change, please secure your account immediately by changing your password and reviewing your security settings.
      </p>
    </div>
    <div style="background-color: #0f0f14; padding: 20px; text-align: center; border-top: 1px solid #2a2a35;">
      <p style="margin: 0; color: #52525b; font-size: 12px;">
        This is an automated security notification from Privxx.<br>
        Privacy-first. Metadata-protected. Quantum-resistant.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    console.log(`Sending security notification: ${event_type} to ${user.email}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Privxx Security <security@resend.dev>",
        to: [user.email!],
        subject: template.subject,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send notification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    // Log to audit
    try {
      await supabase.rpc("log_audit_event", {
        _user_id: user.id,
        _event_type: "profile_update",
        _success: true,
        _metadata: { security_notification: event_type, ...metadata },
      });
    } catch (auditError) {
      console.error("Audit log error (non-fatal):", auditError);
    }

    return new Response(
      JSON.stringify({ success: true, message_id: emailData?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Security notify error:", error);
    return new Response(
      JSON.stringify({ error: "An internal error occurred. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
