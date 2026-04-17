import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "../../functions/api/uploads";

function createContext(file: File, envOverrides: Record<string, unknown> = {}) {
  const form = new FormData();
  form.set("file", file);

  return {
    request: new Request("https://admin.example.com/api/uploads", {
      method: "POST",
      body: form,
    }),
    env: {
      R2_PUBLIC_BASE_URL: "https://cdn.example.com",
      MEDIA_BUCKET: {
        put: vi.fn().mockResolvedValue(undefined),
      },
      ...envOverrides,
    },
  } as never;
}

describe("POST /api/uploads", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects non-image uploads with 400", async () => {
    const response = await onRequestPost(
      createContext(new File(["plain"], "note.txt", { type: "text/plain" })),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Only image uploads are allowed" });
  });

  it("stores image in r2 and returns public url", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("abc123");
    const put = vi.fn().mockResolvedValue(undefined);

    const response = await onRequestPost(
      createContext(new File(["image"], "cover.png", { type: "image/png" }), {
        MEDIA_BUCKET: { put },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(put).toHaveBeenCalledOnce();
    expect(payload.key).toMatch(/^blog\/\d{4}\/\d{2}\/abc123\.png$/);
    expect(payload.url).toMatch(/^https:\/\/cdn\.example\.com\/blog\/\d{4}\/\d{2}\/abc123\.png$/);
  });

  it("rejects files larger than the configured limit", async () => {
    const oversized = new Uint8Array(10 * 1024 * 1024 + 1);
    const request = {
      formData: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue({
          name: "large.png",
          type: "image/png",
          size: oversized.byteLength,
          arrayBuffer: vi.fn().mockResolvedValue(oversized.buffer),
        }),
      }),
    };

    const response = await onRequestPost({
      request,
      env: {
        R2_PUBLIC_BASE_URL: "https://cdn.example.com",
        MEDIA_BUCKET: {
          put: vi.fn(),
        },
      },
    } as never);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "File exceeds 10 MB limit" });
  });
});
