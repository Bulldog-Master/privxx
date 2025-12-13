import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import xxLogo from "@/assets/xx-logo.png";

// XX Logo image mark component - uses brightness filter for visibility on dark backgrounds
const PrivxxMark = ({ className, brighten = false }: { className?: string; brighten?: boolean }) => (
  <img 
    src={xxLogo} 
    alt="" 
    className={`${className} ${brighten ? 'brightness-150' : ''}`}
    aria-hidden="true"
  />
);

interface PrivxxLogoProps extends VariantProps<typeof logoVariants> {
  className?: string;
  variant?: "default" | "inherit";
  darkText?: boolean;
  brightenMark?: boolean; // For use in buttons where logo needs more visibility
}

const logoVariants = cva(
  "inline-flex items-baseline font-bold",
  {
    variants: {
      size: {
        sm: "text-base",      // For buttons, inline use
        md: "text-2xl",       // For headings, callouts
        lg: "text-6xl sm:text-7xl tracking-tight", // For hero
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
);

const markVariants = cva(
  "inline-block object-contain",
  {
    variants: {
      size: {
        sm: "w-[1.1em] h-[0.9em] ml-[-0.15em] align-text-bottom",
        md: "w-[1.15em] h-[1em] ml-[-0.15em] align-text-bottom",
        lg: "w-[1.3em] h-[1.1em] ml-[-0.2em] align-text-bottom",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
);

const PrivxxLogo = ({ size, variant = "default", darkText = false, brightenMark = false, className }: PrivxxLogoProps) => (
  <span className={cn(logoVariants({ size }), className)}>
    <span className={darkText ? "text-slate-800" : (variant === "default" ? "text-foreground" : "")}>Priv</span>
    <PrivxxMark className={markVariants({ size })} brighten={brightenMark} />
  </span>
);

export default PrivxxLogo;
