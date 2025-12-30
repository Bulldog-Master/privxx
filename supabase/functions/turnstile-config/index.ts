/**
 * Turnstile Config Edge Function
 * 
 * Returns the Turnstile site key for frontend widget initialization.
 * The site key is public/publishable, safe to expose to clients.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreflightResponse(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    const siteKey = Deno.env.get("TURNSTILE_SITE_KEY");
    
    if (!siteKey) {
      console.warn("[turnstile-config] TURNSTILE_SITE_KEY not configured");
      return new Response(
        JSON.stringify({ siteKey: null, configured: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ siteKey, configured: true }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          // Cache for 1 hour - site key doesn't change often
          "Cache-Control": "public, max-age=3600",
        } 
      }
    );
  } catch (error) {
    console.error("[turnstile-config] Error:", error);
    return new Response(
      JSON.stringify({ siteKey: null, configured: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
