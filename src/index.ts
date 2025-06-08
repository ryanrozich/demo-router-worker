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
<html lang="en" class="h-full">
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
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            slate: {
              850: '#0f1729',
              925: '#0a0f1f'
            }
          },
          backgroundImage: {
            'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
          },
          animation: {
            'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    .font-inter { font-family: 'Inter', sans-serif; }
    .animation-delay-2000 { animation-delay: 2s; }
  </style>
</head>
<body class="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-inter">
  <div class="min-h-full relative">
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow animation-delay-2000"></div>
    </div>
    
    <!-- Header -->
    <header class="relative bg-slate-900/60 backdrop-blur-md border-b border-slate-700/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-white">Demo Parking Lot</h1>
            <p class="mt-1 text-sm text-slate-400">Every project deserves a forever home, even the weird ones</p>
          </div>
          <div class="flex items-center space-x-4">
            <a href="https://github.com/ryanrozich" target="_blank" class="text-slate-400 hover:text-orange-500 transition-colors">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      ${demos.length === 0 ? `
        <div class="text-center py-16">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 backdrop-blur-sm ring-1 ring-slate-700/50 mb-4">
            <svg class="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-white">The parking lot is empty</h3>
          <p class="mt-2 text-sm text-slate-400">Time to park your first demo here. No permit required.</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          ${demos.map(demo => `
            <div class="group relative rounded-xl bg-slate-800/50 backdrop-blur-sm p-6 hover:bg-slate-800/70 transition-all duration-200 ring-1 ring-slate-700/50 hover:ring-slate-600/50 ${demo.featured ? 'ring-2 ring-orange-500/50' : ''}">
              ${demo.featured ? `
                <div class="absolute -top-2 -right-2">
                  <span class="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1 text-xs font-medium text-white shadow-lg">
                    VIP Parking
                  </span>
                </div>
              ` : ''}
              
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">
                    <a href="/${demo.name}/" class="focus:outline-none">
                      <span class="absolute inset-0" aria-hidden="true"></span>
                      ${demo.name}
                    </a>
                  </h3>
                  ${demo.description ? `
                    <p class="mt-2 text-sm text-slate-400 line-clamp-2">${demo.description}</p>
                  ` : ''}
                </div>
              </div>
              
              <div class="mt-4 flex items-center justify-between text-xs">
                <span class="text-slate-500">
                  Parked ${demo.updated ? new Date(demo.updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}
                </span>
                ${demo.github ? `
                  <a href="${demo.github}" target="_blank" class="relative z-10 inline-flex items-center text-slate-400 hover:text-orange-400 transition-colors">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    Source
                  </a>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </main>

    <!-- Footer -->
    <footer class="relative mt-24 border-t border-slate-800/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p class="text-center text-sm text-slate-500">
          No demos were harmed in the making of this parking lot • 
          <a href="https://github.com/ryanrozich/demo-router-worker" target="_blank" class="text-slate-400 hover:text-orange-400 transition-colors">Parking Attendant Manual</a>
        </p>
      </div>
    </footer>
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