import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Admin-uploaded question/passage photos come straight off a phone camera
// as often as not — several MB and thousands of pixels wide. Next's own
// `/_next/image` optimizer still has to decode and downscale that full-size
// original the first time each question is opened, which is exactly what
// made images feel slow to appear in the exam UI. Shrinking to a size no
// exam layout ever displays larger than, once here at upload time, makes
// that one-time optimization pass (and every plain view of the raw file)
// fast instead of CPU-bound on a multi-megapixel source.
const MAX_IMAGE_DIMENSION = 1600;

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

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const contents = file.type.startsWith("image/") ? await downscaleImage(rawBuffer) : rawBuffer;
  await writeFile(path.join(bucketDir, filename), contents);

  return { url: `${publicUrl.replace(/\/$/, "")}/${bucket}/${filename}` };
}

/**
 * Resizes down to MAX_IMAGE_DIMENSION on the longer side (never upscales)
 * and re-encodes in the same format, auto-rotating per EXIF orientation
 * first since a naive resize would otherwise bake in a sideways photo.
 * Falls back to the original bytes if sharp can't decode it (e.g. a
 * corrupt upload) — the existing type/size checks above already reject
 * anything that isn't a plausible image, so this is a last-resort guard,
 * not the primary validation path.
 */
async function downscaleImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .rotate()
      .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true })
      .toBuffer();
  } catch {
    return buffer;
  }
}

export class UploadValidationError extends Error {}
