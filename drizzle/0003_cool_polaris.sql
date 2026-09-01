CREATE TABLE `custom_cabinet_package_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`description` varchar(255) NOT NULL,
	`room` varchar(120) NOT NULL,
	`widthInches` varchar(24) NOT NULL,
	`heightInches` varchar(24) NOT NULL,
	`depthInches` varchar(24) NOT NULL,
	`boxCount` int NOT NULL,
	`boxEachCents` int NOT NULL,
	`trimCents` int NOT NULL DEFAULT 0,
	`panelCents` int NOT NULL DEFAULT 0,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_cabinet_package_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_cabinet_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdByUserId` int NOT NULL,
	`supplier` enum('Sequoia Cabinets','RA Cabinets') NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerAddress` text NOT NULL,
	`customerPhone` varchar(80) NOT NULL,
	`shippingMethod` varchar(100) NOT NULL,
	`estimateNumber` varchar(120) NOT NULL,
	`allWoodDoorPanelCount` int NOT NULL DEFAULT 0,
	`allWoodDoorPanelEachCents` int NOT NULL DEFAULT 0,
	`installationCents` int NOT NULL DEFAULT 0,
	`status` enum('Draft','Verified','Submitted') NOT NULL DEFAULT 'Draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_cabinet_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cabinet_orders` ADD `installationCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `uscd_packages` ADD `installationCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `custom_cabinet_package_items` ADD CONSTRAINT `custom_cabinet_package_items_packageId_custom_cabinet_packages_id_fk` FOREIGN KEY (`packageId`) REFERENCES `custom_cabinet_packages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `custom_cabinet_packages` ADD CONSTRAINT `custom_cabinet_packages_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `custom_cabinet_package_items_package_idx` ON `custom_cabinet_package_items` (`packageId`);--> statement-breakpoint
CREATE INDEX `custom_cabinet_packages_owner_idx` ON `custom_cabinet_packages` (`createdByUserId`);--> statement-breakpoint
CREATE INDEX `custom_cabinet_packages_supplier_idx` ON `custom_cabinet_packages` (`supplier`);