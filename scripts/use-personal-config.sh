#!/bin/bash

# Switch to personal configuration

if [ -f "wrangler.toml.personal" ]; then
    cp wrangler.toml.personal wrangler.toml
    echo "✅ Switched to personal configuration"
else
    echo "❌ No personal configuration found. Create wrangler.toml.personal first."
    exit 1
fi