/**
 * Process Referral Edge Function
 * 
 * Handles referral processing when a new user signs up with a referral code.
 * Awards XX Coins to the referrer based on their current tier.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Referral tier configuration (must match frontend types.ts)
const REFERRAL_TIERS = [
  { minReferrals: 1, coinsPerReferral: 100, bonusCoins: 0, tierName: "Starter" },
  { minReferrals: 5, coinsPerReferral: 120, bonusCoins: 100, tierName: "Bronze" },
  { minReferrals: 10, coinsPerReferral: 150, bonusCoins: 500, tierName: "Silver" },
  { minReferrals: 25, coinsPerReferral: 175, bonusCoins: 1000, tierName: "Gold" },
  { minReferrals: 50, coinsPerReferral: 200, bonusCoins: 2500, tierName: "Platinum" },
  { minReferrals: 100, coinsPerReferral: 250, bonusCoins: 5000, tierName: "Diamond" },
];

function getCurrentTier(referralCount: number) {
  for (let i = REFERRAL_TIERS.length - 1; i >= 0; i--) {
    if (referralCount >= REFERRAL_TIERS[i].minReferrals) {
      return REFERRAL_TIERS[i];
    }
  }
  return REFERRAL_TIERS[0];
}

function getNextTier(referralCount: number) {
  for (const tier of REFERRAL_TIERS) {
    if (referralCount < tier.minReferrals) {
      return tier;
    }
  }
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[process-referral] Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { referral_code, referred_user_id } = body;

    if (!referral_code || !referred_user_id) {
      console.log("[process-referral] Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing referral_code or referred_user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-referral] Processing referral code: ${referral_code} for user: ${referred_user_id}`);

    // Find the referrer by their referral code
    const { data: referrerProfile, error: referrerError } = await supabase
      .from("profiles")
      .select("user_id, referral_code, xx_coins_balance")
      .eq("referral_code", referral_code.toUpperCase())
      .maybeSingle();

    if (referrerError) {
      console.error("[process-referral] Error finding referrer:", referrerError);
      return new Response(
        JSON.stringify({ error: "Failed to find referrer" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!referrerProfile) {
      console.log("[process-referral] Invalid referral code:", referral_code);
      return new Response(
        JSON.stringify({ error: "Invalid referral code", success: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent self-referral
    if (referrerProfile.user_id === referred_user_id) {
      console.log("[process-referral] Self-referral attempted");
      return new Response(
        JSON.stringify({ error: "Cannot refer yourself", success: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this user was already referred
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_id", referred_user_id)
      .maybeSingle();

    if (existingReferral) {
      console.log("[process-referral] User already referred");
      return new Response(
        JSON.stringify({ error: "User already referred", success: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current referral count to determine tier
    const { count: currentReferralCount } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", referrerProfile.user_id)
      .in("status", ["completed", "rewarded"]);

    const completedCount = currentReferralCount || 0;
    const newTotalCount = completedCount + 1;
    
    // Determine coins to award
    const currentTier = getCurrentTier(newTotalCount);
    const previousTier = getCurrentTier(completedCount);
    
    let coinsToAward = currentTier.coinsPerReferral;
    
    // Add bonus if they just reached a new tier
    if (currentTier.tierName !== previousTier.tierName && completedCount > 0) {
      coinsToAward += currentTier.bonusCoins;
      console.log(`[process-referral] Tier upgrade! ${previousTier.tierName} -> ${currentTier.tierName}, bonus: ${currentTier.bonusCoins}`);
    }

    console.log(`[process-referral] Awarding ${coinsToAward} coins to referrer ${referrerProfile.user_id}`);

    // Create the referral record
    const { error: insertError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrerProfile.user_id,
        referred_id: referred_user_id,
        status: "rewarded",
        coins_earned: coinsToAward,
        completed_at: new Date().toISOString(),
        rewarded_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("[process-referral] Error creating referral:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create referral" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the referrer's coin balance
    const newBalance = (referrerProfile.xx_coins_balance || 0) + coinsToAward;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ xx_coins_balance: newBalance })
      .eq("user_id", referrerProfile.user_id);

    if (updateError) {
      console.error("[process-referral] Error updating coin balance:", updateError);
      // Don't fail the whole request, referral was still recorded
    }

    // Update the referred user's profile to track who referred them
    await supabase
      .from("profiles")
      .update({ referred_by: referrerProfile.user_id })
      .eq("user_id", referred_user_id);

    console.log(`[process-referral] Success! Referrer: ${referrerProfile.user_id}, Referred: ${referred_user_id}, Coins: ${coinsToAward}`);

    return new Response(
      JSON.stringify({
        success: true,
        coins_awarded: coinsToAward,
        new_balance: newBalance,
        tier: currentTier.tierName,
        tier_upgraded: currentTier.tierName !== previousTier.tierName && completedCount > 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[process-referral] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An internal error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
