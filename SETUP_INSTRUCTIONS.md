# 🚀 Setup Instructions

## Prerequisites
- Node.js 18+ or Bun
- Git

## Quick Setup (Recommended)

Run the automated setup script:

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This will:
1. ✅ Install all dependencies
2. ✅ Initialize Husky git hooks
3. ✅ Set up pre-commit code quality checks
4. ✅ Create .env file (if needed)

## Manual Setup

If you prefer to set up manually:

### 1. Install Dependencies
```bash
npm install
# or
bun install
```

### 2. Initialize Git Hooks
```bash
npx husky install
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

## What's Been Integrated from base2

### ✅ Husky Git Hooks
Pre-commit hooks automatically run:
- **ESLint**: Code quality checks
- **Prettier**: Automatic code formatting
- **Lint-staged**: Only checks staged files (fast!)

### ✅ Code Quality Tools
- **Prettier**: Consistent code formatting
- **ESLint**: Code quality and best practices
- **Commitlint**: Conventional commit message format

### ✅ Development Scripts
Located in `scripts/` directory:
- `setup.sh` - Full environment setup
- `format.sh` - Format all code
- `lint.sh` - Lint all code

### ✅ Editor Configuration
- `.editorconfig` - Consistent editor settings
- `.prettierrc` - Code formatting rules
- `.lintstagedrc.json` - Pre-commit checks

## Git Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks

### Examples
```bash
git commit -m "feat: add menu catalog PDF export"
git commit -m "fix: resolve checkout validation timeout"
git commit -m "docs: update setup instructions"
```

## Development Workflow

### 1. Start Development Server
```bash
npm run dev
```

### 2. Make Changes
Edit files in `src/` directory. Hot reload is enabled.

### 3. Commit Changes
```bash
git add .
git commit -m "feat: your feature description"
```

The pre-commit hook will automatically:
- Format your code with Prettier
- Lint your code with ESLint
- Validate your commit message

### 4. Push to Repository
```bash
git push origin main
```

## Docker Development (Optional)

For local development with Docker:

```bash
# Build and run
docker-compose up --build

# Stop
docker-compose down
```

Access at: http://localhost:8080

**Note**: Docker is for local development only. Production uses Lovable Cloud deployment.

## Code Quality Commands

### Format Code
```bash
npm run format
# or
./scripts/format.sh
```

### Lint Code
```bash
npm run lint
# or
./scripts/lint.sh
```

### Type Check
```bash
npm run type-check
```

## Troubleshooting

### Git hooks not working?
```bash
npx husky install
chmod +x .husky/*
```

### Commit message rejected?
Use the conventional commit format:
```bash
git commit -m "type: description"
```

### Prettier/ESLint conflicts?
The configuration is set up to work together. Run:
```bash
npm run format
npm run lint
```

### Need to skip hooks? (Not recommended)
```bash
git commit --no-verify -m "message"
```

## Additional Resources

- [Development Guide](./DEVELOPMENT.md) - Detailed development documentation
- [Lovable Docs](https://docs.lovable.dev/) - Platform documentation
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit format guide

## Support

Need help? Check:
1. [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed docs
2. Lovable Discord community
3. Project README.md
