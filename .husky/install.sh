#!/bin/bash

# Husky Installation Script
# Run this after npm install to set up git hooks

echo "🐶 Installing Husky git hooks..."

# Install husky
npx husky install

# Create hooks directory if it doesn't exist
mkdir -p .husky

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

echo "✅ Husky git hooks installed successfully!"
echo "Git hooks are now active. Code will be automatically linted and formatted before commits."
