import crypto from "crypto";

export type WhitelistedExtension = "mp3" | "m4a" | "ogg" | "wav" | "jpg" | "png" | "webp";

export interface ValidatedFile {
  extension: WhitelistedExtension;
  mimeType: string;
}

export const ALLOWED_EXTENSIONS: WhitelistedExtension[] = [
  "mp3",
  "m4a",
  "ogg",
  "wav",
  "jpg",
  "png",
  "webp",
];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB strict limit

/**
 * Inspects file buffer magic bytes (binary signatures) to prevent file extension spoofing
 * and stored XSS via SVG/HTML polyglots.
 */
export function validateMagicBytes(buffer: Buffer): ValidatedFile | null {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // 1. JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: "jpg", mimeType: "image/jpeg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { extension: "png", mimeType: "image/png" };
  }

  // 3. WebP: 'RIFF' at 0, 'WEBP' at 8
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { extension: "webp", mimeType: "image/webp" };
  }

  // 4. WAV: 'RIFF' at 0, 'WAVE' at 8
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WAVE"
  ) {
    return { extension: "wav", mimeType: "audio/wav" };
  }

  // 5. OGG: 'OggS' at 0
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "OggS") {
    return { extension: "ogg", mimeType: "audio/ogg" };
  }

  // 6. M4A / MP4 Audio: 'ftyp' at 4 and compatible brand at 8
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (["M4A ", "isom", "mp41", "mp42", "dash"].includes(brand)) {
      return { extension: "m4a", mimeType: "audio/mp4" };
    }
  }

  // 7. MP3: ID3v2 container ('ID3' at 0) OR raw MPEG audio sync word (0xFF followed by 0xE0 mask)
  if (buffer.length >= 3 && buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return { extension: "mp3", mimeType: "audio/mpeg" };
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return { extension: "mp3", mimeType: "audio/mpeg" };
  }

  return null;
}

/**
 * Generates an unguessable, cryptographically secure random filename.
 * Does NOT use the client-supplied filename or extension.
 */
export function generateSecureFilename(verifiedExt: WhitelistedExtension): string {
  const randomHex = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}-${randomHex}.${verifiedExt}`;
}
