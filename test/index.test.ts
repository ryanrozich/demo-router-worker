import { describe, it, expect, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import worker from "../src/index";
import type { Env } from "../src/types";

describe("Demo Router Worker", () => {
  let testEnv: Env;

  beforeAll(() => {
    // Environment is provided by cloudflare:test
    testEnv = env as unknown as Env;
  });

  describe("Homepage", () => {
    it("should return homepage with empty demo list", async () => {
      const request = new Request("https://demo.example.com/");
      const response = await worker.fetch(request, testEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(
        "text/html; charset=utf-8",
      );

      const html = await response.text();
      expect(html).toContain("<h1>Demo Projects</h1>");
      expect(html).toContain("demo-grid");
    });
  });

  describe("Demo Routing", () => {
    it("should return 404 for non-existent demo", async () => {
      const request = new Request(
        "https://demo.example.com/non-existent-demo/",
      );
      const response = await worker.fetch(request, testEnv);

      expect(response.status).toBe(404);
      expect(await response.text()).toBe("Demo not found");
    });

    it("should handle demo with metadata", async () => {
      // Add demo metadata to KV
      await testEnv.DEMO_CONFIG.put(
        "test-demo",
        JSON.stringify({
          name: "test-demo",
          description: "Test Demo",
          updated: "2024-01-01T00:00:00Z",
          github: "https://github.com/test/test-demo",
        }),
      );

      // Add a test asset to R2
      await testEnv.DEMO_ASSETS.put(
        "test-demo/index.html",
        "<h1>Test Demo</h1>",
      );

      const request = new Request("https://demo.example.com/test-demo/");
      const response = await worker.fetch(request, testEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(
        "text/html; charset=utf-8",
      );
      expect(response.headers.get("x-demo-name")).toBe("test-demo");

      const html = await response.text();
      expect(html).toBe("<h1>Test Demo</h1>");
    });

    it("should serve static assets with correct content types", async () => {
      await testEnv.DEMO_CONFIG.put(
        "test-demo",
        JSON.stringify({
          name: "test-demo",
          updated: "2024-01-01T00:00:00Z",
        }),
      );

      // Test CSS file
      await testEnv.DEMO_ASSETS.put(
        "test-demo/styles.css",
        "body { color: red; }",
      );

      const cssRequest = new Request(
        "https://demo.example.com/test-demo/styles.css",
      );
      const cssResponse = await worker.fetch(cssRequest, testEnv);

      expect(cssResponse.status).toBe(200);
      expect(cssResponse.headers.get("content-type")).toBe("text/css");
      expect(cssResponse.headers.get("cache-control")).toBe(
        "public, max-age=86400",
      );
    });

    it("should handle SPA routes", async () => {
      await testEnv.DEMO_CONFIG.put(
        "spa-demo",
        JSON.stringify({
          name: "spa-demo",
          updated: "2024-01-01T00:00:00Z",
        }),
      );

      await testEnv.DEMO_ASSETS.put(
        "spa-demo/index.html",
        '<div id="app"></div>',
      );

      // Request a SPA route without file extension
      const request = new Request("https://demo.example.com/spa-demo/about");
      const response = await worker.fetch(request, testEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(
        "text/html; charset=utf-8",
      );
      expect(response.headers.get("x-spa-route")).toBe("true");

      const html = await response.text();
      expect(html).toBe('<div id="app"></div>');
    });
  });

  describe("API Endpoints", () => {
    it("should return API placeholder response", async () => {
      const request = new Request("https://demo.example.com/api/demos");
      const response = await worker.fetch(request, testEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/json");

      const json = await response.json();
      expect(json).toEqual({ message: "API coming soon" });
    });
  });
});
