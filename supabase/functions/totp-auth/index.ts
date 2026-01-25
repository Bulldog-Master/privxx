import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts";
import { logAuditEvent, createAuditContext } from "../_shared/audit.ts";

// Rate limiting and lockout configuration
const MAX_FAILED_ATTEMPTS = 5; // Lock after 5 failed attempts
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute
const TOTP_CODE_VALIDITY_WINDOW = 1; // Allow 1 step before/after current time
const TOKEN_REUSE_PREVENTION_WINDOW_MS = 60 * 1000; // 60 seconds to prevent token reuse

// Simple base32 encoding/decoding for TOTP secrets
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Constant-time string comparison to prevent timing attacks
 * Returns true if strings are equal, false otherwise
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do comparison to maintain constant time for equal-length inputs
    let result = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      result |= (a.charCodeAt(i % a.length) || 0) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validate TOTP code format strictly
 * Only allows exactly 6 numeric digits
 */
function isValidTOTPCode(code: unknown): code is string {
  if (typeof code !== 'string') return false;
  if (code.length !== 6) return false;
  return /^[0-9]{6}$/.test(code);
}

/**
 * Validate backup code format
 * Format: XXXX-XXXX (hex characters)
 */
function isValidBackupCode(code: unknown): code is string {
  if (typeof code !== 'string') return false;
  // Accept both with and without hyphen
  const normalized = code.replace('-', '').toUpperCase();
  if (normalized.length !== 8) return false;
  return /^[0-9A-F]{8}$/.test(normalized);
}

function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < bytes.length; i += 5) {
    const chunk = bytes.slice(i, i + 5);
    const bits = (chunk[0] << 32) | (chunk[1] << 24) | (chunk[2] << 16) | (chunk[3] << 8) | chunk[4];
    for (let j = 0; j < 8 && (i * 8 / 5 + j) < 32; j++) {
      const index = (bits >> (35 - j * 5)) & 0x1f;
      result += BASE32_CHARS[index];
    }
  }
  return result.substring(0, 32);
}

function base32Decode(str: string): Uint8Array {
  str = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const output: number[] = [];
  let bits = 0;
  let value = 0;
  
  for (const char of str) {
    value = (value << 5) | BASE32_CHARS.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      output.push((value >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer;
  const messageBuffer = message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength) as ArrayBuffer;
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
  return new Uint8Array(signature);
}

/**
 * Generate TOTP code for a specific time counter
 */
async function generateTOTPForCounter(secret: string, counter: number): Promise<string> {
  const key = base32Decode(secret);
  
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, counter, false);
  
  const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  
  return (code % 1000000).toString().padStart(6, '0');
}

/**
 * Verify TOTP with constant-time comparison and counter tracking
 * Returns the matched counter if valid, null otherwise
 */
async function verifyTOTPWithCounter(
  secret: string, 
  token: string, 
  window = TOTP_CODE_VALIDITY_WINDOW
): Promise<{ valid: boolean; counter: number | null }> {
  const timeStep = 30;
  const currentCounter = Math.floor(Date.now() / 1000 / timeStep);
  
  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + i;
    const expectedToken = await generateTOTPForCounter(secret, counter);
    
    // Use constant-time comparison to prevent timing attacks
    if (constantTimeEqual(expectedToken, token)) {
      return { valid: true, counter };
    }
  }
  return { valid: false, counter: null };
}

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    codes.push(code.substring(0, 4) + '-' + code.substring(4));
  }
  return codes;
}

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  // Normalize: remove hyphens and lowercase
  const normalized = code.replace(/-/g, '').toLowerCase();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get client IP from request headers
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

