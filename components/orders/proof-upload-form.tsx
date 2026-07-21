// components/orders/proof-upload-form.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import {
  validateProofFile,
  mapProofUploadError,
  PROOF_ALLOWED_MIME,
} from "@/lib/payment";

export function ProofUploadForm({ orderDocumentId }: { orderDocumentId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    setError(null);
    if (!picked) {
      setFile(null);
      return;
    }
    const check = validateProofFile({ type: picked.type, size: picked.size });
    if (!check.ok) {
      setError(check.error);
      setFile(null);
      return;
    }
    setFile(picked);
  };

  const upload = () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    const form = new FormData();
    form.append("image", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/manual-payments/${orderDocumentId}/proofs`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        setProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        toast.success("Bukti pembayaran berhasil diunggah");
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
        return;
      }
      let message: string | undefined;
      try {
        const body = JSON.parse(xhr.responseText);
        message = body?.error?.message ?? body?.error ?? body?.message;
      } catch {
        // non-JSON error body
      }
      toast.error(mapProofUploadError(message));
    };

    xhr.onerror = () => {
      setUploading(false);
      toast.error("Gagal mengunggah bukti pembayaran");
    };

    xhr.send(form);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Bukti Transfer (JPG/PNG/WEBP/GIF, maks 5MB)</Label>
        <input
          ref={inputRef}
          type="file"
          accept={PROOF_ALLOWED_MIME.join(",")}
          onChange={onPick}
          disabled={uploading}
          className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-muted/70"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {uploading && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <Button
        type="button"
        onClick={upload}
        disabled={!file || uploading}
        className="w-full"
        size="sm"
      >
        {uploading ? (
          <span className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Mengunggah... {progress}%
          </span>
        ) : (
          <span className="flex items-center">
            <Upload className="mr-2 h-4 w-4" />
            Unggah Bukti
          </span>
        )}
      </Button>
    </div>
  );
}
