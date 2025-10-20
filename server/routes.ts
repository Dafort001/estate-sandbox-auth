import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createJobSchema, initUploadSchema, assignRoomTypeSchema, type InitUploadResponse } from "@shared/schema";
import { z } from "zod";
import { randomBytes } from "crypto";
import { upload, processUploadedFiles } from "./uploadHandler";
import { generateHandoffPackage, generateHandoffToken } from "./handoffPackage";
import { scheduleEditorReturnProcessing, scheduleAICaptioning } from "./backgroundQueue";
import { notifyHandoffReady, notifyEditorUploadComplete } from "./notifications";

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

export async function registerRoutes(app: Express): Promise<Server> {
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
  app.get("/api/jobs/:id", async (req: Request, res: Response) => {
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
  app.get("/api/shoots/:id", async (req: Request, res: Response) => {
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
  app.get("/api/shoots/:id/stacks", async (req: Request, res: Response) => {
    try {
      const stacks = await storage.getShootStacks(req.params.id);
      res.json(stacks);
    } catch (error) {
      console.error("Error getting stacks:", error);
      res.status(500).json({ error: "Failed to get stacks" });
    }
  });
  
  // PUT /api/stacks/:id/room-type - Assign room type to a stack
  app.put("/api/stacks/:id/room-type", validateBody(assignRoomTypeSchema), async (req: Request, res: Response) => {
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
  app.get("/api/shoots/:id/images", async (req: Request, res: Response) => {
    try {
      const images = await storage.getShootImages(req.params.id);
      res.json(images);
    } catch (error) {
      console.error("Error getting images:", error);
      res.status(500).json({ error: "Failed to get images" });
    }
  });
  
  // POST /api/projects/:jobId/handoff/:shootId - Generate handoff package
  app.post("/api/projects/:jobId/handoff/:shootId", async (req: Request, res: Response) => {
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
  
  // POST /api/shoots/:id/upload - Upload RAW images for a shoot
  app.post("/api/shoots/:id/upload", upload.array("files"), async (req: Request, res: Response) => {
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

  const httpServer = createServer(app);

  return httpServer;
}
