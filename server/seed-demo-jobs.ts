import type { IStorage } from "./storage";

export async function seedDemoJobs(storage: IStorage) {
  console.log("[Seed] Starting demo job seed...");
  
  try {
    const existingJobs = await storage.getAllJobs();
    
    if (existingJobs.length > 0) {
      console.log(`[Seed] Found ${existingJobs.length} existing jobs, skipping seed`);
      return;
    }
    
    const demoEmail = "demo@pix.immo";
    let demoUser = await storage.getUserByEmail(demoEmail);
    
    if (!demoUser) {
      demoUser = await storage.createUser(demoEmail, "demo-password-hash", "admin");
      console.log("[Seed] Created demo user:", demoEmail);
    }
    
    const demoJobsData = [
      {
        customerName: "Wagner Immobilien GmbH",
        propertyName: "Moderne Penthouse-Wohnung",
        propertyAddress: "Maximilianstraße 12, 80539 München",
        deadlineAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        deliverGallery: true,
        deliverAlttext: true,
        deliverExpose: true,
      },
      {
        customerName: "Schneider & Partner Makler",
        propertyName: "Einfamilienhaus mit Garten",
        propertyAddress: "Lindenweg 45, 81549 München",
        deadlineAt: Date.now() + 5 * 24 * 60 * 60 * 1000,
        deliverGallery: true,
        deliverAlttext: false,
        deliverExpose: true,
      },
      {
        customerName: "Müller Hausverwaltung",
        propertyName: "Gewerbeimmobilie Innenstadt",
        propertyAddress: "Sendlinger Straße 88, 80331 München",
        deadlineAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
        deliverGallery: true,
        deliverAlttext: true,
        deliverExpose: false,
      },
    ];
    
    for (const jobData of demoJobsData) {
      const job = await storage.createJob(demoUser.id, jobData);
      console.log(`[Seed] Created demo job: ${job.jobNumber} - ${job.propertyName}`);
    }
    
    console.log(`[Seed] Successfully seeded ${demoJobsData.length} demo jobs`);
  } catch (error) {
    console.error("[Seed] Error seeding demo jobs:", error);
  }
}
