/**
 * Referral Program Types
 */

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: 'pending' | 'completed' | 'rewarded';
  coins_earned: number;
  created_at: string;
  completed_at: string | null;
  rewarded_at: string | null;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalCoinsEarned: number;
  currentBalance: number;
  referralCode: string;
}

export interface ReferralTier {
  minReferrals: number;
  coinsPerReferral: number;
  bonusCoins: number;
  tierName: string;
}

// Referral reward tiers
export const REFERRAL_TIERS: ReferralTier[] = [
  { minReferrals: 1, coinsPerReferral: 100, bonusCoins: 0, tierName: 'Starter' },
  { minReferrals: 5, coinsPerReferral: 120, bonusCoins: 100, tierName: 'Bronze' },
  { minReferrals: 10, coinsPerReferral: 150, bonusCoins: 500, tierName: 'Silver' },
  { minReferrals: 25, coinsPerReferral: 175, bonusCoins: 1000, tierName: 'Gold' },
  { minReferrals: 50, coinsPerReferral: 200, bonusCoins: 2500, tierName: 'Platinum' },
  { minReferrals: 100, coinsPerReferral: 250, bonusCoins: 5000, tierName: 'Diamond' },
];

export function getCurrentTier(referralCount: number): ReferralTier {
  // Find the highest tier the user qualifies for
  for (let i = REFERRAL_TIERS.length - 1; i >= 0; i--) {
    if (referralCount >= REFERRAL_TIERS[i].minReferrals) {
      return REFERRAL_TIERS[i];
    }
  }
  return REFERRAL_TIERS[0];
}

export function getNextTier(referralCount: number): ReferralTier | null {
  for (const tier of REFERRAL_TIERS) {
    if (referralCount < tier.minReferrals) {
      return tier;
    }
  }
  return null;
}

export function calculateTotalEarnings(referralCount: number): number {
  let total = 0;
  let remaining = referralCount;
  
  for (let i = 0; i < REFERRAL_TIERS.length && remaining > 0; i++) {
    const tier = REFERRAL_TIERS[i];
    const nextTier = REFERRAL_TIERS[i + 1];
    const tierEnd = nextTier ? nextTier.minReferrals - 1 : Infinity;
    const referralsInTier = Math.min(remaining, tierEnd - tier.minReferrals + 1);
    
    if (referralCount >= tier.minReferrals) {
      total += tier.bonusCoins;
    }
    
    total += referralsInTier * tier.coinsPerReferral;
    remaining -= referralsInTier;
  }
  
  return total;
}
