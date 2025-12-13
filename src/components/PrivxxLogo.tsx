import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Custom Privxx mark: 3 lines forming 2 overlapping Xs
// Line 1 & 2 cross = first X, Line 2 & 3 cross = second X
// Middle line (2) is shared — creates network/mixing symbolism
const PrivxxMark = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 40 32" 
    fill="none" 
    className={className}
    aria-hidden="true"
  >
    <path d="M4 4L20 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M20 4L4 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M36 4L20 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
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
  "ml-0.5",
  {
    variants: {
      size: {
        sm: "w-[0.7em] h-[0.55em] -translate-y-[0.05em]",
        md: "w-[0.72em] h-[0.58em] -translate-y-[0.1em]",
        lg: "w-[0.75em] h-[0.6em] -translate-y-[0.15em]",
      },
      variant: {
        default: "text-primary",
        inherit: "", // Inherits color from parent (for buttons)
      },
    },
    defaultVariants: {
      size: "sm",
      variant: "default",
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
    <PrivxxMark className={markVariants({ size, variant })} />
  </span>
);

export default PrivxxLogo;
