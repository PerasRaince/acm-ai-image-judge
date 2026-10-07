#!/usr/bin/env bash
set -e

SPACE_REPO="$1"

if [ -z "$SPACE_REPO" ]; then
    echo "========================================================"
    echo "  Hugging Face Spaces Deployment Tool (AI Scoring Engine) "
    echo "========================================================"
    echo ""
    read -p "Enter your Hugging Face Space URL (or username/space-name): " SPACE_REPO
fi

if [ -z "$SPACE_REPO" ]; then
    echo "Error: No Space repository provided."
    exit 1
fi

if [[ "$SPACE_REPO" != http* ]]; then
    SPACE_REPO="https://huggingface.co/spaces/$SPACE_REPO"
fi

echo "==> Preparing AI Scoring Service for Hugging Face Spaces..."
echo "==> Target Space: $SPACE_REPO"

if [ -n "$(git status --porcelain ai-service backend)" ]; then
    echo "==> Committing local ai-service changes..."
    git add ai-service backend
    git commit -m "chore: prepare ai-service for Hugging Face Spaces deployment"
fi

BRANCH_NAME="hf-deploy-temp"
git branch -D "$BRANCH_NAME" 2>/dev/null || true

echo "==> Isolating ai-service folder into deployment branch..."
git subtree split --prefix ai-service -b "$BRANCH_NAME"

echo "==> Pushing container to Hugging Face Spaces (main branch)..."
git push "$SPACE_REPO" "${BRANCH_NAME}:main" --force

git branch -D "$BRANCH_NAME"

echo "========================================================"
echo "  SUCCESS! Deployment pushed to Hugging Face Spaces!    "
echo "========================================================"
echo "Hugging Face is building your container with 16 GB RAM."
