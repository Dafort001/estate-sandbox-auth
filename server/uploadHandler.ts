import multer from "multer";
import ExifReader from "exifreader";
import { storage } from "./storage";
import { uploadFile, generateObjectPath } from "./objectStorage";
import { randomUUID } from "crypto";
import { generateRawHandoffFilename } from "./fileNaming";

// Multer memory storage for handling file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

interface ParsedImage {
  file: Express.Multer.File;
  exifDate?: number;
  exposureValue?: string;
}

interface Stack {
  images: ParsedImage[];
  baseExposure: string;
}

export async function parseExifData(buffer: Buffer): Promise<{ exifDate?: number; exposureValue?: string }> {
  try {
    const tags = ExifReader.load(buffer);
    
    // Extract date
    let exifDate: number | undefined;
    if (tags.DateTime?.description) {
      const dateStr = tags.DateTime.description;
      // Format: "YYYY:MM:DD HH:MM:SS"
      const parsedDate = Date.parse(dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3"));
      if (!isNaN(parsedDate)) {
        exifDate = parsedDate;
      }
    }
    
    // Extract exposure value
    let exposureValue: string | undefined;
    if (tags.ExposureBiasValue?.description) {
      const ev = parseFloat(tags.ExposureBiasValue.description);
      if (!isNaN(ev)) {
        if (ev === 0) {
          exposureValue = "e0";
        } else if (ev > 0) {
          exposureValue = `e+${Math.round(ev)}`;
        } else {
          exposureValue = `e${Math.round(ev)}`;
        }
      }
    }
    
    return { exifDate, exposureValue };
  } catch (error) {
    console.error("Error parsing EXIF data:", error);
    return {};
  }
}

// Auto-stacking algorithm: group consecutive images by exposure pattern
export function autoStackImages(images: ParsedImage[], frameCount: 3 | 5 = 5): Stack[] {
  const stacks: Stack[] = [];
  
  // Sort images by EXIF date if available, otherwise by filename
  const sortedImages = [...images].sort((a, b) => {
    if (a.exifDate && b.exifDate) {
      return a.exifDate - b.exifDate;
    }
    return a.file.originalname.localeCompare(b.file.originalname);
  });
  
  // Group images into stacks
  for (let i = 0; i < sortedImages.length; i += frameCount) {
    const stackImages = sortedImages.slice(i, i + frameCount);
    
    // Determine base exposure (middle frame)
    const middleIndex = Math.floor(stackImages.length / 2);
    const baseExposure = stackImages[middleIndex]?.exposureValue || "e0";
    
    stacks.push({
      images: stackImages,
      baseExposure,
    });
  }
  
  return stacks;
}

// Generate renamed filename according to convention
export function generateRenamedFilename(
  date: Date,
  shootCode: string,
  roomType: string,
  sequenceIndex: number,
  stackNumber: number,
  exposureValue: string,
  extension: string
): string {
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const room = roomType === 'undefined_space' ? 'unsorted' : roomType;
  const idx = String(sequenceIndex).padStart(2, '0');
  const stack = `g${String(stackNumber).padStart(3, '0')}`;
  
  return `${dateStr}-${shootCode}_${room}_${idx}_${stack}_${exposureValue}${extension}`;
}

export async function processUploadedFiles(
  shootId: string,
  jobId: string,
  files: Express.Multer.File[],
  frameCount: 3 | 5 = 5
): Promise<{ success: boolean; stackCount: number; imageCount: number; error?: string }> {
  try {
    const shoot = await storage.getShoot(shootId);
    if (!shoot) {
      return { success: false, stackCount: 0, imageCount: 0, error: "Shoot not found" };
    }
    
    // Extract shoot code (first 5 chars of shoot ID) and shoot date
    const shootCode = shoot.shootCode.toUpperCase();
    const shootDate = new Date(shoot.createdAt);
    
    // Parse EXIF data for all files
    const parsedImages: ParsedImage[] = await Promise.all(
      files.map(async (file) => {
        const { exifDate, exposureValue } = await parseExifData(file.buffer);
        return { file, exifDate, exposureValue };
      })
    );
    
    // Auto-stack images
    const stacks = autoStackImages(parsedImages, frameCount);
    
    // Upload files and create database records
    let totalImagesProcessed = 0;
    
    for (let stackIndex = 0; stackIndex < stacks.length; stackIndex++) {
      const stack = stacks[stackIndex];
      const stackNumberNumeric = stackIndex + 1; // Stack number starts at 1
      const stackNumber = `g${String(stackNumberNumeric).padStart(3, '0')}`;
      
      // Create stack record with proper sequence index
      const sequenceIndex = await storage.getNextSequenceIndexForRoom(shootId, "undefined_space");
      const dbStack = await storage.createStack(
        shootId,
        stackNumber,
        stack.images.length,
        "undefined_space", // Default room type
        sequenceIndex
      );
      
      // Process each image in the stack
      for (let positionInStack = 0; positionInStack < stack.images.length; positionInStack++) {
        const parsedImage = stack.images[positionInStack];
        const file = parsedImage.file;
        
        // Generate file path
        const storagePath = generateObjectPath(jobId, shootId, file.originalname, 'raw');
        
        // Upload to object storage
        const uploadResult = await uploadFile(storagePath, file.buffer, file.mimetype);
        if (!uploadResult.ok) {
          console.error(`Failed to upload file ${file.originalname}:`, uploadResult.error);
          continue;
        }
        
        // Create temporary image record to generate renamed filename
        const tempImage = {
          id: randomUUID(),
          createdAt: Date.now(),
          shootId,
          stackId: dbStack.id,
          originalFilename: file.originalname,
          renamedFilename: null,
          filePath: storagePath,
          fileSize: file.size,
          mimeType: file.mimetype,
          exifDate: parsedImage.exifDate || null,
          exposureValue: parsedImage.exposureValue || "e0", // Use canonical e0 format
          positionInStack,
        };
        
        // Generate renamed filename using the file naming convention
        const renamedFilename = generateRawHandoffFilename(
          tempImage,
          dbStack,
          stackNumberNumeric,
          shootCode,
          shootDate
        );
        
        // Create image record in database with renamed filename
        await storage.createImage({
          shootId,
          stackId: dbStack.id,
          originalFilename: file.originalname,
          renamedFilename,
          filePath: storagePath,
          fileSize: file.size,
          mimeType: file.mimetype,
          exifDate: parsedImage.exifDate,
          exposureValue: parsedImage.exposureValue || "e0",
          positionInStack,
        });
        
        totalImagesProcessed++;
      }
    }
    
    // Update shoot status
    await storage.updateShootStatus(shootId, "uploading");
    
    return {
      success: true,
      stackCount: stacks.length,
      imageCount: totalImagesProcessed,
    };
  } catch (error) {
    console.error("Error processing uploaded files:", error);
    return {
      success: false,
      stackCount: 0,
      imageCount: 0,
      error: String(error),
    };
  }
}
