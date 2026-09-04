import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Local-disk file storage — replaces Supabase Storage. Files land under
 * UPLOADS_DIR/<bucket>/<random>.<ext> (UPLOADS_DIR is expected to be an
 * absolute path outside the app's own deploy directory on the VPS, e.g.
 * /var/app-uploads, so redeploys don't wipe uploads) and are served back by
 * Nginx as static files at NEXT_PUBLIC_UPLOADS_URL.
 *
 * Callers (the /api/upload/* route handlers) are responsible for their own
 * auth check before calling this — this module does no authorization.
 */

export interface SaveUploadResult {
  url: string;
}

export async function saveUpload(
  bucket: string,
  file: File,
  { maxSizeBytes, acceptedTypes }: { maxSizeBytes: number; acceptedTypes: readonly string[] }
): Promise<SaveUploadResult> {
  if (!acceptedTypes.includes(file.type)) {
    throw new UploadValidationError(`Định dạng file không được hỗ trợ (${file.type || "không rõ"})`);
  }
  if (file.size > maxSizeBytes) {
    throw new UploadValidationError(`File phải nhỏ hơn ${Math.round(maxSizeBytes / (1024 * 1024))}MB`);
  }

  const uploadsDir = process.env.UPLOADS_DIR;
  const publicUrl = process.env.NEXT_PUBLIC_UPLOADS_URL;
  if (!uploadsDir || !publicUrl) {
    throw new Error("UPLOADS_DIR / NEXT_PUBLIC_UPLOADS_URL is not set. Copy .env.example to .env and configure it.");
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const filename = `${randomUUID()}.${ext}`;
  const bucketDir = path.join(uploadsDir, bucket);
  await mkdir(bucketDir, { recursive: true });
  await writeFile(path.join(bucketDir, filename), Buffer.from(await file.arrayBuffer()));

  return { url: `${publicUrl.replace(/\/$/, "")}/${bucket}/${filename}` };
}

export class UploadValidationError extends Error {}
