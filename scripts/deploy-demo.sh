#!/bin/bash

# Demo Deployment Helper Script
# Usage: ./deploy-demo.sh <demo-name> <build-directory> [options]

set -e

DEMO_NAME=$1
BUILD_DIR=$2
DESCRIPTION=${3:-""}
GITHUB_URL=${4:-""}

if [ -z "$DEMO_NAME" ] || [ -z "$BUILD_DIR" ]; then
    echo "Usage: $0 <demo-name> <build-directory> [description] [github-url]"
    echo "Example: $0 my-react-app ./dist \"My React demo\" \"https://github.com/user/my-react-app\""
    exit 1
fi

if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found: $BUILD_DIR"
    exit 1
fi

# Get bucket name from wrangler.toml
BUCKET_NAME=$(grep -A2 'r2_buckets' wrangler.toml | grep 'bucket_name' | cut -d'"' -f2)

if [ -z "$BUCKET_NAME" ] || [ "$BUCKET_NAME" == "YOUR_BUCKET_NAME" ]; then
    echo "❌ Please configure your bucket name in wrangler.toml first"
    exit 1
fi

echo "🚀 Deploying demo: $DEMO_NAME"
echo "📦 Uploading to R2 bucket: $BUCKET_NAME"

# Upload files to R2
find "$BUILD_DIR" -type f | while read -r file; do
    # Get relative path from build directory
    RELATIVE_PATH=${file#$BUILD_DIR/}
    R2_PATH="$DEMO_NAME/$RELATIVE_PATH"
    
    echo "📤 Uploading: $RELATIVE_PATH"
    wrangler r2 object put "$BUCKET_NAME/$R2_PATH" --file "$file"
done

# Create metadata
METADATA=$(cat <<EOF
{
    "name": "$DEMO_NAME",
    "description": "$DESCRIPTION",
    "updated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "github": "$GITHUB_URL"
}
EOF
)

# Update KV metadata
echo "📝 Updating metadata..."
echo "$METADATA" | wrangler kv:key put --binding=DEMO_CONFIG "$DEMO_NAME"

echo "✅ Demo deployed successfully!"
echo "🌐 Access your demo at: https://your-domain.com/$DEMO_NAME/"