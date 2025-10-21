import { z } from "zod";
import { pgTable, varchar, text, bigint, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Drizzle Tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("client"), // 'client' or 'admin'
  credits: bigint("credits", { mode: "number" }).notNull().default(0), // AI processing credits
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyName: varchar("property_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }),
  propertyAddress: text("property_address").notNull(),
  preferredDate: varchar("preferred_date", { length: 50 }),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // 'pending', 'confirmed', 'completed', 'cancelled'
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey(),
  jobNumber: varchar("job_number", { length: 50 }).notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerName: varchar("customer_name", { length: 255 }), // Name of the ordering customer/agency
  propertyName: varchar("property_name", { length: 255 }).notNull(), // Property/listing name
  propertyAddress: text("property_address"), // Property address
  status: varchar("status", { length: 50 }).notNull().default("created"), // Demo: 'uploaded', 'processing', 'captioned', 'expose_ready', 'delivered'
  deadlineAt: bigint("deadline_at", { mode: "number" }), // Optional deadline
  deliverGallery: varchar("deliver_gallery", { length: 10 }).notNull().default("true"),
  deliverAlttext: varchar("deliver_alttext", { length: 10 }).notNull().default("true"),
  deliverExpose: varchar("deliver_expose", { length: 10 }).notNull().default("false"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const shoots = pgTable("shoots", {
  id: varchar("id").primaryKey(),
  shootCode: varchar("shoot_code", { length: 5 }).notNull().unique(),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("initialized"), // 'initialized', 'uploading', 'intake_complete', 'handoff_generated', 'editor_returned', 'processing'
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  intakeCompletedAt: bigint("intake_completed_at", { mode: "number" }),
  handoffGeneratedAt: bigint("handoff_generated_at", { mode: "number" }),
  editorReturnedAt: bigint("editor_returned_at", { mode: "number" }),
});

export const stacks = pgTable("stacks", {
  id: varchar("id").primaryKey(),
  shootId: varchar("shoot_id").notNull().references(() => shoots.id, { onDelete: "cascade" }),
  stackNumber: varchar("stack_number", { length: 10 }).notNull(), // 'g001', 'g002', etc.
  roomType: varchar("room_type", { length: 50 }).notNull().default("undefined_space"),
  frameCount: bigint("frame_count", { mode: "number" }).notNull().default(5), // 3 or 5
  sequenceIndex: bigint("sequence_index", { mode: "number" }).notNull(), // ordering within room_type
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const images = pgTable("images", {
  id: varchar("id").primaryKey(),
  shootId: varchar("shoot_id").notNull().references(() => shoots.id, { onDelete: "cascade" }),
  stackId: varchar("stack_id").references(() => stacks.id, { onDelete: "set null" }),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  renamedFilename: varchar("renamed_filename", { length: 255 }),
  filePath: text("file_path").notNull(), // R2 storage path for RAW
  previewPath: text("preview_path"), // R2 path for 3000px sRGB preview
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: varchar("mime_type", { length: 100 }),
  exifDate: bigint("exif_date", { mode: "number" }),
  exposureValue: varchar("exposure_value", { length: 10 }), // 'e0', 'e-2', 'e+2', etc.
  positionInStack: bigint("position_in_stack", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

// Demo: AI-generated captions for images
export const captions = pgTable("captions", {
  id: varchar("id").primaryKey(),
  imageId: varchar("image_id").notNull().references(() => images.id, { onDelete: "cascade" }),
  captionText: text("caption_text").notNull(), // Alt-text in German
  roomType: varchar("room_type", { length: 50 }), // Detected room type
  confidence: bigint("confidence", { mode: "number" }), // 0-100
  language: varchar("language", { length: 10 }).notNull().default("de"),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

// Demo: AI-generated property exposés
export const exposes = pgTable("exposes", {
  id: varchar("id").primaryKey(),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(), // Short description
  highlights: text("highlights"), // JSON array of highlight strings
  neighborhood: text("neighborhood"), // Optional neighborhood description
  techDetails: text("tech_details"), // Optional technical details
  wordCount: bigint("word_count", { mode: "number" }),
  version: bigint("version", { mode: "number" }).notNull().default(1),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const editorTokens = pgTable("editor_tokens", {
  id: varchar("id").primaryKey(),
  shootId: varchar("shoot_id").notNull().references(() => shoots.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  tokenType: varchar("token_type", { length: 20 }).notNull(), // 'download' or 'upload'
  filePath: text("file_path"), // Optional: specific file path for download tokens
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  usedAt: bigint("used_at", { mode: "number" }),
});

export const editedImages = pgTable("edited_images", {
  id: varchar("id").primaryKey(),
  shootId: varchar("shoot_id").notNull().references(() => shoots.id, { onDelete: "cascade" }),
  stackId: varchar("stack_id").references(() => stacks.id, { onDelete: "set null" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(), // Object storage path
  fileSize: bigint("file_size", { mode: "number" }),
  version: bigint("version", { mode: "number" }).notNull().default(1), // 1, 2, 3 for revision tracking
  roomType: varchar("room_type", { length: 50 }),
  sequenceIndex: bigint("sequence_index", { mode: "number" }), // ordering within room_type
  clientApprovalStatus: varchar("client_approval_status", { length: 20 }).notNull().default("pending"), // 'pending', 'approved', 'rejected'
  revisionNotes: text("revision_notes"),
  aiCaption: text("ai_caption"), // Future: AI-generated caption
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  approvedAt: bigint("approved_at", { mode: "number" }),
  rejectedAt: bigint("rejected_at", { mode: "number" }),
});

export const seoMetadata = pgTable("seo_metadata", {
  id: varchar("id").primaryKey(),
  pagePath: varchar("page_path", { length: 255 }).notNull().unique(), // e.g., '/', '/preise', '/about'
  pageTitle: varchar("page_title", { length: 255 }).notNull(),
  metaDescription: text("meta_description").notNull(),
  ogImage: varchar("og_image", { length: 500 }),
  altText: text("alt_text"), // JSON string for page-specific image alt texts
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: "set null" }),
});

// Personal Access Tokens (PAT) for app authentication
export const personalAccessTokens = pgTable("personal_access_tokens", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(), // SHA-256 hashed token
  name: varchar("name", { length: 100 }), // User-friendly name (e.g., "iPhone App", "iPad")
  scopes: text("scopes").notNull(), // Comma-separated: upload:raw,view:gallery,ai:run,order:read
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  lastUsedAt: bigint("last_used_at", { mode: "number" }),
  lastUsedIp: varchar("last_used_ip", { length: 45 }), // IPv6 compatible
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  revokedAt: bigint("revoked_at", { mode: "number" }),
});

// Upload sessions for resumable multipart uploads
export const uploadSessions = pgTable("upload_sessions", {
  id: varchar("id").primaryKey(), // uploadId
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shootId: varchar("shoot_id").notNull().references(() => shoots.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  roomType: varchar("room_type", { length: 50 }).notNull(),
  stackIndex: bigint("stack_index", { mode: "number" }).notNull(),
  stackCount: bigint("stack_count", { mode: "number" }).notNull(), // 3 or 5
  r2Key: text("r2_key").notNull(), // Full R2 object key
  uploadId: text("upload_id").notNull(), // R2 multipart upload ID
  fileSize: bigint("file_size", { mode: "number" }),
  parts: text("parts"), // JSON array of {partNumber, etag}
  status: varchar("status", { length: 20 }).notNull().default("initiated"), // 'initiated', 'uploading', 'completed', 'failed'
  completedAt: bigint("completed_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

// AI processing jobs
export const aiJobs = pgTable("ai_jobs", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shootId: varchar("shoot_id").notNull().references(() => shoots.id, { onDelete: "cascade" }),
  tool: varchar("tool", { length: 50 }).notNull(), // upscale_x2, denoise, wb_normalize, etc.
  modelSlug: varchar("model_slug", { length: 100 }).notNull(), // replicate:upscale, modal:denoise, etc.
  sourceImageKey: text("source_image_key").notNull(), // deliveries/{shoot_id}/...
  outputImageKey: text("output_image_key"), // deliveries/{shoot_id}/ai/{basename}_v{ver}.jpg
  params: text("params"), // JSON object with tool parameters
  externalJobId: text("external_job_id"), // Replicate/Modal job ID
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  cost: bigint("cost", { mode: "number" }), // Cost in cents
  credits: bigint("credits", { mode: "number" }), // Credits consumed
  errorMessage: text("error_message"),
  webhookReceivedAt: bigint("webhook_received_at", { mode: "number" }),
  completedAt: bigint("completed_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const imageFavorites = pgTable("image_favorites", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  imageId: varchar("image_id").notNull().references(() => editedImages.id, { onDelete: "cascade" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const imageComments = pgTable("image_comments", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  imageId: varchar("image_id").notNull().references(() => editedImages.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  altText: text("alt_text"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey(),
  serviceCode: varchar("service_code", { length: 10 }).notNull().unique(), // F10, D04, V30, etc.
  category: varchar("category", { length: 50 }).notNull(), // 'photography', 'drone', 'video', '360tour', 'staging', 'optimization', 'travel'
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  netPrice: bigint("net_price", { mode: "number" }), // Price in cents (null for "auf Anfrage")
  priceNote: text("price_note"), // "€0.80/km", "je Raumgröße", etc.
  notes: text("notes"),
  isActive: varchar("is_active", { length: 5 }).notNull().default("true"), // 'true' or 'false'
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  region: varchar("region", { length: 3 }).notNull(), // 'HH', 'B', 'EXT'
  kilometers: bigint("kilometers", { mode: "number" }), // Only for region='EXT'
  contactName: varchar("contact_name", { length: 255 }), // Optional
  contactEmail: varchar("contact_email", { length: 255 }), // Optional
  contactMobile: varchar("contact_mobile", { length: 50 }).notNull(), // Required
  propertyName: varchar("property_name", { length: 255 }).notNull(),
  propertyAddress: text("property_address"), // Optional (for cases without Google listing)
  propertyType: varchar("property_type", { length: 100 }), // 'Wohnung', 'Haus', 'Gewerbe'
  preferredDate: varchar("preferred_date", { length: 50 }),
  preferredTime: varchar("preferred_time", { length: 50 }),
  specialRequirements: text("special_requirements"),
  totalNetPrice: bigint("total_net_price", { mode: "number" }).notNull(), // Net price in cents
  vatAmount: bigint("vat_amount", { mode: "number" }).notNull(), // VAT amount in cents (19%)
  grossAmount: bigint("gross_amount", { mode: "number" }).notNull(), // Gross total in cents
  agbAccepted: varchar("agb_accepted", { length: 5 }).notNull().default("false"), // 'true' or 'false'
  status: varchar("status", { length: 50 }).notNull().default("pending"), // 'pending', 'confirmed', 'completed', 'cancelled'
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  confirmedAt: bigint("confirmed_at", { mode: "number" }),
});

export const bookingItems = pgTable("booking_items", {
  id: varchar("id").primaryKey(),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "restrict" }),
  quantity: bigint("quantity", { mode: "number" }).notNull().default(1),
  unitPrice: bigint("unit_price", { mode: "number" }).notNull(), // Price per unit in cents
  totalPrice: bigint("total_price", { mode: "number" }).notNull(), // quantity * unitPrice in cents
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  refreshTokens: many(refreshTokens),
  passwordResetTokens: many(passwordResetTokens),
  personalAccessTokens: many(personalAccessTokens),
  orders: many(orders),
  jobs: many(jobs),
  imageFavorites: many(imageFavorites),
  imageComments: many(imageComments),
  uploadSessions: many(uploadSessions),
  aiJobs: many(aiJobs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
  shoots: many(shoots),
  exposes: many(exposes),
}));

export const shootsRelations = relations(shoots, ({ one, many }) => ({
  job: one(jobs, {
    fields: [shoots.jobId],
    references: [jobs.id],
  }),
  stacks: many(stacks),
  images: many(images),
  editorTokens: many(editorTokens),
  editedImages: many(editedImages),
  uploadSessions: many(uploadSessions),
  aiJobs: many(aiJobs),
}));

export const stacksRelations = relations(stacks, ({ one, many }) => ({
  shoot: one(shoots, {
    fields: [stacks.shootId],
    references: [shoots.id],
  }),
  images: many(images),
  editedImages: many(editedImages),
}));

export const imagesRelations = relations(images, ({ one, many }) => ({
  shoot: one(shoots, {
    fields: [images.shootId],
    references: [shoots.id],
  }),
  stack: one(stacks, {
    fields: [images.stackId],
    references: [stacks.id],
  }),
  captions: many(captions),
}));

export const captionsRelations = relations(captions, ({ one }) => ({
  image: one(images, {
    fields: [captions.imageId],
    references: [images.id],
  }),
}));

export const exposesRelations = relations(exposes, ({ one }) => ({
  job: one(jobs, {
    fields: [exposes.jobId],
    references: [jobs.id],
  }),
}));

export const editorTokensRelations = relations(editorTokens, ({ one }) => ({
  shoot: one(shoots, {
    fields: [editorTokens.shootId],
    references: [shoots.id],
  }),
}));

export const editedImagesRelations = relations(editedImages, ({ one, many }) => ({
  shoot: one(shoots, {
    fields: [editedImages.shootId],
    references: [shoots.id],
  }),
  stack: one(stacks, {
    fields: [editedImages.stackId],
    references: [stacks.id],
  }),
  favorites: many(imageFavorites),
  comments: many(imageComments),
}));

export const imageFavoritesRelations = relations(imageFavorites, ({ one }) => ({
  user: one(users, {
    fields: [imageFavorites.userId],
    references: [users.id],
  }),
  image: one(editedImages, {
    fields: [imageFavorites.imageId],
    references: [editedImages.id],
  }),
}));

export const imageCommentsRelations = relations(imageComments, ({ one }) => ({
  user: one(users, {
    fields: [imageComments.userId],
    references: [users.id],
  }),
  image: one(editedImages, {
    fields: [imageComments.imageId],
    references: [editedImages.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  bookingItems: many(bookingItems),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  service: one(services, {
    fields: [bookingItems.serviceId],
    references: [services.id],
  }),
}));

export const personalAccessTokensRelations = relations(personalAccessTokens, ({ one }) => ({
  user: one(users, {
    fields: [personalAccessTokens.userId],
    references: [users.id],
  }),
}));

export const uploadSessionsRelations = relations(uploadSessions, ({ one }) => ({
  user: one(users, {
    fields: [uploadSessions.userId],
    references: [users.id],
  }),
  shoot: one(shoots, {
    fields: [uploadSessions.shootId],
    references: [shoots.id],
  }),
}));

export const aiJobsRelations = relations(aiJobs, ({ one }) => ({
  user: one(users, {
    fields: [aiJobs.userId],
    references: [users.id],
  }),
  shoot: one(shoots, {
    fields: [aiJobs.shootId],
    references: [shoots.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertRefreshToken = typeof refreshTokens.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;
export type Shoot = typeof shoots.$inferSelect;
export type InsertShoot = typeof shoots.$inferInsert;
export type Stack = typeof stacks.$inferSelect;
export type InsertStack = typeof stacks.$inferInsert;
export type Image = typeof images.$inferSelect;
export type InsertImage = typeof images.$inferInsert;
export type EditorToken = typeof editorTokens.$inferSelect;
export type InsertEditorToken = typeof editorTokens.$inferInsert;
export type EditedImage = typeof editedImages.$inferSelect;
export type InsertEditedImage = typeof editedImages.$inferInsert;
export type SeoMetadata = typeof seoMetadata.$inferSelect;
export type InsertSeoMetadata = typeof seoMetadata.$inferInsert;
export type ImageFavorite = typeof imageFavorites.$inferSelect;
export type InsertImageFavorite = typeof imageFavorites.$inferInsert;
export type ImageComment = typeof imageComments.$inferSelect;
export type InsertImageComment = typeof imageComments.$inferInsert;
export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;
export type BookingItem = typeof bookingItems.$inferSelect;
export type InsertBookingItem = typeof bookingItems.$inferInsert;
export type PersonalAccessToken = typeof personalAccessTokens.$inferSelect;
export type InsertPersonalAccessToken = typeof personalAccessTokens.$inferInsert;
export type UploadSession = typeof uploadSessions.$inferSelect;
export type InsertUploadSession = typeof uploadSessions.$inferInsert;
export type AiJob = typeof aiJobs.$inferSelect;
export type InsertAiJob = typeof aiJobs.$inferInsert;
export type Caption = typeof captions.$inferSelect;
export type InsertCaption = typeof captions.$inferInsert;
export type Expose = typeof exposes.$inferSelect;
export type InsertExpose = typeof exposes.$inferInsert;

// Validation Schemas
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// Validation Helpers
// Postal code check
const germanPostalCodeRegex = /\b\d{5}\b/;

// Phone validation: extract digits and check if valid German number
function isValidGermanPhone(phone: string): boolean {
  if (!phone) return false;
  // Extract only digits
  const digits = phone.replace(/\D/g, '');
  // Check if starts with German prefix and has enough digits
  if (digits.startsWith('49')) {
    return digits.length >= 11 && digits.length <= 15; // +49 + 9-13 digits
  }
  if (digits.startsWith('0')) {
    return digits.length >= 10 && digits.length <= 14; // 0 + 9-13 digits
  }
  return false;
}

export const createOrderSchema = z.object({
  propertyName: z.string().min(1, "Objektname erforderlich"),
  contactName: z.string().min(2, "Kontaktname muss mindestens 2 Zeichen lang sein"),
  contactEmail: z.string().email("Ungültige E-Mail-Adresse"),
  contactPhone: z.string()
    .min(1, "Telefonnummer erforderlich")
    .refine(isValidGermanPhone, "Ungültige Telefonnummer (z.B. +49 170 1234567 oder 0170 1234567)"),
  propertyAddress: z.string()
    .min(10, "Adresse muss mindestens 10 Zeichen lang sein")
    .refine(
      (addr) => germanPostalCodeRegex.test(addr),
      { message: "Adresse muss eine gültige deutsche Postleitzahl (5 Ziffern) enthalten" }
    ),
  preferredDate: z.string().optional(),
  notes: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Workflow Validation Schemas
export const createJobSchema = z.object({
  customerName: z.string().optional(),
  propertyName: z.string().min(1, "Property name is required"),
  propertyAddress: z.string().optional(),
  deadlineAt: z.number().optional(), // Unix timestamp
  deliverGallery: z.boolean().optional().default(true),
  deliverAlttext: z.boolean().optional().default(true),
  deliverExpose: z.boolean().optional().default(false),
});

export const initUploadSchema = z.object({
  jobNumber: z.string().min(1, "Job number is required"),
});

export const presignedUploadSchema = z.object({
  filenames: z.array(z.string().min(1)).min(1).max(50, "Maximum 50 files per request"),
});

export const roomTypeSchema = z.enum([
  "living_room",
  "kitchen",
  "bathroom",
  "bedroom",
  "dining_room",
  "hallway",
  "office",
  "exterior",
  "undefined_space",
]);

export const assignRoomTypeSchema = z.object({
  stackId: z.string().min(1),
  roomType: roomTypeSchema,
});

export const createStackSchema = z.object({
  shootId: z.string().min(1),
  frameCount: z.number().int().min(3).max(5),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type InitUploadInput = z.infer<typeof initUploadSchema>;
export type PresignedUploadInput = z.infer<typeof presignedUploadSchema>;
export type RoomType = z.infer<typeof roomTypeSchema>;
export type AssignRoomTypeInput = z.infer<typeof assignRoomTypeSchema>;
export type CreateStackInput = z.infer<typeof createStackSchema>;

export interface PresignedUrlResponse {
  filename: string;
  uploadUrl: string;
  error?: string;
}

// Booking/Order Validation Schemas
export const createOrderApiSchema = z.object({
  region: z.enum(["HH", "B", "EXT"], { required_error: "Region is required" }),
  kilometers: z.number().int().min(0).optional(),
  contact: z.object({
    name: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    mobile: z.string()
      .min(1, "Mobile number is required")
      .refine(isValidGermanPhone, "Invalid mobile number (e.g. +49 170 1234567 or 0170 1234567)"),
  }),
  propertyName: z.string().min(1, "Property name is required"),
  propertyAddress: z.string()
    .optional()
    .refine(
      (addr) => !addr || addr.length === 0 || addr.length >= 10,
      { message: "Address must be at least 10 characters" }
    )
    .refine(
      (addr) => !addr || addr.length === 0 || germanPostalCodeRegex.test(addr),
      { message: "Address must contain a valid German postal code (5 digits)" }
    ),
  propertyType: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  specialRequirements: z.string().optional(),
  agbAccepted: z.boolean().refine((val) => val === true, {
    message: "AGB must be accepted",
  }),
  items: z.array(
    z.object({
      code: z.string().min(1, "Service code is required"),
      unit: z.enum(["flat", "per_item", "per_km"]),
      qty: z.number().int().min(1),
    })
  ).min(1, "At least one service must be selected"),
}).refine((data) => {
  // If region is EXT, kilometers must be provided and > 0
  if (data.region === "EXT") {
    return data.kilometers !== undefined && data.kilometers > 0;
  }
  return true;
}, {
  message: "Kilometers required for EXT region",
  path: ["kilometers"],
});

export type CreateOrderApiInput = z.infer<typeof createOrderApiSchema>;

// Response types
export interface AuthResponse {
  user: Omit<User, "hashedPassword">;
  session: Session;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  createdAt: number;
}

export interface InitUploadResponse {
  shootId: string;
  shootCode: string;
  jobId: string;
}

export interface HandoffResponse {
  downloadUrl: string;
  uploadToken: string;
  expiresAt: number;
}

// Editorial Management - Internal backlog for blog posts and change requests
export const editorialItems = pgTable("editorial_items", {
  id: varchar("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'blog_post' or 'change_request'
  category: varchar("category", { length: 50 }).notNull(), // 'photo', 'ai', 'marketing', 'infra', 'legal', 'other'
  status: varchar("status", { length: 50 }).notNull().default("idea"), // 'idea', 'queued', 'drafting', 'in_review', 'scheduled', 'published', 'done'
  priority: varchar("priority", { length: 20 }).notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  description: text("description"),
  dueDate: bigint("due_date", { mode: "number" }), // Optional scheduling timestamp
  publishWeek: varchar("publish_week", { length: 10 }), // Optional e.g. '2025-W44'
  assigneeId: varchar("assignee_id").references(() => users.id, { onDelete: "set null" }), // Optional user assignment
  tags: text("tags").array(), // Array of string tags
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  completedAt: bigint("completed_at", { mode: "number" }),
});

export const editorialComments = pgTable("editorial_comments", {
  id: varchar("id").primaryKey(),
  itemId: varchar("item_id").notNull().references(() => editorialItems.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

// Editorial Relations
export const editorialItemsRelations = relations(editorialItems, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [editorialItems.createdBy],
    references: [users.id],
    relationName: "editorialItemsCreatedBy",
  }),
  assignee: one(users, {
    fields: [editorialItems.assigneeId],
    references: [users.id],
    relationName: "editorialItemsAssignee",
  }),
  comments: many(editorialComments),
}));

export const editorialCommentsRelations = relations(editorialComments, ({ one }) => ({
  item: one(editorialItems, {
    fields: [editorialComments.itemId],
    references: [editorialItems.id],
  }),
  user: one(users, {
    fields: [editorialComments.userId],
    references: [users.id],
  }),
}));

// Editorial Types
export type EditorialItem = typeof editorialItems.$inferSelect;
export type EditorialComment = typeof editorialComments.$inferSelect;

// Insert Schemas
export const insertEditorialItemSchema = createInsertSchema(editorialItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertEditorialCommentSchema = createInsertSchema(editorialComments).omit({
  id: true,
  createdAt: true,
});

export type InsertEditorialItem = z.infer<typeof insertEditorialItemSchema>;
export type InsertEditorialComment = z.infer<typeof insertEditorialCommentSchema>;

// Demo Phase - Job/Caption/Expose Schemas
export const createDemoJobSchema = z.object({
  customer: z.string().min(1, "Customer name is required"),
  address: z.string().min(1, "Address is required"),
  shootCode: z.string().length(5, "Shoot code must be 5 characters").regex(/^[a-z0-9]{5}$/, "Shoot code must be lowercase alphanumeric"),
  deadlineAt: z.number().optional(),
  deliverGallery: z.boolean().optional().default(true),
  deliverAlttext: z.boolean().optional().default(true),
  deliverExpose: z.boolean().optional().default(false),
});

export const insertCaptionSchema = createInsertSchema(captions).omit({
  id: true,
  createdAt: true,
});

export const insertExposeSchema = createInsertSchema(exposes).omit({
  id: true,
  createdAt: true,
});

export type CreateDemoJobInput = z.infer<typeof createDemoJobSchema>;
export type InsertCaptionInput = z.infer<typeof insertCaptionSchema>;
export type InsertExposeInput = z.infer<typeof insertExposeSchema>;
