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
        sm: "w-[1.6em] h-[1.2em] ml-[-0.1em] align-text-bottom",
        md: "w-[1.15em] h-[1em] ml-[-0.25em] align-text-bottom",
        lg: "w-[1.3em] h-[1.1em] ml-[-0.3em] align-text-bottom",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
);

const PrivxxLogo = ({ size, variant = "default", darkText = false, brightenMark = false, className }: PrivxxLogoProps) => (
  <span className={cn(logoVariants({ size }), "shrink-0", className)}>
    <span 
      className={darkText ? "text-slate-800" : "bg-clip-text text-transparent"}
      style={darkText ? undefined : {
        backgroundImage: 'linear-gradient(90deg, hsl(340 50% 50%) 0%, hsl(45 60% 55%) 50%, hsl(172 50% 45%) 100%)'
      }}
    >
      Priv
    </span>
    <PrivxxMark className={cn(markVariants({ size }), "shrink-0")} brighten={brightenMark} />
  </span>
);

export default PrivxxLogo;
