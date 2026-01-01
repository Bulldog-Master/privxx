/**
 * Reveal-on-Type Password Input Component
 * 
 * Shows each character briefly as typed before masking it.
 */

import { useState, useEffect, useRef, forwardRef, type InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RevealOnTypeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  revealOnType?: boolean;
  revealDuration?: number;
  showToggle?: boolean;
  showPassword?: boolean;
  onToggleVisibility?: () => void;
}

export const RevealOnTypeInput = forwardRef<HTMLInputElement, RevealOnTypeInputProps>(
  ({ 
    value, 
    onChange, 
    revealOnType = true,
    revealDuration = 150,
    showToggle = true,
    showPassword = false,
    onToggleVisibility,
    className,
    ...props 
  }, ref) => {
    const { t } = useTranslation();
    const [displayValue, setDisplayValue] = useState("");
    const [isRevealing, setIsRevealing] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prevLengthRef = useRef(value.length);

    useEffect(() => {
      if (showPassword) {
        setDisplayValue(value);
        return;
      }

      const isTyping = value.length > prevLengthRef.current;
      prevLengthRef.current = value.length;

      if (revealOnType && isTyping && value.length > 0) {
        // Show the last character, mask the rest
        const masked = "•".repeat(value.length - 1);
        const lastChar = value[value.length - 1];
        setDisplayValue(masked + lastChar);
        setIsRevealing(true);

        // Clear previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Mask after delay
        timeoutRef.current = setTimeout(() => {
          setDisplayValue("•".repeat(value.length));
          setIsRevealing(false);
        }, revealDuration);
      } else {
        // Immediate mask for deletion or paste
        setDisplayValue("•".repeat(value.length));
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [value, showPassword, revealOnType, revealDuration]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (showPassword) {
        onChange(e.target.value);
        return;
      }

      const inputValue = e.target.value;
      const cursorPos = e.target.selectionStart ?? inputValue.length;
      
      // Calculate what the new password should be
      let newPassword = value;
      
      if (inputValue.length > displayValue.length) {
        // Character(s) added
        const addedChars = inputValue.length - displayValue.length;
        const insertPos = cursorPos - addedChars;
        const newChars = inputValue.slice(insertPos, cursorPos);
        newPassword = value.slice(0, insertPos) + newChars + value.slice(insertPos);
      } else if (inputValue.length < displayValue.length) {
        // Character(s) deleted
        const deletedCount = displayValue.length - inputValue.length;
        const deletePos = cursorPos;
        newPassword = value.slice(0, deletePos) + value.slice(deletePos + deletedCount);
      }
      
      onChange(newPassword);
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={showPassword ? "text" : "text"}
          value={showPassword ? value : displayValue}
          onChange={handleChange}
          className={cn(
            "font-mono tracking-wider",
            isRevealing && "animate-pulse",
            className
          )}
          autoComplete="new-password"
          {...props}
        />
        {showToggle && onToggleVisibility && (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? t("hidePassword", "Hide password") : t("showPassword", "Show password")}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );
  }
);

RevealOnTypeInput.displayName = "RevealOnTypeInput";
