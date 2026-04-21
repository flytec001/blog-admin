export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
  targetType?: "image/webp" | "image/jpeg";
  skipBelowBytes?: number;
}

export interface CompressResult {
  file: File;
  compressed: boolean;
  originalSize: number;
  finalSize: number;
  originalType: string;
  finalType: string;
}

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1920,
  quality: 0.82,
  targetType: "image/webp",
  skipBelowBytes: 300 * 1024,
};

const SKIP_TYPES = new Set(["image/svg+xml", "image/gif"]);

function scaleToFit(width: number, height: number, maxDim: number) {
  if (width <= maxDim && height <= maxDim) {
    return { width, height };
  }
  const ratio = width >= height ? maxDim / width : maxDim / height;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

function createCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function canvasToBlob(
  canvas: AnyCanvas,
  type: string,
  quality: number,
): Promise<Blob | null> {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve) => {
    (canvas as HTMLCanvasElement).toBlob(resolve, type, quality);
  });
}

function replaceExtension(name: string, type: string): string {
  const base = name.replace(/\.[^./\\]+$/, "");
  const ext = type === "image/webp" ? "webp" : type === "image/jpeg" ? "jpg" : "bin";
  return `${base || "image"}.${ext}`;
}

export const __testing = { scaleToFit, replaceExtension };

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const config = { ...DEFAULTS, ...options };
  const base: CompressResult = {
    file,
    compressed: false,
    originalSize: file.size,
    finalSize: file.size,
    originalType: file.type,
    finalType: file.type,
  };

  if (!file.type.startsWith("image/")) return base;
  if (SKIP_TYPES.has(file.type)) return base;
  if (file.size <= config.skipBelowBytes) return base;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return base;
  }

  try {
    const { width, height } = scaleToFit(bitmap.width, bitmap.height, config.maxDimension);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return base;
    (ctx as CanvasRenderingContext2D).imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, config.targetType, config.quality);
    if (!blob || blob.size >= file.size) return base;

    const name = replaceExtension(file.name, config.targetType);
    const compressedFile = new File([blob], name, {
      type: config.targetType,
      lastModified: Date.now(),
    });

    return {
      file: compressedFile,
      compressed: true,
      originalSize: file.size,
      finalSize: blob.size,
      originalType: file.type,
      finalType: config.targetType,
    };
  } finally {
    bitmap.close?.();
  }
}
