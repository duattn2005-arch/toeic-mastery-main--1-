import { NextResponse } from "next/server";
import { getAuthedProfileOrNull } from "@/lib/auth";
import { saveUpload, UploadValidationError } from "@/lib/upload";

const MAX_SIZE_BYTES = 3 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(request: Request) {
  const profile = await getAuthedProfileOrNull();
  if (!profile) return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Thiếu file" }, { status: 400 });

  try {
    const { url } = await saveUpload("avatars", file, { maxSizeBytes: MAX_SIZE_BYTES, acceptedTypes: ACCEPTED_TYPES });
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof UploadValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
