import {
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const userRoleValues = [
  "super_admin",
  "school_owner",
  "school_admin",
  "principal",
  "staff",
  "teacher",
  "accountant",
  "student",
  "parent",
] as const;

export type UserRole = (typeof userRoleValues)[number];

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  logoUrl: text("logoUrl"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const campuses = mysqlTable(
  "campuses",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    code: varchar("code", { length: 32 }).notNull(),
    address: text("address"),
    phone: varchar("phone", { length: 40 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("campuses_organization_idx").on(table.organizationId)]
);

export const academicSessions = mysqlTable(
  "academicSessions",
  {
    id: int("id").autoincrement().primaryKey(),
    campusId: int("campusId").notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    startsOn: timestamp("startsOn").notNull(),
    endsOn: timestamp("endsOn").notNull(),
    isCurrent: boolean("isCurrent").default(false).notNull(),
  },
  table => [index("academic_sessions_campus_idx").on(table.campusId)]
);

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    uid: varchar("uid", { length: 32 }).notNull().unique(),
    name: varchar("name", { length: 180 }).notNull(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
    role: mysqlEnum("role", userRoleValues).default("school_admin").notNull(),
    organizationId: int("organizationId").notNull(),
    campusId: int("campusId"),
    emailVerified: boolean("emailVerified").default(false).notNull(),
    emailVerificationToken: varchar("emailVerificationToken", { length: 128 }),
    passwordResetToken: varchar("passwordResetToken", { length: 128 }),
    passwordResetExpiresAt: timestamp("passwordResetExpiresAt"),
    lastSignedIn: timestamp("lastSignedIn"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("users_organization_idx").on(table.organizationId),
    index("users_campus_idx").on(table.campusId),
  ]
);

export const permissionDefinitions = mysqlTable("permissionDefinitions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 120 }).notNull().unique(),
  module: varchar("module", { length: 80 }).notNull(),
  action: varchar("action", { length: 40 }).notNull(),
  label: varchar("label", { length: 180 }).notNull(),
  description: varchar("description", { length: 500 }),
});

export const rolePermissions = mysqlTable(
  "rolePermissions",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    role: mysqlEnum("role", userRoleValues).notNull(),
    permissionId: int("permissionId").notNull(),
    isGranted: boolean("isGranted").default(true).notNull(),
  },
  table => [
    uniqueIndex("role_permissions_unique_idx").on(table.organizationId, table.role, table.permissionId),
    index("role_permissions_organization_role_idx").on(table.organizationId, table.role),
  ]
);

export const classes = mysqlTable(
  "classes",
  {
    id: int("id").autoincrement().primaryKey(),
    campusId: int("campusId").notNull(),
    academicSessionId: int("academicSessionId").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
  },
  table => [index("classes_campus_session_idx").on(table.campusId, table.academicSessionId)]
);

export const sections = mysqlTable(
  "sections",
  {
    id: int("id").autoincrement().primaryKey(),
    classId: int("classId").notNull(),
    name: varchar("name", { length: 32 }).notNull(),
    classTeacherUserId: int("classTeacherUserId"),
    capacity: int("capacity").default(40).notNull(),
  },
  table => [index("sections_class_idx").on(table.classId)]
);

export const subjects = mysqlTable(
  "subjects",
  {
    id: int("id").autoincrement().primaryKey(),
    campusId: int("campusId").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    code: varchar("code", { length: 32 }).notNull(),
    department: varchar("department", { length: 80 }),
  },
  table => [index("subjects_campus_idx").on(table.campusId)]
);

export const staff = mysqlTable(
  "staff",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    campusId: int("campusId").notNull(),
    employeeNumber: varchar("employeeNumber", { length: 40 }).notNull(),
    department: varchar("department", { length: 100 }),
    designation: varchar("designation", { length: 100 }),
    joinedOn: timestamp("joinedOn"),
    status: mysqlEnum("status", ["active", "on_leave", "inactive"]).default("active").notNull(),
  },
  table => [
    uniqueIndex("staff_employee_number_idx").on(table.campusId, table.employeeNumber),
    index("staff_user_idx").on(table.userId),
  ]
);

export const guardians = mysqlTable(
  "guardians",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    name: varchar("name", { length: 180 }).notNull(),
    relationship: varchar("relationship", { length: 50 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 40 }),
    occupation: varchar("occupation", { length: 120 }),
  },
  table => [index("guardians_user_idx").on(table.userId)]
);

