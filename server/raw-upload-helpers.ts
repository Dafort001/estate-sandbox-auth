// RAW file formats and validation (extended list for all professional cameras)
export const RAW_FILE_EXTENSIONS = [
  // Canon
  ".cr2", ".cr3", ".crm", ".crw",
  // Nikon
  ".nef", ".nrw",
  // Sony
  ".arw", ".sr2", ".srf",
  // Fujifilm
  ".raf",
  // Panasonic
  ".rw2", ".rwl",
  // Adobe DNG (universal)
  ".dng",
  // Olympus
  ".orf",
  // Pentax
  ".pef",
  // Video RAW formats
  ".braw",  // Blackmagic RAW
  ".r3d",   // RED RAW
  ".ari",   // ARRI RAW
  ".mxf",   // Material Exchange Format
  ".cdng",  // CinemaDNG
  // Phase One
  ".iiq",
  // Hasselblad
  ".3fr", ".fff",
  // Sigma
  ".x3f",
  // Epson
  ".erf",
  // Samsung
  ".srw",
  // Mamiya
  ".mef",
  // Leaf
  ".mos",
  // Phase One (older)
  ".cap",
  // Kodak
  ".kdc",
  // Standard formats
  ".tiff", ".tif", ".jpg", ".jpeg",
] as const;

export const RAW_MIME_TYPES = [
  // Canon RAW
  "image/x-canon-cr3",
  "image/x-canon-cr2",
  "image/x-canon-crw",
  "image/x-canon-crm",
  // Nikon RAW
  "image/x-nikon-nef",
  "image/x-nikon-nrw",
  // Sony RAW
  "image/x-sony-arw",
  "image/x-sony-sr2",
  "image/x-sony-srf",
  // Fujifilm RAW
  "image/x-fuji-raf",
  // Panasonic/Leica RAW
  "image/x-panasonic-rw2",
  "image/x-panasonic-raw",
  "image/x-leica-rwl",
  // Adobe DNG
  "image/x-adobe-dng",
  "image/dng",
  // Olympus RAW
  "image/x-olympus-orf",
  // Pentax RAW
  "image/x-pentax-pef",
  // Phase One RAW
  "image/x-phaseone-iiq",
  "application/x-captureone-cap",
  // Hasselblad RAW
  "image/x-hasselblad-3fr",
  "image/x-hasselblad-fff",
  // Sigma RAW
  "image/x-sigma-x3f",
  // Mamiya RAW
  "image/x-mamiya-mef",
  // Leaf RAW
  "image/x-leaf-mos",
  // Epson RAW
  "image/x-epson-erf",
  // Samsung RAW
  "image/x-samsung-srw",
  // Kodak RAW
  "image/x-kodak-kdc",
  // Video RAW formats
  "video/x-braw",           // Blackmagic RAW
  "video/x-blackmagic-raw", // Blackmagic RAW (alternate)
  "video/x-redcode",        // RED R3D
  "application/r3d",        // RED R3D (alternate)
  "image/x-ari",            // ARRI RAW
  "video/x-ari",            // ARRI RAW (alternate)
  "video/mxf",              // Material Exchange Format
  "application/mxf",        // MXF (alternate)
  "video/x-cdng",           // CinemaDNG
  // Standard formats
  "image/tiff",
  "image/jpeg",
  "video/quicktime",        // Generic video container
  "video/mp4",              // Generic video container
  // Fallback for unrecognized RAW files
  "application/octet-stream",
] as const;

export function isRawFile(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return RAW_FILE_EXTENSIONS.some((rawExt) => rawExt === ext);
}

export function validateRawFilename(filename: string): {
  valid: boolean;
  error?: string;
} {
  if (!filename) {
    return { valid: false, error: "Filename is required" };
  }

  if (!isRawFile(filename)) {
    return {
      valid: false,
      error: `Invalid file type. Supported formats: ${RAW_FILE_EXTENSIONS.join(", ")}`,
    };
  }

  if (filename.length > 255) {
    return { valid: false, error: "Filename too long (max 255 characters)" };
  }

  return { valid: true };
}

