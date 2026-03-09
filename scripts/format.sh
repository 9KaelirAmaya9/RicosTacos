#!/bin/bash

# Code Formatting Script
# Formats all code using Prettier

echo "🎨 Formatting code..."

npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"

echo "✅ Code formatting complete!"
