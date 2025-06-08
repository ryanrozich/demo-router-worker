export interface Env {
  DEMO_ASSETS: R2Bucket;
  DEMO_CONFIG: KVNamespace;
  // Optional: Add these later
  // ANALYTICS: AnalyticsEngineDataset;
  // AUTH_SECRET: string;
}

export interface DemoMetadata {
  name: string;
  description?: string;
  updated: string;
  github?: string;
  featured?: boolean;
}