// v3.1 Filename schema
// Format: PYYYYMMDD_JJJJJJ_SSSSS_ROOM_gNNN_eX.ext
// P = Photographer initials (e.g., "MK", "JS")
// YYYYMMDD = Date (e.g., 20250121)
// JJJJJJ = Job number (e.g., 000042)
// SSSSS = Shoot code (e.g., ab12x)
// ROOM = Room type code (e.g., KIT, LIV, BED1)
// gNNN = Stack number (e.g., g001, g002)
// eX = Exposure value (e.g., e0, e-2, e+2)
// ext = File extension (e.g., .CR3, .JPG)

export interface FilenameV31Components {
  photographer: string;
  date: string;
  jobNumber: string;
  shootCode: string;
  roomType: string;
  stackNumber: string;
  exposureValue: string;
  extension: string;
}

export function parseFilenameV31(filename: string): FilenameV31Components | null {
  // Pattern: PYYYYMMDD_JJJJJJ_SSSSS_ROOM_gNNN_eX.ext
  const pattern = /^([A-Z]{2})(\d{8})_(\d{6})_([a-z0-9]{5})_([A-Z0-9]+)_(g\d{3})_(e[+-]?\d)\.([a-zA-Z0-9]+)$/;
  const match = filename.match(pattern);

  if (!match) {
    return null;
  }

  return {
    photographer: match[1],
    date: match[2],
    jobNumber: match[3],
    shootCode: match[4],
    roomType: match[5],
    stackNumber: match[6],
    exposureValue: match[7],
    extension: match[8],
  };
}

export function generateFilenameV31(components: FilenameV31Components): string {
  return `${components.photographer}${components.date}_${components.jobNumber}_${components.shootCode}_${components.roomType}_${components.stackNumber}_${components.exposureValue}.${components.extension}`;
}

export function extractStackNumberFromFilename(filename: string): string | null {
  const components = parseFilenameV31(filename);
  return components?.stackNumber || null;
}

export function extractExposureValueFromFilename(filename: string): string | null {
  const components = parseFilenameV31(filename);
  return components?.exposureValue || null;
}

export function extractRoomTypeFromFilename(filename: string): string | null {
  const components = parseFilenameV31(filename);
  return components?.roomType || null;
}

// Room type codes mapping
export const ROOM_TYPE_CODES: Record<string, string> = {
  KIT: "kitchen",
  LIV: "living_room",
  DIN: "dining_room",
  BED1: "bedroom_1",
  BED2: "bedroom_2",
  BED3: "bedroom_3",
  BATH1: "bathroom_1",
  BATH2: "bathroom_2",
  BAL: "balcony",
  TER: "terrace",
  GAR: "garage",
  ENT: "entrance",
  HALL: "hallway",
  OFF: "office",
  GYM: "gym",
  POOL: "pool",
  EXT: "exterior",
  UNDEF: "undefined_space",
};

export function getRoomTypeFromCode(code: string): string {
  return ROOM_TYPE_CODES[code] || "undefined_space";
}

// Chunk size for multipart uploads (default 5MB, max 100MB)
export const MULTIPART_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_CHUNK_SIZE = 100 * 1024 * 1024; // 100MB
export const MIN_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB (S3/R2 requirement)

export function calculatePartCount(fileSize: number, chunkSize: number = MULTIPART_CHUNK_SIZE): number {
  return Math.ceil(fileSize / chunkSize);
}

export function validateChunkSize(chunkSize: number): { valid: boolean; error?: string } {
  if (chunkSize < MIN_CHUNK_SIZE) {
    return {
      valid: false,
      error: `Chunk size must be at least ${MIN_CHUNK_SIZE / (1024 * 1024)}MB`,
    };
  }

  if (chunkSize > MAX_CHUNK_SIZE) {
    return {
      valid: false,
      error: `Chunk size must not exceed ${MAX_CHUNK_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}
