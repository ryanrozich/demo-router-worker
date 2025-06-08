# Claude Context for Demo Router Worker

This document provides context for AI assistants (like Claude) to understand and work with this project effectively.

## Project Overview

This is a Cloudflare Worker that acts as a centralized router for hosting multiple demo applications. It serves as infrastructure for portfolio sites, allowing developers to deploy multiple demos under subpaths of a single domain.

## Architecture

- **Worker**: Routes requests and serves static assets
- **R2 Storage**: Stores demo application files (HTML, JS, CSS, images)
- **KV Namespace**: Stores demo metadata (name, description, last updated)
- **Custom Domain**: Serves demos at `demo.yourdomain.com/demo-name/`

## Key Files

- `src/index.ts` - Main router logic with SEO and analytics
- `src/utils.ts` - Helper functions for content types and caching
- `src/types.ts` - TypeScript interfaces
- `src/security.ts` - Security headers and rate limiting
- `src/analytics.ts` - Analytics integration (PostHog, Plausible, etc.)
- `wrangler.toml` - Cloudflare Worker configuration
- `scripts/setup.sh` - Automated setup script
- `scripts/deploy-demo.sh` - Demo deployment helper

## Common Tasks

### Setting Up the Project
```bash
npm run setup  # Automated setup script
```

### Local Development
```bash
npm run dev  # Starts local development server
```

### Deploying the Router
```bash
npm run deploy  # Deploys to Cloudflare
```

### Deploying a Demo
```bash
npm run deploy-demo <demo-name> <build-dir> [description] [github-url]
```

## Configuration Requirements

1. **R2 Bucket**: Must be created in Cloudflare dashboard
2. **KV Namespace**: Must be created and ID added to wrangler.toml
3. **Custom Domain**: Must be configured in Worker settings
4. **API Token**: Needs Workers, KV, and R2 permissions

## Testing

- Check if worker is deployed: `curl https://worker-subdomain.workers.dev`
- Check custom domain: `curl https://demo.yourdomain.com`
- List demos: `npm run list-demos`
- Run tests: `npm test`
- Type check: `npm run typecheck`
- Lint code: `npm run lint`

## Common Issues

1. **"KV namespace not found"**: The KV namespace ID in wrangler.toml is incorrect
2. **"R2 bucket not found"**: The bucket name doesn't match or hasn't been created
3. **Custom domain not working**: Needs to be added as "Custom domain" not "Route"
4. **API token errors**: Token needs Workers, KV, and R2 permissions

## Project Structure
```
demo-router-worker/
├── src/               # Worker source code
├── scripts/           # Automation scripts
├── .github/           # GitHub Actions workflows
└── wrangler.toml      # Cloudflare configuration
```

## Deployment Flow

1. Demo projects build their assets
2. Assets are uploaded to R2 under `project-name/`
3. Metadata is stored in KV
4. Router serves assets and generates homepage

## Features Added

- **SEO Optimization**: robots.txt, sitemap.xml, meta tags
- **Analytics Support**: Multiple providers (PostHog, Plausible, Cloudflare)
- **Security**: Basic headers, rate limiting (1000 req/min)
- **Testing**: Vitest with Cloudflare Workers support
- **Linting**: Trunk.io with ESLint, Prettier, and more
- **CI/CD**: GitHub Actions for testing and deployment

## Important Notes

- This is a public repository template
- Users need their own Cloudflare account and resources
- The setup script automates most configuration
- Custom domains are configured in Cloudflare dashboard, not DNS
- Security is intentionally permissive for demo sites
- Analytics are privacy-friendly and optional