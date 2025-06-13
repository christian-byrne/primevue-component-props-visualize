#!/bin/bash

# PrimeVue Component Playground - Deploy Script
# This script commits changes and deploys to GitHub Pages

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Check if there are uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "📝 Committing changes..."
    
    # Add all changes
    git add .
    
    # Prompt for commit message or use default
    if [ -z "$1" ]; then
        echo "Enter commit message (or press Enter for default):"
        read commit_message
        if [ -z "$commit_message" ]; then
            commit_message="Update playground"
        fi
    else
        commit_message="$1"
    fi
    
    # Commit changes
    git commit -m "$commit_message"
    
    # Push to main branch
    echo "⬆️ Pushing to main branch..."
    git push origin main
else
    echo "✅ No uncommitted changes found"
fi

# Deploy to GitHub Pages
echo "🌐 Deploying to GitHub Pages..."
npm run deploy

echo "✨ Deployment complete!"
echo "🔗 Your app will be available at: https://christian-byrne.github.io/primevue-component-props-visualize/"
echo "⏱️ Note: GitHub Pages may take a few minutes to update"