import { describe, expect, it } from "vitest";
import { __testing } from "../../src/lib/image";

const { scaleToFit, replaceExtension } = __testing;

describe("scaleToFit", () => {
  it("keeps dimensions when both are within max", () => {
    expect(scaleToFit(800, 600, 1920)).toEqual({ width: 800, height: 600 });
  });

  it("scales down landscape images by width", () => {
    expect(scaleToFit(4000, 3000, 1920)).toEqual({ width: 1920, height: 1440 });
  });

  it("scales down portrait images by height", () => {
    expect(scaleToFit(3000, 4000, 1920)).toEqual({ width: 1440, height: 1920 });
  });

  it("scales square images", () => {
    expect(scaleToFit(3000, 3000, 1920)).toEqual({ width: 1920, height: 1920 });
  });

  it("never produces a dimension below 1", () => {
    expect(scaleToFit(1, 1, 1920)).toEqual({ width: 1, height: 1 });
  });

  it("keeps exact-boundary images", () => {
    expect(scaleToFit(1920, 1080, 1920)).toEqual({ width: 1920, height: 1080 });
  });
});

describe("replaceExtension", () => {
  it("replaces a jpg extension with webp", () => {
    expect(replaceExtension("photo.jpg", "image/webp")).toBe("photo.webp");
  });

  it("replaces uppercase extensions", () => {
    expect(replaceExtension("IMG_1234.JPEG", "image/webp")).toBe("IMG_1234.webp");
  });

  it("handles files without extension", () => {
    expect(replaceExtension("scan", "image/webp")).toBe("scan.webp");
  });

  it("falls back for unknown target type", () => {
    expect(replaceExtension("a.png", "application/octet-stream")).toBe("a.bin");
  });

  it("uses jpg for image/jpeg target", () => {
    expect(replaceExtension("a.png", "image/jpeg")).toBe("a.jpg");
  });
});
