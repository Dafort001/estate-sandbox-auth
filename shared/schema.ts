import { z } from "zod";
import { pgTable, varchar, text, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Drizzle Tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("client"), // 'client' or 'admin'
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
  propertyName: varchar("property_name", { length: 255 }).notNull(),
  propertyAddress: text("property_address"),
  status: varchar("status", { length: 50 }).notNull().default("created"), // 'created', 'in_progress', 'edited_returned', 'completed'
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
  filePath: text("file_path").notNull(), // R2 storage path
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: varchar("mime_type", { length: 100 }),
  exifDate: bigint("exif_date", { mode: "number" }),
  exposureValue: varchar("exposure_value", { length: 10 }), // 'e0', 'e-2', 'e+2', etc.
  positionInStack: bigint("position_in_stack", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const editorTokens = pgTable("editor_tokens", {
  id: varchar("id").primaryKey(),
  shootId: varchar("shoot_id").notNull().references(() => shoots.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  tokenType: varchar("token_type", { length: 20 }).notNull(), // 'download' or 'upload'
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  usedAt: bigint("used_at", { mode: "number" }),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  refreshTokens: many(refreshTokens),
  passwordResetTokens: many(passwordResetTokens),
  orders: many(orders),
  jobs: many(jobs),
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
}));

export const shootsRelations = relations(shoots, ({ one, many }) => ({
  job: one(jobs, {
    fields: [shoots.jobId],
    references: [jobs.id],
  }),
  stacks: many(stacks),
  images: many(images),
  editorTokens: many(editorTokens),
}));

export const stacksRelations = relations(stacks, ({ one, many }) => ({
  shoot: one(shoots, {
    fields: [stacks.shootId],
    references: [shoots.id],
  }),
  images: many(images),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  shoot: one(shoots, {
    fields: [images.shootId],
    references: [shoots.id],
  }),
  stack: one(stacks, {
    fields: [images.stackId],
    references: [stacks.id],
  }),
}));

export const editorTokensRelations = relations(editorTokens, ({ one }) => ({
  shoot: one(shoots, {
    fields: [editorTokens.shootId],
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

export const createOrderSchema = z.object({
  propertyName: z.string().min(1, "Property name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().optional(),
  propertyAddress: z.string().min(1, "Property address is required"),
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
  propertyName: z.string().min(1, "Property name is required"),
  propertyAddress: z.string().optional(),
});

export const initUploadSchema = z.object({
  jobNumber: z.string().min(1, "Job number is required"),
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
export type RoomType = z.infer<typeof roomTypeSchema>;
export type AssignRoomTypeInput = z.infer<typeof assignRoomTypeSchema>;
export type CreateStackInput = z.infer<typeof createStackSchema>;

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
