import { useRef, useState } from "react";
import { uploadImage } from "../../lib/upload";

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
    if (!file) return;

    setStatus("uploading");
    setError("");
    try {
      const result = await uploadImage(file);
      onUploaded(result.url);
      event.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
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
