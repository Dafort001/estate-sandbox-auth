import { users, sessions, refreshTokens, passwordResetTokens, orders, jobs, shoots, stacks, images, editorTokens, editedImages, services, bookings, bookingItems, imageFavorites, imageComments, editorialItems, editorialComments, seoMetadata, personalAccessTokens, uploadSessions, aiJobs, captions, exposes, type User, type Session, type RefreshToken, type PasswordResetToken, type Order, type Job, type Shoot, type Stack, type Image, type EditorToken, type EditedImage, type Service, type Booking, type BookingItem, type ImageFavorite, type ImageComment, type EditorialItem, type EditorialComment, type SeoMetadata, type PersonalAccessToken, type UploadSession, type AiJob, type Caption, type Expose } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Initialization
  ready(): Promise<void>;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(email: string, hashedPassword: string, role?: string): Promise<User>;
  
  // Session operations
  getSession(id: string): Promise<Session | undefined>;
  createSession(userId: string, expiresAt: number): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;
  
  // Refresh token operations
  getRefreshToken(token: string): Promise<RefreshToken | undefined>;
  createRefreshToken(id: string, userId: string, token: string, expiresAt: number): Promise<RefreshToken>;
  deleteRefreshToken(token: string): Promise<void>;
  deleteUserRefreshTokens(userId: string): Promise<void>;
  
  // Password reset token operations
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  createPasswordResetToken(id: string, userId: string, token: string, expiresAt: number): Promise<PasswordResetToken>;
  deletePasswordResetToken(token: string): Promise<void>;
  deleteUserPasswordResetTokens(userId: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  
  // Order operations
  createOrder(userId: string, orderData: {
    propertyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    propertyAddress: string;
    preferredDate?: string;
    notes?: string;
  }): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getUserOrders(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<void>;
  
  // Workflow operations - Jobs
  createJob(userId: string, data: {
    customerName?: string;
    propertyName: string;
    propertyAddress?: string;
    deadlineAt?: number;
    deliverGallery?: boolean;
    deliverAlttext?: boolean;
    deliverExpose?: boolean;
  }): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  getJobByNumber(jobNumber: string): Promise<Job | undefined>;
  getUserJobs(userId: string): Promise<Job[]>;
  getAllJobs(): Promise<Job[]>;
  updateJobStatus(id: string, status: string): Promise<void>;
  
  // Workflow operations - Shoots
  createShoot(jobId: string): Promise<Shoot>;
  getShoot(id: string): Promise<Shoot | undefined>;
  getShootByCode(shootCode: string): Promise<Shoot | undefined>;
  getJobShoots(jobId: string): Promise<Shoot[]>;
  getActiveShootForJob(jobId: string): Promise<Shoot | undefined>;
  updateShootStatus(id: string, status: string, timestampField?: string): Promise<void>;
  
  // Workflow operations - Stacks
  createStack(shootId: string, stackNumber: string, frameCount: number, roomType: string): Promise<Stack>;
  getStack(id: string): Promise<Stack | undefined>;
  getShootStacks(shootId: string): Promise<Stack[]>;
  updateStackRoomType(id: string, roomType: string): Promise<void>;
  updateStackFrameCount(id: string, frameCount: number): Promise<void>;
  getNextSequenceIndexForRoom(shootId: string, roomType: string): Promise<number>;
  
  // Workflow operations - Images
  createImage(data: {
    shootId: string;
    stackId?: string;
    originalFilename: string;
    renamedFilename?: string;
    filePath: string;
    fileSize?: number;
    mimeType?: string;
    exifDate?: number;
    exposureValue?: string;
    positionInStack?: number;
  }): Promise<Image>;
  getImage(id: string): Promise<Image | undefined>;
  getShootImages(shootId: string): Promise<Image[]>;
  getStackImages(stackId: string): Promise<Image[]>;
  updateImageRenamedFilename(id: string, renamedFilename: string): Promise<void>;
  
  // Workflow operations - Editor Tokens
  createEditorToken(shootId: string, tokenType: 'download' | 'upload', token: string, expiresAt: number, filePath?: string): Promise<EditorToken>;
  getEditorToken(token: string): Promise<EditorToken | undefined>;
  markEditorTokenUsed(token: string): Promise<void>;
  
  // Workflow operations - Edited Images
  createEditedImage(data: {
    id: string;
    shootId: string;
    stackId?: string | null;
    filename: string;
    filePath: string;
    fileSize?: number;
    version: number;
    roomType?: string;
    sequenceIndex?: number;
    clientApprovalStatus?: string;
    createdAt: number;
  }): Promise<any>;
  getEditedImage(id: string): Promise<any | undefined>;
  getEditedImagesByShoot(shootId: string): Promise<any[]>;
  getStacksByShoot(shootId: string): Promise<Stack[]>;
  updateEditedImageApprovalStatus(id: string, status: string, timestampField?: string): Promise<void>;
  
  // Service operations
  getAllServices(): Promise<Service[]>;
  
  // Booking operations
  createBooking(userId: string, bookingData: {
    region: string;
    kilometers?: number;
    contactName?: string;
    contactEmail?: string;
    contactMobile: string;
    propertyName: string;
    propertyAddress?: string;
    propertyType?: string;
    preferredDate?: string;
    preferredTime?: string;
    specialRequirements?: string;
    totalNetPrice: number;
    vatAmount: number;
    grossAmount: number;
    agbAccepted: boolean;
    serviceSelections: Record<string, number>;
  }): Promise<{ booking: Booking; items: BookingItem[] }>;
  getBooking(id: string): Promise<Booking | undefined>;
  getUserBookings(userId: string): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  
  // Client gallery operations
  getClientGallery(userId: string): Promise<any[]>;
  
  // Image favorites operations
  toggleFavorite(userId: string, imageId: string): Promise<{ favorited: boolean }>;
  getUserFavorites(userId: string): Promise<string[]>; // Returns array of favorited image IDs
  getImageFavoriteCount(imageId: string): Promise<number>;
  
  // Image comments operations
  addComment(userId: string, imageId: string, comment: string, altText?: string): Promise<any>;
  getImageComments(imageId: string): Promise<any[]>;
  
  // Editorial management operations
  getEditorialItems(): Promise<EditorialItem[]>;
  createEditorialItem(data: {
    title: string;
    type: string;
    category: string;
    status?: string;
    priority?: string;
    description?: string;
    dueDate?: number;
    publishWeek?: string;
    assigneeId?: string;
    tags?: string[];
    createdBy: string;
  }): Promise<EditorialItem>;
  updateEditorialItem(id: string, data: Partial<EditorialItem>): Promise<EditorialItem | undefined>;
  deleteEditorialItem(id: string): Promise<void>;
  createEditorialComment(data: { itemId: string; userId: string; comment: string }): Promise<EditorialComment>;
  getEditorialComments(itemId: string): Promise<EditorialComment[]>;
  
  // SEO metadata operations
  getAllSeoMetadata(): Promise<SeoMetadata[]>;
  getSeoMetadata(pagePath: string): Promise<SeoMetadata | undefined>;
  upsertSeoMetadata(data: {
    pagePath: string;
    pageTitle: string;
    metaDescription: string;
    ogImage?: string;
    altText?: string;
    updatedBy: string;
  }): Promise<SeoMetadata>;
  deleteSeoMetadata(pagePath: string): Promise<void>;

  // Personal Access Token operations
  createPersonalAccessToken(data: {
    userId: string;
    token: string;
    name?: string;
    scopes: string;
    expiresAt: number;
  }): Promise<import("@shared/schema").PersonalAccessToken>;
  getUserPersonalAccessTokens(userId: string): Promise<import("@shared/schema").PersonalAccessToken[]>;
  revokePersonalAccessToken(id: string): Promise<void>;
  deletePersonalAccessToken(id: string): Promise<void>;

  // Upload session operations
  createUploadSession(data: {
    id: string;
    userId: string;
    shootId: string;
    filename: string;
    roomType: string;
    stackIndex: number;
    stackCount: number;
    r2Key: string;
    uploadId: string;
    fileSize?: number;
  }): Promise<import("@shared/schema").UploadSession>;
  getUploadSession(id: string): Promise<import("@shared/schema").UploadSession | undefined>;
  updateUploadSessionParts(id: string, parts: string): Promise<void>;
  completeUploadSession(id: string): Promise<void>;
  failUploadSession(id: string): Promise<void>;
  getUserUploadSessions(userId: string): Promise<import("@shared/schema").UploadSession[]>;

  // AI job operations
  createAIJob(data: {
    userId: string;
    shootId: string;
    tool: string;
    modelSlug: string;
    sourceImageKey: string;
    params?: string;
    externalJobId?: string;
  }): Promise<import("@shared/schema").AiJob>;
  getAIJob(id: string): Promise<import("@shared/schema").AiJob | undefined>;
  getAIJobByExternalId(externalJobId: string): Promise<import("@shared/schema").AiJob | undefined>;
  updateAIJobStatus(id: string, status: string, errorMessage?: string): Promise<void>;
  completeAIJob(id: string, outputImageKey: string, cost: number, credits: number): Promise<void>;
  getUserAIJobs(userId: string): Promise<import("@shared/schema").AiJob[]>;
  getShootAIJobs(shootId: string): Promise<import("@shared/schema").AiJob[]>;

  // Demo: Caption operations
  createCaption(data: {
    imageId: string;
    captionText: string;
    roomType?: string;
    confidence?: number;
    language?: string;
    version?: number;
  }): Promise<Caption>;
  getImageCaptions(imageId: string): Promise<Caption[]>;
  getJobCaptions(jobId: string): Promise<Caption[]>;

  // Demo: Expose operations
  createExpose(data: {
    jobId: string;
    summary: string;
    highlights?: string;
    neighborhood?: string;
    techDetails?: string;
    wordCount?: number;
    version?: number;
  }): Promise<Expose>;
  getJobExpose(jobId: string): Promise<Expose | undefined>;

  // Demo: Update image preview path
  updateImagePreviewPath(id: string, previewPath: string): Promise<void>;

  // Demo: Extended job operations
  updateJobDeadline(id: string, deadlineAt: number): Promise<void>;
  updateJobDeliverables(id: string, deliverGallery: boolean, deliverAlttext: boolean, deliverExpose: boolean): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async ready(): Promise<void> {
    // Database connection is established in db.ts
    // No initialization needed
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Normalize email to lowercase for case-insensitive lookup
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }

  async createUser(email: string, hashedPassword: string, role: string = "client"): Promise<User> {
    const id = randomUUID();
    const [user] = await db
      .insert(users)
      .values({
        id,
        email: email.toLowerCase(), // Store email in lowercase
        hashedPassword,
        role,
        createdAt: Date.now(),
      })
      .returning();
    return user;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    
    // Remove expired sessions
    if (session && session.expiresAt < Date.now()) {
      await this.deleteSession(id);
      return undefined;
    }
    
    return session || undefined;
  }

  async createSession(userId: string, expiresAt: number): Promise<Session> {
    const id = randomUUID();
    const [session] = await db
      .insert(sessions)
      .values({
        id,
        userId,
        expiresAt,
      })
      .returning();
    return session;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async getRefreshToken(token: string): Promise<RefreshToken | undefined> {
    const [refreshToken] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
    
    // Remove expired tokens
    if (refreshToken && refreshToken.expiresAt < Date.now()) {
      await this.deleteRefreshToken(token);
      return undefined;
    }
    
    return refreshToken || undefined;
  }

  async createRefreshToken(id: string, userId: string, token: string, expiresAt: number): Promise<RefreshToken> {
    const [refreshToken] = await db
      .insert(refreshTokens)
      .values({
        id,
        userId,
        token,
        expiresAt,
        createdAt: Date.now(),
      })
      .returning();
    return refreshToken;
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }

  async deleteUserRefreshTokens(userId: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    
    // Remove expired tokens
    if (resetToken && resetToken.expiresAt < Date.now()) {
      await this.deletePasswordResetToken(token);
      return undefined;
    }
    
    return resetToken || undefined;
  }

  async createPasswordResetToken(id: string, userId: string, token: string, expiresAt: number): Promise<PasswordResetToken> {
    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values({
        id,
        userId,
        token,
        expiresAt,
        createdAt: Date.now(),
      })
      .returning();
    return resetToken;
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
  }

  async deleteUserPasswordResetTokens(userId: string): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ hashedPassword }).where(eq(users.id, userId));
  }

  async createOrder(userId: string, orderData: {
    propertyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    propertyAddress: string;
    preferredDate?: string;
    notes?: string;
  }): Promise<Order> {
    const id = randomUUID();
    const [order] = await db
      .insert(orders)
      .values({
        id,
        userId,
        propertyName: orderData.propertyName,
        contactName: orderData.contactName,
        contactEmail: orderData.contactEmail,
        contactPhone: orderData.contactPhone,
        propertyAddress: orderData.propertyAddress,
        preferredDate: orderData.preferredDate,
        notes: orderData.notes,
        createdAt: Date.now(),
      })
      .returning();
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    await db.update(orders).set({ status }).where(eq(orders.id, id));
  }

  // Job operations
  async createJob(userId: string, data: {
    customerName?: string;
    propertyName: string;
    propertyAddress?: string;
    deadlineAt?: number;
    deliverGallery?: boolean;
    deliverAlttext?: boolean;
    deliverExpose?: boolean;
  }): Promise<Job> {
    const id = randomUUID();
    const jobNumber = `PIX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const [job] = await db
      .insert(jobs)
      .values({
        id,
        jobNumber,
        userId,
        customerName: data.customerName,
        propertyName: data.propertyName,
        propertyAddress: data.propertyAddress,
        deadlineAt: data.deadlineAt,
        deliverGallery: data.deliverGallery !== undefined ? (data.deliverGallery ? "true" : "false") : "true",
        deliverAlttext: data.deliverAlttext !== undefined ? (data.deliverAlttext ? "true" : "false") : "true",
        deliverExpose: data.deliverExpose !== undefined ? (data.deliverExpose ? "true" : "false") : "false",
        createdAt: Date.now(),
      })
      .returning();
    return job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async getJobByNumber(jobNumber: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.jobNumber, jobNumber));
    return job || undefined;
  }

  async getUserJobs(userId: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.userId, userId)).orderBy(desc(jobs.createdAt));
  }

  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async updateJobStatus(id: string, status: string): Promise<void> {
    await db.update(jobs).set({ status }).where(eq(jobs.id, id));
  }

  // Shoot operations
  async createShoot(jobId: string): Promise<Shoot> {
    const id = randomUUID();
    const shootCode = id.substring(0, 5).toLowerCase();
    const [shoot] = await db
      .insert(shoots)
      .values({
        id,
        shootCode,
        jobId,
        createdAt: Date.now(),
      })
      .returning();
    return shoot;
  }

  async getShoot(id: string): Promise<Shoot | undefined> {
    const [shoot] = await db.select().from(shoots).where(eq(shoots.id, id));
    return shoot || undefined;
  }

  async getShootByCode(shootCode: string): Promise<Shoot | undefined> {
    const [shoot] = await db.select().from(shoots).where(eq(shoots.shootCode, shootCode));
    return shoot || undefined;
  }

  async getJobShoots(jobId: string): Promise<Shoot[]> {
    return await db.select().from(shoots).where(eq(shoots.jobId, jobId)).orderBy(desc(shoots.createdAt));
  }

  async getActiveShootForJob(jobId: string): Promise<Shoot | undefined> {
    const [shoot] = await db
      .select()
      .from(shoots)
      .where(
        and(
          eq(shoots.jobId, jobId),
          eq(shoots.status, 'initialized')
        )
      )
      .orderBy(desc(shoots.createdAt))
      .limit(1);
    return shoot || undefined;
  }

  async updateShootStatus(id: string, status: string, timestampField?: string): Promise<void> {
    const updateData: any = { status };
    if (timestampField) {
      updateData[timestampField] = Date.now();
    }
    await db.update(shoots).set(updateData).where(eq(shoots.id, id));
  }

  // Stack operations
  async createStack(
    shootId: string, 
    stackNumber: string, 
    frameCount: number, 
    roomType: string,
    sequenceIndex?: number
  ): Promise<Stack> {
    const id = randomUUID();
    const finalSequenceIndex = sequenceIndex !== undefined 
      ? sequenceIndex 
      : await this.getNextSequenceIndexForRoom(shootId, roomType);
    const [stack] = await db
      .insert(stacks)
      .values({
        id,
        shootId,
        stackNumber,
        roomType,
        frameCount,
        sequenceIndex: finalSequenceIndex,
        createdAt: Date.now(),
      })
      .returning();
    return stack;
  }

  async getStack(id: string): Promise<Stack | undefined> {
    const [stack] = await db.select().from(stacks).where(eq(stacks.id, id));
    return stack || undefined;
  }

  async getShootStacks(shootId: string): Promise<Stack[]> {
    return await db.select().from(stacks).where(eq(stacks.shootId, shootId));
  }

  async updateStackRoomType(id: string, roomType: string): Promise<void> {
    // Get the stack to find its shootId
    const stack = await this.getStack(id);
    if (!stack) {
      throw new Error("Stack not found");
    }
    
    // Get the new sequence index for the new room type
    const newSequenceIndex = await this.getNextSequenceIndexForRoom(stack.shootId, roomType);
    
    // Update room type and sequence index together
    await db.update(stacks).set({ 
      roomType, 
      sequenceIndex: newSequenceIndex 
    }).where(eq(stacks.id, id));
  }

  async updateStackFrameCount(id: string, frameCount: number): Promise<void> {
    await db.update(stacks).set({ frameCount }).where(eq(stacks.id, id));
  }

  async getNextSequenceIndexForRoom(shootId: string, roomType: string): Promise<number> {
    const existingStacks = await db
      .select()
      .from(stacks)
      .where(and(eq(stacks.shootId, shootId), eq(stacks.roomType, roomType)));
    return existingStacks.length + 1;
  }

  // Image operations
  async createImage(data: {
    shootId: string;
    stackId?: string;
    originalFilename: string;
    renamedFilename?: string;
    filePath: string;
    fileSize?: number;
    mimeType?: string;
    exifDate?: number;
    exposureValue?: string;
    positionInStack?: number;
  }): Promise<Image> {
    const id = randomUUID();
    const [image] = await db
      .insert(images)
      .values({
        id,
        shootId: data.shootId,
        stackId: data.stackId,
        originalFilename: data.originalFilename,
        renamedFilename: data.renamedFilename,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        exifDate: data.exifDate,
        exposureValue: data.exposureValue,
        positionInStack: data.positionInStack,
        createdAt: Date.now(),
      })
      .returning();
    return image;
  }

  async getImage(id: string): Promise<Image | undefined> {
    const [image] = await db.select().from(images).where(eq(images.id, id));
    return image || undefined;
  }

  async getShootImages(shootId: string): Promise<Image[]> {
    return await db.select().from(images).where(eq(images.shootId, shootId));
  }

  async getStackImages(stackId: string): Promise<Image[]> {
    return await db.select().from(images).where(eq(images.stackId, stackId));
  }

  async updateImageRenamedFilename(id: string, renamedFilename: string): Promise<void> {
    await db.update(images).set({ renamedFilename }).where(eq(images.id, id));
  }

  // Editor Token operations
  async createEditorToken(shootId: string, tokenType: 'download' | 'upload', token: string, expiresAt: number, filePath?: string): Promise<EditorToken> {
    const id = randomUUID();
    const [editorToken] = await db
      .insert(editorTokens)
      .values({
        id,
        shootId,
        token,
        tokenType,
        filePath: filePath || null,
        expiresAt,
        createdAt: Date.now(),
      })
      .returning();
    return editorToken;
  }

  async getEditorToken(token: string): Promise<EditorToken | undefined> {
    const [editorToken] = await db.select().from(editorTokens).where(eq(editorTokens.token, token));
    
    // Remove expired tokens
    if (editorToken && editorToken.expiresAt < Date.now()) {
      return undefined;
    }
    
    return editorToken || undefined;
  }

  async markEditorTokenUsed(token: string): Promise<void> {
    await db.update(editorTokens).set({ usedAt: Date.now() }).where(eq(editorTokens.token, token));
  }

  // Edited Image operations
  async createEditedImage(data: {
    id: string;
    shootId: string;
    stackId?: string | null;
    filename: string;
    filePath: string;
    fileSize?: number;
    version: number;
    roomType?: string;
    sequenceIndex?: number;
    clientApprovalStatus?: string;
    createdAt: number;
  }): Promise<EditedImage> {
    const [editedImage] = await db
      .insert(editedImages)
      .values({
        id: data.id,
        shootId: data.shootId,
        stackId: data.stackId || null,
        filename: data.filename,
        filePath: data.filePath,
        fileSize: data.fileSize,
        version: data.version,
        roomType: data.roomType,
        sequenceIndex: data.sequenceIndex,
        clientApprovalStatus: data.clientApprovalStatus || 'pending',
        createdAt: data.createdAt,
      })
      .returning();
    return editedImage;
  }

  async getEditedImage(id: string): Promise<EditedImage | undefined> {
    const [editedImage] = await db.select().from(editedImages).where(eq(editedImages.id, id));
    return editedImage || undefined;
  }

  async getEditedImagesByShoot(shootId: string): Promise<EditedImage[]> {
    return await db.select().from(editedImages).where(eq(editedImages.shootId, shootId)).orderBy(desc(editedImages.createdAt));
  }

  async getStacksByShoot(shootId: string): Promise<Stack[]> {
    return await db.select().from(stacks).where(eq(stacks.shootId, shootId));
  }

  async updateEditedImageApprovalStatus(id: string, status: string, timestampField?: string): Promise<void> {
    const updates: Record<string, any> = { clientApprovalStatus: status };
    if (timestampField) {
      updates[timestampField] = Date.now();
    }
    await db.update(editedImages).set(updates).where(eq(editedImages.id, id));
  }

  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, "true")).orderBy(services.serviceCode);
  }

  async createBooking(userId: string, bookingData: {
    region: string;
    kilometers?: number;
    contactName?: string;
    contactEmail?: string;
    contactMobile: string;
    propertyName: string;
    propertyAddress?: string;
    propertyType?: string;
    preferredDate?: string;
    preferredTime?: string;
    specialRequirements?: string;
    totalNetPrice: number;
    vatAmount: number;
    grossAmount: number;
    agbAccepted: boolean;
    serviceSelections: Record<string, number>;
  }): Promise<{ booking: Booking; items: BookingItem[] }> {
    const bookingId = randomUUID();
    const timestamp = Date.now();

    const [booking] = await db
      .insert(bookings)
      .values({
        id: bookingId,
        userId,
        region: bookingData.region,
        kilometers: bookingData.kilometers || null,
        contactName: bookingData.contactName || null,
        contactEmail: bookingData.contactEmail || null,
        contactMobile: bookingData.contactMobile,
        propertyName: bookingData.propertyName,
        propertyAddress: bookingData.propertyAddress || null,
        propertyType: bookingData.propertyType || null,
        preferredDate: bookingData.preferredDate || null,
        preferredTime: bookingData.preferredTime || null,
        specialRequirements: bookingData.specialRequirements || null,
        totalNetPrice: bookingData.totalNetPrice,
        vatAmount: bookingData.vatAmount,
        grossAmount: bookingData.grossAmount,
        agbAccepted: bookingData.agbAccepted ? "true" : "false",
        status: "pending",
        createdAt: timestamp,
      })
      .returning();

    const items: BookingItem[] = [];
    
    for (const [serviceId, quantity] of Object.entries(bookingData.serviceSelections)) {
      if (quantity > 0) {
        const service = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
        if (service.length > 0 && service[0].netPrice) {
          const unitPrice = service[0].netPrice;
          const totalPrice = unitPrice * quantity;
          
          const [item] = await db
            .insert(bookingItems)
            .values({
              id: randomUUID(),
              bookingId,
              serviceId,
              quantity,
              unitPrice,
              totalPrice,
              createdAt: timestamp,
            })
            .returning();
          
          items.push(item);
        }
      }
    }

    return { booking, items };
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getClientGallery(userId: string): Promise<any[]> {
    // Get all jobs for this user
    const userJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.userId, userId))
      .orderBy(desc(jobs.createdAt));

    const galleryData = [];

    for (const job of userJobs) {
      // Get all shoots for this job
      const jobShoots = await db
        .select()
        .from(shoots)
        .where(eq(shoots.jobId, job.id))
        .orderBy(shoots.createdAt);

      const shootsWithImages = [];

      for (const shoot of jobShoots) {
        // Get all approved edited images for this shoot
        const approvedImages = await db
          .select()
          .from(editedImages)
          .where(
            and(
              eq(editedImages.shootId, shoot.id),
              eq(editedImages.clientApprovalStatus, "approved")
            )
          )
          .orderBy(editedImages.roomType, editedImages.sequenceIndex);

        if (approvedImages.length > 0) {
          shootsWithImages.push({
            ...shoot,
            images: approvedImages,
          });
        }
      }

      if (shootsWithImages.length > 0) {
        galleryData.push({
          ...job,
          shoots: shootsWithImages,
        });
      }
    }

    return galleryData;
  }

  async toggleFavorite(userId: string, imageId: string): Promise<{ favorited: boolean }> {
    // Check if favorite already exists
    const [existing] = await db
      .select()
      .from(imageFavorites)
      .where(
        and(
          eq(imageFavorites.userId, userId),
          eq(imageFavorites.imageId, imageId)
        )
      );

    if (existing) {
      // Remove favorite
      await db
        .delete(imageFavorites)
        .where(
          and(
            eq(imageFavorites.userId, userId),
            eq(imageFavorites.imageId, imageId)
          )
        );
      return { favorited: false };
    } else {
      // Add favorite
      await db.insert(imageFavorites).values({
        id: randomUUID(),
        userId,
        imageId,
        createdAt: Date.now(),
      });
      return { favorited: true };
    }
  }

  async getUserFavorites(userId: string): Promise<string[]> {
    const favorites = await db
      .select()
      .from(imageFavorites)
      .where(eq(imageFavorites.userId, userId));
    
    return favorites.map(f => f.imageId);
  }

  async getImageFavoriteCount(imageId: string): Promise<number> {
    const favorites = await db
      .select()
      .from(imageFavorites)
      .where(eq(imageFavorites.imageId, imageId));
    
    return favorites.length;
  }

  async addComment(userId: string, imageId: string, comment: string, altText?: string): Promise<ImageComment> {
    const [newComment] = await db
      .insert(imageComments)
      .values({
        id: randomUUID(),
        userId,
        imageId,
        comment,
        altText: altText || null,
        createdAt: Date.now(),
      })
      .returning();
    
    return newComment;
  }

  async getImageComments(imageId: string): Promise<any[]> {
    const comments = await db
      .select({
        id: imageComments.id,
        comment: imageComments.comment,
        altText: imageComments.altText,
        createdAt: imageComments.createdAt,
        userId: imageComments.userId,
        userEmail: users.email,
      })
      .from(imageComments)
      .leftJoin(users, eq(imageComments.userId, users.id))
      .where(eq(imageComments.imageId, imageId))
      .orderBy(imageComments.createdAt);
    
    return comments;
  }

  // Editorial management operations
  async getEditorialItems(): Promise<EditorialItem[]> {
    const items = await db
      .select()
      .from(editorialItems)
      .orderBy(desc(editorialItems.createdAt));
    
    return items;
  }

  async createEditorialItem(data: {
    title: string;
    type: string;
    category: string;
    status?: string;
    priority?: string;
    description?: string;
    dueDate?: number;
    publishWeek?: string;
    assigneeId?: string;
    tags?: string[];
    createdBy: string;
  }): Promise<EditorialItem> {
    const id = randomUUID();
    const now = Date.now();
    
    const [item] = await db
      .insert(editorialItems)
      .values({
        id,
        title: data.title,
        type: data.type,
        category: data.category,
        status: data.status || 'idea',
        priority: data.priority || 'normal',
        description: data.description || null,
        dueDate: data.dueDate || null,
        publishWeek: data.publishWeek || null,
        assigneeId: data.assigneeId || null,
        tags: data.tags || null,
        createdBy: data.createdBy,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      })
      .returning();
    
    return item;
  }

  async updateEditorialItem(id: string, data: Partial<EditorialItem>): Promise<EditorialItem | undefined> {
    const [item] = await db
      .update(editorialItems)
      .set({
        ...data,
        updatedAt: Date.now(),
        // Set completedAt when status becomes 'done' or 'published'
        completedAt: (data.status === 'done' || data.status === 'published') && !data.completedAt 
          ? Date.now() 
          : data.completedAt,
      })
      .where(eq(editorialItems.id, id))
      .returning();
    
    return item || undefined;
  }

  async deleteEditorialItem(id: string): Promise<void> {
    await db.delete(editorialItems).where(eq(editorialItems.id, id));
  }

  async createEditorialComment(data: { itemId: string; userId: string; comment: string }): Promise<EditorialComment> {
    const [comment] = await db
      .insert(editorialComments)
      .values({
        id: randomUUID(),
        itemId: data.itemId,
        userId: data.userId,
        comment: data.comment,
        createdAt: Date.now(),
      })
      .returning();
    
    return comment;
  }

  async getEditorialComments(itemId: string): Promise<EditorialComment[]> {
    const comments = await db
      .select()
      .from(editorialComments)
      .where(eq(editorialComments.itemId, itemId))
      .orderBy(editorialComments.createdAt);
    
    return comments;
  }

  // SEO metadata operations
  async getAllSeoMetadata(): Promise<SeoMetadata[]> {
    const metadata = await db
      .select()
      .from(seoMetadata)
      .orderBy(seoMetadata.pagePath);
    
    return metadata;
  }

  async getSeoMetadata(pagePath: string): Promise<SeoMetadata | undefined> {
    const [metadata] = await db
      .select()
      .from(seoMetadata)
      .where(eq(seoMetadata.pagePath, pagePath));
    
    return metadata || undefined;
  }

  async upsertSeoMetadata(data: {
    pagePath: string;
    pageTitle: string;
    metaDescription: string;
    ogImage?: string;
    altText?: string;
    updatedBy: string;
  }): Promise<SeoMetadata> {
    const now = Date.now();
    const existing = await this.getSeoMetadata(data.pagePath);

    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(seoMetadata)
        .set({
          pageTitle: data.pageTitle,
          metaDescription: data.metaDescription,
          ogImage: data.ogImage || null,
          altText: data.altText || null,
          updatedAt: now,
          updatedBy: data.updatedBy,
        })
        .where(eq(seoMetadata.pagePath, data.pagePath))
        .returning();
      
      return updated;
    } else {
      // Insert new record
      const [inserted] = await db
        .insert(seoMetadata)
        .values({
          id: randomUUID(),
          pagePath: data.pagePath,
          pageTitle: data.pageTitle,
          metaDescription: data.metaDescription,
          ogImage: data.ogImage || null,
          altText: data.altText || null,
          updatedAt: now,
          updatedBy: data.updatedBy,
        })
        .returning();
      
      return inserted;
    }
  }

  async deleteSeoMetadata(pagePath: string): Promise<void> {
    await db.delete(seoMetadata).where(eq(seoMetadata.pagePath, pagePath));
  }

  async createPersonalAccessToken(data: {
    userId: string;
    token: string;
    name?: string;
    scopes: string;
    expiresAt: number;
  }): Promise<PersonalAccessToken> {
    const [pat] = await db
      .insert(personalAccessTokens)
      .values({
        id: randomUUID(),
        userId: data.userId,
        token: data.token,
        name: data.name || null,
        scopes: data.scopes,
        expiresAt: data.expiresAt,
        createdAt: Date.now(),
        lastUsedAt: null,
        lastUsedIp: null,
        revokedAt: null,
      })
      .returning();
    return pat;
  }

  async getUserPersonalAccessTokens(userId: string): Promise<PersonalAccessToken[]> {
    const tokens = await db
      .select()
      .from(personalAccessTokens)
      .where(eq(personalAccessTokens.userId, userId))
      .orderBy(desc(personalAccessTokens.createdAt));
    return tokens;
  }

  async revokePersonalAccessToken(id: string): Promise<void> {
    await db
      .update(personalAccessTokens)
      .set({ revokedAt: Date.now() })
      .where(eq(personalAccessTokens.id, id));
  }

  async deletePersonalAccessToken(id: string): Promise<void> {
    await db
      .delete(personalAccessTokens)
      .where(eq(personalAccessTokens.id, id));
  }

  async createUploadSession(data: {
    id: string;
    userId: string;
    shootId: string;
    filename: string;
    roomType: string;
    stackIndex: number;
    stackCount: number;
    r2Key: string;
    uploadId: string;
    fileSize?: number;
  }): Promise<UploadSession> {
    const [session] = await db
      .insert(uploadSessions)
      .values({
        id: data.id,
        userId: data.userId,
        shootId: data.shootId,
        filename: data.filename,
        roomType: data.roomType,
        stackIndex: data.stackIndex,
        stackCount: data.stackCount,
        r2Key: data.r2Key,
        uploadId: data.uploadId,
        fileSize: data.fileSize || null,
        parts: null,
        status: "initiated",
        completedAt: null,
        createdAt: Date.now(),
      })
      .returning();
    return session;
  }

  async getUploadSession(id: string): Promise<UploadSession | undefined> {
    const [session] = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.id, id));
    return session || undefined;
  }

  async updateUploadSessionParts(id: string, parts: string): Promise<void> {
    await db
      .update(uploadSessions)
      .set({ parts, status: "uploading" })
      .where(eq(uploadSessions.id, id));
  }

  async completeUploadSession(id: string): Promise<void> {
    await db
      .update(uploadSessions)
      .set({ status: "completed", completedAt: Date.now() })
      .where(eq(uploadSessions.id, id));
  }

  async failUploadSession(id: string): Promise<void> {
    await db
      .update(uploadSessions)
      .set({ status: "failed" })
      .where(eq(uploadSessions.id, id));
  }

  async getUserUploadSessions(userId: string): Promise<UploadSession[]> {
    const sessions = await db
      .select()
      .from(uploadSessions)
      .where(eq(uploadSessions.userId, userId))
      .orderBy(desc(uploadSessions.createdAt));
    return sessions;
  }

  async createAIJob(data: {
    userId: string;
    shootId: string;
    tool: string;
    modelSlug: string;
    sourceImageKey: string;
    params?: string;
    externalJobId?: string;
  }): Promise<AiJob> {
    const [job] = await db
      .insert(aiJobs)
      .values({
        id: randomUUID(),
        userId: data.userId,
        shootId: data.shootId,
        tool: data.tool,
        modelSlug: data.modelSlug,
        sourceImageKey: data.sourceImageKey,
        outputImageKey: null,
        params: data.params || null,
        externalJobId: data.externalJobId || null,
        status: "pending",
        cost: null,
        credits: null,
        errorMessage: null,
        webhookReceivedAt: null,
        completedAt: null,
        createdAt: Date.now(),
      })
      .returning();
    return job;
  }

  async getAIJob(id: string): Promise<AiJob | undefined> {
    const [job] = await db.select().from(aiJobs).where(eq(aiJobs.id, id));
    return job || undefined;
  }

  async getAIJobByExternalId(externalJobId: string): Promise<AiJob | undefined> {
    const [job] = await db
      .select()
      .from(aiJobs)
      .where(eq(aiJobs.externalJobId, externalJobId));
    return job || undefined;
  }

  async updateAIJobStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    await db
      .update(aiJobs)
      .set({
        status,
        errorMessage: errorMessage || null,
        webhookReceivedAt: Date.now(),
      })
      .where(eq(aiJobs.id, id));
  }

  async completeAIJob(id: string, outputImageKey: string, cost: number, credits: number): Promise<void> {
    await db
      .update(aiJobs)
      .set({
        status: "completed",
        outputImageKey,
        cost,
        credits,
        completedAt: Date.now(),
        webhookReceivedAt: Date.now(),
      })
      .where(eq(aiJobs.id, id));
  }

  async getUserAIJobs(userId: string): Promise<AiJob[]> {
    const jobs = await db
      .select()
      .from(aiJobs)
      .where(eq(aiJobs.userId, userId))
      .orderBy(desc(aiJobs.createdAt));
    return jobs;
  }

  async getShootAIJobs(shootId: string): Promise<AiJob[]> {
    const jobs = await db
      .select()
      .from(aiJobs)
      .where(eq(aiJobs.shootId, shootId))
      .orderBy(desc(aiJobs.createdAt));
    return jobs;
  }

  async getUserCredits(userId: string): Promise<number> {
    const [user] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, userId));
    return user?.credits || 0;
  }

  async addCredits(userId: string, amount: number): Promise<void> {
    const currentCredits = await this.getUserCredits(userId);
    await db
      .update(users)
      .set({ credits: currentCredits + amount })
      .where(eq(users.id, userId));
  }

  async deductCredits(userId: string, amount: number): Promise<boolean> {
    const currentCredits = await this.getUserCredits(userId);
    if (currentCredits < amount) {
      return false;
    }
    await db
      .update(users)
      .set({ credits: currentCredits - amount })
      .where(eq(users.id, userId));
    return true;
  }

  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId));
  }

  // Demo: Caption operations
  async createCaption(data: {
    imageId: string;
    captionText: string;
    roomType?: string;
    confidence?: number;
    language?: string;
    version?: number;
  }): Promise<Caption> {
    const id = randomUUID();
    const [caption] = await db
      .insert(captions)
      .values({
        id,
        imageId: data.imageId,
        captionText: data.captionText,
        roomType: data.roomType,
        confidence: data.confidence,
        language: data.language || "de",
        version: data.version || 1,
        createdAt: Date.now(),
      })
      .returning();
    return caption;
  }

  async getImageCaptions(imageId: string): Promise<Caption[]> {
    return await db
      .select()
      .from(captions)
      .where(eq(captions.imageId, imageId))
      .orderBy(desc(captions.version));
  }

  async getJobCaptions(jobId: string): Promise<Caption[]> {
    const result = await db
      .select({
        caption: captions,
      })
      .from(captions)
      .innerJoin(images, eq(captions.imageId, images.id))
      .innerJoin(shoots, eq(images.shootId, shoots.id))
      .where(eq(shoots.jobId, jobId))
      .orderBy(desc(captions.createdAt));
    
    return result.map(r => r.caption);
  }

  // Demo: Expose operations
  async createExpose(data: {
    jobId: string;
    summary: string;
    highlights?: string;
    neighborhood?: string;
    techDetails?: string;
    wordCount?: number;
    version?: number;
  }): Promise<Expose> {
    const id = randomUUID();
    const [expose] = await db
      .insert(exposes)
      .values({
        id,
        jobId: data.jobId,
        summary: data.summary,
        highlights: data.highlights,
        neighborhood: data.neighborhood,
        techDetails: data.techDetails,
        wordCount: data.wordCount,
        version: data.version || 1,
        createdAt: Date.now(),
      })
      .returning();
    return expose;
  }

  async getJobExpose(jobId: string): Promise<Expose | undefined> {
    const [expose] = await db
      .select()
      .from(exposes)
      .where(eq(exposes.jobId, jobId))
      .orderBy(desc(exposes.version))
      .limit(1);
    return expose || undefined;
  }

  // Demo: Update image preview path
  async updateImagePreviewPath(id: string, previewPath: string): Promise<void> {
    await db
      .update(images)
      .set({ previewPath })
      .where(eq(images.id, id));
  }

  // Demo: Extended job operations
  async updateJobDeadline(id: string, deadlineAt: number): Promise<void> {
    await db
      .update(jobs)
      .set({ deadlineAt })
      .where(eq(jobs.id, id));
  }

  async updateJobDeliverables(id: string, deliverGallery: boolean, deliverAlttext: boolean, deliverExpose: boolean): Promise<void> {
    await db
      .update(jobs)
      .set({ 
        deliverGallery: deliverGallery ? "true" : "false",
        deliverAlttext: deliverAlttext ? "true" : "false",
        deliverExpose: deliverExpose ? "true" : "false",
      })
      .where(eq(jobs.id, id));
  }
}

export const storage = new DatabaseStorage();
