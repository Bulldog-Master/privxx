# Contributing to Privxx

Thank you for your interest in contributing to Privxx!

## Development Setup

### Prerequisites

- Node.js 18+
- npm (not yarn, not bun)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/privxx.git
cd privxx

# Install dependencies (use npm only)
npm install

# Start development server
npm run dev
```

### Important: Use npm

This project uses **npm** as its package manager. Do not use bun or yarn.

- ✅ `npm install`
- ✅ `npm run dev`
- ❌ `bun install`
- ❌ `yarn install`

## Pull Request Guidelines

### Before Submitting

1. Run linting: `npm run lint`
2. Run type checking: `npm run typecheck` (if available)
3. Run build: `npm run build`
4. Test your changes locally

### PR Requirements

- Clear description of what changed and why
- Reference any related issues
- Keep changes focused — one feature/fix per PR
- Follow existing code style

### What We Look For

- **Privacy-first**: No analytics, tracking, or persistent identifiers
- **i18n**: All user-facing strings use translation keys
- **Accessibility**: Semantic HTML, keyboard navigation
- **Simplicity**: Minimal dependencies, clear code

## Code Style

- TypeScript for all new code
- Tailwind CSS for styling (use design system tokens)
- React functional components with hooks
- Meaningful component and variable names

## Branch Naming

- `feature/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation updates
- `refactor/description` — Code refactoring

## Questions?

Open a discussion or reach out to the maintainers.
