/**
 * ReferralDrawer Component
 * 
 * Drawer/dialog containing the referral dashboard.
 */

import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/useMobile';
import { ReferralDashboard } from './ReferralDashboard';

interface ReferralDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReferralDrawer({ open, onOpenChange }: ReferralDrawerProps) {
  const { t } = useTranslation('ui');
  const isMobile = useIsMobile();

  const title = t('referrals.title', 'Referral Program');
  const description = t('referrals.description', 'Invite friends and earn XX Coins');

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="text-left flex-shrink-0">
            <DrawerTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {title}
            </DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
            <ReferralDashboard className="h-full" />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ReferralDashboard className="h-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
