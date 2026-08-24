CREATE TABLE `permissionDefinitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(120) NOT NULL,
	`module` varchar(80) NOT NULL,
	`action` varchar(40) NOT NULL,
	`label` varchar(180) NOT NULL,
	`description` varchar(500),
	CONSTRAINT `permissionDefinitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissionDefinitions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `rolePermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`role` enum('super_admin','school_owner','school_admin','principal','staff','teacher','accountant','student','parent') NOT NULL,
	`permissionId` int NOT NULL,
	`isGranted` boolean NOT NULL DEFAULT true,
	CONSTRAINT `rolePermissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_permissions_unique_idx` UNIQUE(`organizationId`,`role`,`permissionId`)
);
--> statement-breakpoint
CREATE INDEX `role_permissions_organization_role_idx` ON `rolePermissions` (`organizationId`,`role`);