import { and, asc, count, desc, eq, gt, inArray, like, or, sql, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import { academicSessions, admissions, attendanceRecords, campuses, classes, documents, guardians, invoices, notifications, organizations, permissionDefinitions, rolePermissions, sections, studentGuardians, students, type InsertUser, type User, users } from "../drizzle/schema";

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

export async function createSchoolOwnerAccount(values: {
  schoolName: string;
  name: string;
  email: string;
  passwordHash: string;
  emailVerificationToken: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("The School ERP database is currently unavailable.");

  const baseSlug = values.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "school";
  const slug = `${baseSlug}-${nanoid(8).toLowerCase()}`;
  const campusCode = `MAIN-${nanoid(6).toUpperCase()}`;

  await db.insert(organizations).values({ name: values.schoolName, slug, email: values.email });
  const organization = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  if (!organization[0]) throw new Error("The School ERP organization could not be created.");

  await db.insert(campuses).values({ organizationId: organization[0].id, name: "Main Campus", code: campusCode });
  const campus = await db.select().from(campuses).where(and(eq(campuses.organizationId, organization[0].id), eq(campuses.code, campusCode))).limit(1);
  if (!campus[0]) throw new Error("The School ERP campus could not be created.");

  return createEmailUser({
    name: values.name,
    email: values.email,
    passwordHash: values.passwordHash,
    role: "school_owner",
    organizationId: organization[0].id,
    campusId: campus[0].id,
    emailVerified: false,
    emailVerificationToken: values.emailVerificationToken,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
  });
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

export async function hasGrantedPermission(organizationId: number, role: User["role"], permissionCode: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ isGranted: rolePermissions.isGranted })
    .from(rolePermissions)
    .innerJoin(permissionDefinitions, eq(rolePermissions.permissionId, permissionDefinitions.id))
    .where(and(eq(rolePermissions.organizationId, organizationId), eq(rolePermissions.role, role), eq(permissionDefinitions.code, permissionCode)))
    .limit(1);
  return result[0]?.isGranted ?? false;
}

export async function listPermissionDefinitions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(permissionDefinitions).orderBy(permissionDefinitions.module, permissionDefinitions.action);
}

export async function getRolePermissionGrants(organizationId: number, role: User["role"]) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ code: permissionDefinitions.code, label: permissionDefinitions.label, module: permissionDefinitions.module, action: permissionDefinitions.action, isGranted: rolePermissions.isGranted })
    .from(rolePermissions)
    .innerJoin(permissionDefinitions, eq(rolePermissions.permissionId, permissionDefinitions.id))
    .where(and(eq(rolePermissions.organizationId, organizationId), eq(rolePermissions.role, role)))
    .orderBy(permissionDefinitions.module, permissionDefinitions.action);
}

export async function setRolePermissionGrant(organizationId: number, role: User["role"], permissionCode: string, isGranted: boolean) {
  const db = await getDb();
  if (!db) throw new Error("The School ERP database is currently unavailable.");
  const permission = await db.select().from(permissionDefinitions).where(eq(permissionDefinitions.code, permissionCode)).limit(1);
  const permissionId = permission[0]?.id;
  if (!permissionId) throw new Error("The requested permission definition was not found.");
  await db.insert(rolePermissions).values({ organizationId, role, permissionId, isGranted }).onDuplicateKeyUpdate({ set: { isGranted } });
}

export async function createPermissionDefinition(values: typeof permissionDefinitions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("The School ERP database is currently unavailable.");
  await db.insert(permissionDefinitions).values(values).onDuplicateKeyUpdate({ set: { module: values.module, action: values.action, label: values.label, description: values.description } });
}

export async function getSchoolSettings(organizationId: number, preferredCampusId: number | null, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("The School ERP database is currently unavailable.");
  const organization = (await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1))[0];
  if (!organization) throw new Error("The school organization could not be found.");
  const freshUser = userId ? (await db.select({ campusId: users.campusId }).from(users).where(and(eq(users.id, userId), eq(users.organizationId, organizationId))).limit(1))[0] : undefined;
  const effectiveCampusId = freshUser?.campusId ?? preferredCampusId;
  const organizationCampuses = await db.select().from(campuses).where(eq(campuses.organizationId, organizationId)).orderBy(campuses.id);
  const selectedCampus = organizationCampuses.find(campus => campus.id === effectiveCampusId) ?? organizationCampuses[0] ?? null;
  const currentSessions = organizationCampuses.length
    ? await db.select().from(academicSessions).where(and(inArray(academicSessions.campusId, organizationCampuses.map(campus => campus.id)), eq(academicSessions.isCurrent, true))).orderBy(desc(academicSessions.id))
    : [];
  const currentSession = currentSessions.find(session => session.campusId === selectedCampus?.id) ?? null;
  return { organization, campuses: organizationCampuses, selectedCampusId: selectedCampus?.id ?? null, currentSession, currentSessions };
}

