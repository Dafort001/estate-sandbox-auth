import { users, sessions, type User, type Session } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Initialization
  ready(): Promise<void>;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(email: string, hashedPassword: string): Promise<User>;
  
  // Session operations
  getSession(id: string): Promise<Session | undefined>;
  createSession(userId: string, expiresAt: number): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;
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

  async createUser(email: string, hashedPassword: string): Promise<User> {
    const id = randomUUID();
    const [user] = await db
      .insert(users)
      .values({
        id,
        email: email.toLowerCase(), // Store email in lowercase
        hashedPassword,
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
}

export const storage = new DatabaseStorage();
