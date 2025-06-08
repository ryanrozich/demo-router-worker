# Demo Router Worker

A centralized Cloudflare Worker that routes and serves multiple demo applications from a single domain. Perfect for hosting portfolio projects, demos, and experiments.

## Features

- 🚀 **Centralized Routing** - One domain for all your demos
- 📦 **R2 Storage** - Serve static assets efficiently
- 🗂️ **KV Metadata** - Track demo information and settings
- 🎨 **Auto-generated Homepage** - Lists all demos with descriptions
- ⚡ **SPA Support** - Client-side routing for React, Vue, etc.
- 🔧 **Easy Integration** - Simple deployment from demo repos
- 🛡️ **SEO Friendly** - Robots.txt, sitemap.xml, meta tags
- 📊 **Analytics Ready** - Support for PostHog, Plausible, and more
- 🔒 **Secure by Default** - HTTPS, security headers, Cloudflare protection

## Architecture

```
demo.yourdomain.com/
├── /                     # Homepage listing all demos
├── /demo1/              # Individual demo routes
├── /demo2/
└── /api/demos           # Future API endpoints
```

## Quick Start

### Prerequisites

- Cloudflare account
- Node.js 18+ installed
- GitHub account (for automated deployment)

### 1. Deploy with GitHub Actions

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_USERNAME/demo-router-worker)

**OR** manually:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/demo-router-worker
cd demo-router-worker

# Install dependencies
npm install

# Deploy (requires Cloudflare API token)
npm run deploy
```

### 2. Manual Cloudflare Setup

After deployment, you need to configure these resources in your [Cloudflare dashboard](https://dash.cloudflare.com):

#### Create R2 Bucket
1. Navigate to **R2** → **Create bucket**
2. Name: `your-demos` (or update in `wrangler.toml`)
3. Location: Choose closest region

#### Create KV Namespace
1. Go to **Workers & Pages** → **KV** → **Create namespace**
2. Name: `demo-config`
3. Copy the namespace ID
4. Update `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "DEMO_CONFIG"
   id = "YOUR_KV_NAMESPACE_ID"  # Replace with your ID
   ```

#### Configure Custom Domain
1. Go to **Workers & Pages** → Select your worker
2. Go to **Settings** tab
3. Under **Domains & Routes**, click **+ Add**
4. Choose **Custom domain**
5. Enter your subdomain (e.g., `demo.yourdomain.com`)
6. Save (DNS will be configured automatically)

### 3. GitHub Actions Setup (Optional)

To enable automated deployment on push:

1. Copy the example workflow:
   ```bash
   cp .github/workflows/deploy.yml.example .github/workflows/deploy.yml
   ```

2. Add these secrets to your GitHub repository:
   ```bash
   # Get your Cloudflare API token
   # Dashboard → My Profile → API Tokens → Create Token
   # Use "Edit Cloudflare Workers" template with KV and R2 permissions
   gh secret set CLOUDFLARE_API_TOKEN

   # Get your Account ID from Cloudflare dashboard (right sidebar)
   gh secret set CLOUDFLARE_ACCOUNT_ID
   ```

**Note**: The `.github/workflows/deploy.yml` is gitignored to prevent accidental deployments to the wrong account.

## Configuration

### wrangler.toml

```toml
name = "demo-router"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# R2 bucket binding
[[r2_buckets]]
binding = "DEMO_ASSETS"
bucket_name = "your-demos"  # Change to your bucket name

# KV namespace binding
[[kv_namespaces]]
binding = "DEMO_CONFIG"
id = "YOUR_KV_NAMESPACE_ID"  # Replace with your KV namespace ID
```

## Deploying Demos

Each demo repository should include a deployment script that:

1. Builds the demo assets
2. Uploads to R2 under `project-name/`
3. Updates KV metadata

Example deployment workflow for a demo project:

```yaml
# .github/workflows/deploy-demo.yml
name: Deploy Demo

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Demo
        run: |
          npm ci
          npm run build
          
      - name: Deploy to R2
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: r2 object put your-demos/${{ github.event.repository.name }}/ --file=./dist --recursive
          
      - name: Update KV Metadata
        run: |
          # Update demo metadata in KV
          echo '{"name":"${{ github.event.repository.name }}","updated":"${{ github.event.head_commit.timestamp }}"}' | \
          wrangler kv:key put --binding=DEMO_CONFIG "${{ github.event.repository.name }}"
```

## API Reference

### Demo Metadata Structure

```typescript
interface DemoMetadata {
  name: string;          // Demo identifier (URL path)
  description?: string;  // Short description
  updated: string;       // ISO date string
  github?: string;       // GitHub repo URL
  featured?: boolean;    // Show as featured demo
}
```

### Adding Demo Metadata

```bash
# Using wrangler CLI
wrangler kv:key put --binding=DEMO_CONFIG "my-demo" '{"name":"my-demo","description":"My awesome demo","updated":"2024-01-01T00:00:00Z","github":"https://github.com/user/my-demo","featured":true}'

# Using the API (future)
POST /api/demos
{
  "name": "my-demo",
  "description": "My awesome demo",
  "github": "https://github.com/user/my-demo"
}
```

## Local Development

```bash
# Install dependencies
npm install

# Run locally (requires wrangler login)
npm run dev

# Deploy to production
npm run deploy
```

### Testing with Local Assets

For local testing without R2:

1. Create a `local-assets/` directory
2. Add demo folders with assets
3. Update `wrangler.toml` for local development:

```toml
[env.development]
[[env.development.r2_buckets]]
binding = "DEMO_ASSETS"
bucket_name = "your-demos"
local_directory = "./local-assets"
```

## Troubleshooting

### Custom domain not working
- Ensure the domain is added as "Custom domain" not "Route"
- Check that your domain's nameservers point to Cloudflare
- Wait 1-2 minutes for DNS propagation

### KV namespace errors
- Verify the namespace ID in `wrangler.toml` matches your KV namespace
- Ensure your API token has KV write permissions

### R2 bucket issues
- Check bucket name matches in `wrangler.toml`
- Verify API token has R2 read/write permissions

## Security & Analytics

### Security
The router includes appropriate security for a public demo site:
- **Basic Protection**: Security headers and error handling
- **Search Engine Friendly**: Allows crawlers and legitimate bots
- **Cloudflare Protection**: Automatic DDoS protection and SSL

See [SECURITY.md](./SECURITY.md) for details.

### Analytics
Easy integration with privacy-friendly analytics:
- **Multiple Providers**: PostHog, Plausible, Simple Analytics, Cloudflare
- **Privacy First**: No cookies, GDPR compliant options
- **Easy Setup**: Just add your API keys to `wrangler.toml`

See [ANALYTICS.md](./ANALYTICS.md) for setup instructions.

## Contributing

Pull requests are welcome! Please ensure:
- Code follows existing style
- Tests pass (when added)
- Documentation is updated

## License

MIT - See LICENSE file for details

---

Built with ❤️ using Cloudflare Workers, R2, and KV