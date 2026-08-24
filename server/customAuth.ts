import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { SignJWT, jwtVerify } from "jose";
import type { User, UserRole } from "../drizzle/schema";

const scrypt = promisify(nodeScrypt);
export const SCHOOL_SESSION_COOKIE = "school_erp_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: number;
  uid: string;
  role: UserRole;
};

function key() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
  }
  return new TextEncoder().encode(secret || "school-erp-development-session-secret");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, storedKey] = storedHash.split(":");
  if (!salt || !storedKey) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const stored = Buffer.from(storedKey, "hex");
  return stored.length === derived.length && timingSafeEqual(stored, derived);
}

export async function createSession(user: User) {
  if (!user.id) throw new Error("Cannot create a session without an account id.");
  return new SignJWT({ uid: user.uid, role: user.role } satisfies Omit<SessionPayload, "userId">)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(key());
}

export async function verifySession(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || typeof payload.uid !== "string" || typeof payload.role !== "string") return null;
    return { userId, uid: payload.uid, role: payload.role as UserRole };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(req: { protocol?: string; headers?: Record<string, unknown> }) {
  const forwarded = req.headers?.["x-forwarded-proto"];
  const isSecure = req.protocol === "https" || forwarded === "https" || (typeof forwarded === "string" && forwarded.includes("https"));
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? "none" : "lax") as "none" | "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS * 1000,
  };
}
