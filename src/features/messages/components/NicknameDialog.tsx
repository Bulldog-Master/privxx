/**
 * NicknameDialog Component (Phase-1)
 * 
 * Modal dialog for setting/clearing conversation nicknames.
 * Phase-1 compliant: local storage only, no backend calls.
 * 
 * Nicknames are NOT verified contacts — just local UI labels.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NicknameDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Called when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Conversation ID being edited */
  conversationId: string;
  /** Current nickname (if any) */
  currentNickname?: string;
  /** Called with new nickname on save */
  onSave: (nickname: string) => void;
  /** Called when nickname should be cleared */
  onClear: () => void;
}

export function NicknameDialog({
  open,
  onOpenChange,
  conversationId,
  currentNickname,
  onSave,
  onClear,
}: NicknameDialogProps) {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState(currentNickname ?? "");

  // Reset input when dialog opens with different conversation
  useEffect(() => {
    if (open) {
      setNickname(currentNickname ?? "");
    }
  }, [open, currentNickname]);

  const handleSave = () => {
    const trimmed = nickname.trim();
    if (trimmed) {
      onSave(trimmed);
    }
    onOpenChange(false);
  };

  const handleClear = () => {
    onClear();
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && nickname.trim()) {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentNickname
              ? t("nickname.editTitle", "Edit Nickname")
              : t("nickname.setTitle", "Set Nickname")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "nickname.description",
              "Nicknames are local labels stored only on this device. They do not affect message routing or identity verification."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Show truncated conversation ID */}
          <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
            {conversationId.slice(0, 24)}…
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">
              {t("nickname.label", "Nickname")}
            </Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("nickname.placeholder", "Enter a nickname…")}
              maxLength={50}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {currentNickname && (
            <Button
              variant="outline"
              onClick={handleClear}
              className="sm:mr-auto"
            >
              {t("nickname.clear", "Clear Nickname")}
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!nickname.trim()}>
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
