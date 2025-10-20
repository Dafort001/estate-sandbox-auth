import { users, sessions, refreshTokens, passwordResetTokens, orders, jobs, shoots, stacks, images, editorTokens, editedImages, services, bookings, bookingItems, imageFavorites, imageComments, type User, type Session, type RefreshToken, type PasswordResetToken, type Order, type Job, type Shoot, type Stack, type Image, type EditorToken, type EditedImage, type Service, type Booking, type BookingItem, type ImageFavorite, type ImageComment } from "@shared/schema";
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
  createJob(userId: string, propertyName: string, propertyAddress?: string): Promise<Job>;
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
    propertyName: string;
    propertyAddress: string;
    propertyType?: string;
    preferredDate?: string;
    preferredTime?: string;
    specialRequirements?: string;
    totalNetPrice: number;
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
  async createJob(userId: string, propertyName: string, propertyAddress?: string): Promise<Job> {
    const id = randomUUID();
    const jobNumber = `PIX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const [job] = await db
      .insert(jobs)
      .values({
        id,
        jobNumber,
        userId,
        propertyName,
        propertyAddress,
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
    propertyName: string;
    propertyAddress: string;
    propertyType?: string;
    preferredDate?: string;
    preferredTime?: string;
    specialRequirements?: string;
    totalNetPrice: number;
    serviceSelections: Record<string, number>;
  }): Promise<{ booking: Booking; items: BookingItem[] }> {
    const bookingId = randomUUID();
    const timestamp = Date.now();

    const [booking] = await db
      .insert(bookings)
      .values({
        id: bookingId,
        userId,
        propertyName: bookingData.propertyName,
        propertyAddress: bookingData.propertyAddress,
        propertyType: bookingData.propertyType || null,
        preferredDate: bookingData.preferredDate || null,
        preferredTime: bookingData.preferredTime || null,
        specialRequirements: bookingData.specialRequirements || null,
        totalNetPrice: bookingData.totalNetPrice,
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
}

export const storage = new DatabaseStorage();
