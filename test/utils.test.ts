import { describe, it, expect } from "vitest";
import { getContentType, getCacheControl } from "../src/utils";

describe("Utils", () => {
  describe("getContentType", () => {
    it("should return correct content types for common files", () => {
      expect(getContentType("index.html")).toBe("text/html; charset=utf-8");
      expect(getContentType("styles.css")).toBe("text/css");
      expect(getContentType("script.js")).toBe("application/javascript");
      expect(getContentType("data.json")).toBe("application/json");
      expect(getContentType("image.png")).toBe("image/png");
      expect(getContentType("image.jpg")).toBe("image/jpeg");
      expect(getContentType("font.woff2")).toBe("font/woff2");
    });

    it("should handle files without extensions", () => {
      expect(getContentType("README")).toBe("application/octet-stream");
      expect(getContentType("")).toBe("application/octet-stream");
    });

    it("should handle uppercase extensions", () => {
      expect(getContentType("IMAGE.PNG")).toBe("image/png");
      expect(getContentType("SCRIPT.JS")).toBe("application/javascript");
    });
  });

  describe("getCacheControl", () => {
    it("should return long cache for images and fonts", () => {
      expect(getCacheControl("image/png")).toBe(
        "public, max-age=31536000, immutable",
      );
      expect(getCacheControl("image/jpeg")).toBe(
        "public, max-age=31536000, immutable",
      );
      expect(getCacheControl("font/woff2")).toBe(
        "public, max-age=31536000, immutable",
      );
    });

    it("should return medium cache for JS and CSS", () => {
      expect(getCacheControl("application/javascript")).toBe(
        "public, max-age=86400",
      );
      expect(getCacheControl("text/css")).toBe("public, max-age=86400");
    });

    it("should return no cache for HTML", () => {
      expect(getCacheControl("text/html; charset=utf-8")).toBe(
        "public, max-age=0, must-revalidate",
      );
    });

    it("should return default cache for other types", () => {
      expect(getCacheControl("application/json")).toBe("public, max-age=3600");
      expect(getCacheControl("text/plain")).toBe("public, max-age=3600");
    });
  });
});
