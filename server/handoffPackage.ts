import archiver from "archiver";
import { storage } from "./storage";
import { downloadFile, uploadFile, generateObjectPath } from "./objectStorage";
import { randomBytes } from "crypto";

export interface HandoffManifest {
  jobNumber: string;
  shootCode: string;
  shootDate: string;
  propertyName?: string;
  propertyAddress?: string;
  stacks: Array<{
    stackNumber: string;
    roomType: string;
    frameCount: number;
    images: Array<{
      originalFilename: string;
      renamedFilename: string;
      exposureValue: string;
      positionInStack: number;
    }>;
  }>;
  generatedAt: string;
  packageVersion: string;
}

/**
 * Generate a handoff package (ZIP) for a shoot
 * Returns the path to the uploaded ZIP file in object storage
 */
export async function generateHandoffPackage(
  jobId: string,
  shootId: string
): Promise<{ ok: boolean; zipPath?: string; error?: string }> {
  try {
    // Get shoot and job information
    const shoot = await storage.getShoot(shootId);
    if (!shoot) {
      return { ok: false, error: "Shoot not found" };
    }

    const job = await storage.getJob(jobId);
    if (!job) {
      return { ok: false, error: "Job not found" };
    }

    // Get all stacks and images for this shoot
    const stacks = await storage.getShootStacks(shootId);
    if (stacks.length === 0) {
      return { ok: false, error: "No stacks found for this shoot" };
    }

    // Create ZIP archive in memory
    const archive = archiver("zip", {
      zlib: { level: 6 }, // Moderate compression
    });

    // Collect ZIP data chunks
    const chunks: Buffer[] = [];
    archive.on("data", (chunk) => chunks.push(chunk));
    
    // Handle archiver errors
    archive.on("error", (err) => {
      throw new Error(`Archive error: ${err.message}`);
    });

    // Build manifest
    const manifest: HandoffManifest = {
      jobNumber: job.jobNumber,
      shootCode: shoot.shootCode,
      shootDate: new Date(shoot.createdAt).toISOString(),
      propertyName: job.propertyName || undefined,
      propertyAddress: job.propertyAddress || undefined,
      stacks: [],
      generatedAt: new Date().toISOString(),
      packageVersion: "1.0",
    };

    // Process each stack
    for (const stack of stacks) {
      const images = await storage.getStackImages(stack.id);
      
      const manifestStack = {
        stackNumber: stack.stackNumber,
        roomType: stack.roomType,
        frameCount: stack.frameCount,
        images: [] as Array<{
          originalFilename: string;
          renamedFilename: string;
          exposureValue: string;
          positionInStack: number;
        }>,
      };

      // Add each image to ZIP with renamed filename
      for (const image of images) {
        // Download image from object storage
        const downloadResult = await downloadFile(image.filePath);
        if (!downloadResult.ok || !downloadResult.value) {
          console.error(`Failed to download image ${image.originalFilename}:`, downloadResult.error);
          continue;
        }

        // Use renamed filename for the ZIP entry
        const zipFilename = image.renamedFilename || image.originalFilename;
        archive.append(downloadResult.value, { name: zipFilename });

        // Add to manifest
        manifestStack.images.push({
          originalFilename: image.originalFilename,
          renamedFilename: image.renamedFilename || image.originalFilename,
          exposureValue: image.exposureValue || "e0",
          positionInStack: image.positionInStack || 0,
        });
      }

      manifest.stacks.push(manifestStack);
    }

    // Add manifest.json to ZIP
    archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });

    // Finalize the archive and wait for completion
    const zipPromise = new Promise<Buffer>((resolve, reject) => {
      archive.on("end", () => {
        const zipBuffer = Buffer.concat(chunks);
        if (zipBuffer.length === 0) {
          reject(new Error("Generated ZIP is empty"));
        }
        resolve(zipBuffer);
      });
      archive.on("error", reject);
    });

    await archive.finalize();

    // Wait for ZIP to be fully assembled and verify it's not empty
    const zipBuffer = await zipPromise;

    // Upload ZIP to object storage
    const zipFilename = `${job.jobNumber}_${shoot.shootCode}_handoff.zip`;
    const zipPath = generateObjectPath(jobId, shootId, zipFilename, "handoff");
    
    const uploadResult = await uploadFile(zipPath, zipBuffer, "application/zip");
    if (!uploadResult.ok) {
      return { ok: false, error: uploadResult.error };
    }

    // Update shoot status to handoff_generated (per Sprint 1 spec)
    await storage.updateShootStatus(shootId, "handoff_generated", "handoffGeneratedAt");

    return { ok: true, zipPath };
  } catch (error) {
    console.error("Error generating handoff package:", error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Generate a signed download token for handoff package
 * Token valid for 36 hours
 */
export async function generateHandoffToken(
  shootId: string
): Promise<{ ok: boolean; token?: string; expiresAt?: number; error?: string }> {
  try {
    const shoot = await storage.getShoot(shootId);
    if (!shoot) {
      return { ok: false, error: "Shoot not found" };
    }

    // Token valid for 36 hours (129,600,000 ms)
    const validityMs = 36 * 60 * 60 * 1000;
    const expiresAt = Date.now() + validityMs;

    // Generate secure random token
    const token = randomBytes(32).toString("hex");

    // Create editor token for handoff download
    const editorToken = await storage.createEditorToken(
      shootId,
      "download",
      token,
      expiresAt
    );

    return { ok: true, token: editorToken.token, expiresAt: editorToken.expiresAt };
  } catch (error) {
    console.error("Error generating handoff token:", error);
    return { ok: false, error: String(error) };
  }
}
