/**
 * Background Job Queue Stub
 * 
 * Sprint 1 Specification:
 * - 60-minute quiet window after editor upload before processing
 * - Triggers downstream processing (AI captioning, final package generation)
 * - This is a stub implementation to be replaced with actual queue system (BullMQ, etc.)
 */

export interface QueueJob {
  id: string;
  shootId: string;
  jobType: 'process_editor_return' | 'generate_final_package' | 'ai_caption';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledAt: number;
  processedAt?: number;
  error?: string;
}

// In-memory queue for development (replace with actual queue service in production)
const jobs: Map<string, QueueJob> = new Map();

/**
 * Schedule a background job to process editor returns
 * Waits 60 minutes after editor upload to allow for late additions
 */
export function scheduleEditorReturnProcessing(shootId: string): string {
  const jobId = `editor-return-${shootId}-${Date.now()}`;
  const quietWindowMs = 60 * 60 * 1000; // 60 minutes
  
  const job: QueueJob = {
    id: jobId,
    shootId,
    jobType: 'process_editor_return',
    status: 'pending',
    scheduledAt: Date.now() + quietWindowMs,
  };
  
  jobs.set(jobId, job);
  
  console.log(`📅 Scheduled editor return processing for shoot ${shootId} in 60 minutes (job: ${jobId})`);
  
  // TODO: In production, use actual queue system (BullMQ, etc.)
  // Example: await queue.add('process_editor_return', { shootId }, { delay: quietWindowMs });
  
  return jobId;
}

/**
 * Schedule AI captioning job for processed images
 */
export function scheduleAICaptioning(shootId: string): string {
  const jobId = `ai-caption-${shootId}-${Date.now()}`;
  
  const job: QueueJob = {
    id: jobId,
    shootId,
    jobType: 'ai_caption',
    status: 'pending',
    scheduledAt: Date.now(),
  };
  
  jobs.set(jobId, job);
  
  console.log(`📸 Scheduled AI captioning for shoot ${shootId} (job: ${jobId})`);
  
  // TODO: Call Replicate API for image analysis and caption generation
  // Example: await replicate.run("image-captioning-model", { image: imageUrl });
  
  return jobId;
}

/**
 * Get job status by ID
 */
export function getJobStatus(jobId: string): QueueJob | undefined {
  return jobs.get(jobId);
}

/**
 * Get all jobs for a shoot
 */
export function getShootJobs(shootId: string): QueueJob[] {
  return Array.from(jobs.values()).filter((job) => job.shootId === shootId);
}

/**
 * Mark job as completed
 */
export function markJobCompleted(jobId: string): void {
  const job = jobs.get(jobId);
  if (job) {
    job.status = 'completed';
    job.processedAt = Date.now();
    console.log(`✅ Job ${jobId} completed`);
  }
}

/**
 * Mark job as failed
 */
export function markJobFailed(jobId: string, error: string): void {
  const job = jobs.get(jobId);
  if (job) {
    job.status = 'failed';
    job.processedAt = Date.now();
    job.error = error;
    console.error(`❌ Job ${jobId} failed:`, error);
  }
}
