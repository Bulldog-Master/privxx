import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import xxLogo from "@/assets/xx-logo.png";

// XX Logo image mark component
const PrivxxMark = ({ className }: { className?: string }) => (
  <img 
    src={xxLogo} 
    alt="" 
    className={className}
    aria-hidden="true"
  />
);

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
  "ml-0.5 object-contain",
  {
    variants: {
      size: {
        sm: "w-[1.2em] h-[1em]",
        md: "w-[1.3em] h-[1.1em]",
        lg: "w-[1.4em] h-[1.2em]",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
);

interface PrivxxLogoProps extends VariantProps<typeof logoVariants> {
  className?: string;
  variant?: "default" | "inherit";
  darkText?: boolean; // For use on bright backgrounds
}

const PrivxxLogo = ({ size, variant = "default", darkText = false, className }: PrivxxLogoProps) => (
  <span className={cn(logoVariants({ size }), className)}>
    <span className={darkText ? "text-slate-800" : (variant === "default" ? "text-foreground" : "")}>Privx</span>
    <PrivxxMark className={markVariants({ size })} />
  </span>
);

export default PrivxxLogo;