export function assertCampusBelongsToOrganization(campus: { organizationId: number } | undefined, organizationId: number) {
  if (!campus || campus.organizationId !== organizationId) throw new Error("The selected campus does not belong to this school.");
  return campus;
}

export async function updateSchoolSettings(values: {
  organizationId: number;
  campusId: number;
  organization: Pick<typeof organizations.$inferInsert, "name" | "email" | "phone" | "address">;
  campus: Pick<typeof campuses.$inferInsert, "name" | "code" | "phone" | "address">;
  session?: { name: string; startsOn: Date; endsOn: Date };
}) {
  const db = await getDb();
  if (!db) throw new Error("The School ERP database is currently unavailable.");
  const campus = (await db.select().from(campuses).where(and(eq(campuses.id, values.campusId), eq(campuses.organizationId, values.organizationId))).limit(1))[0];
  assertCampusBelongsToOrganization(campus, values.organizationId);
  await db.update(organizations).set(values.organization).where(eq(organizations.id, values.organizationId));
  await db.update(campuses).set(values.campus).where(and(eq(campuses.id, values.campusId), eq(campuses.organizationId, values.organizationId)));
  if (values.session) {
    const currentSessions = await db.select().from(academicSessions).where(and(eq(academicSessions.campusId, values.campusId), eq(academicSessions.isCurrent, true))).orderBy(desc(academicSessions.id)).limit(1);
    if (currentSessions[0]) {
      await db.update(academicSessions).set({ name: values.session.name, startsOn: values.session.startsOn, endsOn: values.session.endsOn, isCurrent: true }).where(eq(academicSessions.id, currentSessions[0].id));
    } else {
      await db.insert(academicSessions).values({ campusId: values.campusId, name: values.session.name, startsOn: values.session.startsOn, endsOn: values.session.endsOn, isCurrent: true });
    }
  }
  return getSchoolSettings(values.organizationId, values.campusId);
}

export async function updateUserCampus(userId: number, organizationId: number, campusId: number) {
  const db = await getDb();
  if (!db) throw new Error("The School ERP database is currently unavailable.");
  const campus = (await db.select().from(campuses).where(and(eq(campuses.id, campusId), eq(campuses.organizationId, organizationId))).limit(1))[0];
  assertCampusBelongsToOrganization(campus, organizationId);
  await db.update(users).set({ campusId }).where(and(eq(users.id, userId), eq(users.organizationId, organizationId)));
  return campus;
}

export type StudentListQuery = {
  organizationId: number;
  campusId: number | null;
  search: string;
  status: "all" | "Current" | "Due";
  className: string;
  sortBy: "name-asc" | "name-desc" | "class-asc" | "balance-desc" | "balance-asc" | "status";
  page: number;
  pageSize: number;
};

