import { readdir, stat, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

/**
 * Cleanup temporary files older than specified hours
 * Used to remove any orphaned temporary files from legacy operations
 */
export async function cleanupTempFiles(maxAgeHours: number = 6): Promise<{ deletedCount: number; errors: string[] }> {
  const tempDir = tmpdir();
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds
  
  let deletedCount = 0;
  const errors: string[] = [];
  
  try {
    console.log(`[Cleanup] Starting temp file cleanup in ${tempDir}`);
    console.log(`[Cleanup] Max age: ${maxAgeHours} hours`);
    
    // List all files/directories in temp directory
    const entries = await readdir(tempDir, { withFileTypes: true });
    
    for (const entry of entries) {
      // Only clean up our upload directories (upload-*)
      if (!entry.name.startsWith("upload-") && !entry.name.startsWith("handoff-")) {
        continue;
      }
      
      const fullPath = join(tempDir, entry.name);
      
      try {
        const stats = await stat(fullPath);
        const age = now - stats.mtimeMs;
        
        // Delete if older than max age
        if (age > maxAge) {
          console.log(`[Cleanup] Deleting old temp: ${entry.name} (age: ${Math.round(age / 1000 / 60 / 60)}h)`);
          await rm(fullPath, { recursive: true, force: true });
          deletedCount++;
        }
      } catch (err) {
        const error = `Failed to process ${entry.name}: ${err}`;
        console.error(`[Cleanup] ${error}`);
        errors.push(error);
      }
    }
    
    console.log(`[Cleanup] Completed. Deleted ${deletedCount} items, ${errors.length} errors`);
    
  } catch (err) {
    const error = `Failed to read temp directory: ${err}`;
    console.error(`[Cleanup] ${error}`);
    errors.push(error);
  }
  
  return { deletedCount, errors };
}

/**
 * Schedule periodic cleanup job
 * Runs every intervalHours
 */
export function scheduleCleanup(intervalHours: number = 6, maxAgeHours: number = 6): NodeJS.Timeout {
  console.log(`[Cleanup] Scheduling cleanup job every ${intervalHours} hours`);
  
  // Run immediately on startup
  cleanupTempFiles(maxAgeHours).catch(err => {
    console.error("[Cleanup] Initial cleanup failed:", err);
  });
  
  // Schedule recurring cleanup
  const interval = setInterval(async () => {
    try {
      const result = await cleanupTempFiles(maxAgeHours);
      console.log(`[Cleanup] Scheduled run completed: ${result.deletedCount} deleted, ${result.errors.length} errors`);
    } catch (err) {
      console.error("[Cleanup] Scheduled cleanup failed:", err);
    }
  }, intervalHours * 60 * 60 * 1000);
  
  return interval;
}
