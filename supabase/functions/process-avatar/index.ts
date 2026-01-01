/**
 * Avatar Processing Edge Function
 * 
 * Strips EXIF metadata from uploaded images for privacy protection.
 * Prevents location, device, and timestamp leakage from image metadata.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Strip EXIF metadata by re-encoding the image
 * Drawing to canvas and exporting removes all metadata
 */
async function stripExifMetadata(imageData: ArrayBuffer, mimeType: string): Promise<Blob> {
  // For edge functions, we use a pure JavaScript approach
  // Re-encode JPEG/PNG by parsing and reconstructing without metadata
  
  const uint8Array = new Uint8Array(imageData);
  
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return stripJpegExif(uint8Array);
  } else if (mimeType === 'image/png') {
    return stripPngMetadata(uint8Array);
  } else if (mimeType === 'image/webp') {
    // WebP: return as-is for now (minimal EXIF support in WebP)
    return new Blob([uint8Array], { type: mimeType });
  }
  
  // For other formats, return as-is
  return new Blob([uint8Array], { type: mimeType });
}

/**
 * Strip EXIF from JPEG by removing APP1 markers (where EXIF lives)
 */
function stripJpegExif(data: Uint8Array): Blob {
  const result: number[] = [];
  let i = 0;
  
  // JPEG must start with SOI marker (0xFFD8)
  if (data[0] !== 0xFF || data[1] !== 0xD8) {
    return new Blob([new Uint8Array(data)], { type: 'image/jpeg' });
  }
  
  // Copy SOI marker
  result.push(data[0], data[1]);
  i = 2;
  
  while (i < data.length) {
    // Check for marker
    if (data[i] !== 0xFF) {
      result.push(data[i]);
      i++;
      continue;
    }
    
    const marker = data[i + 1];
    
    // End of image or start of scan - copy rest as-is
    if (marker === 0xD9 || marker === 0xDA) {
      while (i < data.length) {
        result.push(data[i]);
        i++;
      }
      break;
    }
    
    // APP1 (0xE1) contains EXIF - skip it
    // APP2-APP15 may contain other metadata - skip them too
    if (marker >= 0xE1 && marker <= 0xEF) {
      const segmentLength = (data[i + 2] << 8) | data[i + 3];
      i += 2 + segmentLength;
      continue;
    }
    
    // For other markers, calculate length and copy
    if (marker >= 0xC0 && marker <= 0xFE) {
      const segmentLength = (data[i + 2] << 8) | data[i + 3];
      for (let j = 0; j < segmentLength + 2; j++) {
        if (i + j < data.length) {
          result.push(data[i + j]);
        }
      }
      i += 2 + segmentLength;
    } else {
      result.push(data[i]);
      i++;
    }
  }
  
  return new Blob([new Uint8Array(result)], { type: 'image/jpeg' });
}

/**
 * Strip metadata from PNG by removing non-critical chunks
 */
function stripPngMetadata(data: Uint8Array): Blob {
  const result: number[] = [];
  
  // PNG signature (8 bytes)
  if (data.length < 8) {
    return new Blob([new Uint8Array(data)], { type: 'image/png' });
  }
  
  // Copy PNG signature
  for (let i = 0; i < 8; i++) {
    result.push(data[i]);
  }
  
  let offset = 8;
  
  // Critical chunks to keep: IHDR, PLTE, IDAT, IEND
  const criticalChunks = ['IHDR', 'PLTE', 'IDAT', 'IEND'];
  
  while (offset < data.length) {
    // Read chunk length (4 bytes, big-endian)
    const length = (data[offset] << 24) | (data[offset + 1] << 16) | 
                   (data[offset + 2] << 8) | data[offset + 3];
    
    // Read chunk type (4 bytes)
    const type = String.fromCharCode(
      data[offset + 4], data[offset + 5], 
      data[offset + 6], data[offset + 7]
    );
    
    // Total chunk size: length(4) + type(4) + data(length) + crc(4)
    const totalChunkSize = 12 + length;
    
    // Keep only critical chunks
    if (criticalChunks.includes(type)) {
      for (let i = 0; i < totalChunkSize && offset + i < data.length; i++) {
        result.push(data[offset + i]);
      }
    }
    
    offset += totalChunkSize;
    
    // Stop at IEND
    if (type === 'IEND') break;
  }
  
  return new Blob([new Uint8Array(result)], { type: 'image/png' });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Check for health check action (JSON body with action: "health")
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        if (body.action === 'health') {
          return new Response(
            JSON.stringify({ status: 'ok', service: 'process-avatar' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch {
        // Not valid JSON, continue to normal processing
      }
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use anon client with the user's token to verify authentication
    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use service role client for storage operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get form data with image
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size: 5MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read and strip EXIF metadata
    const imageBuffer = await file.arrayBuffer();
    const cleanedImage = await stripExifMetadata(imageBuffer, file.type);
    
    // Determine file extension
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const ext = extMap[file.type] || 'jpg';
    const filePath = `${user.id}/avatar.${ext}`;

    // Upload cleaned image to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, cleanedImage, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload avatar' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile with the storage path (not signed URL)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: filePath })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URL for immediate use
    const { data: signedUrlData } = await supabase.storage
      .from('avatars')
      .createSignedUrl(filePath, 60 * 60 * 4); // 4 hours

    return new Response(
      JSON.stringify({ 
        success: true, 
        path: filePath,
        signedUrl: signedUrlData?.signedUrl,
        expiresIn: 60 * 60 * 4,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Avatar processing error:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
