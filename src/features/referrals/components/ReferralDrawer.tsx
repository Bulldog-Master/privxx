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
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {title}
            </DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <ReferralDashboard className="px-4 pb-6 max-h-[calc(90vh-100px)]" />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ReferralDashboard className="flex-1 min-h-0" />
      </DialogContent>
    </Dialog>
  );
}
