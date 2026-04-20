import type { Env } from "../_lib/env";
import { json } from "../_lib/response";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getExtension(file: File) {
  const parts = file.name.split(".");
  if (parts.length > 1) {
    return parts.pop()!.toLowerCase();
  }

  const mimeMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };

  return mimeMap[file.type] ?? "bin";
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const formData = await request.formData();
  const file = formData.get("file");

  if (
    !file ||
    typeof file !== "object" ||
    !("type" in file) ||
    !("size" in file) ||
    !("name" in file) ||
    !("arrayBuffer" in file)
  ) {
    return json({ error: "Only image uploads are allowed" }, { status: 400 });
  }

  const upload = file as File;

  if (!upload.type.startsWith("image/")) {
    return json({ error: "Only image uploads are allowed" }, { status: 400 });
  }

  const bytes = await upload.arrayBuffer();

  if (bytes.byteLength > MAX_FILE_SIZE) {
    return json({ error: "File exceeds 10 MB limit" }, { status: 400 });
  }

  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const ext = getExtension(upload);
  const key = `blog/${year}/${month}/${crypto.randomUUID()}.${ext}`;

  await env.MEDIA_BUCKET.put(key, bytes, {
    httpMetadata: {
      contentType: upload.type,
    },
    customMetadata: {
      originalName: upload.name,
      uploadedAt: now.toISOString(),
    },
  });

  return json(
    {
      key,
      url: `${env.R2_PUBLIC_BASE_URL}/${key}`,
    },
    { status: 201 },
  );
};
