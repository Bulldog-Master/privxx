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

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastReferralDate: string | null;
  streakMultiplier: number;
}

export interface StreakMilestone {
  days: number;
  multiplier: number;
  label: string;
}

// Streak milestones for bonus multipliers
export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 7, multiplier: 2, label: '7' },
  { days: 14, multiplier: 3, label: '14' },
  { days: 30, multiplier: 5, label: '30' },
];

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

export function getStreakMultiplier(streakDays: number): number {
  let multiplier = 1;
  for (const milestone of STREAK_MILESTONES) {
    if (streakDays >= milestone.days) {
      multiplier = milestone.multiplier;
    }
  }
  return multiplier;
}

export function getNextStreakMilestone(streakDays: number): StreakMilestone | null {
  for (const milestone of STREAK_MILESTONES) {
    if (streakDays < milestone.days) {
      return milestone;
    }
  }
  return null;
}

export function calculateStreakData(referrals: Referral[]): StreakData {
  if (referrals.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastReferralDate: null,
      streakMultiplier: 1,
    };
  }

  // Sort referrals by date (newest first)
  const sortedReferrals = [...referrals]
    .filter(r => r.status === 'completed' || r.status === 'rewarded')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (sortedReferrals.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastReferralDate: null,
      streakMultiplier: 1,
    };
  }

  const lastReferralDate = sortedReferrals[0].created_at;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastDate = new Date(lastReferralDate);
  lastDate.setHours(0, 0, 0, 0);
  
  const daysSinceLastReferral = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  // If more than 1 day has passed, streak is broken
  if (daysSinceLastReferral > 1) {
    return {
      currentStreak: 0,
      longestStreak: calculateLongestStreak(sortedReferrals),
      lastReferralDate,
      streakMultiplier: 1,
    };
  }

  // Calculate current streak
  let currentStreak = 1;
  let previousDate = lastDate;

  for (let i = 1; i < sortedReferrals.length; i++) {
    const referralDate = new Date(sortedReferrals[i].created_at);
    referralDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((previousDate.getTime() - referralDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, continue
      continue;
    } else if (daysDiff === 1) {
      // Consecutive day
      currentStreak++;
      previousDate = referralDate;
    } else {
      // Streak broken
      break;
    }
  }

  const longestStreak = calculateLongestStreak(sortedReferrals);

  return {
    currentStreak,
    longestStreak: Math.max(currentStreak, longestStreak),
    lastReferralDate,
    streakMultiplier: getStreakMultiplier(currentStreak),
  };
}

function calculateLongestStreak(sortedReferrals: Referral[]): number {
  if (sortedReferrals.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;
  let previousDate = new Date(sortedReferrals[0].created_at);
  previousDate.setHours(0, 0, 0, 0);

  for (let i = 1; i < sortedReferrals.length; i++) {
    const referralDate = new Date(sortedReferrals[i].created_at);
    referralDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((previousDate.getTime() - referralDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      continue;
    } else if (daysDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
      previousDate = referralDate;
    } else {
      currentStreak = 1;
      previousDate = referralDate;
    }
  }

  return longestStreak;
}
