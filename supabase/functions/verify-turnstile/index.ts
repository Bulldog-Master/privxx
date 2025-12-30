/**
 * Cloudflare Turnstile Verification Edge Function
 * 
 * Server-side verification of Turnstile CAPTCHA tokens.
 * Called before authentication to prevent automated attacks.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Import shared CORS handler
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface VerifyRequest {
  token: string;
}

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreflightResponse(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    // Only allow POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: VerifyRequest = await req.json();
    const { token } = body;

    if (!token) {
      console.error("[verify-turnstile] Missing token in request");
      return new Response(
        JSON.stringify({ success: false, error: "Missing verification token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!secretKey) {
      console.error("[verify-turnstile] TURNSTILE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify token with Cloudflare
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);

    // Optionally include client IP for additional security
    const clientIP = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for");
    if (clientIP) {
      formData.append("remoteip", clientIP.split(",")[0].trim());
    }

    console.log("[verify-turnstile] Verifying token with Cloudflare");

    const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result: TurnstileResponse = await verifyResponse.json();

    if (!result.success) {
      console.warn("[verify-turnstile] Verification failed:", result["error-codes"]);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "CAPTCHA verification failed. Please try again." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[verify-turnstile] Token verified successfully for hostname:", result.hostname);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[verify-turnstile] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An internal error occurred. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
