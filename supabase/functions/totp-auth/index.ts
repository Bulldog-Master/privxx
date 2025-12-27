import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple base32 encoding/decoding for TOTP secrets
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

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

async function generateTOTP(secret: string, timeStep = 30): Promise<string> {
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / timeStep);
  
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, time, false);
  
  const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  
  return (code % 1000000).toString().padStart(6, '0');
}

async function verifyTOTP(secret: string, token: string, window = 1): Promise<boolean> {
  for (let i = -window; i <= window; i++) {
    const timeStep = 30;
    const time = Math.floor(Date.now() / 1000 / timeStep) + i;
    
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, time, false);
    
    const key = base32Decode(secret);
    const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = ((hmac[offset] & 0x7f) << 24) |
                 ((hmac[offset + 1] & 0xff) << 16) |
                 ((hmac[offset + 2] & 0xff) << 8) |
                 (hmac[offset + 3] & 0xff);
    
    const expectedToken = (code % 1000000).toString().padStart(6, '0');
    if (expectedToken === token) {
      return true;
    }
  }
  return false;
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
  const data = encoder.encode(code.replace('-', '').toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, code } = await req.json();
    console.log(`[totp-auth] Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'status': {
        const { data, error } = await supabase
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
            .update({ encrypted_secret: secret, enabled: false, verified_at: null })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('totp_secrets')
            .insert({ user_id: user.id, encrypted_secret: secret, enabled: false });
        }

        console.log('[totp-auth] Setup initiated for:', user.email);
        return new Response(JSON.stringify({
          secret,
          otpauthUrl,
          qrData: otpauthUrl,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'verify': {
        if (!code || code.length !== 6) {
          return new Response(JSON.stringify({ error: 'Invalid code format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

        const isValid = await verifyTOTP(secretData.encrypted_secret, code);
        
        if (!isValid) {
          console.log('[totp-auth] Invalid code for:', user.email);
          return new Response(JSON.stringify({ error: 'Invalid code' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

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

          // Enable 2FA
          await supabase
            .from('totp_secrets')
            .update({ enabled: true, verified_at: new Date().toISOString() })
            .eq('user_id', user.id);

          console.log('[totp-auth] 2FA enabled for:', user.email);
          return new Response(JSON.stringify({
            verified: true,
            enabled: true,
            backupCodes,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('[totp-auth] Code verified for:', user.email);
        return new Response(JSON.stringify({ verified: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disable': {
        if (!code || code.length !== 6) {
          return new Response(JSON.stringify({ error: 'Code required to disable 2FA' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

        const isValid = await verifyTOTP(secretData.encrypted_secret, code);
        if (!isValid) {
          return new Response(JSON.stringify({ error: 'Invalid code' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Delete TOTP and backup codes
        await supabase.from('totp_backup_codes').delete().eq('user_id', user.id);
        await supabase.from('totp_secrets').delete().eq('user_id', user.id);

        console.log('[totp-auth] 2FA disabled for:', user.email);
        return new Response(JSON.stringify({ disabled: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'verify-backup': {
        if (!code) {
          return new Response(JSON.stringify({ error: 'Backup code required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const codeHash = await hashCode(code);
        const { data: backupData } = await supabase
          .from('totp_backup_codes')
          .select('id')
          .eq('user_id', user.id)
          .eq('code_hash', codeHash)
          .is('used_at', null)
          .single();

        if (!backupData) {
          return new Response(JSON.stringify({ error: 'Invalid backup code' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Mark backup code as used
        await supabase
          .from('totp_backup_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('id', backupData.id);

        console.log('[totp-auth] Backup code used for:', user.email);
        return new Response(JSON.stringify({ verified: true }), {
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
    console.error('[totp-auth] Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
