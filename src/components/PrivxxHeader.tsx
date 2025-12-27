import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, Settings, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import LanguageSelector from "./LanguageSelector";
import { IdentityStatusCompact } from "./IdentityStatusCompact";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

// Lazy load the privacy drawer - only loaded when user interacts
const PrivacyDrawer = lazy(() => import("./PrivacyDrawer"));

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

const PrivxxHeader = () => {
  const { t } = useTranslation("ui");
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Fetch user profile when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [isAuthenticated, user]);

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

  return (
    <header className="fixed top-6 left-6 z-20 flex flex-col gap-3 opacity-70 hover:opacity-95 transition-opacity">
      <LanguageSelector />
      <Suspense fallback={<div className="min-h-[44px] w-20" />}>
        <PrivacyDrawer />
      </Suspense>
      {isAuthenticated ? (
        <>
          {/* User Profile Button */}
          <Link to="/settings">
            <Button 
              variant="ghost" 
              size="sm" 
              className="justify-start gap-2 text-foreground/70 hover:text-foreground min-h-[44px] px-2"
              aria-label={t("settings", "Settings")}
            >
              <Avatar className="h-6 w-6 border border-border/50">
                <AvatarImage src={profile?.avatar_url || undefined} alt={getDisplayName()} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only sm:not-sr-only text-sm truncate max-w-[100px]">
                {getDisplayName()}
              </span>
              <Settings className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
            </Button>
          </Link>
          <IdentityStatusCompact />
        </>
      ) : (
        <Link to="/auth">
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start gap-2 text-foreground/70 hover:text-foreground min-h-[44px]"
            aria-label={t("signIn", "Sign In")}
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{t("signIn", "Sign In")}</span>
          </Button>
        </Link>
      )}
      <Link to="/whats-new">
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start gap-2 text-foreground/70 hover:text-foreground min-h-[44px]"
          aria-label={t("whatsNew")}
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          {t("whatsNew")}
        </Button>
      </Link>
    </header>
  );
};

export default PrivxxHeader;
