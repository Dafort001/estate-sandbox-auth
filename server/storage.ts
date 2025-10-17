import { type User, type Session } from "@shared/schema";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { join } from "path";

const PERSIST_FILE = join(process.cwd(), "data", "auth-data.json");

interface StorageData {
  users: User[];
  sessions: Session[];
}

export interface IStorage {
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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, Session>;
  private shouldPersist: boolean;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.shouldPersist = process.env.DEV_PERSIST === "true";
    
    // Load data on initialization if persistence is enabled
    if (this.shouldPersist) {
      this.loadData().catch(() => {
        console.log("No existing data file found, starting fresh");
      });
    }
  }

  private async loadData(): Promise<void> {
    try {
      const data = await fs.readFile(PERSIST_FILE, "utf-8");
      const parsed: StorageData = JSON.parse(data);
      
      this.users = new Map(parsed.users.map(u => [u.id, u]));
      this.sessions = new Map(parsed.sessions.map(s => [s.id, s]));
      
      console.log(`Loaded ${this.users.size} users and ${this.sessions.size} sessions from disk`);
    } catch (error) {
      throw error;
    }
  }

  private async persistData(): Promise<void> {
    if (!this.shouldPersist) return;

    try {
      await fs.mkdir(join(process.cwd(), "data"), { recursive: true });
      
      const data: StorageData = {
        users: Array.from(this.users.values()),
        sessions: Array.from(this.sessions.values()),
      };
      
      await fs.writeFile(PERSIST_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to persist data:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(email: string, hashedPassword: string): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      email,
      hashedPassword,
      createdAt: Date.now(),
    };
    
    this.users.set(id, user);
    await this.persistData();
    
    return user;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    
    // Remove expired sessions
    if (session && session.expiresAt < Date.now()) {
      await this.deleteSession(id);
      return undefined;
    }
    
    return session;
  }

  async createSession(userId: string, expiresAt: number): Promise<Session> {
    const id = randomUUID();
    const session: Session = {
      id,
      userId,
      expiresAt,
    };
    
    this.sessions.set(id, session);
    await this.persistData();
    
    return session;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
    await this.persistData();
  }

  async deleteUserSessions(userId: string): Promise<void> {
    const userSessions = Array.from(this.sessions.entries())
      .filter(([_, session]) => session.userId === userId);
    
    for (const [sessionId] of userSessions) {
      this.sessions.delete(sessionId);
    }
    
    await this.persistData();
  }
}

export const storage = new MemStorage();
