export interface Env {
  DEMO_ASSETS: R2Bucket;
  DEMO_CONFIG: KVNamespace;
  // Optional analytics configuration
  ANALYTICS_PROVIDER?: string;
  POSTHOG_API_KEY?: string;
  POSTHOG_HOST?: string;
  PLAUSIBLE_DOMAIN?: string;
  SIMPLE_HOSTNAME?: string;
}

export interface DemoMetadata {
  name: string;
  description?: string;
  updated: string;
  github?: string;
  featured?: boolean;
}