#!/bin/bash

# Demo Router Setup Script
# This script helps automate the setup process for the demo router

set -e

echo "🚀 Demo Router Setup Script"
echo "=========================="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v wrangler >/dev/null 2>&1 || { echo "⚠️  Wrangler not found. Installing..."; npm install -g wrangler; }

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if wrangler is authenticated
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami >/dev/null 2>&1; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Get account ID
ACCOUNT_ID=$(wrangler whoami --json | jq -r '.account_id' 2>/dev/null || echo "")
if [ -z "$ACCOUNT_ID" ]; then
    echo "❌ Could not retrieve account ID. Please run 'wrangler whoami' and note your account ID."
    exit 1
fi

echo "✅ Account ID: $ACCOUNT_ID"

# Create R2 bucket
echo "📦 Creating R2 bucket..."
BUCKET_NAME=${R2_BUCKET_NAME:-"demo-assets-$(date +%s)"}
if wrangler r2 bucket create "$BUCKET_NAME" 2>/dev/null; then
    echo "✅ Created R2 bucket: $BUCKET_NAME"
else
    echo "⚠️  R2 bucket might already exist or creation failed. Continuing..."
fi

# Create KV namespace
echo "🗂️ Creating KV namespace..."
KV_RESULT=$(wrangler kv:namespace create "DEMO_CONFIG" --json 2>/dev/null || echo "{}")
KV_ID=$(echo "$KV_RESULT" | jq -r '.id' 2>/dev/null || echo "")

if [ -n "$KV_ID" ] && [ "$KV_ID" != "null" ]; then
    echo "✅ Created KV namespace with ID: $KV_ID"
    
    # Update wrangler.toml with the KV namespace ID
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/YOUR_KV_NAMESPACE_ID/$KV_ID/g" wrangler.toml
        sed -i '' "s/rozich-demos/$BUCKET_NAME/g" wrangler.toml
    else
        # Linux
        sed -i "s/YOUR_KV_NAMESPACE_ID/$KV_ID/g" wrangler.toml
        sed -i "s/rozich-demos/$BUCKET_NAME/g" wrangler.toml
    fi
    echo "✅ Updated wrangler.toml"
else
    echo "⚠️  Could not create KV namespace. You'll need to create it manually and update wrangler.toml"
fi

# Deploy the worker
echo "🚀 Deploying worker..."
if npm run deploy; then
    echo "✅ Worker deployed successfully!"
    WORKER_URL=$(wrangler deployments list --json | jq -r '.[0].url' 2>/dev/null || echo "")
    if [ -n "$WORKER_URL" ]; then
        echo "🌐 Worker URL: $WORKER_URL"
    fi
else
    echo "❌ Worker deployment failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "📋 Next Steps:"
echo "============="
echo "1. Go to your Cloudflare dashboard: https://dash.cloudflare.com"
echo "2. Navigate to Workers & Pages → Select 'demo-router'"
echo "3. Go to Settings → Domains & Routes"
echo "4. Add a Custom Domain (e.g., demo.yourdomain.com)"
echo ""
echo "For GitHub Actions deployment:"
echo "- Set CLOUDFLARE_API_TOKEN secret in your repo"
echo "- Set CLOUDFLARE_ACCOUNT_ID secret to: $ACCOUNT_ID"
echo ""
echo "🎉 Setup complete! Your demo router is ready to use."