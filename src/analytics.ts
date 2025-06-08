export interface AnalyticsConfig {
  provider: 'posthog' | 'plausible' | 'cloudflare' | 'simple' | 'none';
  posthog?: {
    apiKey: string;
    host?: string; // defaults to https://app.posthog.com
  };
  plausible?: {
    domain: string;
    apiHost?: string; // defaults to https://plausible.io
  };
  simple?: {
    hostname: string;
  };
}

export function getAnalyticsScript(config: AnalyticsConfig): string {
  switch (config.provider) {
    case 'posthog':
      return `
        <script>
          !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
          posthog.init('${config.posthog?.apiKey}',{api_host:'${config.posthog?.host || 'https://app.posthog.com'}'})
        </script>
      `;
      
    case 'plausible':
      return `
        <script defer data-domain="${config.plausible?.domain}" src="${config.plausible?.apiHost || 'https://plausible.io'}/js/script.js"></script>
      `;
      
    case 'simple':
      return `
        <script async defer src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
        <noscript><img src="https://queue.simpleanalyticscdn.com/noscript.gif?hostname=${config.simple?.hostname}" alt="" referrerpolicy="no-referrer-when-downgrade" /></noscript>
      `;
      
    case 'cloudflare':
      // Cloudflare Web Analytics is added via dashboard, not script
      return '<!-- Cloudflare Web Analytics added via dashboard -->';
      
    default:
      return '';
  }
}

export function trackPageView(config: AnalyticsConfig, path: string, metadata?: Record<string, any>): void {
  // Server-side tracking for providers that support it
  if (config.provider === 'posthog' && config.posthog) {
    // PostHog server-side tracking
    fetch(`${config.posthog.host || 'https://app.posthog.com'}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: config.posthog.apiKey,
        event: '$pageview',
        properties: {
          $current_url: path,
          ...metadata,
        },
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Silently fail - don't break the app for analytics
    });
  }
}

export function addAnalyticsToHTML(html: string, config: AnalyticsConfig): string {
  const analyticsScript = getAnalyticsScript(config);
  
  // Add analytics script before closing </head> tag
  return html.replace('</head>', `${analyticsScript}\n</head>`);
}