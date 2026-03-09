# Development Guide

## Quick Start

### Initial Setup
```bash
# Run the setup script to initialize the development environment
chmod +x scripts/*.sh
./scripts/setup.sh

# Or manually:
npm install
npx husky install
```

### Available Scripts

#### Development
```bash
npm run dev           # Start development server (port 8080)
```

#### Code Quality
```bash
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
npm run type-check    # Run TypeScript type checking
```

#### Testing
```bash
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:e2e      # Run end-to-end tests
```

#### Building
```bash
npm run build         # Build for production
npm run preview       # Preview production build
```

## Git Hooks (Husky)

Pre-commit hooks automatically run before each commit:
- **Lint-staged**: Formats and lints only staged files
- **ESLint**: Checks code quality
- **Prettier**: Formats code

Commit message hook:
- **Commitlint**: Ensures conventional commit format

### Commit Message Format
```
type(scope?): subject

types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
```

Examples:
```bash
feat: add menu catalog page
fix: resolve checkout validation issue
docs: update README with setup instructions
```

## Code Style

### Prettier Configuration
- Single quotes: No (double quotes)
- Semicolons: Yes
- Trailing commas: ES5
- Print width: 100
- Tab width: 2 spaces

### ESLint Rules
- TypeScript strict mode
- React hooks rules enforced
- Unused variables allowed (for development)

## Project Structure

```
src/
├── assets/          # Images, fonts, static files
├── components/      # Reusable React components
│   └── ui/         # UI library components (shadcn)
├── contexts/        # React Context providers
├── data/           # Static data and translations
├── hooks/          # Custom React hooks
├── integrations/   # Third-party integrations
│   └── supabase/  # Supabase client and types
├── pages/          # Route pages
├── utils/          # Utility functions
└── main.tsx        # Application entry point

supabase/
├── functions/      # Edge functions (serverless)
└── config.toml    # Supabase configuration

scripts/
├── setup.sh       # Environment setup
├── format.sh      # Code formatting
└── lint.sh        # Code linting
```

## Docker Development

The project includes Docker support for local development:

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application
http://localhost:8080
```

**Note**: Docker is for local development only. Production deployment uses Lovable Cloud.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Supabase (Lovable Cloud)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key

# Mapbox (for delivery validation)
VITE_MAPBOX_PUBLIC_TOKEN=your_mapbox_token
```

## Backend (Lovable Cloud)

This project uses Lovable Cloud (Supabase) for backend:
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Built-in auth system
- **Edge Functions**: Serverless functions for backend logic
- **Storage**: File storage (if configured)

### Database Migrations
Migrations are automatically applied. To create new migrations, use the Lovable Cloud UI or SQL editor.

### Edge Functions
Located in `supabase/functions/`. They deploy automatically when you update code.

Example edge function call:
```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* payload */ }
});
```

## Troubleshooting

### Husky hooks not running
```bash
npx husky install
chmod +x .husky/*
```

### Prettier conflicts with ESLint
The configuration includes `eslint-config-prettier` to disable conflicting rules.

### Type errors after dependency update
```bash
npm run type-check
```

## Additional Resources

- [Lovable Documentation](https://docs.lovable.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
