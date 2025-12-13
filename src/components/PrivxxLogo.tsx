import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Custom Privxx mark: 3 lines forming 2 overlapping Xs
// Line 1 & 2 cross = first X, Line 2 & 3 cross = second X
// Middle line (2) is shared — creates network/mixing symbolism
// Curved xx mark inspired by official xx network geometry
const PrivxxMark = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 48 40" 
    fill="none" 
    className={className}
    aria-hidden="true"
  >
    {/* Two curved strokes forming the xx shape */}
    <path 
      d="M8 6C16 16 16 24 8 34" 
      stroke="currentColor" 
      strokeWidth="5" 
      strokeLinecap="round"
      fill="none"
    />
    <path 
      d="M24 6C16 16 16 24 24 34" 
      stroke="currentColor" 
      strokeWidth="5" 
      strokeLinecap="round"
      fill="none"
    />
    <path 
      d="M24 6C32 16 32 24 24 34" 
      stroke="currentColor" 
      strokeWidth="5" 
      strokeLinecap="round"
      fill="none"
    />
    <path 
      d="M40 6C32 16 32 24 40 34" 
      stroke="currentColor" 
      strokeWidth="5" 
      strokeLinecap="round"
      fill="none"
    />
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
