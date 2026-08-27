import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  EXTRACTION_PROMPT,
  RECEIPT_SCHEMA,
  validateExtraction,
} from "@/lib/extraction";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 30_000;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/** Every failure the client can encounter, with the message the user will read. */
type FailureCode =
  | "no_image"
  | "bad_image"
  | "image_too_large"
  | "missing_api_key"
  | "invalid_api_key"
  | "rate_limited"
  | "timeout"
  | "unusable_response"
  | "upstream_error";

function fail(code: FailureCode, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return fail(
      "missing_api_key",
      "The server has no Gemini API key configured. Add GEMINI_API_KEY to .env.local and restart the dev server.",
      500,
    );
  }

  // --- read and vet the upload -------------------------------------------
  let file: File | null = null;
  try {
    const form = await request.formData();
    const candidate = form.get("image");
    if (candidate instanceof File) file = candidate;
  } catch {
    return fail("bad_image", "That upload couldn't be read. Try again.", 400);
  }

  if (!file || file.size === 0) {
    return fail("no_image", "No image was attached to the request.", 400);
  }
  if (file.size > MAX_BYTES) {
    return fail(
      "image_too_large",
      "That photo is too large. Try again — the app shrinks images before sending, so this usually means the resize step failed.",
      413,
    );
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    return fail(
      "bad_image",
      `${file.type || "That file"} isn't a supported image format. Use a JPEG, PNG, WebP, or HEIC photo.`,
      415,
    );
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  // --- call Gemini --------------------------------------------------------
  const ai = new GoogleGenAI({ apiKey });

  let text: string | undefined;
  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: file.type, data: base64 } },
              { text: EXTRACTION_PROMPT },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: RECEIPT_SCHEMA,
          // Reading printed text is not a creative task.
          temperature: 0,
        },
      }),
      TIMEOUT_MS,
    );
    text = response.text;
  } catch (error) {
    return handleUpstreamError(error);
  }

  // --- parse and sanity-check --------------------------------------------
  if (!text) {
    return fail(
      "unusable_response",
      "The model returned an empty response. Try retaking the photo.",
      502,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail(
      "unusable_response",
      "The model's response wasn't valid JSON. Try again.",
      502,
    );
  }

  const receipt = validateExtraction(parsed);
  if (!receipt) {
    return fail(
      "unusable_response",
      "The model's response didn't match the expected shape. Try again.",
      502,
    );
  }

  return NextResponse.json({ receipt });
}

class TimeoutError extends Error {}

/**
 * The SDK's own retries can outlive any single request, so the ceiling is
 * enforced here — a hung call must surface as a message, never a spinner
 * that never resolves.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

function handleUpstreamError(error: unknown) {
  if (error instanceof TimeoutError) {
    return fail(
      "timeout",
      "Extraction took too long. Check your connection and try again.",
      504,
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  const status = extractStatus(error);

  if (status === 401 || status === 403 || /API key/i.test(message)) {
    return fail(
      "invalid_api_key",
      "The Gemini API key was rejected. Check GEMINI_API_KEY in .env.local.",
      502,
    );
  }
  if (status === 429) {
    return fail(
      "rate_limited",
      "Gemini is rate-limiting requests right now. Wait a moment and try again.",
      429,
    );
  }
  if (status === 400) {
    return fail(
      "bad_image",
      "Gemini couldn't process that image. Try retaking the photo.",
      400,
    );
  }

  console.error("[extract-receipt] upstream failure:", message);
  return fail(
    "upstream_error",
    "Couldn't reach Gemini. Try again in a moment.",
    502,
  );
}

function extractStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const candidate = error as { status?: unknown; code?: unknown };
  for (const value of [candidate.status, candidate.code]) {
    if (typeof value === "number") return value;
  }
  return null;
}
