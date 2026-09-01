CREATE TABLE `cabinet_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`priceId` int NOT NULL,
	`productCodeSnapshot` varchar(80) NOT NULL,
	`descriptionSnapshot` text NOT NULL,
	`categorySnapshot` varchar(255) NOT NULL,
	`doorStyleSnapshot` enum('Shaker','Beveled','Eyed Edge') NOT NULL,
	`finishColorSnapshot` enum('White','Bisque','Walnut','Oak') NOT NULL,
	`unitPriceCentsSnapshot` int NOT NULL,
	`quantity` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cabinet_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cabinet_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdByUserId` int NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerAddress` text NOT NULL,
	`customerPhone` varchar(80) NOT NULL,
	`shippingMethod` varchar(100) NOT NULL,
	`estimateNumber` varchar(120) NOT NULL,
	`status` enum('Draft','Verified','Submitted') NOT NULL DEFAULT 'Draft',
	`verifiedAt` timestamp,
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cabinet_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cabinet_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`doorStyle` enum('Shaker','Beveled','Eyed Edge') NOT NULL,
	`finishColor` enum('White','Bisque','Walnut','Oak') NOT NULL,
	`unitPriceCents` int NOT NULL,
	`sourceColumn` varchar(32) NOT NULL,
	`sourceLabel` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cabinet_prices_id` PRIMARY KEY(`id`),
	CONSTRAINT `cabinet_prices_product_config_unique` UNIQUE(`productId`,`doorStyle`,`finishColor`)
);
--> statement-breakpoint
CREATE TABLE `cabinet_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceRow` int NOT NULL,
	`category` varchar(255) NOT NULL,
	`productCode` varchar(80) NOT NULL,
	`description` text NOT NULL,
	`boxOnlyCents` int,
	`sourceVersion` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cabinet_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `cabinet_products_productCode_unique` UNIQUE(`productCode`)
);
--> statement-breakpoint
CREATE TABLE `uscd_finishes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`finishName` varchar(120) NOT NULL,
	`skuPrefix` varchar(24) NOT NULL,
	`tierFactorMicros` int NOT NULL,
	`transferRequired` boolean NOT NULL DEFAULT false,
	`discontinued` boolean NOT NULL DEFAULT false,
	`sourceUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uscd_finishes_id` PRIMARY KEY(`id`),
	CONSTRAINT `uscd_finishes_finishName_unique` UNIQUE(`finishName`)
);
--> statement-breakpoint
CREATE TABLE `uscd_package_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`assemblyModsCents` int NOT NULL DEFAULT 0,
	`addonEachCents` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uscd_package_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uscd_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdByUserId` int NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerAddress` text NOT NULL,
	`customerPhone` varchar(80) NOT NULL,
	`shippingMethod` varchar(100) NOT NULL,
	`estimateNumber` varchar(120) NOT NULL,
	`warehouse` varchar(120) NOT NULL DEFAULT 'Pickup — Utah',
	`primaryFinishId` int,
	`status` enum('Draft','Verified','Submitted') NOT NULL DEFAULT 'Draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uscd_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uscd_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`finishId` int NOT NULL,
	`orderSku` varchar(120) NOT NULL,
	`unitPriceCents` int NOT NULL,
	`priceType` enum('Direct','Planning') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uscd_prices_id` PRIMARY KEY(`id`),
	CONSTRAINT `uscd_prices_product_finish_unique` UNIQUE(`productId`,`finishId`)
);
--> statement-breakpoint
CREATE TABLE `uscd_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceRow` int NOT NULL,
	`baseSku` varchar(100) NOT NULL,
	`productGroup` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`sourceVersion` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uscd_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `uscd_products_baseSku_unique` UNIQUE(`baseSku`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `cabinet_order_items` ADD CONSTRAINT `cabinet_order_items_orderId_cabinet_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `cabinet_orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cabinet_order_items` ADD CONSTRAINT `cabinet_order_items_productId_cabinet_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `cabinet_products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cabinet_order_items` ADD CONSTRAINT `cabinet_order_items_priceId_cabinet_prices_id_fk` FOREIGN KEY (`priceId`) REFERENCES `cabinet_prices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cabinet_orders` ADD CONSTRAINT `cabinet_orders_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cabinet_prices` ADD CONSTRAINT `cabinet_prices_productId_cabinet_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `cabinet_products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uscd_package_items` ADD CONSTRAINT `uscd_package_items_packageId_uscd_packages_id_fk` FOREIGN KEY (`packageId`) REFERENCES `uscd_packages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uscd_package_items` ADD CONSTRAINT `uscd_package_items_productId_uscd_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `uscd_products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uscd_packages` ADD CONSTRAINT `uscd_packages_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uscd_packages` ADD CONSTRAINT `uscd_packages_primaryFinishId_uscd_finishes_id_fk` FOREIGN KEY (`primaryFinishId`) REFERENCES `uscd_finishes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uscd_prices` ADD CONSTRAINT `uscd_prices_productId_uscd_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `uscd_products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uscd_prices` ADD CONSTRAINT `uscd_prices_finishId_uscd_finishes_id_fk` FOREIGN KEY (`finishId`) REFERENCES `uscd_finishes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cabinet_order_items_order_idx` ON `cabinet_order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `cabinet_orders_owner_idx` ON `cabinet_orders` (`createdByUserId`);--> statement-breakpoint
CREATE INDEX `cabinet_orders_status_idx` ON `cabinet_orders` (`status`);--> statement-breakpoint
CREATE INDEX `cabinet_products_category_idx` ON `cabinet_products` (`category`);--> statement-breakpoint
CREATE INDEX `uscd_package_items_package_idx` ON `uscd_package_items` (`packageId`);--> statement-breakpoint
CREATE INDEX `uscd_packages_status_idx` ON `uscd_packages` (`status`);--> statement-breakpoint
CREATE INDEX `uscd_prices_finish_idx` ON `uscd_prices` (`finishId`);--> statement-breakpoint
CREATE INDEX `uscd_products_group_idx` ON `uscd_products` (`productGroup`);