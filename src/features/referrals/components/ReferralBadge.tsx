/**
 * ReferralBadge Component
 * 
 * Small badge overlay for the user avatar showing referral icon.
 */

import { forwardRef, MouseEvent } from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferralBadgeProps {
  className?: string;
  onClick?: (e: MouseEvent) => void;
}

export const ReferralBadge = forwardRef<HTMLButtonElement, ReferralBadgeProps>(
  ({ className, onClick }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "absolute -bottom-1 -right-1 z-10",
          "w-5 h-5 rounded-full",
          "bg-primary text-primary-foreground",
          "flex items-center justify-center",
          "border-2 border-background",
          "transition-transform hover:scale-110",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          className
        )}
        aria-label="View referral program"
      >
        <Users className="h-3 w-3" />
      </button>
    );
  }
);

ReferralBadge.displayName = 'ReferralBadge';
