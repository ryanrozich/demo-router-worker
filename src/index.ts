import { getContentType, getCacheControl } from './utils';
import { Env, DemoMetadata } from './types';
import { addSecurityHeaders, RateLimiter, getCorsHeaders } from './security';
import { AnalyticsConfig, addAnalyticsToHTML, trackPageView } from './analytics';

// Initialize rate limiter with very permissive settings
const rateLimiter = new RateLimiter({
  requests: 1000, // 1000 requests
  windowMs: 60 * 1000, // per minute
});

function getAnalyticsConfig(env: Env): AnalyticsConfig {
  const provider = env.ANALYTICS_PROVIDER as AnalyticsConfig['provider'] || 'none';
  
  return {
    provider,
    posthog: provider === 'posthog' ? {
      apiKey: env.POSTHOG_API_KEY || '',
      host: env.POSTHOG_HOST,
    } : undefined,
    plausible: provider === 'plausible' ? {
      domain: env.PLAUSIBLE_DOMAIN || '',
    } : undefined,
    simple: provider === 'simple' ? {
      hostname: env.SIMPLE_HOSTNAME || '',
    } : undefined,
  };
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let pathname = url.pathname;
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: getCorsHeaders(request.headers.get('Origin')),
      });
    }
    
    // Rate limiting by IP
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `ip:${clientIP}`;
    
    if (!(await rateLimiter.isAllowed(rateLimitKey))) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
        },
      });
    }
    
    // Remove trailing slash for consistency
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    
    // Track page view (non-blocking)
    const analyticsConfig = getAnalyticsConfig(env);
    trackPageView(analyticsConfig, pathname, {
      referrer: request.headers.get('Referer'),
      userAgent: request.headers.get('User-Agent'),
    });
    
    // Homepage - show demo listing
    if (pathname === '/' || pathname === '') {
      return await showDemoListing(env);
    }
    
    // robots.txt for search engines
    if (pathname === '/robots.txt') {
      return new Response(`User-agent: *
Allow: /
Sitemap: https://demo.rozich.net/sitemap.xml

# Allow all search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /`, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=86400', // 1 day
        },
      });
    }
    
    // Sitemap
    if (pathname === '/sitemap.xml') {
      return await generateSitemap(env);
    }
    
    // API endpoint for demo management (future use)
    if (pathname === '/api/demos') {
      return await handleAPI(request, env);
    }
    
    // Extract project and asset path
    const parts = pathname.slice(1).split('/');
    const project = parts[0];
    const assetPath = parts.slice(1).join('/') || 'index.html';
    
    // Validate project exists
    const metadata = await env.DEMO_CONFIG.get<DemoMetadata>(project, 'json');
    if (!metadata) {
      return new Response('Demo not found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Try to serve the requested asset
    const assetKey = `${project}/${assetPath}`;
    let asset = await env.DEMO_ASSETS.get(assetKey);
    
    // For SPA routes without file extension, serve index.html
    if (!asset && !assetPath.includes('.')) {
      const indexKey = `${project}/index.html`;
      asset = await env.DEMO_ASSETS.get(indexKey);
      
      if (asset) {
        // Set proper headers for SPA routing
        const headers = new Headers();
        headers.set('Content-Type', 'text/html; charset=utf-8');
        headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
        headers.set('X-SPA-Route', 'true');
        
        return new Response(asset.body, { headers });
      }
    }
    
    if (!asset) {
      return new Response('Asset not found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Serve the asset with appropriate headers
    const contentType = getContentType(assetPath);
    const cacheControl = getCacheControl(contentType);
    
    return new Response(asset.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'X-Demo-Name': project,
      },
    });
}

async function showDemoListing(env: Env): Promise<Response> {
  const { keys } = await env.DEMO_CONFIG.list<DemoMetadata>();
  
  // Sort by updated date, featured first
  const demos = await Promise.all(
    keys.map(async ({ name }) => {
      const metadata = await env.DEMO_CONFIG.get<DemoMetadata>(name, 'json');
      return { name, ...metadata };
    })
  );
  
  demos.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.updated || '').getTime() - new Date(a.updated || '').getTime();
  });
  
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Projects - Interactive Examples and Experiments</title>
  <meta name="description" content="Explore interactive demos, experiments, and proof-of-concepts. Browse through various web technologies and frameworks in action.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Demo Projects">
  <meta property="og:description" content="Interactive demos and experiments">
  <meta property="og:type" content="website">
  <link rel="canonical" href="https://demo.rozich.net/">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    h1 {
      color: #2563eb;
      margin-bottom: 2rem;
      font-size: 2.5rem;
    }
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .demo-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .demo-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .demo-card.featured {
      border: 2px solid #2563eb;
    }
    .demo-card h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
    }
    .demo-card a {
      color: #2563eb;
      text-decoration: none;
    }
    .demo-card a:hover {
      text-decoration: underline;
    }
    .demo-meta {
      font-size: 0.875rem;
      color: #666;
      margin-top: 0.5rem;
    }
    .demo-description {
      margin: 0.5rem 0;
      color: #555;
    }
    .featured-badge {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
    }
  </style>
</head>
<body>
  <h1>Demo Projects</h1>
  <div class="demo-grid">
    ${demos.map(demo => `
      <div class="demo-card ${demo.featured ? 'featured' : ''}">
        ${demo.featured ? '<span class="featured-badge">Featured</span>' : ''}
        <h2><a href="/${demo.name}/">${demo.name}</a></h2>
        ${demo.description ? `<p class="demo-description">${demo.description}</p>` : ''}
        <div class="demo-meta">
          Updated: ${demo.updated ? new Date(demo.updated).toLocaleDateString() : 'Unknown'}
          ${demo.github ? `• <a href="${demo.github}" target="_blank">GitHub</a>` : ''}
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;
  
  // Add analytics to HTML
  const analyticsConfig = getAnalyticsConfig(env);
  html = addAnalyticsToHTML(html, analyticsConfig);
  
  return new Response(html, {
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300' // 5 minutes
    },
  });
}

async function handleAPI(_request: Request, _env: Env): Promise<Response> {
  // Future: Add API endpoints for managing demos
  // Could include webhook endpoints for GitHub Actions
  return new Response(JSON.stringify({ message: 'API coming soon' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function generateSitemap(env: Env): Promise<Response> {
  const { keys } = await env.DEMO_CONFIG.list<DemoMetadata>();
  
  const demos = await Promise.all(
    keys.map(async ({ name }) => {
      const metadata = await env.DEMO_CONFIG.get<DemoMetadata>(name, 'json');
      return { name, updated: metadata?.updated };
    })
  );
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://demo.rozich.net/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${demos.map(demo => `
  <url>
    <loc>https://demo.rozich.net/${demo.name}/</loc>
    ${demo.updated ? `<lastmod>${new Date(demo.updated).toISOString().split('T')[0]}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;
  
  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // 1 hour
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const response = await handleRequest(request, env);
      return addSecurityHeaders(response);
    } catch (error) {
      // Log error for debugging
      console.error('Worker error:', error);
      
      // Return generic error response
      return addSecurityHeaders(new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      }));
    }
  },
};