export const students = mysqlTable(
  "students",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    campusId: int("campusId").notNull(),
    academicSessionId: int("academicSessionId").notNull(),
    sectionId: int("sectionId"),
    admissionNumber: varchar("admissionNumber", { length: 50 }).notNull(),
    rollNumber: varchar("rollNumber", { length: 30 }),
    firstName: varchar("firstName", { length: 80 }).notNull(),
    lastName: varchar("lastName", { length: 80 }).notNull(),
    dateOfBirth: timestamp("dateOfBirth"),
    gender: varchar("gender", { length: 30 }),
    photoUrl: text("photoUrl"),
    address: text("address"),
    bloodGroup: varchar("bloodGroup", { length: 8 }),
    status: mysqlEnum("status", ["active", "withdrawn", "alumni"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("students_admission_number_idx").on(table.campusId, table.admissionNumber),
    index("students_section_idx").on(table.sectionId),
  ]
);

export const studentGuardians = mysqlTable(
  "studentGuardians",
  {
    id: int("id").autoincrement().primaryKey(),
    studentId: int("studentId").notNull(),
    guardianId: int("guardianId").notNull(),
    isPrimary: boolean("isPrimary").default(false).notNull(),
  },
  table => [index("student_guardians_student_idx").on(table.studentId)]
);

export const admissions = mysqlTable(
  "admissions",
  {
    id: int("id").autoincrement().primaryKey(),
    campusId: int("campusId").notNull(),
    academicSessionId: int("academicSessionId").notNull(),
    applicationNumber: varchar("applicationNumber", { length: 50 }).notNull(),
    applicantName: varchar("applicantName", { length: 180 }).notNull(),
    guardianName: varchar("guardianName", { length: 180 }),
    guardianEmail: varchar("guardianEmail", { length: 320 }),
    guardianPhone: varchar("guardianPhone", { length: 40 }),
    appliedClass: varchar("appliedClass", { length: 100 }).notNull(),
    source: varchar("source", { length: 80 }),
    status: mysqlEnum("status", ["enquiry", "applied", "review", "assessment", "offered", "enrolled", "declined"]).default("enquiry").notNull(),
    submittedAt: timestamp("submittedAt"),
    decisionAt: timestamp("decisionAt"),
    notes: text("notes"),
  },
  table => [
    uniqueIndex("admissions_application_idx").on(table.campusId, table.applicationNumber),
    index("admissions_status_idx").on(table.campusId, table.status),
  ]
);

export const attendanceRecords = mysqlTable(
  "attendanceRecords",
  {
    id: int("id").autoincrement().primaryKey(),
    campusId: int("campusId").notNull(),
    memberType: mysqlEnum("memberType", ["student", "staff"]).notNull(),
    memberId: int("memberId").notNull(),
    attendanceDate: timestamp("attendanceDate").notNull(),
    status: mysqlEnum("status", ["present", "absent", "late", "leave", "half_day"]).notNull(),
    recordedByUserId: int("recordedByUserId"),
    note: varchar("note", { length: 500 }),
  },
  table => [index("attendance_member_date_idx").on(table.memberType, table.memberId, table.attendanceDate)]
);

export const invoices = mysqlTable(
  "invoices",
  {
    id: int("id").autoincrement().primaryKey(),
    campusId: int("campusId").notNull(),
    studentId: int("studentId").notNull(),
    invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    paidAmount: decimal("paidAmount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    dueDate: timestamp("dueDate").notNull(),
    status: mysqlEnum("status", ["paid", "partial", "due", "overdue", "waived"]).default("due").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("invoices_number_idx").on(table.campusId, table.invoiceNumber),
    index("invoices_student_idx").on(table.studentId),
  ]
);

export const payments = mysqlTable(
  "payments",
  {
    id: int("id").autoincrement().primaryKey(),
    invoiceId: int("invoiceId").notNull(),
    receiptNumber: varchar("receiptNumber", { length: 50 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    method: varchar("method", { length: 50 }).notNull(),
    paidAt: timestamp("paidAt").defaultNow().notNull(),
    receivedByUserId: int("receivedByUserId"),
  },
  table => [index("payments_invoice_idx").on(table.invoiceId)]
);

export const notices = mysqlTable(
  "notices",
  {
    id: int("id").autoincrement().primaryKey(),
    campusId: int("campusId").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body").notNull(),
    audience: mysqlEnum("audience", ["all", "staff", "students", "parents"]).default("all").notNull(),
    publishedAt: timestamp("publishedAt"),
    createdByUserId: int("createdByUserId").notNull(),
  },
  table => [index("notices_campus_published_idx").on(table.campusId, table.publishedAt)]
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: varchar("type", { length: 80 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    content: text("content").notNull(),
    actionUrl: varchar("actionUrl", { length: 500 }),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("notifications_user_read_idx").on(table.userId, table.isRead)]
);

export const documents = mysqlTable(
  "documents",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organizationId").notNull(),
    ownerType: mysqlEnum("ownerType", ["admission", "student", "staff", "guardian"]).notNull(),
    ownerId: int("ownerId").notNull(),
    label: varchar("label", { length: 120 }).notNull(),
    filename: varchar("filename", { length: 255 }).notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    contentType: varchar("contentType", { length: 150 }).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    uploadedByUserId: int("uploadedByUserId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("documents_owner_idx").on(table.ownerType, table.ownerId)]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
