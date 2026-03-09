#!/bin/bash

# Linting Script
# Runs ESLint on the codebase

echo "🔍 Linting code..."

npx eslint "src/**/*.{ts,tsx}" --fix

echo "✅ Linting complete!"
