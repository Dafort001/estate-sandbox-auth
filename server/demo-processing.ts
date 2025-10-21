import type { IStorage } from "./storage";

/**
 * Demo Phase Processing
 * Tasks 5-7: Preview Generation, Captioning, Exposé Generation
 * 
 * In DEMO mode, we simulate the full workflow without actual image processing or AI:
 * 1. Create demo shoot + demo images for the job
 * 2. Mock preview generation (update previewPath on images)
 * 3. Generate German demo captions
 * 4. Generate demo exposé with property highlights
 */

const DEMO_CAPTIONS = [
  "Moderne Küche mit hochwertiger Einbauküche und viel Tageslicht",
  "Geräumiges Wohnzimmer mit Parkettboden und großen Fenstern",
  "Helles Badezimmer mit Badewanne und bodengleicher Dusche",
  "Elegantes Schlafzimmer mit Blick ins Grüne",
  "Großzügiger Balkon mit Südausrichtung",
  "Einladender Eingangsbereich mit Garderobe",
  "Praktisches Arbeitszimmer mit Einbauschränken",
  "Stilvolles Gäste-WC mit modernen Armaturen",
  "Lichtdurchflutetes Treppenhaus",
  "Gemütliche Terrasse mit Holzboden",
];

const DEMO_EXPOSE_HIGHLIGHTS = [
  "Zentrale Lage mit ausgezeichneter Verkehrsanbindung",
  "Hochwertige Ausstattung und moderne Technik",
  "Großzügiger Grundriss mit durchdachter Raumaufteilung",
  "Energieeffizientes Gebäude mit optimaler Dämmung",
  "Ruhige Wohnlage mit hoher Lebensqualität",
  "Nahe zu Schulen, Einkaufsmöglichkeiten und Grünflächen",
];

/**
 * Process a job in DEMO mode
 * 
 * Workflow:
 * 1. Create demo shoot with demo images
 * 2. Generate preview paths for images (mock - no actual downscaling)
 * 3. Generate captions for each image
 * 4. Generate exposé document
 * 5. Update job status to "completed"
 */
export async function processJobDemo(jobId: string, storage: IStorage): Promise<void> {
  console.log(`[Demo Processing] Starting job ${jobId}`);

  // Get the job
  const job = await storage.getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  // Update status to processing
  await storage.updateJobStatus(jobId, "processing");

  try {
    // Create demo shoot + demo images for this job
    const shootId = await createDemoShoot(jobId, storage);

    // Task 5: Generate Previews (DEMO - update previewPath on images)
    await generatePreviewsDemo(shootId, storage);

    // Task 6: Generate Captions (DEMO - random German captions)
    const captionsGenerated = job.deliverAlttext === "true";
    if (captionsGenerated) {
      await generateCaptionsDemo(shootId, storage);
    }

    // Task 7: Generate Exposé (DEMO - mock document with highlights)
    const exposeGenerated = job.deliverExpose === "true";
    if (exposeGenerated) {
      await generateExposeDemo(jobId, storage);
    }

    // Mark job as completed
    await storage.updateJobStatus(jobId, "completed");
    // Update deliverables based on what was actually generated
    await storage.updateJobDeliverables(
      jobId,
      job.deliverGallery === "true", // Gallery always generated if requested
      captionsGenerated,
      exposeGenerated
    );

    console.log(`[Demo Processing] Completed job ${jobId}`);
  } catch (error) {
    console.error(`[Demo Processing] Error processing job ${jobId}:`, error);
    await storage.updateJobStatus(jobId, "failed");
    throw error;
  }
}

/**
 * Create a demo shoot with demo images for testing
 */
