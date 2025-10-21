import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type CompletedPart,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.CF_R2_ACCOUNT_ID;
const R2_ACCESS_KEY = process.env.CF_R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.CF_R2_SECRET_KEY;
const R2_BUCKET = process.env.CF_R2_BUCKET;
const R2_ENDPOINT = process.env.CF_R2_ENDPOINT;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET || !R2_ENDPOINT) {
  console.warn("Cloudflare R2 credentials not configured. R2 operations will fail.");
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY || "",
    secretAccessKey: R2_SECRET_KEY || "",
  },
});

export interface InitMultipartUploadResult {
  uploadId: string;
  key: string;
}

export interface UploadPartResult {
  partNumber: number;
  etag: string;
}

export interface CompleteMultipartUploadResult {
  location: string;
  bucket: string;
  key: string;
  etag: string;
}

export async function initMultipartUpload(
  key: string,
  contentType?: string
): Promise<InitMultipartUploadResult> {
  const command = new CreateMultipartUploadCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const response = await r2Client.send(command);

  if (!response.UploadId) {
    throw new Error("Failed to initialize multipart upload");
  }

  return {
    uploadId: response.UploadId,
    key,
  };
}

export async function generatePresignedUploadUrl(
  key: string,
  uploadId: string,
  partNumber: number,
  expiresIn: number = 3600
): Promise<string> {
  const command = new UploadPartCommand({
    Bucket: R2_BUCKET,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: CompletedPart[]
): Promise<CompleteMultipartUploadResult> {
  const command = new CompleteMultipartUploadCommand({
    Bucket: R2_BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts,
    },
  });

  const response = await r2Client.send(command);

  if (!response.Location || !response.ETag) {
    throw new Error("Failed to complete multipart upload");
  }

  return {
    location: response.Location,
    bucket: response.Bucket || R2_BUCKET || "",
    key: response.Key || key,
    etag: response.ETag,
  };
}

export async function abortMultipartUpload(
  key: string,
  uploadId: string
): Promise<void> {
  const command = new AbortMultipartUploadCommand({
    Bucket: R2_BUCKET,
    Key: key,
    UploadId: uploadId,
  });

  await r2Client.send(command);
}

export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await r2Client.send(command);
}

export async function getObject(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  const response = await r2Client.send(command);
  
  if (!response.Body) {
    throw new Error(`Object not found: ${key}`);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  await r2Client.send(command);
}

export async function headObject(key: string): Promise<{
  contentLength?: number;
  contentType?: string;
  lastModified?: Date;
  etag?: string;
}> {
  const command = new HeadObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  const response = await r2Client.send(command);

  return {
    contentLength: response.ContentLength,
    contentType: response.ContentType,
    lastModified: response.LastModified,
    etag: response.ETag,
  };
}

export async function listObjects(prefix: string, maxKeys: number = 1000): Promise<{
  keys: string[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}> {
  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await r2Client.send(command);

  return {
    keys: (response.Contents || []).map((obj) => obj.Key || "").filter(Boolean),
    isTruncated: response.IsTruncated || false,
    nextContinuationToken: response.NextContinuationToken,
  };
}

export function generateR2ObjectKey(
  shootId: string,
  filename: string,
  type: "raw" | "preview" | "edited" | "ai" | "handoff" = "raw"
): string {
  switch (type) {
    case "raw":
      return `raw/${shootId}/${filename}`;
    case "preview":
      return `previews/${shootId}/${filename}`;
    case "edited":
      return `deliveries/${shootId}/${filename}`;
    case "ai":
      return `deliveries/${shootId}/ai/${filename}`;
    case "handoff":
      return `handoffs/${shootId}/${filename}`;
    default:
      return `${type}/${shootId}/${filename}`;
  }
}
