/**
 * UserProfileCard Component
 * 
 * A reusable card that displays user avatar, name, and email.
 * Uses the centralized ProfileContext for fast avatar loading.
 */

import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileContext } from "@/contexts/ProfileContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UserProfileCardProps {
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show as a link to profile page */
  asLink?: boolean;
  /** Whether to show the description text */
  showDescription?: boolean;
  /** Whether to show the chevron arrow */
  showChevron?: boolean;
  /** Additional className */
  className?: string;
}

const sizeConfig = {
  sm: {
    avatar: "h-8 w-8",
    name: "text-sm font-medium",
    email: "text-xs",
  },
  md: {
    avatar: "h-10 w-10",
    name: "font-medium",
    email: "text-sm",
  },
  lg: {
    avatar: "h-12 w-12",
    name: "text-lg font-semibold",
    email: "text-sm",
  },
};

const UserProfileCard = forwardRef<HTMLDivElement, UserProfileCardProps>(
  (
    {
      size = "md",
      asLink = false,
      showDescription = true,
      showChevron = true,
      className,
    },
    ref
  ) => {
    const { t } = useTranslation("ui");
    const { user } = useAuth();
    const { profile, avatarUrl } = useProfileContext();

    const config = sizeConfig[size];

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
      return t("editProfile", "Edit Profile");
    };

    const content = (
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Avatar className={config.avatar}>
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={profile?.display_name || "User"} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary">
              {profile?.display_name ? getInitials() : <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className={cn("text-primary", config.name)}>{getDisplayName()}</p>
            {showDescription && (
              <p className={cn("text-primary/70", config.email)}>
                {t("editProfileDesc", "Change your display name and avatar")}
              </p>
            )}
          </div>
        </div>
        {showChevron && <ChevronRight className="h-5 w-5 text-primary/70" />}
      </CardContent>
    );

    if (asLink) {
      return (
        <Card
          ref={ref}
          className={cn("bg-card/90 backdrop-blur-sm border-border/50", className)}
        >
          <Link to="/profile" className="block">
            {content}
          </Link>
        </Card>
      );
    }

    return (
      <Card
        ref={ref}
        className={cn("bg-card/90 backdrop-blur-sm border-border/50", className)}
      >
        {content}
      </Card>
    );
  }
);

UserProfileCard.displayName = "UserProfileCard";

export default UserProfileCard;
