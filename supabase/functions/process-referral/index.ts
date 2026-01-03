/**
 * Process Referral Edge Function
 * 
 * Handles referral processing when a new user signs up with a referral code.
 * Awards XX Coins to the referrer based on their current tier.
 * Sends email notification to the referrer.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

// Send referral notification email
async function sendReferralNotification(
  referrerEmail: string,
  coinsEarned: number,
  newBalance: number,
  tierName: string,
  tierUpgraded: boolean,
  totalReferrals: number
): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log("[process-referral] RESEND_API_KEY not configured, skipping email");
    return;
  }

  const resend = new Resend(resendApiKey);

  const tierUpgradeMessage = tierUpgraded
    ? `<p style="color: #10b981; font-weight: bold;">🎉 Congratulations! You've reached the ${tierName} tier!</p>`
    : "";

  const nextTier = getNextTier(totalReferrals);
  const progressMessage = nextTier
    ? `<p style="color: #6b7280; font-size: 14px;">You're ${nextTier.minReferrals - totalReferrals} referral(s) away from the ${nextTier.tierName} tier!</p>`
    : `<p style="color: #10b981; font-size: 14px;">You've reached the highest tier! Maximum rewards unlocked.</p>`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 32px; border: 1px solid #334155;">
        
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #14b8a6; margin: 0; font-size: 28px;">Priv<span style="color: #f59e0b;">xx</span></h1>
          <p style="color: #94a3b8; margin: 8px 0 0 0;">Referral Program</p>
        </div>

        <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: rgba(255,255,255,0.9); margin: 0 0 8px 0; font-size: 14px;">You've earned</p>
          <h2 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold;">+${coinsEarned} XX Coins</h2>
        </div>

        ${tierUpgradeMessage}

        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #94a3b8;">New Balance</span>
            <span style="color: #fbbf24; font-weight: bold;">${newBalance.toLocaleString()} XX</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #94a3b8;">Current Tier</span>
            <span style="color: #14b8a6; font-weight: bold;">${tierName}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Total Referrals</span>
            <span style="color: #e2e8f0; font-weight: bold;">${totalReferrals}</span>
          </div>
        </div>

        ${progressMessage}

        <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #334155;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            Thank you for spreading privacy-first browsing!
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: "Privxx <notifications@resend.dev>",
      to: [referrerEmail],
      subject: `🎉 You earned ${coinsEarned} XX Coins from a referral!`,
      html: emailHtml,
    });

    if (error) {
      console.error("[process-referral] Failed to send email:", error);
    } else {
      console.log("[process-referral] Notification email sent to:", referrerEmail);
    }
  } catch (err) {
    console.error("[process-referral] Email send error:", err);
  }
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
    const tierUpgraded = currentTier.tierName !== previousTier.tierName && completedCount > 0;
    
    // Add bonus if they just reached a new tier
    if (tierUpgraded) {
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

    // Get referrer's email for notification
    const { data: referrerAuth } = await supabase.auth.admin.getUserById(referrerProfile.user_id);
    
    if (referrerAuth?.user?.email) {
      // Send email notification (don't await to not block response)
      sendReferralNotification(
        referrerAuth.user.email,
        coinsToAward,
        newBalance,
        currentTier.tierName,
        tierUpgraded,
        newTotalCount
      ).catch(err => console.error("[process-referral] Email notification failed:", err));
    }

    console.log(`[process-referral] Success! Referrer: ${referrerProfile.user_id}, Referred: ${referred_user_id}, Coins: ${coinsToAward}`);

    return new Response(
      JSON.stringify({
        success: true,
        coins_awarded: coinsToAward,
        new_balance: newBalance,
        tier: currentTier.tierName,
        tier_upgraded: tierUpgraded,
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
