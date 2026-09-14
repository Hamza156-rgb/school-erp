import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { type UserRole, userRoleValues } from "../drizzle/schema";
import {
  createPermissionDefinition,
  createDocumentRecord,
  createSchoolOwnerAccount,
  createInAppNotification,
  getDocumentRecords,
  getInAppNotifications,
  getRolePermissionGrants,
  getDashboardSummary,
  getSchoolSettings,
  listPermissionDefinitions,
  getUserByEmail,
  getUserByValidResetToken,
  getUserByVerificationToken,
  markNotificationRead,
  setRolePermissionGrant,
  updateSchoolSettings,
  updateUserCampus,
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
import { adminProcedure, permissionProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { sendSchoolEmail } from "./email";

const passwordSchema = z.string().min(10, "Use at least 10 characters.").max(128);
const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid calendar date.");
const toUtcDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

export const schoolSettingsInputSchema = z.object({
  campusId: z.number().int().positive(),
  organization: z.object({ name: z.string().trim().min(2).max(180), email: z.string().trim().email().max(320), phone: z.string().trim().max(40), address: z.string().trim().max(2000) }).strict(),
  campus: z.object({ name: z.string().trim().min(2).max(180), code: z.string().trim().min(1).max(32), phone: z.string().trim().max(40), address: z.string().trim().max(2000) }).strict(),
  session: z.object({ name: z.string().trim().max(80), startsOn: z.union([calendarDateSchema, z.literal("")]), endsOn: z.union([calendarDateSchema, z.literal("")]) }).strict(),
}).strict().superRefine((input, refinementContext) => {
  const sessionValues = [input.session.name, input.session.startsOn, input.session.endsOn];
  if (sessionValues.some(Boolean) && sessionValues.some(value => !value)) {
    refinementContext.addIssue({ code: z.ZodIssueCode.custom, path: ["session"], message: "Complete the session name, start date, and end date together." });
  } else if (input.session.startsOn && input.session.endsOn && toUtcDate(input.session.endsOn) <= toUtcDate(input.session.startsOn)) {
    refinementContext.addIssue({ code: z.ZodIssueCode.custom, path: ["session", "endsOn"], message: "The end date must be after the start date." });
  }
});

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
      .input(z.object({ schoolName: z.string().trim().min(2).max(180), name: z.string().trim().min(2).max(180), email: z.string().email(), password: passwordSchema }).strict())
      .mutation(async ({ input, ctx }) => {
        const email = normalizeEmail(input.email);
        const existing = await getUserByEmail(email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account already exists for this email address." });
        const verificationToken = createOpaqueToken();
        const user = await createSchoolOwnerAccount({
          schoolName: input.schoolName,
          name: input.name,
          email,
          passwordHash: await hashPassword(input.password),
          emailVerificationToken: hashOpaqueToken(verificationToken),
        });
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Your account could not be created. Please retry." });
        const origin = typeof ctx.req.headers.origin === "string" ? ctx.req.headers.origin : "";
        const verificationUrl = origin ? `${origin}/verify-email?token=${encodeURIComponent(verificationToken)}` : "";
        const deliveryConfigured = verificationUrl
          ? await sendSchoolEmail({
              to: user.email,
              subject: "Verify your School ERP email",
              html: `<p>Hello ${user.name},</p><p>Verify your School ERP email address by using this secure link:</p><p><a href="${verificationUrl}">Verify email address</a></p><p>If you did not create this account, you can ignore this message.</p>`,
            })
          : false;
        return { success: true, account: accountSummary(user), nextStep: "verify_email" as const, deliveryConfigured };
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
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(normalizeEmail(input.email));
        let deliveryConfigured = false;
        if (user) {
          const resetToken = createOpaqueToken();
          await updateUserSecurity(user.id, {
            passwordResetToken: hashOpaqueToken(resetToken),
            passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
          });
          const origin = typeof ctx.req.headers.origin === "string" ? ctx.req.headers.origin : "";
          const resetUrl = origin ? `${origin}/reset-password?token=${encodeURIComponent(resetToken)}` : "";
          if (resetUrl) {
            deliveryConfigured = await sendSchoolEmail({
              to: user.email,
              subject: "Reset your School ERP password",
              html: `<p>Hello ${user.name},</p><p>Use this secure link to reset your password. It expires in one hour:</p><p><a href="${resetUrl}">Reset password</a></p>`,
            });
          }
        }
        return { success: true, deliveryConfigured } as const;
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
    upload: permissionProcedure("documents.upload")
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
    queue: permissionProcedure("notifications.queue")
      .input(z.object({ userId: z.number().int().positive(), type: z.enum(["attendance_flag", "fee_reminder", "admission_decision", "notice_posted"]), title: z.string().trim().min(2).max(180), content: z.string().trim().min(2).max(3000), actionUrl: z.string().max(500).optional() }))
      .mutation(async ({ input }) => {
        await createInAppNotification({ userId: input.userId, type: input.type, title: input.title, content: input.content, actionUrl: input.actionUrl ?? null, isRead: false });
        return { success: true } as const;
      }),
  }),
  access: router({
    catalogue: adminProcedure.query(() => listPermissionDefinitions()),
    grants: adminProcedure.input(z.object({ role: z.enum(userRoleValues) })).query(({ ctx, input }) => getRolePermissionGrants(ctx.user.organizationId, input.role)),
    definePermission: adminProcedure.input(z.object({ code: z.string().regex(/^[a-z]+(?:\.[a-z_]+)+$/), module: z.string().trim().min(2).max(80), action: z.string().trim().min(2).max(40), label: z.string().trim().min(2).max(180), description: z.string().trim().max(500).optional() })).mutation(async ({ input }) => {
      await createPermissionDefinition({ ...input, description: input.description ?? null });
      return { success: true } as const;
    }),
    setGrant: adminProcedure.input(z.object({ role: z.enum(userRoleValues), permissionCode: z.string().trim().min(3).max(120), isGranted: z.boolean() })).mutation(async ({ ctx, input }) => {
      await setRolePermissionGrant(ctx.user.organizationId, input.role, input.permissionCode, input.isGranted);
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    summary: protectedProcedure.query(({ ctx }) => getDashboardSummary(ctx.user.organizationId, ctx.user.campusId)),
  }),
  settings: router({
    get: protectedProcedure.query(({ ctx }) => getSchoolSettings(ctx.user.organizationId, ctx.user.campusId, ctx.user.id)),
    setCurrentCampus: protectedProcedure.input(z.object({ campusId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await updateUserCampus(ctx.user.id, ctx.user.organizationId, input.campusId); return { success: true as const, campusId: input.campusId }; }),
    update: adminProcedure
      .input(schoolSettingsInputSchema)
      .mutation(async ({ ctx, input }) => {
        const settings = await updateSchoolSettings({ organizationId: ctx.user.organizationId, campusId: input.campusId, organization: input.organization, campus: input.campus, session: input.session.name && input.session.startsOn && input.session.endsOn ? { name: input.session.name, startsOn: toUtcDate(input.session.startsOn), endsOn: toUtcDate(input.session.endsOn) } : undefined });
        return { success: true as const, settings };
      }),
  }),
});

export type AppRouter = typeof appRouter;