// Check rate limit using rate_limits table
async function checkRateLimit(
  supabase: any,
  identifier: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = new Date();
  
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
      if (existing.attempts >= MAX_REQUESTS_PER_WINDOW) {
        const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
        await supabase
          .from('rate_limits')
          .update({ locked_until: lockedUntil.toISOString(), last_attempt_at: now.toISOString() })
          .eq('id', existing.id);
        
        return { allowed: false, retryAfter: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
      }

      await supabase
        .from('rate_limits')
        .update({ attempts: existing.attempts + 1, last_attempt_at: now.toISOString() })
        .eq('id', existing.id);
    } else {
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

// Check TOTP-specific lockout (for brute force protection on verification)
async function checkTOTPLockout(
  supabase: any,
  userId: string
): Promise<{ locked: boolean; retryAfter?: number }> {
  const { data } = await supabase
    .from('totp_secrets')
    .select('failed_attempts, locked_until')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return { locked: false };

  const now = new Date();
  if (data.locked_until && new Date(data.locked_until) > now) {
    const retryAfter = Math.ceil((new Date(data.locked_until).getTime() - now.getTime()) / 1000);
    return { locked: true, retryAfter };
  }

  return { locked: false };
}

// Record failed TOTP attempt
async function recordFailedAttempt(supabase: any, userId: string): Promise<void> {
  const { data } = await supabase
    .from('totp_secrets')
    .select('failed_attempts')
    .eq('user_id', userId)
    .single();

  const newAttempts = (data?.failed_attempts || 0) + 1;
  const updates: any = { failed_attempts: newAttempts };

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    updates.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
    console.log(`[totp-auth] Account locked for user: ${userId} after ${newAttempts} failed attempts`);
  }

  await supabase
    .from('totp_secrets')
    .update(updates)
    .eq('user_id', userId);
}

// Reset failed attempts on successful verification
async function resetFailedAttempts(supabase: any, userId: string): Promise<void> {
  await supabase
    .from('totp_secrets')
    .update({ failed_attempts: 0, locked_until: null })
    .eq('user_id', userId);
}

/**
 * Check if a TOTP counter was recently used (replay attack prevention)
 */
async function isCounterReused(
  supabase: any,
  userId: string,
  counter: number
): Promise<boolean> {
  const { data } = await supabase
    .from('totp_secrets')
    .select('last_used_counter, last_used_at')
    .eq('user_id', userId)
    .single();

  if (!data) return false;

  // Check if same counter was used recently
  if (data.last_used_counter === counter) {
    const lastUsedAt = new Date(data.last_used_at);
    const now = new Date();
    // If same counter used within prevention window, it's a replay
    if (now.getTime() - lastUsedAt.getTime() < TOKEN_REUSE_PREVENTION_WINDOW_MS) {
      return true;
    }
  }

  return false;
}

/**
 * Record the used counter to prevent replay attacks
 */
async function recordUsedCounter(
  supabase: any,
  userId: string,
  counter: number
): Promise<void> {
  await supabase
    .from('totp_secrets')
    .update({ 
      last_used_counter: counter, 
      last_used_at: new Date().toISOString() 
    })
    .eq('user_id', userId);
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

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(requestOrigin);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create client with user's token for auth validation
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Validate JWT and get claims
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error('[totp-auth] Token validation failed:', claimsError?.message);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Extract user info from claims
    const user = {
      id: claimsData.claims.sub as string,
      email: claimsData.claims.email as string | undefined,
    };
    
    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, code } = await req.json();
    const clientIP = getClientIP(req);
    const auditContext = createAuditContext(req);

    // Rate limit check for all actions
    const rateLimitIdentifier = `${clientIP}_${user.id}`;
    const rateLimit = await checkRateLimit(supabase, rateLimitIdentifier, `totp_${action}`);
    
    if (!rateLimit.allowed) {
      console.log(`[totp-auth] Rate limit exceeded for: ${user.id}`);
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimit.retryAfter || 60)
        },
      });
    }

    console.log(`[totp-auth] Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'status': {
        const { data } = await supabase
          .from('totp_secrets')
          .select('enabled, verified_at, created_at')
          .eq('user_id', user.id)
          .maybeSingle();

        return new Response(JSON.stringify({
          enabled: data?.enabled || false,
          verifiedAt: data?.verified_at,
          createdAt: data?.created_at,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'setup': {
        // Check if already has TOTP
        const { data: existing } = await supabase
          .from('totp_secrets')
          .select('id, enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing?.enabled) {
          return new Response(JSON.stringify({ error: '2FA already enabled' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const secret = generateSecret();
        const issuer = 'Privxx';
        const label = user.email || user.id;
        const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

        // Store or update secret (not enabled yet)
        if (existing) {
          await supabase
            .from('totp_secrets')
            .update({ 
              encrypted_secret: secret, 
              enabled: false, 
              verified_at: null, 
              failed_attempts: 0, 
              locked_until: null,
              last_used_counter: null,
              last_used_at: null
            })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('totp_secrets')
            .insert({ 
              user_id: user.id, 
              encrypted_secret: secret, 
              enabled: false, 
              failed_attempts: 0 
            });
        }

        console.log('[totp-auth] Setup initiated for:', user.email);

        // Log TOTP setup start
        await logAuditEvent(supabase, {
          userId: user.id,
          eventType: 'totp_setup_start',
          success: true,
          ...auditContext,
          metadata: { email: user.email },
        });

        return new Response(JSON.stringify({
          secret,
          otpauthUrl,
          qrData: otpauthUrl,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'verify': {
        // Strict input validation
        if (!isValidTOTPCode(code)) {
          return new Response(JSON.stringify({ error: 'Invalid code format. Must be exactly 6 digits.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check TOTP-specific lockout
        const lockoutCheck = await checkTOTPLockout(supabase, user.id);
        if (lockoutCheck.locked) {
          return new Response(JSON.stringify({ 
            error: 'Account temporarily locked due to too many failed attempts. Please try again later.' 
          }), {
            status: 429,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(lockoutCheck.retryAfter || 900)
            },
          });
        }

        const { data: secretData, error: secretError } = await supabase
          .from('totp_secrets')
          .select('encrypted_secret, enabled')
          .eq('user_id', user.id)
          .single();

        if (secretError || !secretData) {
          return new Response(JSON.stringify({ error: '2FA not set up' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify with constant-time comparison and get counter
        const verification = await verifyTOTPWithCounter(secretData.encrypted_secret, code);
        
        if (!verification.valid || verification.counter === null) {
          // Record failed attempt for lockout tracking
          await recordFailedAttempt(supabase, user.id);

          // Log failed verification
          await logAuditEvent(supabase, {
            userId: user.id,
            eventType: 'totp_verify_failure',
            success: false,
            ...auditContext,
            metadata: { email: user.email, reason: 'invalid_code' },
          });
          
          console.log('[totp-auth] Invalid code for:', user.email);
          return new Response(JSON.stringify({ error: 'Invalid code' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check for replay attack (same code used within time window)
        if (secretData.enabled) {
          const isReplay = await isCounterReused(supabase, user.id, verification.counter);
          if (isReplay) {
            console.log('[totp-auth] Replay attack detected for:', user.email);
            return new Response(JSON.stringify({ error: 'Code already used. Please wait for a new code.' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Record the used counter
          await recordUsedCounter(supabase, user.id, verification.counter);
        }

        // Reset failed attempts on success
        await resetFailedAttempts(supabase, user.id);

        // If this is first verification, enable 2FA and generate backup codes
        if (!secretData.enabled) {
          const backupCodes = generateBackupCodes();
          
          // Hash and store backup codes
          await supabase.from('totp_backup_codes').delete().eq('user_id', user.id);
          for (const backupCode of backupCodes) {
            const codeHash = await hashCode(backupCode);
            await supabase.from('totp_backup_codes').insert({
              user_id: user.id,
              code_hash: codeHash,
            });
          }

          // Enable 2FA and record the counter
          await supabase
            .from('totp_secrets')
            .update({ 
              enabled: true, 
              verified_at: new Date().toISOString(),
              last_used_counter: verification.counter,
              last_used_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

          console.log('[totp-auth] 2FA enabled with cryptographic verification for:', user.email);

          // Log TOTP setup complete
          await logAuditEvent(supabase, {
            userId: user.id,
            eventType: 'totp_setup_complete',
            success: true,
            ...auditContext,
            metadata: { email: user.email },
          });

          return new Response(JSON.stringify({
            verified: true,
            enabled: true,
            backupCodes,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('[totp-auth] Code verified with constant-time comparison for:', user.email);

        // Log successful verification
        await logAuditEvent(supabase, {
          userId: user.id,
          eventType: 'totp_verify_success',
          success: true,
          ...auditContext,
          metadata: { email: user.email },
        });

        return new Response(JSON.stringify({ verified: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disable': {
        // Strict input validation
        if (!isValidTOTPCode(code)) {
          return new Response(JSON.stringify({ error: 'Code required to disable 2FA. Must be exactly 6 digits.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check TOTP-specific lockout
        const lockoutCheck = await checkTOTPLockout(supabase, user.id);
        if (lockoutCheck.locked) {
          return new Response(JSON.stringify({ 
            error: 'Account temporarily locked due to too many failed attempts. Please try again later.' 
          }), {
            status: 429,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(lockoutCheck.retryAfter || 900)
            },
          });
        }

        const { data: secretData } = await supabase
          .from('totp_secrets')
          .select('encrypted_secret, enabled')
          .eq('user_id', user.id)
          .single();

        if (!secretData?.enabled) {
          return new Response(JSON.stringify({ error: '2FA not enabled' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const verification = await verifyTOTPWithCounter(secretData.encrypted_secret, code);
        if (!verification.valid) {
          await recordFailedAttempt(supabase, user.id);
          return new Response(JSON.stringify({ error: 'Invalid code' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Reset failed attempts on success
        await resetFailedAttempts(supabase, user.id);

        // Delete TOTP and backup codes
        await supabase.from('totp_backup_codes').delete().eq('user_id', user.id);
        await supabase.from('totp_secrets').delete().eq('user_id', user.id);

        console.log('[totp-auth] 2FA disabled for:', user.email);
        return new Response(JSON.stringify({ disabled: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'backup-codes': {
        // Regenerate backup codes (requires valid TOTP code)
        if (!isValidTOTPCode(code)) {
          return new Response(JSON.stringify({ error: 'Code required to regenerate backup codes. Must be exactly 6 digits.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const lockoutCheck = await checkTOTPLockout(supabase, user.id);
        if (lockoutCheck.locked) {
          return new Response(JSON.stringify({ 
            error: 'Account temporarily locked due to too many failed attempts. Please try again later.' 
          }), {
            status: 429,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(lockoutCheck.retryAfter || 900)
            },
          });
        }

        const { data: secretData } = await supabase
          .from('totp_secrets')
          .select('encrypted_secret, enabled')
          .eq('user_id', user.id)
          .single();

        if (!secretData?.enabled) {
          return new Response(JSON.stringify({ error: '2FA not enabled' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const verification = await verifyTOTPWithCounter(secretData.encrypted_secret, code);
        if (!verification.valid) {
          await recordFailedAttempt(supabase, user.id);
          return new Response(JSON.stringify({ error: 'Invalid code' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await resetFailedAttempts(supabase, user.id);

        // Generate new backup codes
        const backupCodes = generateBackupCodes();
        
        await supabase.from('totp_backup_codes').delete().eq('user_id', user.id);
        for (const backupCode of backupCodes) {
          const codeHash = await hashCode(backupCode);
          await supabase.from('totp_backup_codes').insert({
            user_id: user.id,
            code_hash: codeHash,
          });
        }

        console.log('[totp-auth] Backup codes regenerated for:', user.email);
        return new Response(JSON.stringify({ backupCodes }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'verify-backup': {
        // Verify using a backup code with strict validation
        if (!isValidBackupCode(code)) {
          return new Response(JSON.stringify({ error: 'Invalid backup code format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const codeHash = await hashCode(code);
        
        // Get all backup codes for the user to do constant-time comparison
        const { data: backupCodes, error: backupError } = await supabase
          .from('totp_backup_codes')
          .select('id, code_hash, used_at')
          .eq('user_id', user.id);

        if (backupError || !backupCodes || backupCodes.length === 0) {
          return new Response(JSON.stringify({ error: 'No backup codes available' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Constant-time search through all codes
        let matchedCode: { id: string; used_at: string | null } | null = null;
        for (const bc of backupCodes) {
          if (constantTimeEqual(bc.code_hash, codeHash)) {
            matchedCode = bc;
          }
        }

        if (!matchedCode) {
          return new Response(JSON.stringify({ error: 'Invalid backup code' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (matchedCode.used_at) {
          return new Response(JSON.stringify({ error: 'Backup code already used' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Mark code as used
        await supabase
          .from('totp_backup_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('id', matchedCode.id);

        // Log backup code usage
        await logAuditEvent(supabase, {
          userId: user.id,
          eventType: 'totp_backup_code_used',
          success: true,
          ...auditContext,
          metadata: { email: user.email },
        });

        console.log('[totp-auth] Backup code used with constant-time verification for:', user.email);
        return new Response(JSON.stringify({ verified: true, usedBackupCode: true }), {
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
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[totp-auth] Error:', errorMessage);
    return new Response(JSON.stringify({ error: 'An internal error occurred. Please try again later.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});