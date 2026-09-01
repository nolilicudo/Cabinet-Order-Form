CREATE TABLE `countertop_takeoff_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`takeoffId` int NOT NULL,
	`room` varchar(120) NOT NULL,
	`label` varchar(255) NOT NULL,
	`lengthMilliInches` int NOT NULL,
	`depthMilliInches` int NOT NULL,
	`edgeMilliFeet` int NOT NULL DEFAULT 0,
	`edgeProfile` varchar(80) NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `countertop_takeoff_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `countertop_takeoffs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdByUserId` int NOT NULL,
	`supplier` enum('MSI','Cosentino') NOT NULL,
	`collection` varchar(160) NOT NULL,
	`materialName` varchar(255) NOT NULL,
	`finish` varchar(80) NOT NULL,
	`materialSourceUrl` text,
	`customerName` varchar(255) NOT NULL,
	`estimateNumber` varchar(120) NOT NULL,
	`materialCentsPerSquareFoot` int NOT NULL DEFAULT 3500,
	`nonEasedEdgeCentsPerLinearFoot` int NOT NULL DEFAULT 500,
	`status` enum('Draft','Verified','Submitted') NOT NULL DEFAULT 'Draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `countertop_takeoffs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `countertop_takeoff_runs` ADD CONSTRAINT `countertop_takeoff_runs_takeoffId_countertop_takeoffs_id_fk` FOREIGN KEY (`takeoffId`) REFERENCES `countertop_takeoffs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD CONSTRAINT `countertop_takeoffs_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `countertop_takeoff_runs_takeoff_idx` ON `countertop_takeoff_runs` (`takeoffId`);--> statement-breakpoint
CREATE INDEX `countertop_takeoffs_owner_idx` ON `countertop_takeoffs` (`createdByUserId`);--> statement-breakpoint
CREATE INDEX `countertop_takeoffs_supplier_idx` ON `countertop_takeoffs` (`supplier`);