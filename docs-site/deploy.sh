#!/bin/bash

# This script builds and deploys the documentation to the gh-pages branch.
# It's a convenient way to deploy manually from your local machine.

# Exit on error
set -e

# Change to the docs-site directory if not already there
cd "$(dirname "$0")"

echo "🧹 Cleaning up old build..."
rm -rf out

echo "🚀 Building Orchka Documentation..."
bun run build

# Enter the output directory
cd out

# GitHub Pages needs a .nojekyll file to serve files starting with underscores (like Next.js chunks)
touch .nojekyll

# Initialize a temporary git repository
git init -b main
git add -A
git commit -m "deploy: update documentation $(date)"

# Use the correct repository URL provided by the user
REMOTE_URL="https://github.com/manyeya/Orchka.git"

echo "📤 Pushing to gh-pages branch on $REMOTE_URL..."
git push -f "$REMOTE_URL" main:gh-pages

echo "✅ Success! Your documentation is being deployed."
echo "🔗 View it at: https://manyeya.github.io/Orchka"
