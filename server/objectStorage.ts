import { Client } from "@replit/object-storage";

const client = new Client();

export async function uploadFile(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await client.uploadFromBytes(path, buffer);
    if (!result.ok) {
      return { ok: false, error: String(result.error) };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

export async function downloadFile(path: string): Promise<{ ok: boolean; value?: Buffer; error?: string }> {
  try {
    const result = await client.downloadAsBytes(path);
    if (!result.ok) {
      return { ok: false, error: String(result.error) };
    }
    // result.value is already a Buffer (wrapped in an array by type system)
    const buffer = Array.isArray(result.value) ? result.value[0] : result.value;
    return { ok: true, value: buffer };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

export async function listFiles(prefix: string): Promise<{ ok: boolean; value?: string[]; error?: string }> {
  try {
    const result = await client.list({ prefix });
    if (!result.ok) {
      return { ok: false, error: String(result.error) };
    }
    return { ok: true, value: (result.value || []).map((obj: any) => obj.key) };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

export async function deleteFile(path: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await client.delete(path);
    if (!result.ok) {
      return { ok: false, error: String(result.error) };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

export function generateObjectPath(jobId: string, shootId: string, filename: string, category: 'raw' | 'edits' | 'handoff' | 'meta'): string {
  if (category === 'raw') {
    return `projects/${jobId}/raw/${shootId}/${filename}`;
  } else if (category === 'edits') {
    return `projects/${jobId}/edits/${shootId}/final/${filename}`;
  } else if (category === 'handoff') {
    return `projects/${jobId}/handoff/${filename}`;
  } else {
    return `projects/${jobId}/meta/${filename}`;
  }
}

/**
 * Get the default bucket name from environment
 */
export function getDefaultBucketName(): string {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID environment variable not set");
  }
  return bucketId;
}

/**
 * Parse object path into bucket and object name
 * Format: /<bucket_name>/<object_path>
 * If path doesn't start with bucket, prepends default bucket
 */
function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/").filter(p => p.length > 0);
  
  // If path looks like it already has bucket (starts with repl-), use it
  if (pathParts.length >= 1 && pathParts[0].startsWith("repl-")) {
    const bucketName = pathParts[0];
    const objectName = pathParts.slice(1).join("/");
    return { bucketName, objectName };
  }
  
  // Otherwise, prepend default bucket
  const bucketName = getDefaultBucketName();
  const objectName = pathParts.join("/");
  
  return { bucketName, objectName };
}

/**
 * Generate a presigned URL for PUT (upload) operations
 * Uses Replit's sidecar endpoint for Google Cloud Storage
 * @param objectPath - Full object path including bucket (e.g., /bucket/path/to/file.jpg)
 * @param ttlSeconds - Time-to-live in seconds (default: 120s for uploads)
 * @returns Presigned URL that allows PUT operations
 */
export async function generatePresignedPutUrl(
  objectPath: string,
  ttlSeconds: number = 120
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
    const { bucketName, objectName } = parseObjectPath(objectPath);

    const request = {
      bucket_name: bucketName,
      object_name: objectName,
      method: "PUT",
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };

    const response = await fetch(
      `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      return {
        ok: false,
        error: `Failed to generate presigned URL (status: ${response.status})`,
      };
    }

    const { signed_url: signedUrl } = await response.json();
    return { ok: true, url: signedUrl };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
