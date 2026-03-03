import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { freemiumUsage, actionLogs, type FreemiumUsage, type ActionLog, type InsertActionLog } from "@shared/schema";

export interface IStorage {
  getFreemiumUsage(userEmail: string, monthYear: string): Promise<FreemiumUsage | undefined>;
  upsertFreemiumUsage(userEmail: string, monthYear: string, count: number): Promise<FreemiumUsage>;
  incrementFreemiumUsage(userEmail: string, monthYear: string): Promise<FreemiumUsage>;
  getActionLogs(userEmail: string): Promise<ActionLog[]>;
  addActionLog(log: InsertActionLog): Promise<ActionLog>;
}

export class DatabaseStorage implements IStorage {
  async getFreemiumUsage(userEmail: string, monthYear: string): Promise<FreemiumUsage | undefined> {
    const [row] = await db.select().from(freemiumUsage)
      .where(and(eq(freemiumUsage.userEmail, userEmail), eq(freemiumUsage.monthYear, monthYear)));
    return row;
  }

  async upsertFreemiumUsage(userEmail: string, monthYear: string, count: number): Promise<FreemiumUsage> {
    const existing = await this.getFreemiumUsage(userEmail, monthYear);
    if (existing) {
      const [updated] = await db.update(freemiumUsage)
        .set({ actionCount: count })
        .where(and(eq(freemiumUsage.userEmail, userEmail), eq(freemiumUsage.monthYear, monthYear)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(freemiumUsage)
        .values({ userEmail, monthYear, actionCount: count })
        .returning();
      return created;
    }
  }

  async incrementFreemiumUsage(userEmail: string, monthYear: string): Promise<FreemiumUsage> {
    const existing = await this.getFreemiumUsage(userEmail, monthYear);
    const newCount = (existing?.actionCount || 0) + 1;
    return this.upsertFreemiumUsage(userEmail, monthYear, newCount);
  }

  async getActionLogs(userEmail: string): Promise<ActionLog[]> {
    return db.select().from(actionLogs)
      .where(eq(actionLogs.userEmail, userEmail))
      .orderBy(actionLogs.createdAt);
  }

  async addActionLog(log: InsertActionLog): Promise<ActionLog> {
    const [created] = await db.insert(actionLogs).values(log).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
