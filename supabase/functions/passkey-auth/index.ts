import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "https://esm.sh/@simplewebauthn/server@11.0.0";
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts";
import { logAuditEvent, createAuditContext } from "../_shared/audit.ts";
// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout after too many attempts

// Simple base64url encoding/decoding for user ID
function base64UrlEncode(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Get expected origin(s) for WebAuthn verification
function getExpectedOrigins(origin: string | null): string[] {
  const origins: string[] = [];
  if (origin) {
    origins.push(origin);
  }
  // Add known Lovable preview origins
  origins.push('https://privxx.app');
  // Add localhost for development
  origins.push('http://localhost:5173');
  origins.push('http://localhost:3000');
  return origins;
}

// Get client IP from request headers
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

// Check rate limit and return whether request is allowed
async function checkRateLimit(
  supabase: any,
  identifier: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = new Date();
  
  // Check existing rate limit entry
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('action', action)
    .maybeSingle();

  if (existing) {
    // Check if locked out
    if (existing.locked_until && new Date(existing.locked_until) > now) {
      const retryAfter = Math.ceil((new Date(existing.locked_until).getTime() - now.getTime()) / 1000);
      return { allowed: false, retryAfter };
    }

    // Check if within rate limit window
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
    if (new Date(existing.first_attempt_at) > windowStart) {
      // Still in window
      if (existing.attempts >= MAX_REQUESTS_PER_WINDOW) {
        // Lock out the user
        const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
        await supabase
          .from('rate_limits')
          .update({ locked_until: lockedUntil.toISOString(), last_attempt_at: now.toISOString() })
          .eq('id', existing.id);
        
        return { allowed: false, retryAfter: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
      }

      // Increment attempts
      await supabase
        .from('rate_limits')
        .update({ attempts: existing.attempts + 1, last_attempt_at: now.toISOString() })
        .eq('id', existing.id);
    } else {
      // Window expired, reset
      await supabase
        .from('rate_limits')
        .update({ 
          attempts: 1, 
          first_attempt_at: now.toISOString(), 
          last_attempt_at: now.toISOString(),
          locked_until: null 
        })
        .eq('id', existing.id);
    }
  } else {
    // Create new rate limit entry
    await supabase.from('rate_limits').insert({
      identifier,
      action,
      attempts: 1,
      first_attempt_at: now.toISOString(),
      last_attempt_at: now.toISOString(),
    });
  }

  return { allowed: true };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(origin);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, credential, userId } = await req.json();
    const rpId = new URL(origin || supabaseUrl).hostname;
    const rpName = 'Privxx';
    const clientIP = getClientIP(req);
    const auditContext = createAuditContext(req);

    // Rate limit check for all actions
    const rateLimitIdentifier = email ? `${clientIP}_${email}` : clientIP;
    const rateLimit = await checkRateLimit(supabase, rateLimitIdentifier, `passkey_${action}`);
    
    if (!rateLimit.allowed) {
      console.log(`[passkey-auth] Rate limit exceeded for: ${rateLimitIdentifier}`);
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimit.retryAfter || 60)
        },
      });
    }

    console.log(`[passkey-auth] Action: ${action}, Email: ${email}, RP ID: ${rpId}`);

    switch (action) {
      case 'registration-options': {
        // Generate registration options for a logged-in user
        if (!userId || !email) {
          return new Response(JSON.stringify({ error: 'userId and email required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get existing credentials for this user
        const { data: existingCreds } = await supabase
          .from('passkey_credentials')
          .select('credential_id')
          .eq('user_id', userId);

        // Generate registration options using @simplewebauthn/server
        const options = await generateRegistrationOptions({
          rpName,
          rpID: rpId,
          userID: new TextEncoder().encode(userId),
          userName: email,
          userDisplayName: email.split('@')[0],
          attestationType: 'none',
          excludeCredentials: (existingCreds || []).map(c => ({
            id: c.credential_id,
          })),
          authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
          },
        });

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

        // Store challenge for verification
        await supabase.from('passkey_challenges').insert({
          user_email: email,
          challenge: options.challenge,
          type: 'registration',
          expires_at: expiresAt,
        });

        // Log registration start
        await logAuditEvent(supabase, {
          userId,
          eventType: 'passkey_registration_start',
          success: true,
          ...auditContext,
          metadata: { email, rpId },
        });

        return new Response(JSON.stringify({ options }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'registration-verify': {
        // Verify registration with cryptographic validation
        if (!credential || !userId || !email) {
          return new Response(JSON.stringify({ error: 'credential, userId, email required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify challenge exists and not expired
        const { data: challengeData, error: challengeError } = await supabase
          .from('passkey_challenges')
          .select('*')
          .eq('user_email', email)
          .eq('type', 'registration')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (challengeError || !challengeData) {
          console.error('[passkey-auth] Challenge not found or expired:', challengeError);
          return new Response(JSON.stringify({ error: 'Challenge expired or not found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Perform cryptographic verification of the registration response
        let verification;
        try {
          verification = await verifyRegistrationResponse({
            response: credential,
            expectedChallenge: challengeData.challenge,
            expectedOrigin: getExpectedOrigins(origin),
            expectedRPID: rpId,
          });
        } catch (verifyError) {
          console.error('[passkey-auth] Registration verification failed:', verifyError);
          return new Response(JSON.stringify({ error: 'Registration verification failed' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!verification.verified || !verification.registrationInfo) {
          console.error('[passkey-auth] Registration not verified');
          return new Response(JSON.stringify({ error: 'Registration verification failed' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { credential: verifiedCredential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

        // Convert Uint8Array to base64url string for storage
        const credentialIdStr = typeof verifiedCredential.id === 'string' 
          ? verifiedCredential.id 
          : base64UrlEncode(new Uint8Array(verifiedCredential.id));
        const publicKeyStr = typeof verifiedCredential.publicKey === 'string'
          ? verifiedCredential.publicKey
          : base64UrlEncode(new Uint8Array(verifiedCredential.publicKey));

        // Store the verified credential
        const { error: insertError } = await supabase.from('passkey_credentials').insert({
          user_id: userId,
          credential_id: credentialIdStr,
          public_key: publicKeyStr,
          counter: verifiedCredential.counter,
          device_type: credentialDeviceType || 'unknown',
          backed_up: credentialBackedUp || false,
          transports: credential.response?.transports || [],
        });

        if (insertError) {
          console.error('[passkey-auth] Failed to store credential:', insertError);
          return new Response(JSON.stringify({ error: 'Failed to store credential' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Clean up challenge
        await supabase.from('passkey_challenges').delete().eq('id', challengeData.id);

        // Log successful registration
        await logAuditEvent(supabase, {
          userId,
          eventType: 'passkey_registration_complete',
          success: true,
          ...auditContext,
          metadata: { email, deviceType: credentialDeviceType || 'unknown', backedUp: credentialBackedUp },
        });

        console.log('[passkey-auth] Passkey registered successfully with cryptographic verification');
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'authentication-options': {
        // Generate authentication options
        if (!email) {
          return new Response(JSON.stringify({ error: 'email required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Find user by email
        const { data: userData } = await supabase.auth.admin.listUsers();
        const user = userData?.users?.find((u: any) => u.email === email);

        // Generic error message to prevent user enumeration
        // Add consistent delay to prevent timing attacks
        const delay = 100 + Math.random() * 100; // 100-200ms random delay
        await new Promise(resolve => setTimeout(resolve, delay));

        const authFailedResponse = new Response(
          JSON.stringify({ error: 'Authentication failed' }), 
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

        if (!user) {
          console.error('[passkey-auth] User not found:', email);
          return authFailedResponse;
        }

        // Get user's passkeys
        const { data: credentials } = await supabase
          .from('passkey_credentials')
          .select('credential_id, transports')
          .eq('user_id', user.id);

        if (!credentials || credentials.length === 0) {
          return authFailedResponse;
        }

        // Generate authentication options using @simplewebauthn/server
        const options = await generateAuthenticationOptions({
          rpID: rpId,
          userVerification: 'preferred',
          allowCredentials: credentials.map((c: any) => ({
            id: c.credential_id,
            transports: c.transports || [],
          })),
        });

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        // Store challenge for verification
        await supabase.from('passkey_challenges').insert({
          user_email: email,
          challenge: options.challenge,
          type: 'authentication',
          expires_at: expiresAt,
        });

        return new Response(JSON.stringify({ options, userId: user.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'authentication-verify': {
        // Verify authentication with cryptographic validation
        if (!credential || !email) {
          return new Response(JSON.stringify({ error: 'credential and email required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify challenge exists and not expired
        const { data: challengeData, error: challengeError } = await supabase
          .from('passkey_challenges')
          .select('*')
          .eq('user_email', email)
          .eq('type', 'authentication')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (challengeError || !challengeData) {
          return new Response(JSON.stringify({ error: 'Challenge expired or not found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Find the credential by ID
        const { data: storedCred, error: credError } = await supabase
          .from('passkey_credentials')
          .select('*')
          .eq('credential_id', credential.id)
          .single();

        if (credError || !storedCred) {
          return new Response(JSON.stringify({ error: 'Credential not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Perform cryptographic verification of the authentication response
        let verification;
        try {
          verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge: challengeData.challenge,
            expectedOrigin: getExpectedOrigins(origin),
            expectedRPID: rpId,
            credential: {
              id: storedCred.credential_id,
              publicKey: base64UrlDecode(storedCred.public_key),
              counter: storedCred.counter,
            },
          });
        } catch (verifyError) {
          console.error('[passkey-auth] Authentication verification failed:', verifyError);
          // Log failed authentication
          await logAuditEvent(supabase, {
            userId: storedCred.user_id,
            eventType: 'passkey_auth_failure',
            success: false,
            ...auditContext,
            metadata: { email, reason: 'verification_failed' },
          });
          return new Response(JSON.stringify({ error: 'Authentication verification failed' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!verification.verified) {
          console.error('[passkey-auth] Authentication not verified');
          return new Response(JSON.stringify({ error: 'Authentication verification failed' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify counter to prevent replay attacks
        const { authenticationInfo } = verification;
        if (authenticationInfo.newCounter <= storedCred.counter) {
          console.error('[passkey-auth] Counter replay detected:', {
            storedCounter: storedCred.counter,
            newCounter: authenticationInfo.newCounter,
          });
          return new Response(JSON.stringify({ error: 'Authentication failed - replay detected' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update counter and last used with verified counter
        await supabase.from('passkey_credentials').update({
          counter: authenticationInfo.newCounter,
          last_used_at: new Date().toISOString(),
        }).eq('id', storedCred.id);

        // Clean up challenge
        await supabase.from('passkey_challenges').delete().eq('id', challengeData.id);

        // Generate a magic link token for this user
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
        });

        if (linkError || !linkData) {
          console.error('[passkey-auth] Failed to generate session:', linkError);
          return new Response(JSON.stringify({ error: 'Failed to create session' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Extract token from link
        const url = new URL(linkData.properties.action_link);
        const token = url.searchParams.get('token');
        const tokenType = url.searchParams.get('type');

        // Log successful authentication
        await logAuditEvent(supabase, {
          userId: storedCred.user_id,
          eventType: 'passkey_auth_success',
          success: true,
          ...auditContext,
          metadata: { email },
        });

        console.log('[passkey-auth] Authentication successful with cryptographic verification for:', email);
        return new Response(JSON.stringify({ 
          success: true, 
          token,
          tokenType,
          userId: storedCred.user_id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[passkey-auth] Error:', errorMessage);
    return new Response(JSON.stringify({ error: 'An internal error occurred. Please try again later.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});