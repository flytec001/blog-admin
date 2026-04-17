import { useRef, useState } from "react";
import { ApiError } from "../../lib/types";

interface ImageUploaderProps {
  label: string;
  onUploaded: (url: string) => void;
}

export function ImageUploader({ label, onUploaded }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading">("idle");
  const [error, setError] = useState("");

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setStatus("uploading");
    setError("");

    const formData = new FormData();
    formData.set("file", file);

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new ApiError(response.status, payload.error ?? "上传失败");
      }

      onUploaded(payload.url);
      event.target.value = "";
    } catch (error) {
      setError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="upload-box">
      <button
        className="secondary-button"
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
      >
        {status === "uploading" ? `${label}上传中...` : label}
      </button>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        onChange={handleChange}
      />
      {error ? <div className="field-error">{error}</div> : null}
    </div>
  );
}
