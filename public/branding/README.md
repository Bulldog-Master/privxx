# Privxx Brand Assets

## Asset Inventory

| File | Description | Usage |
|------|-------------|-------|
| `privxx-xx-mark.png` | Official XX Network logo mark (teal) | Used in PrivxxLogo component alongside "Priv" text |
| `privxx-xx-symbol.svg` | Custom Privxx symbol (3-line X geometry) | Decorative/structural use only |

## Usage Rules

- **Never use "Privxx" as plain text** in UI labels or buttons
- Always use the `PrivxxLogo` component which combines:
  - "Priv" (gradient text)
  - XX mark (teal logo)
- The XX mark has **zero white background** — it's transparent
- No monochrome fallbacks, no icon-only usage

## Component Reference

```tsx
import PrivxxLogo from "@/components/PrivxxLogo";

// Sizes: sm (buttons), md (headings), lg (hero)
<PrivxxLogo size="sm" />
<PrivxxLogo size="md" />
<PrivxxLogo size="lg" />
```

## Colors

- XX Mark: Official teal (`hsl(172 50% 45%)`)
- "Priv" gradient: Rose → Amber → Teal

## Do Not

- ❌ Redesign or reinterpret the XX mark
- ❌ Use alternative colors
- ❌ Add backgrounds or boxes around the mark
- ❌ Use emoji or substitutes
