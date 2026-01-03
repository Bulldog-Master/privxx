/**
 * useReferrals Hook
 * 
 * Manages referral data fetching and state.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileContext } from '@/contexts/ProfileContext';
import type { Referral, ReferralStats } from '../types';
import { calculateTotalEarnings } from '../types';

interface UseReferralsReturn {
  stats: ReferralStats | null;
  referrals: Referral[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  networkUserCount: number;
}

export function useReferrals(): UseReferralsReturn {
  const { user } = useAuth();
  const { profile } = useProfileContext();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkUserCount, setNetworkUserCount] = useState(0);

  const fetchReferrals = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch user's referrals
      const { data, error: fetchError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      // Cast the status to the correct type
      const typedReferrals: Referral[] = (data || []).map(r => ({
        ...r,
        status: r.status as Referral['status'],
      }));
      setReferrals(typedReferrals);

      // Get approximate network user count (profiles count)
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      setNetworkUserCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referrals');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Subscribe to referral changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('referral-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${user.id}`,
        },
        () => {
          fetchReferrals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchReferrals]);

  const stats: ReferralStats | null = profile ? {
    totalReferrals: referrals.length,
    completedReferrals: referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length,
    pendingReferrals: referrals.filter(r => r.status === 'pending').length,
    totalCoinsEarned: referrals.reduce((sum, r) => sum + r.coins_earned, 0),
    currentBalance: profile.xx_coins_balance || 0,
    referralCode: profile.referral_code || '',
  } : null;

  return {
    stats,
    referrals,
    isLoading,
    error,
    refresh: fetchReferrals,
    networkUserCount,
  };
}
