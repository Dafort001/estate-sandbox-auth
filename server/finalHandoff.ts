/**
 * Final Client Handoff Package Generator
 * 
 * Creates a clean delivery ZIP with only approved images,
 * organized by room type with a delivery manifest.
 */

import AdmZip from "adm-zip";
import { IStorage } from "./storage";
import { downloadFile, uploadFile } from "./objectStorage";
import { randomUUID } from "crypto";

export interface HandoffManifest {
  jobNumber: string;
  shootCode: string;
  propertyName: string;
  generatedAt: number;
  version: number;
  totalImages: number;
  imagesByRoom: Record<string, string[]>;
}

export interface GenerateHandoffResult {
  success: boolean;
  downloadUrl?: string;
  manifest?: HandoffManifest;
  error?: string;
  totalImages?: number;
}

/**
 * Generate final client handoff package
 * 
 * @param storage - Storage interface
 * @param jobId - Job ID
 * @param shootId - Shoot ID
 * @param version - Version number to package (latest by default)
 * @returns Result with download URL or error
 */
export async function generateFinalHandoff(
  storage: IStorage,
  jobId: string,
  shootId: string,
  version?: number
): Promise<GenerateHandoffResult> {
  try {
    // 1. Fetch job and shoot
    const job = await storage.getJob(jobId);
    if (!job) {
      return { success: false, error: "Job not found" };
    }

    const shoot = await storage.getShoot(shootId);
    if (!shoot) {
      return { success: false, error: "Shoot not found" };
    }

    // 2. Fetch all edited images for this shoot
    const allEditedImages = await storage.getEditedImagesByShoot(shootId);

    // 3. Filter for approved images
    const approvedImages = allEditedImages.filter(
      (img) => img.clientApprovalStatus === 'approved'
    );

    if (approvedImages.length === 0) {
      return { 
        success: false, 
        error: "No approved images found for handoff" 
      };
    }

    // 4. Filter by version if specified, otherwise use latest
    let targetVersion = version;
    if (!targetVersion) {
      const versionSet = new Set(approvedImages.map(img => img.version));
      const versions = Array.from(versionSet);
      targetVersion = Math.max(...versions);
    }

    const versionImages = approvedImages.filter(
      (img) => img.version === targetVersion
    );

    if (versionImages.length === 0) {
      return { 
        success: false, 
        error: `No approved images found for version ${targetVersion}` 
      };
    }

    // 5. Group images by room type
    const imagesByRoom: Record<string, typeof versionImages> = {};
    for (const image of versionImages) {
      const roomType = image.roomType || 'uncategorized';
      if (!imagesByRoom[roomType]) {
        imagesByRoom[roomType] = [];
      }
      imagesByRoom[roomType].push(image);
    }

    // 6. Create ZIP archive
    const zip = new AdmZip();

    // 7. Download and add images to ZIP, organized by room
    console.log(`📦 Creating handoff package for ${versionImages.length} approved images`);

    // Track successfully packaged files
    const successfullyPackagedByRoom: Record<string, string[]> = {};
    let totalPackaged = 0;

    for (const [roomType, images] of Object.entries(imagesByRoom)) {
      if (!successfullyPackagedByRoom[roomType]) {
        successfullyPackagedByRoom[roomType] = [];
      }

      for (const image of images) {
        try {
          // Download image from object storage
          const downloadResult = await downloadFile(image.filePath);
          
          if (!downloadResult.ok || !downloadResult.value) {
            console.warn(`⚠️  Failed to download ${image.filename}: ${downloadResult.error}`);
            continue;
          }

          // Add to ZIP in room-specific folder
          const zipPath = `${roomType}/${image.filename}`;
          zip.addFile(zipPath, downloadResult.value);
          
          // Track successfully packaged file
          successfullyPackagedByRoom[roomType].push(image.filename);
          totalPackaged++;
          
          console.log(`✓ Added ${zipPath}`);
        } catch (error) {
          console.error(`❌ Error processing ${image.filename}:`, error);
          continue;
        }
      }
    }

    // Fail if no images were successfully packaged
    if (totalPackaged === 0) {
      return {
        success: false,
        error: "Failed to package any images",
      };
    }

    // 8. Create manifest (only include successfully packaged files)
    const manifest: HandoffManifest = {
      jobNumber: job.jobNumber,
      shootCode: shoot.shootCode,
      propertyName: job.propertyName,
      generatedAt: Date.now(),
      version: targetVersion,
      totalImages: totalPackaged,
      imagesByRoom: successfullyPackagedByRoom,
    };

    // Add manifest to ZIP
    zip.addFile(
      "manifest.json",
      Buffer.from(JSON.stringify(manifest, null, 2))
    );

    console.log(`📄 Added manifest.json`);

    // 9. Generate ZIP buffer
    const zipBuffer = zip.toBuffer();

    // 10. Upload to object storage
    const timestamp = Date.now();
    const zipFilename = `${job.jobNumber}_${shoot.shootCode}_v${targetVersion}_final.zip`;
    const zipPath = `/projects/${jobId}/handoff/${zipFilename}`;

    console.log(`⬆️  Uploading handoff package: ${zipFilename} (${zipBuffer.length} bytes)`);

    const uploadResult = await uploadFile(zipPath, zipBuffer, 'application/zip');

    if (!uploadResult.ok) {
      return {
        success: false,
        error: `Failed to upload handoff package: ${uploadResult.error}`,
      };
    }

    // 11. Generate signed download URL (valid for 7 days)
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    const token = randomUUID();
    await storage.createEditorToken(shootId, 'download', token, expiresAt, zipPath);
    const downloadUrl = `/api/handoff/download/${token}`;

    console.log(`✅ Handoff package created successfully: ${totalPackaged} images packaged (${versionImages.length} approved)`);

    return {
      success: true,
      downloadUrl,
      manifest,
      totalImages: totalPackaged,
    };
  } catch (error) {
    console.error("Error generating final handoff:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get list of available handoff packages for a job
 */
export async function listHandoffPackages(
  storage: IStorage,
  jobId: string
): Promise<Array<{ version: number; filename: string; generatedAt: number }>> {
  // This would query object storage to list available handoff packages
  // For now, return empty array (stub implementation)
  return [];
}
