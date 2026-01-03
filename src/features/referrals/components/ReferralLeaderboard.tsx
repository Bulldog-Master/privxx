/**
 * ReferralLeaderboard Component
 * 
 * Displays top referrers and user's current rank.
 */

import { useTranslation } from 'react-i18next';
import { Trophy, Medal, Crown, Star, Coins, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeaderboard, type LeaderboardEntry } from '../hooks/useLeaderboard';
import { cn } from '@/lib/utils';

interface ReferralLeaderboardProps {
  className?: string;
  limit?: number;
}

const TIER_COLORS: Record<string, string> = {
  Diamond: 'text-cyan-400',
  Platinum: 'text-purple-400',
  Gold: 'text-yellow-400',
  Silver: 'text-gray-300',
  Bronze: 'text-amber-600',
  Starter: 'text-primary/70',
};

const TIER_BG: Record<string, string> = {
  Diamond: 'bg-cyan-500/10 border-cyan-500/30',
  Platinum: 'bg-purple-500/10 border-purple-500/30',
  Gold: 'bg-yellow-500/10 border-yellow-500/30',
  Silver: 'bg-gray-500/10 border-gray-500/30',
  Bronze: 'bg-amber-600/10 border-amber-600/30',
  Starter: 'bg-primary/5 border-primary/20',
};

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-400" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-300" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
}

function LeaderboardRow({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser?: boolean }) {
  const { t } = useTranslation('ui');

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg transition-colors",
        isCurrentUser && "bg-primary/10 border border-primary/30",
        !isCurrentUser && "hover:bg-muted/30"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 flex justify-center">
          {getRankIcon(entry.rank)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("font-medium", isCurrentUser && "text-primary")}>
              {entry.display_name}
            </span>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs">
                {t('referrals.you', 'You')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{entry.referral_count} {t('referrals.referrals', 'referrals')}</span>
            <span>•</span>
            <span className={TIER_COLORS[entry.tier_name]}>{entry.tier_name}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 text-yellow-500 font-medium">
        <Coins className="h-4 w-4" />
        {entry.total_coins_earned.toLocaleString()}
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-5" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export function ReferralLeaderboard({ className, limit = 10 }: ReferralLeaderboardProps) {
  const { t } = useTranslation('ui');
  const { leaderboard, myRank, isLoading, refresh } = useLeaderboard(limit);

  // Check if current user is in the displayed leaderboard
  const userInLeaderboard = myRank && leaderboard.some(e => e.rank === myRank.rank);

  return (
    <Card className={cn("bg-card/50 backdrop-blur-sm border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {t('referrals.leaderboard', 'Leaderboard')}
            </CardTitle>
            <CardDescription>
              {t('referrals.leaderboardDesc', 'Top referrers on the network')}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && leaderboard.length === 0 ? (
          <LeaderboardSkeleton />
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {t('referrals.noReferralsYet', 'No referrals yet')}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {t('referrals.beFirst', 'Be the first to refer someone!')}
            </p>
          </div>
        ) : (
          <>
            {leaderboard.map((entry) => (
              <LeaderboardRow 
                key={entry.rank} 
                entry={entry}
                isCurrentUser={myRank?.rank === entry.rank}
              />
            ))}

            {/* Show user's rank if not in displayed list */}
            {myRank && !userInLeaderboard && (
              <>
                <div className="flex items-center gap-2 py-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {t('referrals.yourRank', 'Your Rank')}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <LeaderboardRow 
                  entry={{
                    rank: myRank.rank,
                    display_name: t('referrals.you', 'You'),
                    referral_count: myRank.referral_count,
                    total_coins_earned: myRank.total_coins_earned,
                    tier_name: myRank.tier_name,
                  }}
                  isCurrentUser
                />
              </>
            )}

            {/* Show message if user has no referrals */}
            {!myRank && (
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg mt-2",
                "bg-muted/20 border border-dashed border-muted-foreground/30"
              )}>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t('referrals.startReferring', 'Start referring to appear on the leaderboard!')}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
