import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { logger, generateRequestId, type LogContext } from "./logger";
import { createJobSchema, initUploadSchema, presignedUploadSchema, assignRoomTypeSchema, type InitUploadResponse, type PresignedUrlResponse } from "@shared/schema";
import { generateBearerToken } from "./bearer-auth";
import { validateRawFilename, extractRoomTypeFromFilename, extractStackNumberFromFilename, calculatePartCount, MULTIPART_CHUNK_SIZE } from "./raw-upload-helpers";
import { initMultipartUpload, generatePresignedUploadUrl, completeMultipartUpload, generateR2ObjectKey } from "./r2-client";
import { runAITool, getToolById, getAllTools } from "./replicate-adapter";
import { z } from "zod";
import { randomBytes } from "crypto";
import { upload, processUploadedFiles } from "./uploadHandler";
import { generateHandoffPackage, generateHandoffToken } from "./handoffPackage";
import Stripe from "stripe";

// Initialize Stripe from Replit's Stripe integration
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;
import { scheduleEditorReturnProcessing, scheduleAICaptioning } from "./backgroundQueue";
import { notifyHandoffReady, notifyEditorUploadComplete } from "./notifications";
import { generatePresignedPutUrl, generateObjectPath } from "./objectStorage";
import { isValidFilenameV31 } from "./fileNaming";

// Middleware to validate request body with Zod
function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(400).json({ error: "Invalid request body" });
      }
    }
  };
}

// Middleware to validate UUID path parameters
function validateUuidParam(...paramNames: string[]) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  return (req: Request, res: Response, next: any) => {
    for (const paramName of paramNames) {
      const value = req.params[paramName];
      if (value && !uuidRegex.test(value)) {
        return res.status(400).json({ error: `Invalid ${paramName} format` });
      }
    }
    next();
  };
}

// Middleware to validate and sanitize string path parameters
function validateStringParam(...paramNames: string[]) {
  // Allow alphanumeric, hyphens, and underscores only
  const safeStringRegex = /^[a-zA-Z0-9_-]+$/;
  
  return (req: Request, res: Response, next: any) => {
    for (const paramName of paramNames) {
      const value = req.params[paramName];
      if (value && !safeStringRegex.test(value)) {
        return res.status(400).json({ error: `Invalid ${paramName} format` });
      }
    }
    next();
  };
}

