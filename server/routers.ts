import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { type UserRole, userRoleValues } from "../drizzle/schema";
import {
  createDocumentRecord,
  createEmailUser,
  createInAppNotification,
  getDocumentRecords,
  getInAppNotifications,
  getUserByEmail,
  getUserByValidResetToken,
  getUserByVerificationToken,
  markNotificationRead,
  updateUserSecurity,
} from "./db";
import {
  SCHOOL_SESSION_COOKIE,
  createOpaqueToken,
  createSession,
  getSessionCookieOptions,
  hashOpaqueToken,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "./customAuth";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

const passwordSchema = z.string().min(10, "Use at least 10 characters.").max(128);
const displayRoles = ["school_admin", "staff", "student", "parent"] as const;

const accountSummary = (user: { id: number; uid: string; name: string; email: string; role: UserRole; emailVerified: boolean; organizationId: number; campusId: number | null }) => ({
  id: user.id,
  uid: user.uid,
  name: user.name,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
  organizationId: user.organizationId,
  campusId: user.campusId,
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => (ctx.user ? accountSummary(ctx.user) : null)),
    signUp: publicProcedure
      .input(z.object({ name: z.string().trim().min(2).max(180), email: z.string().email(), password: passwordSchema, role: z.enum(displayRoles).default("school_admin"), organizationId: z.number().int().positive().default(1), campusId: z.number().int().positive().optional() }))
      .mutation(async ({ input }) => {
        const email = normalizeEmail(input.email);
        const existing = await getUserByEmail(email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account already exists for this email address." });
        const verificationToken = createOpaqueToken();
        const user = await createEmailUser({
          name: input.name,
          email,
          passwordHash: await hashPassword(input.password),
          role: input.role,
          organizationId: input.organizationId,
          campusId: input.campusId ?? null,
          emailVerified: false,
          emailVerificationToken: hashOpaqueToken(verificationToken),
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        });
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Your account could not be created. Please retry." });
        return { success: true, account: accountSummary(user), nextStep: "verify_email" as const };
      }),
    signIn: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(normalizeEmail(input.email));
        if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "The email or password is incorrect." });
        }
        const session = await createSession(user);
        ctx.res.cookie(SCHOOL_SESSION_COOKIE, session, getSessionCookieOptions(ctx.req));
        await updateUserSecurity(user.id, { lastSignedIn: new Date() });
        return { account: accountSummary(user), emailVerificationRequired: !user.emailVerified };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const options = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(SCHOOL_SESSION_COOKIE, { ...options, maxAge: -1 });
      return { success: true } as const;
    }),
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const user = await getUserByEmail(normalizeEmail(input.email));
        if (user) {
          const resetToken = createOpaqueToken();
          await updateUserSecurity(user.id, {
            passwordResetToken: hashOpaqueToken(resetToken),
            passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
          });
        }
        return { success: true } as const;
      }),
    resetPassword: publicProcedure
      .input(z.object({ token: z.string().min(20), password: passwordSchema }))
      .mutation(async ({ input }) => {
        const user = await getUserByValidResetToken(hashOpaqueToken(input.token));
        if (!user) throw new TRPCError({ code: "BAD_REQUEST", message: "This password reset link is invalid or has expired." });
        await updateUserSecurity(user.id, { passwordHash: await hashPassword(input.password), passwordResetToken: null, passwordResetExpiresAt: null });
        return { success: true } as const;
      }),
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string().min(20) }))
      .mutation(async ({ input }) => {
        const user = await getUserByVerificationToken(hashOpaqueToken(input.token));
        if (!user) throw new TRPCError({ code: "BAD_REQUEST", message: "This verification link is invalid or has already been used." });
        await updateUserSecurity(user.id, { emailVerified: true, emailVerificationToken: null });
        return { success: true } as const;
      }),
  }),
  documents: router({
    list: protectedProcedure
      .input(z.object({ ownerType: z.enum(["admission", "student", "staff", "guardian"]), ownerId: z.number().int().positive() }))
      .query(({ ctx, input }) => getDocumentRecords(input.ownerType, input.ownerId, ctx.user.organizationId)),
    upload: adminProcedure
      .input(z.object({ ownerType: z.enum(["admission", "student", "staff", "guardian"]), ownerId: z.number().int().positive(), label: z.string().trim().min(2).max(120), filename: z.string().trim().min(1).max(255), contentType: z.string().trim().min(3).max(150), base64Data: z.string().min(4) }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64Data, "base64");
        if (!buffer.length || buffer.length > 8 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Files must be between 1 byte and 8 MB." });
        }
        const key = `school-erp/${ctx.user.organizationId}/${input.ownerType}/${input.ownerId}/${Date.now()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const stored = await storagePut(key, buffer, input.contentType);
        await createDocumentRecord({ organizationId: ctx.user.organizationId, ownerType: input.ownerType, ownerId: input.ownerId, label: input.label, filename: input.filename, storageKey: stored.key, contentType: input.contentType, sizeBytes: buffer.length, uploadedByUserId: ctx.user.id });
        return { success: true, url: stored.url, key: stored.key } as const;
      }),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => getInAppNotifications(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.notificationId, ctx.user.id);
      return { success: true } as const;
    }),
    queue: adminProcedure
      .input(z.object({ userId: z.number().int().positive(), type: z.enum(["attendance_flag", "fee_reminder", "admission_decision", "notice_posted"]), title: z.string().trim().min(2).max(180), content: z.string().trim().min(2).max(3000), actionUrl: z.string().max(500).optional() }))
      .mutation(async ({ input }) => {
        await createInAppNotification({ userId: input.userId, type: input.type, title: input.title, content: input.content, actionUrl: input.actionUrl ?? null, isRead: false });
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
