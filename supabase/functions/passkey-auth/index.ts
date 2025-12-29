import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout after too many attempts

// Simple base64url encoding/decoding
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

function generateChallenge(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, credential, userId } = await req.json();
    const rpId = new URL(req.headers.get('origin') || supabaseUrl).hostname;
    const rpName = 'Privxx';
    const clientIP = getClientIP(req);

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

        const challenge = generateChallenge();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

        // Store challenge
        await supabase.from('passkey_challenges').insert({
          user_email: email,
          challenge,
          type: 'registration',
          expires_at: expiresAt,
        });

        const options = {
          challenge,
          rp: { name: rpName, id: rpId },
          user: {
            id: base64UrlEncode(new TextEncoder().encode(userId)),
            name: email,
            displayName: email.split('@')[0],
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },   // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          timeout: 60000,
          authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
          },
          attestation: 'none',
          excludeCredentials: (existingCreds || []).map(c => ({
            id: c.credential_id,
            type: 'public-key',
          })),
        };

        return new Response(JSON.stringify({ options }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'registration-verify': {
        // Verify registration and store credential
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

        // Store the credential
        const { error: insertError } = await supabase.from('passkey_credentials').insert({
          user_id: userId,
          credential_id: credential.id,
          public_key: credential.publicKey,
          counter: credential.counter || 0,
          device_type: credential.deviceType || 'unknown',
          backed_up: credential.backedUp || false,
          transports: credential.transports || [],
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

        console.log('[passkey-auth] Passkey registered successfully');
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
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        const user = userData?.users?.find(u => u.email === email);

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
          // Return same error as "no passkeys" to prevent enumeration
          return authFailedResponse;
        }

        // Get user's passkeys
        const { data: credentials } = await supabase
          .from('passkey_credentials')
          .select('credential_id, transports')
          .eq('user_id', user.id);

        if (!credentials || credentials.length === 0) {
          // Same generic error to prevent enumeration
          return authFailedResponse;
        }

        const challenge = generateChallenge();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        // Store challenge
        await supabase.from('passkey_challenges').insert({
          user_email: email,
          challenge,
          type: 'authentication',
          expires_at: expiresAt,
        });

        const options = {
          challenge,
          rpId,
          timeout: 60000,
          userVerification: 'preferred',
          allowCredentials: credentials.map(c => ({
            id: c.credential_id,
            type: 'public-key',
            transports: c.transports || [],
          })),
        };

        return new Response(JSON.stringify({ options, userId: user.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'authentication-verify': {
        // Verify authentication and create session
        if (!credential || !email) {
          return new Response(JSON.stringify({ error: 'credential and email required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify challenge
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

        // Find the credential
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

        // Update counter and last used
        await supabase.from('passkey_credentials').update({
          counter: credential.counter || storedCred.counter + 1,
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

        console.log('[passkey-auth] Authentication successful for:', email);
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