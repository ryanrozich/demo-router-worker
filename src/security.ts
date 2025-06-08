export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  // Basic security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN'); // Allow embedding on same domain
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissive CSP for demos - allows most common resources
  const csp = [
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
    "frame-ancestors 'self'", // Still prevent clickjacking from other sites
  ].join('; ');
  
  headers.set('Content-Security-Policy', csp);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private config: RateLimitConfig) {}
  
  async isAllowed(identifier: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing requests for this identifier
    const existingRequests = this.requests.get(identifier) || [];
    
    // Filter out old requests
    const recentRequests = existingRequests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.config.requests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      this.cleanup();
    }
    
    return true;
  }
  
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

export function getCorsHeaders(origin: string | null): HeadersInit {
  // Configure allowed origins for your demos
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://demo.rozich.net',
  ];
  
  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else {
    // Default to same-origin only
    headers['Access-Control-Allow-Origin'] = 'null';
  }
  
  return headers;
}