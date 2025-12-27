/**
 * Auth Card Component
 * 
 * Wrapper card with header for auth forms.
 */

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          {title || t("authWelcome", "Welcome to Privxx")}
        </CardTitle>
        {description && (
          <CardDescription>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
