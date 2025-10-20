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
