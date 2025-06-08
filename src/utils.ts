export function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: 'text/html; charset=utf-8',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
  };
  return types[ext || ''] || 'application/octet-stream';
}

export function getCacheControl(contentType: string): string {
  if (contentType.startsWith('image/') || contentType.startsWith('font/')) {
    return 'public, max-age=31536000, immutable'; // 1 year
  }
  if (contentType.includes('javascript') || contentType.includes('css')) {
    return 'public, max-age=86400'; // 1 day
  }
  if (contentType.includes('html')) {
    return 'public, max-age=0, must-revalidate';
  }
  return 'public, max-age=3600'; // 1 hour default
}