async function createDemoShoot(jobId: string, storage: IStorage): Promise<string> {
  console.log(`[Demo Processing] Creating demo shoot for job ${jobId}`);

  // Create shoot
  const shoot = await storage.createShoot(jobId);
  const shootId = shoot.id;

  // Create 8-12 demo images with different room types
  const imageCount = Math.floor(Math.random() * 5) + 8; // 8-12 images
  const roomTypes = ["kitchen", "living_room", "bedroom", "bathroom", "hallway", "exterior"];

  for (let i = 0; i < imageCount; i++) {
    const roomType = roomTypes[i % roomTypes.length];
    const filename = `DEMO_IMG_${String(i + 1).padStart(4, "0")}.CR3`;
    const filePath = `raw/${jobId}/${filename}`;

    await storage.createImage({
      shootId,
      originalFilename: filename,
      filePath,
      fileSize: 25_000_000, // Mock: ~25MB RAW
      mimeType: "image/x-canon-cr3",
    });
  }

  console.log(`[Demo Processing] Created shoot ${shootId} with ${imageCount} demo images`);
  return shootId;
}

/**
 * Task 5: Generate 3000px sRGB Previews (DEMO mode)
 * 
 * In production: ExifReader extracts metadata, Sharp downscales to 3000px sRGB JPG
 * In DEMO: We update previewPath on existing images
 */
async function generatePreviewsDemo(shootId: string, storage: IStorage): Promise<void> {
  console.log(`[Demo Processing] Generating previews for shoot ${shootId}`);

  // Get all images for this shoot
  const images = await storage.getShootImages(shootId);

  // Update each image with a preview path
  for (const image of images) {
    const previewFilename = image.originalFilename.replace(/\.(CR2|CR3|NEF|BRAW|R3D|MXF|TIFF|JPG)$/i, "_preview.jpg");
    const previewPath = `preview/${shootId}/${previewFilename}`;

    await storage.updateImagePreviewPath(image.id, previewPath);
  }

  console.log(`[Demo Processing] Created ${images.length} preview paths`);
}

/**
 * Task 6: Generate AI Captions (DEMO mode)
 * 
 * In production: Replicate Vision API analyzes images and generates German captions
 * In DEMO: We use random pre-defined German captions
 */
async function generateCaptionsDemo(shootId: string, storage: IStorage): Promise<void> {
  console.log(`[Demo Processing] Generating captions for shoot ${shootId}`);

  // Get all images for this shoot
  const images = await storage.getShootImages(shootId);

  // Generate a caption for each image
  for (const image of images) {
    const caption = DEMO_CAPTIONS[Math.floor(Math.random() * DEMO_CAPTIONS.length)];

    await storage.createCaption({
      imageId: image.id,
      captionText: caption,
      language: "de",
      confidence: 95, // Mock confidence (0-100)
    });
  }

  console.log(`[Demo Processing] Created ${images.length} captions`);
}

/**
 * Task 7: Generate Exposé (DEMO mode)
 * 
 * In production: AI analyzes images, extracts features, generates property description
 * In DEMO: We create a mock exposé with random highlights
 */
async function generateExposeDemo(jobId: string, storage: IStorage): Promise<void> {
  console.log(`[Demo Processing] Generating exposé for job ${jobId}`);

  const job = await storage.getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  // Select 3-5 random highlights
  const highlightCount = Math.floor(Math.random() * 3) + 3; // 3-5 highlights
  const selectedHighlights = [...DEMO_EXPOSE_HIGHLIGHTS]
    .sort(() => Math.random() - 0.5)
    .slice(0, highlightCount);

  const summary = `Diese attraktive Immobilie in ${job.propertyAddress} überzeugt durch ihre moderne Ausstattung und hervorragende Lage. ` +
    `Mit ${selectedHighlights.length} besonderen Merkmalen bietet sie ein außergewöhnliches Wohnerlebnis.`;

  await storage.createExpose({
    jobId,
    summary,
    highlights: JSON.stringify(selectedHighlights),
    version: 1,
  });

  console.log(`[Demo Processing] Created exposé with ${highlightCount} highlights`);
}
