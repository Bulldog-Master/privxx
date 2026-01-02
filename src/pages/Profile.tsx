/**
 * Profile Page
 * 
 * Allows users to view and edit their profile including display name and avatar.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Camera, Loader2, Save, Trash2, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileContext } from "@/contexts/ProfileContext";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageBackground } from "@/components/layout/PageBackground";
import { PrivxxLogo } from "@/components/brand";
import { AvatarCropperDialog } from "@/components/profile";
import { toast } from "sonner";

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { avatarUrl, refreshProfile: refreshContext } = useProfileContext();
  const { profile, isLoading, fetchProfile, updateProfile, uploadAvatar, removeAvatar } = useProfile();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    setJustSaved(false);
    const result = await updateProfile({ display_name: displayName, bio });
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      setJustSaved(true);
      toast.success(t("profileSaved", "Profile saved successfully"));
      // Reset "Saved" state after 2 seconds
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("invalidFileType", "Please select an image file"));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("fileTooLarge", "Image must be less than 5MB"));
      return;
    }

    // Open cropper dialog
    setSelectedFile(file);
    setCropperOpen(true);

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Convert blob to file for upload
    const file = new File([croppedBlob], "avatar.png", { type: "image/png" });
    
    setIsUploading(true);
    const result = await uploadAvatar(file);
    setIsUploading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("avatarUploaded", "Avatar uploaded successfully"));
      // Refresh context so header updates immediately
      refreshContext();
    }
    
    setSelectedFile(null);
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    const result = await removeAvatar();
    setIsUploading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("avatarRemoved", "Avatar removed"));
      // Refresh context so header updates immediately
      refreshContext();
    }
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  if (isLoading) {
    return (
      <PageBackground className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </PageBackground>
    );
  }

  return (
    <PageBackground className="px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-primary/60 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back", "Back")}
          </Button>
          <PrivxxLogo size="sm" />
        </div>

        {/* Profile Card */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <User className="h-5 w-5" />
              {t("yourProfile", "Your Profile")}
            </CardTitle>
            <CardDescription>
              {t("profileDescription", "Customize how you appear to others")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName || "Avatar"} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {t("changeAvatar", "Change Avatar")}
                </Button>
                {profile?.avatar_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={isUploading}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("remove", "Remove")}
                  </Button>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email", "Email")}</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  {t("emailCannotBeChanged", "Email cannot be changed")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">{t("displayName", "Display Name")}</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("displayNamePlaceholder", "How should we call you?")}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t("bio", "Bio")}</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("bioPlaceholder", "Tell us a bit about yourself...")}
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {bio.length}/200
                </p>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full ${justSaved ? "bg-green-600 hover:bg-green-600" : ""}`}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : justSaved ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving 
                ? t("saving", "Saving...") 
                : justSaved 
                  ? t("saved", "Saved") 
                  : t("saveChanges", "Save Changes")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Avatar Cropper Dialog */}
      <AvatarCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageFile={selectedFile}
        onCropComplete={handleCropComplete}
      />
    </PageBackground>
  );
}
