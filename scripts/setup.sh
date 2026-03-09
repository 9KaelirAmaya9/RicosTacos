#!/bin/bash

# Development Environment Setup Script
# This script initializes the development environment

set -e

echo "🚀 Setting up development environment..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
else
  echo "✓ Dependencies already installed"
fi

# Initialize Husky
echo "🐶 Setting up Husky git hooks..."
npx husky install

# Make git hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "📝 Creating .env file from .env.example..."
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✓ .env file created. Please update with your credentials."
  fi
fi

echo "✅ Development environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env with your environment variables"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Git hooks are now active for code quality checks"
