/**
 * StreakBonusCard Component
 * 
 * Displays the user's referral streak status and bonus multipliers.
 */

import { useTranslation } from 'react-i18next';
import { Flame, Zap, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { StreakData, STREAK_MILESTONES, getNextStreakMilestone } from '../types';

interface StreakBonusCardProps {
  streakData: StreakData;
  className?: string;
}

export function StreakBonusCard({ streakData, className }: StreakBonusCardProps) {
  const { t } = useTranslation('ui');
  const { currentStreak, longestStreak, streakMultiplier, lastReferralDate } = streakData;
  
  const nextMilestone = getNextStreakMilestone(currentStreak);
  const progressToNext = nextMilestone 
    ? (currentStreak / nextMilestone.days) * 100 
    : 100;

  const isStreakActive = currentStreak > 0;
  const needsReferralToday = lastReferralDate && (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = new Date(lastReferralDate);
    lastDate.setHours(0, 0, 0, 0);
    return today.getTime() !== lastDate.getTime();
  })();

  return (
    <Card className={cn("bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className={cn("h-5 w-5", isStreakActive ? "text-orange-500" : "text-muted-foreground")} />
          {t('referrals.streak.title', 'Daily Streak')}
          {streakMultiplier > 1 && (
            <Badge variant="default" className="bg-orange-500 text-white">
              {t('referrals.streak.multiplier', '{{multiplier}}x multiplier', { multiplier: streakMultiplier })}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {t('referrals.streak.description', 'Refer daily to earn bonus coins')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className={cn("h-4 w-4", isStreakActive ? "text-orange-500" : "text-muted-foreground")} />
              <span className="text-xs text-muted-foreground">
                {t('referrals.streak.currentStreak', 'Current Streak')}
              </span>
            </div>
            <p className={cn("text-2xl font-bold", isStreakActive ? "text-orange-500" : "text-muted-foreground")}>
              {currentStreak}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentStreak === 1 
                ? t('referrals.streak.day', 'day') 
                : t('referrals.streak.days', 'days')}
            </p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {t('referrals.streak.longestStreak', 'Longest')}
              </span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground">
              {longestStreak}
            </p>
            <p className="text-xs text-muted-foreground">
              {longestStreak === 1 
                ? t('referrals.streak.day', 'day') 
                : t('referrals.streak.days', 'days')}
            </p>
          </div>
        </div>

        {/* Progress to next milestone */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('referrals.streak.bonus', 'Streak Bonus')}
              </span>
              <span className="font-medium">
                {t('referrals.streak.nextMilestone', 'Next milestone in {{days}} days', { 
                  days: nextMilestone.days - currentStreak 
                })}
              </span>
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        )}

        {/* Milestone badges */}
        <div className="flex flex-wrap gap-2">
          {STREAK_MILESTONES.map((milestone) => {
            const isAchieved = currentStreak >= milestone.days;
            return (
              <Badge
                key={milestone.days}
                variant={isAchieved ? "default" : "outline"}
                className={cn(
                  "text-xs",
                  isAchieved && "bg-orange-500 text-white"
                )}
              >
                <Zap className="h-3 w-3 mr-1" />
                {t(`referrals.streak.milestones.${milestone.label}`, `${milestone.days}-Day Streak: ${milestone.multiplier}x coins`)}
              </Badge>
            );
          })}
        </div>

        {/* Call to action */}
        {!isStreakActive ? (
          <p className="text-sm text-center text-muted-foreground">
            {t('referrals.streak.startStreak', 'Start your streak today!')}
          </p>
        ) : needsReferralToday ? (
          <p className="text-sm text-center text-orange-500 font-medium">
            {t('referrals.streak.referToday', 'Refer someone today to maintain your streak')}
          </p>
        ) : (
          <p className="text-sm text-center text-green-500 font-medium">
            {t('referrals.streak.keepItUp', 'Keep it up!')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
