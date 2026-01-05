import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, Settings, LogIn, User, Shield, ChevronDown, Lock, Unlock, Activity, HeartPulse, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileContext } from "@/contexts/ProfileContext";
import { useIdentity } from "@/features/identity";
import { ReferralBadge, ReferralDrawer } from "@/features/referrals";
import LanguageSelector from "@/components/shared/LanguageSelector";
import { ConnectionStatusBadge } from "@/components/connection";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Lazy load the privacy drawer - only loaded when user interacts
const PrivacyDrawer = lazy(() => import("@/components/shared/PrivacyDrawer"));

const PrivxxHeader = () => {
  const { t } = useTranslation("ui");
  const { isAuthenticated, user, signOut } = useAuth();
  const { profile, avatarUrl, isLoading: isProfileLoading } = useProfileContext();
  const { isUnlocked, isLocked, lock } = useIdentity();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (profile?.display_name) {
      return profile.display_name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return t("user", "User");
  };

  const handleLock = async () => {
    await lock();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleReferralClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setReferralOpen(true);
  };

  return (
    <>
      <header className="fixed top-6 left-6 z-20 flex items-center gap-3 opacity-70 hover:opacity-95 transition-opacity">
        {/* Connection Status Badge */}
        <ConnectionStatusBadge />

        {/* Language Selector */}
        <LanguageSelector />

        {/* Sign In button for unauthenticated users */}
        {!isAuthenticated && (
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="gap-1.5 text-primary/80 hover:text-primary min-h-[44px] px-3"
          >
            <Link to="/auth">
              <LogIn className="w-4 h-4" />
              {t("signIn", "Sign In")}
            </Link>
          </Button>
        )}

        {/* User Menu Dropdown */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1.5 text-primary/80 hover:text-primary min-h-[44px] px-2"
              >
              {isAuthenticated ? (
                isProfileLoading ? (
                  <Skeleton className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="relative">
                    <Avatar className="h-8 w-8 border-2 border-primary/40">
                      <AvatarImage src={avatarUrl || undefined} alt={getDisplayName()} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    {/* XX Coins balance badge overlay */}
                    <button
                      type="button"
                      onClick={handleReferralClick}
                      className="absolute -bottom-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-yellow-500 text-yellow-950 flex items-center justify-center border-2 border-background cursor-pointer hover:scale-110 hover:bg-yellow-400 transition-all shadow-lg"
                      title={t("referrals.xxCoins", "XX Coins: {{count}}", { count: profile?.xx_coins_balance ?? 0 })}
                    >
                      <span className="text-[10px] font-bold leading-none">
                        {profile?.xx_coins_balance ?? 0}
                      </span>
                    </button>
                  </div>
                )
              ) : (
                <User className="w-5 h-5 text-primary/80" />
              )}
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 border-primary/40 text-primary">
            {isAuthenticated ? (
              <>
                {/* User info */}
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium truncate">{getDisplayName()}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                
                {/* Referrals */}
                <DropdownMenuItem 
                  onClick={() => setReferralOpen(true)} 
                  className="gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  {t("referrals.title", "Referral Program")}
                </DropdownMenuItem>
                
                {/* Identity status */}
                {isUnlocked && (
                  <DropdownMenuItem onClick={handleLock} className="gap-2 cursor-pointer">
                    <Lock className="w-4 h-4" />
                    {t("lock", "Lock")}
                  </DropdownMenuItem>
                )}
                {isLocked && (
                  <DropdownMenuItem disabled className="gap-2 opacity-60">
                    <Unlock className="w-4 h-4" />
                    {t("identityLocked", "Identity Locked")}
                  </DropdownMenuItem>
                )}
                
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/auth" className="gap-2 cursor-pointer">
                    <LogIn className="w-4 h-4" />
                    {t("signIn", "Sign In")}
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            {/* Privacy */}
            <DropdownMenuItem 
              onClick={() => setPrivacyOpen(true)} 
              className="gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              {t("privacy", "Privacy")}
            </DropdownMenuItem>

            {/* What's New */}
            <DropdownMenuItem asChild>
              <Link to="/whats-new" className="gap-2 cursor-pointer">
                <Sparkles className="w-4 h-4" />
                {t("whatsNew", "What's New")}
              </Link>
            </DropdownMenuItem>

            {/* Health */}
            <DropdownMenuItem asChild>
              <Link to="/health" className="gap-2 cursor-pointer">
                <HeartPulse className="w-4 h-4" />
                {t("health.title", "Health")}
              </Link>
            </DropdownMenuItem>

            {/* Diagnostics */}
            <DropdownMenuItem asChild>
              <Link to="/diagnostics" className="gap-2 cursor-pointer">
                <Activity className="w-4 h-4" />
                {t("diagnostics.link", "Diagnostics")}
              </Link>
            </DropdownMenuItem>

            {/* Settings (only when authenticated) */}
            {isAuthenticated && (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    {t("settings", "Settings")}
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={handleSignOut} 
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogIn className="w-4 h-4 rotate-180" />
                  {t("signOut", "Sign Out")}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Privacy Drawer (controlled by dropdown) */}
        <Suspense fallback={null}>
          <PrivacyDrawer open={privacyOpen} onOpenChange={setPrivacyOpen} />
        </Suspense>
      </header>

      {/* Referral Drawer */}
      <ReferralDrawer open={referralOpen} onOpenChange={setReferralOpen} />
    </>
  );
};

export default PrivxxHeader;
