import {
  users,
  learningSessions,
  type User,
  type UpsertUser,
  type InsertSession,
  type LearningSession,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Learning session methods
  createSession(session: InsertSession): Promise<LearningSession>;
  getSession(id: string): Promise<LearningSession | undefined>;
  updateSession(id: string, updates: Partial<LearningSession>): Promise<LearningSession | undefined>;
  getUserSessions(userId: string): Promise<LearningSession[]>;
  
  // Subscription methods
  updateUserSubscription(userId: string, subscriptionData: Partial<User>): Promise<User | undefined>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  resetUserUsage(userId: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Learning session operations
  async createSession(sessionData: InsertSession): Promise<LearningSession> {
    const [session] = await db.insert(learningSessions).values(sessionData).returning();
    return session;
  }

  async getSession(id: string): Promise<LearningSession | undefined> {
    const [session] = await db.select().from(learningSessions).where(eq(learningSessions.id, id));
    return session;
  }

  async updateSession(id: string, updates: Partial<LearningSession>): Promise<LearningSession | undefined> {
    const [session] = await db
      .update(learningSessions)
      .set(updates)
      .where(eq(learningSessions.id, id))
      .returning();
    return session;
  }

  async getUserSessions(userId: string): Promise<LearningSession[]> {
    return db.select().from(learningSessions).where(eq(learningSessions.userId, userId));
  }

  // Subscription operations
  async updateUserSubscription(userId: string, subscriptionData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(users.createdAt);
    return allUsers;
  }

  async resetUserUsage(userId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        dailyUsageCount: '0',
        monthlyImageCount: '0',
        lastUsageReset: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
