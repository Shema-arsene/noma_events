"use client";

import { useRef, useState } from "react";
import { apiPost, ApiRequestError } from "@/lib/api";
import { Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await apiPost<{ url: string }>("/uploads", formData);
      onChange(data.url);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Échec du téléversement");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-16 w-24 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-sand text-xs text-ink/40">Aucune image</div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button type="button" variant="outline" size="sm" loading={uploading} onClick={() => inputRef.current?.click()}>
          {value ? "Changer l'image" : "Téléverser une image"}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