export async function listStudents(values: StudentListQuery) {
  const db = await getDb();
  if (!db) throw new Error("The School ERP database is currently unavailable.");
  const balanceExpression = sql`coalesce((select sum(${invoices.amount} - ${invoices.paidAmount}) from ${invoices} where ${invoices.studentId} = ${students.id}), 0)`;
  const dueExpression = sql`exists (select 1 from ${invoices} where ${invoices.studentId} = ${students.id} and (${invoices.amount} - ${invoices.paidAmount}) > 0)`;
  const campusFilter = and(eq(campuses.organizationId, values.organizationId), values.campusId ? eq(students.campusId, values.campusId) : undefined);
  const searchFilter = values.search.trim()
    ? or(like(students.firstName, `%${values.search.trim()}%`), like(students.lastName, `%${values.search.trim()}%`), like(students.admissionNumber, `%${values.search.trim()}%`), like(guardians.name, `%${values.search.trim()}%`))
    : undefined;
  const statusFilter = values.status === "Due" ? dueExpression : values.status === "Current" ? sql`not (${dueExpression})` : undefined;
  const classFilter = values.className !== "all" ? sql`concat(${classes.name}, ' · ', ${sections.name}) = ${values.className}` : undefined;
  const where = and(campusFilter, classFilter, searchFilter, statusFilter);
  const orderBy = values.sortBy === "name-desc" ? desc(students.lastName) : values.sortBy === "class-asc" ? asc(classes.name) : values.sortBy === "balance-desc" ? desc(balanceExpression) : values.sortBy === "balance-asc" ? asc(balanceExpression) : values.sortBy === "status" ? asc(students.status) : asc(students.lastName);
  const [rows, totalRows, classRows] = await Promise.all([
    db.select({ id: students.id, admissionNumber: students.admissionNumber, firstName: students.firstName, lastName: students.lastName, photoUrl: students.photoUrl, status: students.status, className: classes.name, sectionName: sections.name, guardian: guardians.name, balance: balanceExpression }).from(students).innerJoin(campuses, eq(students.campusId, campuses.id)).leftJoin(sections, eq(students.sectionId, sections.id)).leftJoin(classes, eq(sections.classId, classes.id)).leftJoin(studentGuardians, and(eq(studentGuardians.studentId, students.id), eq(studentGuardians.isPrimary, true))).leftJoin(guardians, eq(studentGuardians.guardianId, guardians.id)).where(where).orderBy(orderBy, asc(students.firstName)).limit(values.pageSize).offset((values.page - 1) * values.pageSize),
    db.select({ total: count() }).from(students).innerJoin(campuses, eq(students.campusId, campuses.id)).leftJoin(sections, eq(students.sectionId, sections.id)).leftJoin(classes, eq(sections.classId, classes.id)).leftJoin(studentGuardians, and(eq(studentGuardians.studentId, students.id), eq(studentGuardians.isPrimary, true))).leftJoin(guardians, eq(studentGuardians.guardianId, guardians.id)).where(where),
    db.selectDistinct({ className: classes.name, sectionName: sections.name }).from(students).innerJoin(campuses, eq(students.campusId, campuses.id)).leftJoin(sections, eq(students.sectionId, sections.id)).leftJoin(classes, eq(sections.classId, classes.id)).where(campusFilter).orderBy(asc(classes.name)),
  ]);
  const total = Number(totalRows[0]?.total ?? 0);
  return { rows: rows.map(row => ({ ...row, name: `${row.firstName} ${row.lastName}`, className: row.className ? `${row.className}${row.sectionName ? ` · ${row.sectionName}` : ""}` : "Unassigned", guardian: row.guardian ?? "No guardian linked", balance: Number(row.balance ?? 0), status: Number(row.balance ?? 0) > 0 ? "Due" as const : "Current" as const })), total, page: values.page, pageSize: values.pageSize, totalPages: Math.max(1, Math.ceil(total / values.pageSize)), classOptions: classRows.map(row => row.className ? `${row.className}${row.sectionName ? ` · ${row.sectionName}` : ""}` : "Unassigned") };
}

export async function getDashboardSummary(organizationId: number, campusId: number | null) {
  const db = await getDb();
  if (!db) return { activeStudents: 0, openAdmissions: 0, outstandingBalance: 0, attendanceRecords: 0 };
  const campusFilter = campusId ? eq(students.campusId, campusId) : undefined;
  const [studentCount, admissionCount, balance, attendanceCount] = await Promise.all([
    db.select({ value: count() }).from(students).where(campusFilter),
    db.select({ value: count() }).from(admissions).where(campusId ? eq(admissions.campusId, campusId) : undefined),
    db.select({ value: sum(sql`(${invoices.amount} - ${invoices.paidAmount})`) }).from(invoices).where(campusId ? eq(invoices.campusId, campusId) : undefined),
    db.select({ value: count() }).from(attendanceRecords).where(campusId ? eq(attendanceRecords.campusId, campusId) : undefined),
  ]);
  return {
    activeStudents: Number(studentCount[0]?.value ?? 0),
    openAdmissions: Number(admissionCount[0]?.value ?? 0),
    outstandingBalance: Number(balance[0]?.value ?? 0),
    attendanceRecords: Number(attendanceCount[0]?.value ?? 0),
  };
}
