CREATE TABLE `academicSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`startsOn` timestamp NOT NULL,
	`endsOn` timestamp NOT NULL,
	`isCurrent` boolean NOT NULL DEFAULT false,
	CONSTRAINT `academicSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`academicSessionId` int NOT NULL,
	`applicationNumber` varchar(50) NOT NULL,
	`applicantName` varchar(180) NOT NULL,
	`guardianName` varchar(180),
	`guardianEmail` varchar(320),
	`guardianPhone` varchar(40),
	`appliedClass` varchar(100) NOT NULL,
	`source` varchar(80),
	`status` enum('enquiry','applied','review','assessment','offered','enrolled','declined') NOT NULL DEFAULT 'enquiry',
	`submittedAt` timestamp,
	`decisionAt` timestamp,
	`notes` text,
	CONSTRAINT `admissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `admissions_application_idx` UNIQUE(`campusId`,`applicationNumber`)
);
--> statement-breakpoint
CREATE TABLE `attendanceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`memberType` enum('student','staff') NOT NULL,
	`memberId` int NOT NULL,
	`attendanceDate` timestamp NOT NULL,
	`status` enum('present','absent','late','leave','half_day') NOT NULL,
	`recordedByUserId` int,
	`note` varchar(500),
	CONSTRAINT `attendanceRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`code` varchar(32) NOT NULL,
	`address` text,
	`phone` varchar(40),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`academicSessionId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`ownerType` enum('admission','student','staff','guardian') NOT NULL,
	`ownerId` int NOT NULL,
	`label` varchar(120) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`contentType` varchar(150) NOT NULL,
	`sizeBytes` int NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guardians` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(180) NOT NULL,
	`relationship` varchar(50) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`occupation` varchar(120),
	CONSTRAINT `guardians_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`studentId` int NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`paidAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`dueDate` timestamp NOT NULL,
	`status` enum('paid','partial','due','overdue','waived') NOT NULL DEFAULT 'due',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_number_idx` UNIQUE(`campusId`,`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `notices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`audience` enum('all','staff','students','parents') NOT NULL DEFAULT 'all',
	`publishedAt` timestamp,
	`createdByUserId` int NOT NULL,
	CONSTRAINT `notices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(80) NOT NULL,
	`title` varchar(180) NOT NULL,
	`content` text NOT NULL,
	`actionUrl` varchar(500),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`logoUrl` text,
	`email` varchar(320),
	`phone` varchar(40),
	`address` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`receiptNumber` varchar(50) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`method` varchar(50) NOT NULL,
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	`receivedByUserId` int,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`name` varchar(32) NOT NULL,
	`classTeacherUserId` int,
	`capacity` int NOT NULL DEFAULT 40,
	CONSTRAINT `sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campusId` int NOT NULL,
	`employeeNumber` varchar(40) NOT NULL,
	`department` varchar(100),
	`designation` varchar(100),
	`joinedOn` timestamp,
	`status` enum('active','on_leave','inactive') NOT NULL DEFAULT 'active',
	CONSTRAINT `staff_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_employee_number_idx` UNIQUE(`campusId`,`employeeNumber`)
);
--> statement-breakpoint
CREATE TABLE `studentGuardians` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`guardianId` int NOT NULL,
	`isPrimary` boolean NOT NULL DEFAULT false,
	CONSTRAINT `studentGuardians_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`campusId` int NOT NULL,
	`academicSessionId` int NOT NULL,
	`sectionId` int,
	`admissionNumber` varchar(50) NOT NULL,
	`rollNumber` varchar(30),
	`firstName` varchar(80) NOT NULL,
	`lastName` varchar(80) NOT NULL,
	`dateOfBirth` timestamp,
	`gender` varchar(30),
	`photoUrl` text,
	`address` text,
	`bloodGroup` varchar(8),
	`status` enum('active','withdrawn','alumni') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_admission_number_idx` UNIQUE(`campusId`,`admissionNumber`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`code` varchar(32) NOT NULL,
	`department` varchar(80),
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` varchar(180) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('super_admin','school_owner','school_admin','principal','staff','teacher','accountant','student','parent') NOT NULL DEFAULT 'school_admin';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `uid` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `organizationId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `campusId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_uid_unique` UNIQUE(`uid`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
CREATE INDEX `academic_sessions_campus_idx` ON `academicSessions` (`campusId`);--> statement-breakpoint
CREATE INDEX `admissions_status_idx` ON `admissions` (`campusId`,`status`);--> statement-breakpoint
CREATE INDEX `attendance_member_date_idx` ON `attendanceRecords` (`memberType`,`memberId`,`attendanceDate`);--> statement-breakpoint
CREATE INDEX `campuses_organization_idx` ON `campuses` (`organizationId`);--> statement-breakpoint
CREATE INDEX `classes_campus_session_idx` ON `classes` (`campusId`,`academicSessionId`);--> statement-breakpoint
CREATE INDEX `documents_owner_idx` ON `documents` (`ownerType`,`ownerId`);--> statement-breakpoint
CREATE INDEX `guardians_user_idx` ON `guardians` (`userId`);--> statement-breakpoint
CREATE INDEX `invoices_student_idx` ON `invoices` (`studentId`);--> statement-breakpoint
CREATE INDEX `notices_campus_published_idx` ON `notices` (`campusId`,`publishedAt`);--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`userId`,`isRead`);--> statement-breakpoint
CREATE INDEX `payments_invoice_idx` ON `payments` (`invoiceId`);--> statement-breakpoint
CREATE INDEX `sections_class_idx` ON `sections` (`classId`);--> statement-breakpoint
CREATE INDEX `staff_user_idx` ON `staff` (`userId`);--> statement-breakpoint
CREATE INDEX `student_guardians_student_idx` ON `studentGuardians` (`studentId`);--> statement-breakpoint
CREATE INDEX `students_section_idx` ON `students` (`sectionId`);--> statement-breakpoint
CREATE INDEX `subjects_campus_idx` ON `subjects` (`campusId`);--> statement-breakpoint
CREATE INDEX `users_organization_idx` ON `users` (`organizationId`);--> statement-breakpoint
CREATE INDEX `users_campus_idx` ON `users` (`campusId`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `openId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `loginMethod`;