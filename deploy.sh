#!/bin/bash

# DevTalks Deployment Script
# This script builds and deploys the Docker container with proper environment variables

set -e  # Exit on error

echo "🚀 DevTalks Deployment Script"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your environment variables."
    exit 1
fi

# Load environment variables
source .env.local

# Validate required NEXT_PUBLIC variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "NEXT_PUBLIC_FIREBASE_APP_ID"
)

echo "✅ Validating environment variables..."
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set in .env.local"
        exit 1
    fi
    echo "  ✓ $var is set"
done

echo ""
echo "🔨 Building Docker image..."
echo ""

# Build with docker-compose (automatically reads .env.local)
docker-compose build

echo ""
echo "🎯 Stopping existing container (if any)..."
docker-compose down

echo ""
echo "🚀 Starting new container..."
docker-compose up -d

echo ""
echo "📊 Container status:"
docker-compose ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Useful commands:"
echo "  - View logs:    docker-compose logs -f"
echo "  - Stop:         docker-compose down"
echo "  - Restart:      docker-compose restart"
echo "  - Shell access: docker-compose exec devtalks sh"
echo ""
