# Demo Router Worker

Centralized routing for all demos hosted at demo.rozich.net.

## Architecture

This Worker:
- Routes requests to appropriate demo projects
- Serves static assets from R2 storage
- Manages demo metadata in KV
- Provides a homepage listing all demos

## Adding a New Demo

Demos are deployed from their individual repositories. To add a demo:

1. In your demo repo, build with the correct base path
2. Upload assets to R2 under your project name
3. Update metadata in KV

See individual demo repos for their deployment workflows.

## Local Development

```bash
npm install
npm run dev
```

## Deployment

Pushes to main automatically deploy via GitHub Actions.

## Environment Variables

Set these as GitHub secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`