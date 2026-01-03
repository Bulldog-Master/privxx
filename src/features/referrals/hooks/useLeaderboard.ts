/**
 * useLeaderboard Hook
 * 
 * Fetches referral leaderboard data and user's rank.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LeaderboardEntry {
  rank: number;
  display_name: string;
  referral_count: number;
  total_coins_earned: number;
  tier_name: string;
}

export interface MyRank {
  rank: number;
  referral_count: number;
  total_coins_earned: number;
  tier_name: string;
}

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  myRank: MyRank | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLeaderboard(limit: number = 10): UseLeaderboardReturn {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch leaderboard
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .rpc('get_referral_leaderboard', { limit_count: limit });

      if (leaderboardError) {
        console.error('[useLeaderboard] Error fetching leaderboard:', leaderboardError);
        setError(leaderboardError.message);
      } else {
        setLeaderboard((leaderboardData || []).map((entry: any) => ({
          rank: Number(entry.rank),
          display_name: entry.display_name,
          referral_count: Number(entry.referral_count),
          total_coins_earned: Number(entry.total_coins_earned),
          tier_name: entry.tier_name,
        })));
      }

      // Fetch user's rank if authenticated
      if (user) {
        const { data: rankData, error: rankError } = await supabase
          .rpc('get_my_referral_rank');

        if (rankError) {
          console.error('[useLeaderboard] Error fetching my rank:', rankError);
        } else if (rankData && rankData.length > 0) {
          setMyRank({
            rank: Number(rankData[0].rank),
            referral_count: Number(rankData[0].referral_count),
            total_coins_earned: Number(rankData[0].total_coins_earned),
            tier_name: rankData[0].tier_name,
          });
        } else {
          setMyRank(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    myRank,
    isLoading,
    error,
    refresh: fetchLeaderboard,
  };
}
