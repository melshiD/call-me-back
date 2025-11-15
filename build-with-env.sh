#!/bin/bash
# Build script that ensures all .env variables are loaded

set -e

echo "=== Building Frontend with Environment Variables ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env from .env.example first"
    exit 1
fi

# Load all environment variables from .env
echo "📦 Loading environment variables from .env..."
set -a  # Mark all new variables for export
source .env
set +a  # Turn off auto-export

# Verify critical variables are set
echo "✅ Verifying critical environment variables..."

if [ -z "$VITE_API_URL" ]; then
    echo "❌ Error: VITE_API_URL is not set in .env"
    exit 1
else
    echo "   VITE_API_URL is set (pointing to: ${VITE_API_URL:0:50}...)"
fi

# Run the build with all env vars loaded
echo ""
echo "🔨 Building frontend with Vite..."
npm run build

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Deploy to Vercel: npx vercel --prod --yes"
echo "   2. Or deploy to staging: npx vercel"
echo ""
echo "🔍 To verify the build has correct API URL:"
echo "   grep -o '01ka23f9q75s1jdjgxhh700ghv' dist/assets/*.js | head -1"
echo ""