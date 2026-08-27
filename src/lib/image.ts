"use client";

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Shrink a camera photo before it goes over the wire. A phone JPEG is 3-8MB,
 * which is slow to upload on cellular and adds seconds to a scan; receipt text
 * stays legible at 1600px on the long edge, and the result is usually 300-600KB.
 *
 * Falls back to the original file if anything about the canvas path fails —
 * a slow upload beats a broken one.
 */
export async function downscaleImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

    // Already small enough — re-encoding would only lose detail.
    if (scale === 1 && file.size <= 1_500_000) {
      bitmap.close();
      return file;
    }

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;

    return new File([blob], "receipt.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Object URL for previewing without base64-inflating the image into state. */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}
