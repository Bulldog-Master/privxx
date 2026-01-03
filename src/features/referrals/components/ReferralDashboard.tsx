/**
 * ReferralDashboard Component
 * 
 * Displays referral program stats, link, and reward tiers.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Copy, 
  Check, 
  Users, 
  Coins, 
  Gift, 
  TrendingUp,
  Share2,
  ChevronRight,
  Trophy,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

import { useToast } from '@/hooks/useToast';
import { useReferrals } from '../hooks/useReferrals';
import { REFERRAL_TIERS, getCurrentTier, getNextTier, calculateStreakData } from '../types';
import { ReferralLeaderboard } from './ReferralLeaderboard';
import { StreakBonusCard } from './StreakBonusCard';
import { cn } from '@/lib/utils';

interface ReferralDashboardProps {
  className?: string;
}

export function ReferralDashboard({ className }: ReferralDashboardProps) {
  const { t } = useTranslation('ui');
  const { toast } = useToast();
  const { stats, referrals, isLoading, networkUserCount } = useReferrals();
  const [copied, setCopied] = useState(false);

  const referralLink = stats?.referralCode 
    ? `${window.location.origin}/?ref=${stats.referralCode}`
    : '';

  const handleCopyLink = async () => {
    if (!referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: t('referrals.copied', 'Copied!'),
        description: t('referrals.copiedDesc', 'Referral link copied to clipboard'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: t('referrals.copyFailed', 'Copy failed'),
        description: t('referrals.copyFailedDesc', 'Unable to copy link'),
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('referrals.shareTitle', 'Join Privxx'),
          text: t('referrals.shareText', 'Join Privxx and get privacy-first browsing. Use my referral link:'),
          url: referralLink,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopyLink();
    }
  };

  const currentTier = stats ? getCurrentTier(stats.completedReferrals) : REFERRAL_TIERS[0];
  const nextTier = stats ? getNextTier(stats.completedReferrals) : REFERRAL_TIERS[1];
  const progressToNext = nextTier && stats
    ? ((stats.completedReferrals - currentTier.minReferrals) / (nextTier.minReferrals - currentTier.minReferrals)) * 100
    : 100;
  const streakData = calculateStreakData(referrals);

  if (isLoading && !stats) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 animate-pulse">
          <CardContent className="h-48" />
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 pb-4", className)}>
        {/* Referral Link Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Share2 className="h-5 w-5 text-primary" />
              {t('referrals.yourLink', 'Your Referral Link')}
            </CardTitle>
            <CardDescription>
              {t('referrals.linkDesc', 'Share this link to earn XX Coins')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-background/50 rounded-md text-sm font-mono truncate">
                {referralLink || t('referrals.noCode', 'Loading...')}
              </code>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={handleCopyLink}
                disabled={!referralLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button 
              className="w-full" 
              onClick={handleShare}
              disabled={!referralLink}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {t('referrals.share', 'Share Link')}
            </Button>
          </CardContent>
        </Card>

        {/* Daily Streak Card */}
        <StreakBonusCard streakData={streakData} />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary/70" />
                <span className="text-xs text-muted-foreground">
                  {t('referrals.yourReferrals', 'Your Referrals')}
                </span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {stats?.completedReferrals || 0}
              </p>
              {stats?.pendingReferrals ? (
                <p className="text-xs text-muted-foreground">
                  +{stats.pendingReferrals} {t('referrals.pending', 'pending')}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">
                  {t('referrals.xxCoins', 'XX Coins')}
                </span>
              </div>
              <p className="text-2xl font-bold text-yellow-500">
                {stats?.currentBalance.toLocaleString() || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('referrals.earned', 'earned')}: {stats?.totalCoinsEarned.toLocaleString() || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">
                  {t('referrals.networkUsers', 'Network Users')}
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-500">
                {networkUserCount.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">
                  {t('referrals.tier', 'Current Tier')}
                </span>
              </div>
              <p className="text-2xl font-bold text-amber-500">
                {currentTier.tierName}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentTier.coinsPerReferral} {t('referrals.perReferral', 'per referral')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {t('referrals.nextTier', 'Next Tier')}: {nextTier.tierName}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {nextTier.minReferrals - (stats?.completedReferrals || 0)} {t('referrals.toGo', 'to go')}
                </Badge>
              </div>
              <Progress value={progressToNext} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {t('referrals.unlockBonus', 'Unlock {{coins}} bonus coins', { coins: nextTier.bonusCoins })}
              </p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Reward Tiers */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5 text-primary" />
              {t('referrals.rewardTiers', 'Reward Tiers')}
            </CardTitle>
            <CardDescription>
              {t('referrals.tiersDesc', 'Earn more as you refer more users')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {REFERRAL_TIERS.map((tier, index) => {
              const isCurrentTier = tier.tierName === currentTier.tierName;
              const isUnlocked = (stats?.completedReferrals || 0) >= tier.minReferrals;
              
              return (
                <div
                  key={tier.tierName}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg transition-colors",
                    isCurrentTier && "bg-primary/10 border border-primary/30",
                    !isCurrentTier && isUnlocked && "bg-muted/30",
                    !isUnlocked && "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      isCurrentTier && "bg-primary text-primary-foreground",
                      !isCurrentTier && isUnlocked && "bg-muted text-foreground",
                      !isUnlocked && "bg-muted/50 text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {tier.tierName}
                        </span>
                        {isCurrentTier && (
                          <Badge variant="default" className="text-xs">
                            {t('referrals.current', 'Current')}
                          </Badge>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs",
                        isUnlocked ? "text-foreground/60" : "text-foreground/50"
                      )}>
                        {tier.minReferrals}+ {t('referrals.referrals', 'referrals')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "flex items-center gap-1 font-semibold",
                      isUnlocked ? "text-yellow-400" : "text-yellow-500/70"
                    )}>
                      <Coins className="h-3.5 w-3.5" />
                      {tier.coinsPerReferral}
                      <span className="text-xs text-foreground/50 font-normal">/ea</span>
                    </div>
                    {tier.bonusCoins > 0 && (
                      <p className={cn(
                        "text-xs font-medium",
                        isUnlocked ? "text-emerald-400" : "text-emerald-500/70"
                      )}>
                        +{tier.bonusCoins} {t('referrals.bonus', 'bonus')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        {referrals.length > 0 && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t('referrals.recentReferrals', 'Recent Referrals')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {referrals.slice(0, 5).map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {t('referrals.referralUser', 'User')} #{referral.id.slice(0, 6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={referral.status === 'rewarded' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {referral.status === 'pending' && t('referrals.pending', 'Pending')}
                      {referral.status === 'completed' && t('referrals.completed', 'Completed')}
                      {referral.status === 'rewarded' && t('referrals.rewarded', 'Rewarded')}
                    </Badge>
                    {referral.coins_earned > 0 && (
                      <span className="text-xs text-yellow-500 font-medium">
                        +{referral.coins_earned}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <ReferralLeaderboard />
    </div>
  );
}
