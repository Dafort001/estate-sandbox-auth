import AdmZip from 'adm-zip';
import { downloadFile, uploadFile } from './objectStorage';
import type { IStorage } from './storage';
import type { RoomType, Stack, EditedImage } from '../shared/schema';
import { nanoid } from 'nanoid';

/**
 * Parse edited filename to extract metadata
 * Expected format: {date}-{shootcode}_{room_type}_{index}_v{version}.jpg
 * Example: 20250120-abc12_living_room_001_v1.jpg
 */
export function parseEditedFilename(filename: string): {
  date: string;
  shootCode: string;
  roomType: string;
  sequenceIndex: number;
  version: number;
  extension: string;
} | null {
  const pattern = /^(\d{8})-([a-z0-9]{5})_([a-z_]+)_(\d{3})_v(\d+)\.(jpg|jpeg|png)$/i;
  const match = filename.match(pattern);
  
  if (!match) {
    console.warn(`Filename does not match expected pattern: ${filename}`);
    return null;
  }
  
  const [, date, shootCode, roomType, indexStr, versionStr, extension] = match;
  
  return {
    date,
    shootCode,
    roomType,
    sequenceIndex: parseInt(indexStr, 10),
    version: parseInt(versionStr, 10),
    extension,
  };
}

/**
 * Process editor return ZIP:
 * 1. Download ZIP from object storage
 * 2. Extract files
 * 3. Parse filenames
 * 4. Upload files to final location
 * 5. Create EditedImage records
 * 6. Match to original stacks
 */
export async function processEditorReturnZip(
  storage: IStorage,
  shootId: string,
  jobId: string
): Promise<{ 
  success: boolean; 
  processedCount: number; 
  skippedCount: number; 
  errors: string[];
}> {
  const errors: string[] = [];
  let processedCount = 0;
  let skippedCount = 0;
  
  try {
    // 1. Download ZIP from object storage
    const zipPath = `/projects/${jobId}/edits/${shootId}/editor_return.zip`;
    console.log(`📦 Downloading editor return ZIP from ${zipPath}`);
    
    const downloadResult = await downloadFile(zipPath);
    if (!downloadResult.ok || !downloadResult.value) {
      throw new Error(`Failed to download ZIP: ${downloadResult.error || 'Unknown error'}`);
    }
    
    // 2. Extract ZIP
    console.log(`📂 Extracting ZIP (${downloadResult.value.length} bytes)`);
    const zip = new AdmZip(downloadResult.value);
    const zipEntries = zip.getEntries();
    
    // Get shoot to verify shootCode
    const shoot = await storage.getShoot(shootId);
    if (!shoot) {
      throw new Error('Shoot not found');
    }
    
    // Get all stacks for this shoot to match edited images
    const stacks = await storage.getStacksByShoot(shootId);
    const stackMap = new Map(stacks.map((s: Stack) => [`${s.roomType}_${s.sequenceIndex}`, s]));
    
    // Determine version number (check existing edited images)
    const existingEdits = await storage.getEditedImagesByShoot(shootId);
    const maxVersion = existingEdits.reduce((max: number, img: EditedImage) => Math.max(max, img.version || 0), 0);
    const version = maxVersion + 1;
    
    console.log(`📸 Processing version ${version} (found ${existingEdits.length} existing edits)`);
    
    // 3. Process each file
    for (const entry of zipEntries) {
      if (entry.isDirectory || entry.entryName.startsWith('__MACOSX/')) {
        continue;
      }
      
      const filename = entry.entryName.split('/').pop() || entry.entryName;
      
      // Skip non-image files
      if (!/\.(jpg|jpeg|png)$/i.test(filename)) {
        console.log(`⏭️  Skipping non-image file: ${filename}`);
        skippedCount++;
        continue;
      }
      
      // Parse filename
      const parsed = parseEditedFilename(filename);
      if (!parsed) {
        errors.push(`Invalid filename format: ${filename}`);
        skippedCount++;
        continue;
      }
      
      // Verify shootCode matches
      if (parsed.shootCode !== shoot.shootCode) {
        errors.push(`Shoot code mismatch in ${filename}: expected ${shoot.shootCode}, got ${parsed.shootCode}`);
        skippedCount++;
        continue;
      }
      
      // 4. Upload file to object storage
      const fileBuffer = entry.getData();
      const storagePath = `/projects/${jobId}/edits/${shootId}/final/v${version}/${filename}`;
      
      console.log(`⬆️  Uploading ${filename} (${fileBuffer.length} bytes)`);
      const uploadResult = await uploadFile(storagePath, fileBuffer, 'image/jpeg');
      
      if (!uploadResult.ok) {
        errors.push(`Failed to upload ${filename}: ${uploadResult.error}`);
        skippedCount++;
        continue;
      }
      
      // 5. Match to original stack
      const stackKey = `${parsed.roomType}_${parsed.sequenceIndex}`;
      const matchedStack = stackMap.get(stackKey);
      
      if (!matchedStack) {
        console.warn(`⚠️  No matching stack found for ${filename} (${stackKey})`);
      }
      
      // 6. Create EditedImage record
      await storage.createEditedImage({
        id: nanoid(),
        shootId,
        stackId: matchedStack?.id || null,
        filename,
        filePath: storagePath,
        fileSize: fileBuffer.length,
        version,
        roomType: parsed.roomType,
        sequenceIndex: parsed.sequenceIndex,
        clientApprovalStatus: 'pending',
        createdAt: Date.now(),
      });
      
      processedCount++;
      console.log(`✅ Processed ${filename}`);
    }
    
    // Update shoot status
    if (processedCount > 0) {
      await storage.updateShootStatus(shootId, 'processing', 'editorReturnedAt');
      console.log(`✨ Successfully processed ${processedCount} images (version ${version})`);
    }
    
    return {
      success: errors.length === 0,
      processedCount,
      skippedCount,
      errors,
    };
    
  } catch (error) {
    console.error('Error processing editor return ZIP:', error);
    return {
      success: false,
      processedCount,
      skippedCount,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
