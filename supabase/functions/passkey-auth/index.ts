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

// Normalize base64/base64url strings to base64url (no padding)
function normalizeBase64Url(value: string): string {
  // Accept base64url or base64. Convert to base64url without padding.
  return value
    .trim()
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
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
  const originHeader = req.headers.get('origin');
  const refererHeader = req.headers.get('referer');
  const derivedOrigin = !originHeader && refererHeader ? (() => {
    try {
      return new URL(refererHeader).origin;
    } catch {
      return null;
    }
  })() : null;

  const requestOrigin = originHeader || derivedOrigin;
  const corsHeaders = getCorsHeaders(requestOrigin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(requestOrigin);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, credential } = await req.json();

    // Health check action - no rate limiting, just confirm the function is running
    if (action === 'health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'passkey-auth' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rpId = new URL(requestOrigin || supabaseUrl).hostname;
    const rpName = 'Privxx';
    const clientIP = getClientIP(req);
    const auditContext = createAuditContext(req);

    // For registration actions, validate JWT and extract user server-side
    // This prevents clients from spoofing userId/email
    let authenticatedUser: { id: string; email: string } | null = null;
    const authHeader = req.headers.get('authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (!userError && user) {
        authenticatedUser = { id: user.id, email: user.email || '' };
      }
    }

    // Rate limit check for all actions (except health which is handled above)
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

    console.log(`[passkey-auth] Action: ${action}, Email: ${email || authenticatedUser?.email}, RP ID: ${rpId}`);

    switch (action) {
      case 'status': {
        // Check passkey status for the authenticated user
        if (!authenticatedUser) {
          // Unauthenticated status check - just return ok
          return new Response(JSON.stringify({ ok: true, credentialCount: 0 }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get credential count for authenticated user
        const { data: credentials, error: credError } = await supabase
          .from('passkey_credentials')
          .select('id')
          .eq('user_id', authenticatedUser.id);

        const credentialCount = credError ? 0 : (credentials?.length ?? 0);

        return new Response(JSON.stringify({ ok: true, credentialCount }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'registration-options': {
        // SECURITY: Require valid JWT for registration - do not trust client-provided userId/email
        if (!authenticatedUser) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const userId = authenticatedUser.id;
        const userEmail = authenticatedUser.email;

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
          userName: userEmail,
          userDisplayName: userEmail.split('@')[0],
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
          user_email: userEmail,
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
          metadata: { email: userEmail, rpId },
        });

        return new Response(JSON.stringify({ options }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'registration-verify': {
        // SECURITY: Require valid JWT for registration verification
        if (!authenticatedUser) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const userId = authenticatedUser.id;
        const userEmail = authenticatedUser.email;

        if (!credential) {
          return new Response(JSON.stringify({ error: 'credential required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify challenge exists and not expired
        const { data: challengeData, error: challengeError } = await supabase
          .from('passkey_challenges')
          .select('*')
          .eq('user_email', userEmail)
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
            expectedOrigin: getExpectedOrigins(requestOrigin),
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
          metadata: { email: userEmail, deviceType: credentialDeviceType || 'unknown', backedUp: credentialBackedUp },
        });

        console.log('[passkey-auth] Passkey registered successfully with cryptographic verification');
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'authentication-options': {
        // Generate authentication options
        // Email is optional for usernameless (discoverable) passkeys.

        const normalizedEmail = typeof email === 'string' && email.trim()
          ? email.trim().toLowerCase()
          : null;

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

        // If email is provided, narrow to that user's credentials
        let user: any | null = null;
        let allowCredentials: any[] | undefined;

        if (normalizedEmail) {
          const { data: userData } = await supabase.auth.admin.listUsers();
          user = userData?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail) ?? null;

          if (!user) {
            console.error('[passkey-auth] User not found:', normalizedEmail);
            return authFailedResponse;
          }

          const { data: credentials } = await supabase
            .from('passkey_credentials')
            .select('credential_id, transports')
            .eq('user_id', user.id);

          if (!credentials || credentials.length === 0) {
            return authFailedResponse;
          }

          allowCredentials = credentials.map((c: any) => ({
            id: c.credential_id,
            transports: c.transports || [],
          }));
        }

        // Generate authentication options using @simplewebauthn/server
        // If allowCredentials is omitted, the client can use discoverable credentials (no email needed).
        const options = await generateAuthenticationOptions({
          rpID: rpId,
          userVerification: 'preferred',
          ...(allowCredentials ? { allowCredentials } : {}),
        });

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        // Store challenge for verification
        await supabase.from('passkey_challenges').insert({
          user_email: normalizedEmail ?? '__discoverable__',
          challenge: options.challenge,
          type: 'authentication',
          expires_at: expiresAt,
        });

        return new Response(JSON.stringify({ options, userId: user?.id ?? null }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'authentication-verify': {
        // Verify authentication with cryptographic validation
        if (!credential) {
          return new Response(JSON.stringify({ error: 'credential required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const normalizedEmail = typeof email === 'string' && email.trim()
          ? email.trim().toLowerCase()
          : '__discoverable__';

        // Verify challenge exists and not expired
        const { data: challengeData, error: challengeError } = await supabase
          .from('passkey_challenges')
          .select('*')
          .eq('user_email', normalizedEmail)
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

        // Normalize incoming credential IDs (some browsers may send padded base64)
        const credentialId = normalizeBase64Url(String(credential.id));
        const rawId = credential.rawId ? normalizeBase64Url(String(credential.rawId)) : credentialId;
        const credentialForVerify = { ...credential, id: credentialId, rawId };

        // Find the credential by ID
        const { data: storedCred, error: credError } = await supabase
          .from('passkey_credentials')
          .select('*')
          .eq('credential_id', credentialId)
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
             response: credentialForVerify,
             expectedChallenge: challengeData.challenge,
             expectedOrigin: getExpectedOrigins(requestOrigin),
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
            metadata: { email: email ?? null, reason: 'verification_failed' },
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

        // Verify counter to prevent replay attacks.
        // Some authenticators legitimately return 0 for all assertions; treat (0 -> 0) as "counter not supported".
        const { authenticationInfo } = verification;
        const countersInUse = storedCred.counter > 0 || authenticationInfo.newCounter > 0;
        if (countersInUse && authenticationInfo.newCounter <= storedCred.counter) {
          console.error('[passkey-auth] Counter replay detected:', {
            storedCounter: storedCred.counter,
            newCounter: authenticationInfo.newCounter,
          });
          return new Response(JSON.stringify({ error: 'Authentication failed - replay detected' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update counter and last used
        // If counters aren't in use, keep stored counter unchanged.
        const nextCounter = countersInUse ? authenticationInfo.newCounter : storedCred.counter;
        await supabase.from('passkey_credentials').update({
          counter: nextCounter,
          last_used_at: new Date().toISOString(),
        }).eq('id', storedCred.id);

        // Clean up challenge
        await supabase.from('passkey_challenges').delete().eq('id', challengeData.id);

        // Resolve user's email from the credential's user_id
        const { data: userById } = await supabase.auth.admin.getUserById(storedCred.user_id);
        const resolvedEmail = userById?.user?.email;

        if (!resolvedEmail) {
          console.error('[passkey-auth] Failed to resolve user email for:', storedCred.user_id);
          return new Response(JSON.stringify({ error: 'Failed to create session' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Generate a magic link token for this user
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: resolvedEmail,
        });

        if (linkError || !linkData) {
          console.error('[passkey-auth] Failed to generate session:', linkError);
          return new Response(JSON.stringify({ error: 'Failed to create session' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Extract token_hash from link properties (this is the correct format for verifyOtp)
        // The hashed_token property is what verifyOtp expects
        const tokenHash = linkData.properties?.hashed_token;
        
        if (!tokenHash) {
          // Fallback: extract from action_link URL if hashed_token not available
          const url = new URL(linkData.properties.action_link);
          const urlToken = url.searchParams.get('token');
          if (!urlToken) {
            console.error('[passkey-auth] No token found in generated link');
            return new Response(JSON.stringify({ error: 'Failed to create session' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Log successful authentication
          await logAuditEvent(supabase, {
            userId: storedCred.user_id,
            eventType: 'passkey_auth_success',
            success: true,
            ...auditContext,
            metadata: { email: resolvedEmail },
          });

          console.log('[passkey-auth] Authentication successful with cryptographic verification for:', storedCred.user_id);
          return new Response(JSON.stringify({
            success: true,
            token: urlToken,
            email: resolvedEmail,
            userId: storedCred.user_id,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Log successful authentication
        await logAuditEvent(supabase, {
          userId: storedCred.user_id,
          eventType: 'passkey_auth_success',
          success: true,
          ...auditContext,
          metadata: { email: resolvedEmail },
        });

        console.log('[passkey-auth] Authentication successful with cryptographic verification for:', storedCred.user_id);
        return new Response(JSON.stringify({
          success: true,
          tokenHash,
          email: resolvedEmail,
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