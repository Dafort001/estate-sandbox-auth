import { z } from "zod";

// User Model
export interface User {
  id: string;
  email: string;
  hashedPassword: string;
  createdAt: number;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
}

// Validation Schemas
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// Response types
export interface AuthResponse {
  user: Omit<User, "hashedPassword">;
  session: Session;
}

export interface UserResponse {
  id: string;
  email: string;
  createdAt: number;
}
