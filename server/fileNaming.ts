import type { Image, Stack } from "@shared/schema";
import path from "path";

/**
 * Generate standardized filename for RAW images in handoff package
 * Format: {date}-{shootcode}_{room_type}_{index}_g{stack}_e{ev}.{ext}
 * Example: 20231015-ABC12_living_room_001_g1_e0.0.CR2
 */
export function generateRawHandoffFilename(
  image: Image,
  stack: Stack,
  stackNumber: number,
  shootCode: string,
  shootDate: Date
): string {
  const date = formatDate(shootDate);
  const roomType = stack.roomType || "undefined_space";
  const index = String(stack.sequenceIndex || 0).padStart(3, "0");
  const stackNum = String(stackNumber);
  const ev = formatExposureValue(image.exposureValue);
  const ext = path.extname(image.originalFilename).toLowerCase().substring(1); // Remove leading dot
  
  return `${date}-${shootCode}_${roomType}_${index}_g${stackNum}_e${ev}.${ext}`;
}

/**
 * Generate standardized filename for final edited images
 * Format: {date}-{shootcode}_{room_type}_{index}_v{version}.jpg
 * Example: 20231015-ABC12_living_room_001_v1.jpg
 */
export function generateFinalFilename(
  stack: Stack,
  shootCode: string,
  shootDate: Date,
  version: number = 1
): string {
  const date = formatDate(shootDate);
  const roomType = stack.roomType || "undefined_space";
  const index = String(stack.sequenceIndex).padStart(3, "0");
  const ver = String(version).padStart(1, "0");
  
  return `${date}-${shootCode}_${roomType}_${index}_v${ver}.jpg`;
}

/**
 * Format date as YYYYMMDD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${year}${month}${day}`;
}

/**
 * Format exposure value for filename
 * Handles both numeric values and string formats like "e0", "e+1", "e-2"
 * Returns integer tokens: 0, +1, -2 (no decimal points)
 */
function formatExposureValue(ev: string | number | null): string {
  if (ev === null || ev === undefined) {
    return "0";
  }
  
  // If it's a string like "e0", "e+1", extract the numeric part
  if (typeof ev === "string") {
    const match = ev.match(/e([+-]?\d+(?:\.\d+)?)/);
    if (match) {
      const numericValue = Math.round(parseFloat(match[1]));
      const sign = numericValue > 0 ? "+" : numericValue < 0 ? "" : "";
      return `${sign}${numericValue}`;
    }
    // Try to parse as number
    const numericValue = Math.round(parseFloat(ev));
    if (!isNaN(numericValue)) {
      const sign = numericValue > 0 ? "+" : numericValue < 0 ? "" : "";
      return `${sign}${numericValue}`;
    }
    return "0"; // Fallback
  }
  
  // Numeric value - round to integer
  const numericValue = Math.round(ev);
  const sign = numericValue > 0 ? "+" : numericValue < 0 ? "" : "";
  return `${sign}${numericValue}`;
}

/**
 * Parse room type from filename (for validation/recovery)
 */
export function parseRoomTypeFromFilename(filename: string): string | null {
  // Match pattern: {date}-{shootcode}_{room_type}_{index}_...
  const match = filename.match(/^\d{8}-[A-Z0-9]{5}_([a-z_]+)_\d{3}_/);
  return match ? match[1] : null;
}

/**
 * Parse sequence index from filename (for validation/recovery)
 */
export function parseSequenceIndexFromFilename(filename: string): number | null {
  // Match pattern: ..._{room_type}_{index}_...
  const match = filename.match(/_(\d{3})_g\d+_/);
  return match ? parseInt(match[1], 10) : null;
}
