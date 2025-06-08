# Analytics Setup Guide

This demo router supports multiple privacy-friendly analytics providers. Here's how to set them up:

## 📊 Analytics Options

### 1. PostHog (Recommended)
- **Best for**: Detailed analytics, user journeys, feature flags
- **Privacy**: Can be self-hosted, GDPR compliant
- **Free tier**: 1M events/month

```toml
# wrangler.toml
[vars]
ANALYTICS_PROVIDER = "posthog"
POSTHOG_API_KEY = "phc_YOUR_PROJECT_API_KEY"
POSTHOG_HOST = "https://app.posthog.com" # Or your self-hosted URL
```

### 2. Plausible Analytics
- **Best for**: Simple, privacy-first analytics
- **Privacy**: No cookies, GDPR compliant by default
- **Free tier**: 30-day trial, then $9/month

```toml
# wrangler.toml
[vars]
ANALYTICS_PROVIDER = "plausible"
PLAUSIBLE_DOMAIN = "demo.yourdomain.com"
```

### 3. Simple Analytics
- **Best for**: Ultra-simple, no-setup analytics
- **Privacy**: No cookies, GDPR compliant
- **Free tier**: 14-day trial, then $19/month

```toml
# wrangler.toml
[vars]
ANALYTICS_PROVIDER = "simple"
SIMPLE_HOSTNAME = "demo.yourdomain.com"
```

### 4. Cloudflare Web Analytics (Free!)
- **Best for**: Basic metrics, already using Cloudflare
- **Privacy**: Privacy-first, no cookies
- **Free tier**: Completely free

1. Go to your Cloudflare dashboard
2. Navigate to **Analytics & Logs** → **Web Analytics**
3. Add your site: `demo.yourdomain.com`
4. Copy the provided JavaScript snippet
5. No configuration needed in wrangler.toml

### 5. No Analytics

```toml
# wrangler.toml
[vars]
ANALYTICS_PROVIDER = "none"
```

## 🚀 Quick Start

### Step 1: Choose Your Provider

For a demo site, I recommend:
- **PostHog** if you want detailed insights
- **Cloudflare Web Analytics** if you want free basic metrics
- **Plausible** if you prioritize privacy and simplicity

### Step 2: Sign Up and Get Credentials

#### PostHog
1. Sign up at [posthog.com](https://posthog.com)
2. Create a project
3. Copy your Project API Key from Project Settings

#### Plausible
1. Sign up at [plausible.io](https://plausible.io)
2. Add your domain
3. That's it! Just set your domain in config

#### Simple Analytics
1. Sign up at [simpleanalytics.com](https://simpleanalytics.com)
2. Add your website
3. Use your domain as the hostname

### Step 3: Update Configuration

```bash
# Edit wrangler.toml and uncomment the [vars] section
# Add your chosen provider and credentials

# Deploy with new configuration
npm run deploy
```

## 📈 What Gets Tracked?

All providers track basic metrics:
- Page views
- Unique visitors
- Referrers
- Browser/OS
- Country (IP-based)

No personal data is collected by default.

## 🔒 Privacy Considerations

- All recommended providers are privacy-friendly
- No cookies are used (except PostHog if configured)
- GDPR compliant out of the box
- Visitors are not tracked across sites
- IP addresses are not stored (or anonymized)

## 🎯 Custom Events (PostHog Only)

Track demo interactions:

```javascript
// In your demo code
posthog.capture('demo_interaction', {
  demo: 'react-router',
  action: 'route_changed',
  path: '/about'
});
```

## 🆓 Free Analytics Comparison

| Provider | Free Tier | Best For |
|----------|-----------|----------|
| Cloudflare | Unlimited | Basic metrics |
| PostHog | 1M events/mo | Detailed analytics |
| Plausible | 30-day trial | Privacy-first |
| Simple | 14-day trial | Simplicity |

## 🚫 Respecting Do Not Track

The router respects browser DNT settings by default. Analytics scripts won't load for visitors with DNT enabled.

## 📝 Analytics Dashboard URLs

Once configured, view your analytics at:
- PostHog: `https://app.posthog.com/project/YOUR_PROJECT_ID`
- Plausible: `https://plausible.io/YOUR_DOMAIN`
- Simple: `https://simpleanalytics.com/YOUR_DOMAIN`
- Cloudflare: In your Cloudflare dashboard under Web Analytics