// Rate limiters for sensitive endpoints
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 uploads per minute per IP
  message: { error: "Too many upload requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const presignLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 presign requests per minute per IP
  message: { error: "Too many presign requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const handoffLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 handoff generation requests per minute per IP
  message: { error: "Too many handoff requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Request ID middleware - Attach unique request_id to every request
  app.use((req: Request, res: Response, next: any) => {
    const requestId = generateRequestId();
    (req as any).requestId = requestId;
    const requestStart = Date.now();
    
    // Attach request ID to response header for tracing
    res.setHeader("X-Request-ID", requestId);
    
    // Log request completion
    res.on("finish", () => {
      const duration = Date.now() - requestStart;
      const logContext: LogContext = {
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
      };
      
      logger.info(`Request completed`, logContext);
    });
    
    next();
  });

  // Security headers middleware
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");
    
    // Prevent MIME-type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    
    // Enable XSS filter in older browsers
    res.setHeader("X-XSS-Protection", "1; mode=block");
    
    // Referrer policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    
    // Content Security Policy - relaxed for development only
    // In development, Vite HMR requires 'unsafe-inline' and 'unsafe-eval'
    // This middleware only runs in development, so these directives are acceptable
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://storage.googleapis.com; " +
      "frame-ancestors 'none';"
    );
    
    // HSTS (only in production with HTTPS)
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    
    next();
  });
  
  // Ensure demo user exists for development
  async function ensureDemoUser() {
    const demoEmail = "demo@pix.immo";
    let demoUser = await storage.getUserByEmail(demoEmail);
    
    if (!demoUser) {
      // Create demo user for development
      demoUser = await storage.createUser(demoEmail, "demo-password-hash", "admin");
      console.log("✓ Demo user created:", demoEmail);
    }
    
    return demoUser;
  }

  // Workflow API Routes
  
  // POST /api/jobs - Create a new job with job_number generation
  app.post("/api/jobs", validateBody(createJobSchema), async (req: Request, res: Response) => {
    try {
      // TODO: Get userId from session/auth middleware when auth is implemented
      // For now, use demo user
      const demoUser = await ensureDemoUser();
      
      const { propertyName, propertyAddress } = req.body;
      const job = await storage.createJob(demoUser.id, propertyName, propertyAddress);
      
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ error: "Failed to create job" });
    }
  });
  
  // GET /api/jobs - Get all jobs (admin) or user's jobs
  app.get("/api/jobs", async (req: Request, res: Response) => {
    try {
      // TODO: Get userId and role from session/auth middleware when auth is implemented
      // For now, show all jobs (demo user is admin)
      const jobs = await storage.getAllJobs();
      
      res.json(jobs);
    } catch (error) {
      console.error("Error getting jobs:", error);
      res.status(500).json({ error: "Failed to get jobs" });
    }
  });
  
  // GET /api/jobs/:id - Get job by ID
  app.get("/api/jobs/:id", validateUuidParam("id"), async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error getting job:", error);
      res.status(500).json({ error: "Failed to get job" });
    }
  });
  
  // POST /api/uploads/init - Initialize a shoot for uploading
  app.post("/api/uploads/init", validateBody(initUploadSchema), async (req: Request, res: Response) => {
    try {
      const { jobNumber } = req.body;
      
      // Get job by job number
      const job = await storage.getJobByNumber(jobNumber);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // Check if there's an active shoot for this job
      let shoot = await storage.getActiveShootForJob(job.id);
      
      // If no active shoot, create a new one
      if (!shoot) {
        shoot = await storage.createShoot(job.id);
        await storage.updateJobStatus(job.id, "in_progress");
      }
      
      const response: InitUploadResponse = {
        shootId: shoot.id,
        shootCode: shoot.shootCode,
        jobId: job.id,
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error initializing upload:", error);
      res.status(500).json({ error: "Failed to initialize upload" });
    }
  });
  
  // GET /api/shoots/:id - Get shoot details
  app.get("/api/shoots/:id", validateUuidParam("id"), async (req: Request, res: Response) => {
    try {
      const shoot = await storage.getShoot(req.params.id);
      if (!shoot) {
        return res.status(404).json({ error: "Shoot not found" });
      }
      res.json(shoot);
    } catch (error) {
      console.error("Error getting shoot:", error);
      res.status(500).json({ error: "Failed to get shoot" });
    }
  });
  
  // GET /api/shoots/:id/stacks - Get all stacks for a shoot
  app.get("/api/shoots/:id/stacks", validateUuidParam("id"), async (req: Request, res: Response) => {
    try {
      const stacks = await storage.getShootStacks(req.params.id);
      res.json(stacks);
    } catch (error) {
      console.error("Error getting stacks:", error);
      res.status(500).json({ error: "Failed to get stacks" });
    }
  });
  
  // PUT /api/stacks/:id/room-type - Assign room type to a stack
  app.put("/api/stacks/:id/room-type", validateUuidParam("id"), validateBody(assignRoomTypeSchema), async (req: Request, res: Response) => {
    try {
      const { roomType } = req.body;
      await storage.updateStackRoomType(req.params.id, roomType);
      
      const stack = await storage.getStack(req.params.id);
      res.json(stack);
    } catch (error) {
      console.error("Error updating stack room type:", error);
      res.status(500).json({ error: "Failed to update stack room type" });
    }
  });
  
  // GET /api/shoots/:id/images - Get all images for a shoot
  app.get("/api/shoots/:id/images", validateUuidParam("id"), async (req: Request, res: Response) => {
    try {
      const images = await storage.getShootImages(req.params.id);
      res.json(images);
    } catch (error) {
      console.error("Error getting images:", error);
      res.status(500).json({ error: "Failed to get images" });
    }
  });
  
  // POST /api/projects/:jobId/handoff/:shootId - Generate handoff package
  app.post("/api/projects/:jobId/handoff/:shootId", handoffLimiter, validateUuidParam("jobId", "shootId"), async (req: Request, res: Response) => {
    try {
      const { jobId, shootId } = req.params;
      
      // Verify job and shoot exist
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      const shoot = await storage.getShoot(shootId);
      if (!shoot) {
        return res.status(404).json({ error: "Shoot not found" });
      }
      
      // Generate handoff package (ZIP with renamed files and manifest)
      const packageResult = await generateHandoffPackage(jobId, shootId);
      if (!packageResult.ok) {
        return res.status(500).json({ error: packageResult.error || "Failed to generate handoff package" });
      }
      
      // Generate download token (36 hours validity)
      const downloadTokenResult = await generateHandoffToken(shootId);
      if (!downloadTokenResult.ok) {
        return res.status(500).json({ error: downloadTokenResult.error || "Failed to generate download token" });
      }
      
      // Generate upload token (36 hours validity)
      const uploadToken = randomBytes(32).toString('hex');
      const expiresAt = Date.now() + (36 * 60 * 60 * 1000); // 36 hours
      await storage.createEditorToken(shootId, 'upload', uploadToken, expiresAt);
      
      // Send notification to producer
      const downloadUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/handoff/download/${downloadTokenResult.token}`;
      await notifyHandoffReady({
        email: "demo@pix.immo", // TODO: Get from user/job settings
        jobNumber: job.jobNumber,
        shootCode: shoot.shootCode,
        downloadUrl,
      });
      
      // Only expose signed download URL, not internal storage path
      res.json({
        downloadUrl: `/api/handoff/download/${downloadTokenResult.token}`,
        uploadToken: uploadToken,
        expiresAt: downloadTokenResult.expiresAt,
      });
    } catch (error) {
      console.error("Error generating handoff package:", error);
      res.status(500).json({ error: "Failed to generate handoff package" });
    }
  });
  
  // POST /api/shoots/:id/presign - Generate presigned URLs for uploading RAW images
  app.post("/api/shoots/:id/presign", presignLimiter, validateUuidParam("id"), validateBody(presignedUploadSchema), async (req: Request, res: Response) => {
    try {
      const shootId = req.params.id;
      const { filenames } = req.body as { filenames: string[] };
      
      // TODO: Get userId from session/auth middleware when auth is implemented
      // For now, use demo user for ownership check
      const demoUser = await ensureDemoUser();
      
      // Get shoot to verify it exists and check ownership
      const shoot = await storage.getShoot(shootId);
      if (!shoot) {
        return res.status(404).json({ error: "Shoot not found" });
      }
      
      // Get job to verify ownership
      const job = await storage.getJob(shoot.jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // TODO: Check if user owns the job when auth is implemented
      // if (job.userId !== demoUser.id) {
      //   return res.status(403).json({ error: "Unauthorized" });
      // }
      
      // Validate file limits
      if (filenames.length > 50) {
        return res.status(400).json({ error: "Maximum 50 files per request" });
      }
      
      // Process each filename
      const results: PresignedUrlResponse[] = [];
      
      for (const filename of filenames) {
        // Validate filename against v3.1 schema
        if (!isValidFilenameV31(filename)) {
          results.push({
            filename,
            uploadUrl: "",
            error: "Invalid filename format. Must match v3.1 schema: {date}-{shootcode}_{room_type}_{index}_v{ver}.{ext}",
          });
          continue;
        }
        
        // Validate MIME type based on extension
        const ext = filename.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'heic', 'heif', 'png'];
        if (!ext || !allowedExtensions.includes(ext)) {
          results.push({
            filename,
            uploadUrl: "",
            error: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`,
          });
          continue;
        }
        
        // Generate object path
        const objectPath = generateObjectPath(job.id, shootId, filename, 'raw');
        
        // Generate presigned URL (120 second TTL)
        const presignResult = await generatePresignedPutUrl(objectPath, 120);
        
        if (!presignResult.ok || !presignResult.url) {
          results.push({
            filename,
            uploadUrl: "",
            error: presignResult.error || "Failed to generate presigned URL",
          });
          continue;
        }
        
        results.push({
          filename,
          uploadUrl: presignResult.url,
        });
      }
      
      res.json({ results });
    } catch (error) {
      console.error("Error generating presigned URLs:", error);
      res.status(500).json({ error: "Failed to generate presigned URLs" });
    }
  });
  
  // POST /api/shoots/:id/upload - Upload RAW images for a shoot
  app.post("/api/shoots/:id/upload", uploadLimiter, validateUuidParam("id"), upload.array("files"), async (req: Request, res: Response) => {
    try {
      const shootId = req.params.id;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      
      // Get shoot to verify it exists and get job ID
      const shoot = await storage.getShoot(shootId);
      if (!shoot) {
        return res.status(404).json({ error: "Shoot not found" });
      }
      
      // Get frame count from request (default to 5)
      const frameCount = req.body.frameCount === "3" ? 3 : 5;
      
      // Process uploaded files
      const result = await processUploadedFiles(shootId, shoot.jobId, files, frameCount);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to process files" });
      }
      
      res.json({
        success: true,
        stackCount: result.stackCount,
        imageCount: result.imageCount,
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ error: "Failed to upload files" });
    }
  });
  
  // POST /api/editor/:token/upload - Editor upload endpoint
  app.post("/api/editor/:token/upload", upload.single("package"), async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Verify token
      const editorToken = await storage.getEditorToken(token);
      if (!editorToken || editorToken.tokenType !== 'upload') {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      
      // Get shoot and job info for notifications
      const shoot = await storage.getShoot(editorToken.shootId);
      if (!shoot) {
        return res.status(404).json({ error: "Shoot not found" });
      }
      
      const job = await storage.getJob(shoot.jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // Mark token as used
      await storage.markEditorTokenUsed(token);
      
      // TODO: Implement ZIP validation and unpacking
      // For now, just log the upload
      console.log(`📦 Editor uploaded ${file.size} bytes for shoot ${editorToken.shootId}`);
      
      // Update shoot status
      await storage.updateShootStatus(editorToken.shootId, 'editor_returned', 'editorReturnedAt');
      
      // Schedule background processing (60-minute quiet window)
      const queueJobId = scheduleEditorReturnProcessing(editorToken.shootId);
      
      // Send notification to producer
      await notifyEditorUploadComplete({
        email: "demo@pix.immo", // TODO: Get from user/job settings
        jobNumber: job.jobNumber,
        shootCode: shoot.shootCode,
        imageCount: 0, // TODO: Get actual count from unpacked ZIP
      });
      
      res.json({ 
        success: true, 
        message: "Upload received successfully",
        queueJobId,
      });
    } catch (error) {
      console.error("Error handling editor upload:", error);
      res.status(500).json({ error: "Failed to process upload" });
    }
  });

  // Bearer token management routes
  const createTokenSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    scopes: z.array(z.enum(["upload:raw", "view:gallery", "ai:run", "order:read", "order:write", "admin:all"])),
    expiresInDays: z.number().int().min(1).max(365).optional().default(90),
  });

  app.post("/api/tokens", validateBody(createTokenSchema), async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { name, scopes, expiresInDays } = req.body;
      const { token, hashedToken } = generateBearerToken();
      
      const expiresAt = Date.now() + (expiresInDays * 24 * 60 * 60 * 1000);
      
      const pat = await storage.createPersonalAccessToken({
        userId: user.id,
        token: hashedToken,
        name,
        scopes: scopes.join(","),
        expiresAt,
      });

      res.json({
        id: pat.id,
        token,
        name: pat.name,
        scopes: pat.scopes.split(","),
        expiresAt: pat.expiresAt,
        createdAt: pat.createdAt,
      });
    } catch (error) {
      console.error("Error creating token:", error);
      res.status(500).json({ error: "Failed to create token" });
    }
  });

  app.get("/api/tokens", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const tokens = await storage.getUserPersonalAccessTokens(user.id);
      
      const sanitizedTokens = tokens.map((t) => ({
        id: t.id,
        name: t.name,
        scopes: t.scopes.split(","),
        expiresAt: t.expiresAt,
        lastUsedAt: t.lastUsedAt,
        lastUsedIp: t.lastUsedIp,
        revokedAt: t.revokedAt,
        createdAt: t.createdAt,
      }));

      res.json(sanitizedTokens);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      res.status(500).json({ error: "Failed to fetch tokens" });
    }
  });

  app.delete("/api/tokens/:id", validateUuidParam("id"), async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      
      const tokens = await storage.getUserPersonalAccessTokens(user.id);
      const token = tokens.find((t) => t.id === id);

      if (!token) {
        return res.status(404).json({ error: "Token not found" });
      }

      await storage.revokePersonalAccessToken(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error revoking token:", error);
      res.status(500).json({ error: "Failed to revoke token" });
    }
  });

  // RAW file upload endpoints (multipart resumable)
  const initRawUploadSchema = z.object({
    shootId: z.string().uuid(),
    filename: z.string().min(1).max(255),
    fileSize: z.number().int().positive(),
    roomType: z.string().min(1),
    stackIndex: z.number().int().min(0),
    stackCount: z.number().int().min(3).max(5),
  });

  app.post("/api/raw-uploads/init", validateBody(initRawUploadSchema), async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { shootId, filename, fileSize, roomType, stackIndex, stackCount } = req.body;

      const filenameValidation = validateRawFilename(filename);
      if (!filenameValidation.valid) {
        return res.status(400).json({ error: filenameValidation.error });
      }

      const shoot = await storage.getShoot(shootId);
      if (!shoot) {
        return res.status(404).json({ error: "Shoot not found" });
      }

      const r2Key = generateR2ObjectKey(shootId, filename, "raw");
      
      const upload = await initMultipartUpload(r2Key, "application/octet-stream");

      const session = await storage.createUploadSession({
        id: upload.uploadId,
        userId: user.id,
        shootId,
        filename,
        roomType,
        stackIndex,
        stackCount,
        r2Key,
        uploadId: upload.uploadId,
        fileSize,
      });

      const partCount = calculatePartCount(fileSize);

      res.json({
        uploadId: upload.uploadId,
        sessionId: session.id,
        r2Key: upload.key,
        partCount,
        chunkSize: MULTIPART_CHUNK_SIZE,
      });
    } catch (error) {
      console.error("Error initializing upload:", error);
      res.status(500).json({ error: "Failed to initialize upload" });
    }
  });

  const getPresignedUrlsSchema = z.object({
    partNumbers: z.array(z.number().int().positive()),
  });

  app.post("/api/raw-uploads/:uploadId/parts", validateBody(getPresignedUrlsSchema), async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { uploadId } = req.params;
      const { partNumbers } = req.body;

      const session = await storage.getUploadSession(uploadId);
      if (!session) {
        return res.status(404).json({ error: "Upload session not found" });
      }

      if (session.userId !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (session.status === "completed") {
        return res.status(400).json({ error: "Upload already completed" });
      }

      const presignedUrls = await Promise.all(
        partNumbers.map(async (partNumber: number) => ({
          partNumber,
          url: await generatePresignedUploadUrl(session.r2Key, session.uploadId, partNumber),
        }))
      );

      res.json({ presignedUrls });
    } catch (error) {
      console.error("Error generating presigned URLs:", error);
      res.status(500).json({ error: "Failed to generate presigned URLs" });
    }
  });

  const completeUploadSchema = z.object({
    parts: z.array(z.object({
      PartNumber: z.number().int().positive(),
      ETag: z.string().min(1),
    })),
  });

  app.post("/api/raw-uploads/:uploadId/complete", validateBody(completeUploadSchema), async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { uploadId } = req.params;
      const { parts } = req.body;

      const session = await storage.getUploadSession(uploadId);
      if (!session) {
        return res.status(404).json({ error: "Upload session not found" });
      }

      if (session.userId !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (session.status === "completed") {
        return res.status(400).json({ error: "Upload already completed" });
      }

      await storage.updateUploadSessionParts(uploadId, JSON.stringify(parts));

      const result = await completeMultipartUpload(session.r2Key, session.uploadId, parts);

      await storage.completeUploadSession(uploadId);

      await storage.createImage({
        shootId: session.shootId,
        stackId: undefined,
        originalFilename: session.filename,
        renamedFilename: undefined,
        filePath: session.r2Key,
        fileSize: session.fileSize || undefined,
        mimeType: "application/octet-stream",
        exifDate: undefined,
        exposureValue: extractStackNumberFromFilename(session.filename) || undefined,
        positionInStack: session.stackIndex,
      });

      res.json({
        success: true,
        location: result.location,
        etag: result.etag,
      });
    } catch (error) {
      console.error("Error completing upload:", error);
      await storage.failUploadSession(req.params.uploadId);
      res.status(500).json({ error: "Failed to complete upload" });
    }
  });

  // AI processing endpoints
  app.get("/api/ai/tools", async (req: Request, res: Response) => {
    try {
      const tools = getAllTools();
      res.json(tools);
    } catch (error) {
      console.error("Error fetching AI tools:", error);
      res.status(500).json({ error: "Failed to fetch AI tools" });
    }
  });

  const runAIToolSchema = z.object({
    shootId: z.string().uuid(),
    toolId: z.string().min(1),
    sourceImageKey: z.string().min(1),
    params: z.record(z.any()).optional(),
  });

  app.post("/api/ai/run", validateBody(runAIToolSchema), async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { shootId, toolId, sourceImageKey, params } = req.body;

      const shoot = await storage.getShoot(shootId);
      if (!shoot) {
        return res.status(404).json({ error: "Shoot not found" });
      }

      const job = await storage.getJob(shoot.jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.userId !== user.id && user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const tool = getToolById(toolId);
      if (!tool) {
        return res.status(400).json({ error: "Invalid tool ID" });
      }

      const userCredits = await storage.getUserCredits(user.id);
      if (userCredits < tool.creditsPerImage) {
        return res.status(402).json({ 
          error: "Insufficient credits",
          required: tool.creditsPerImage,
          current: userCredits,
        });
      }

      const webhookUrl = `${process.env.BASE_URL || "https://pix.immo"}/api/ai/webhook`;
      
      const sourceImageUrl = `https://${process.env.CF_R2_BUCKET}.r2.cloudflarestorage.com/${sourceImageKey}`;

      const result = await runAITool({
        toolId,
        sourceImageUrl,
        webhookUrl,
        params,
      });

      const aiJob = await storage.createAIJob({
        userId: user.id,
        shootId,
        tool: toolId,
        modelSlug: tool.modelVersion,
        sourceImageKey,
        params: params ? JSON.stringify(params) : undefined,
        externalJobId: result.id,
      });

      res.json({
        jobId: aiJob.id,
        externalJobId: result.id,
        status: result.status,
        estimatedTime: tool.estimatedTimeSeconds,
        cost: tool.costPerImage,
        credits: tool.creditsPerImage,
      });
    } catch (error) {
      console.error("Error running AI tool:", error);
      res.status(500).json({ error: "Failed to run AI tool" });
    }
  });

  app.post("/api/ai/webhook", async (req: Request, res: Response) => {
    try {
      const { id: externalJobId, status, output, error } = req.body;

      const aiJob = await storage.getAIJobByExternalId(externalJobId);
      if (!aiJob) {
        return res.status(404).json({ error: "AI job not found" });
      }

      if (status === "succeeded" && output) {
        const outputUrl = Array.isArray(output) ? output[0] : output;
        const outputFilename = `${aiJob.id}_${Date.now()}.jpg`;
        const outputKey = generateR2ObjectKey(aiJob.shootId, outputFilename, "ai");

        const tool = getToolById(aiJob.tool);
        const cost = tool?.costPerImage || 0;
        const credits = tool?.creditsPerImage || 0;

        const deducted = await storage.deductCredits(aiJob.userId, credits);
        if (!deducted) {
          console.error(`Failed to deduct ${credits} credits from user ${aiJob.userId} for job ${aiJob.id}`);
        }

        await storage.completeAIJob(aiJob.id, outputKey, cost, credits);

        res.json({ success: true });
      } else if (status === "failed") {
        await storage.updateAIJobStatus(aiJob.id, "failed", error);
        res.json({ success: true });
      } else {
        await storage.updateAIJobStatus(aiJob.id, status);
        res.json({ success: true });
      }
    } catch (error) {
      console.error("Error processing AI webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  app.get("/api/ai/jobs/:shootId", validateUuidParam("shootId"), async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { shootId } = req.params;

      const shoot = await storage.getShoot(shootId);
      if (!shoot) {
        return res.status(404).json({ error: "Shoot not found" });
      }

      const job = await storage.getJob(shoot.jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.userId !== user.id && user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const jobs = await storage.getShootAIJobs(shootId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching AI jobs:", error);
      res.status(500).json({ error: "Failed to fetch AI jobs" });
    }
  });

  // Credit billing endpoints - using Stripe integration from blueprint:javascript_stripe
  app.get("/api/credits/balance", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const credits = await storage.getUserCredits(user.id);
      res.json({ credits });
    } catch (error) {
      console.error("Error fetching credits:", error);
      res.status(500).json({ error: "Failed to fetch credits" });
    }
  });

  const createPaymentSchema = z.object({
    credits: z.number().int().min(100).max(10000),
  });

  app.post("/api/credits/purchase", validateBody(createPaymentSchema), async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: "Payment system not configured" });
      }

      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { credits } = req.body;
      const pricePerCredit = 0.01;
      const amount = Math.round(credits * pricePerCredit * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "eur",
        metadata: {
          userId: user.id,
          credits: credits.toString(),
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount,
        credits,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  app.post("/api/credits/webhook", async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: "Payment system not configured" });
      }

      const sig = req.headers["stripe-signature"];
      if (!sig) {
        return res.status(400).json({ error: "Missing signature" });
      }

      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );

      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { userId, credits } = paymentIntent.metadata;

        if (userId && credits) {
          await storage.addCredits(userId, parseInt(credits, 10));
          console.log(`Added ${credits} credits to user ${userId}`);
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error processing Stripe webhook:", error);
      res.status(400).json({ error: "Webhook error" });
    }
  });

  // Healthz endpoint for monitoring and CI/CD
  app.get("/healthz", (req, res) => {
    res.json({
      status: "ok",
      env: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      service: "pix.immo",
      version: "1.0.0",
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
