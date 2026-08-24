import { and, desc, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import { documents, notifications, type InsertUser, type User, users } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createEmailUser(values: Omit<InsertUser, "uid" | "id" | "createdAt" | "updatedAt" | "lastSignedIn">) {
  const db = await getDb();
  if (!db) throw new Error("The School ERP database is currently unavailable.");
  const user: InsertUser = { ...values, uid: nanoid(20) };
  await db.insert(users).values(user);
  return getUserByEmail(user.email);
}

export async function updateUserSecurity(id: number, values: Partial<Pick<User, "passwordHash" | "emailVerified" | "emailVerificationToken" | "passwordResetToken" | "passwordResetExpiresAt" | "lastSignedIn">>) {
  const db = await getDb();
  if (!db) throw new Error("The School ERP database is currently unavailable.");
  await db.update(users).set(values).where(eq(users.id, id));
}

export async function getUserByVerificationToken(tokenHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.emailVerificationToken, tokenHash)).limit(1);
  return result[0];
}

export async function getUserByValidResetToken(tokenHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.passwordResetToken, tokenHash), gt(users.passwordResetExpiresAt, new Date())))
    .limit(1);
  return result[0];
}

export async function createDocumentRecord(values: typeof documents.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("The School ERP database is currently unavailable.");
  await db.insert(documents).values(values);
}

export async function getDocumentRecords(ownerType: "admission" | "student" | "staff" | "guardian", ownerId: number, organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(and(eq(documents.ownerType, ownerType), eq(documents.ownerId, ownerId), eq(documents.organizationId, organizationId))).orderBy(desc(documents.createdAt));
}

export async function createInAppNotification(values: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("The School ERP database is currently unavailable.");
  await db.insert(notifications).values(values);
}

export async function getInAppNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(30);
}

export async function markNotificationRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("The School ERP database is currently unavailable.");
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}
