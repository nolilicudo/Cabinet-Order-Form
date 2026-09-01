CREATE TABLE `countertop_labor_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(120) NOT NULL,
	`materialCentsPerSquareFoot` int NOT NULL DEFAULT 3500,
	`nonEasedEdgeCentsPerLinearFoot` int NOT NULL DEFAULT 500,
	`sinkCutoutCentsEach` int NOT NULL DEFAULT 10000,
	`vanitySinkCutoutCentsEach` int NOT NULL DEFAULT 10000,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `countertop_labor_rates_id` PRIMARY KEY(`id`),
	CONSTRAINT `countertop_labor_rates_label_unique` UNIQUE(`label`)
);
--> statement-breakpoint
CREATE TABLE `countertop_slabs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplier` enum('MSI','Cosentino') NOT NULL,
	`collection` varchar(160) NOT NULL,
	`materialName` varchar(255) NOT NULL,
	`finish` varchar(80) NOT NULL,
	`thicknessMm` int,
	`sourceItemId` varchar(160),
	`sourcePriceCents` int NOT NULL,
	`sourcePriceBasis` varchar(255) NOT NULL,
	`sourceDocument` varchar(255) NOT NULL,
	`discontinued` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `countertop_slabs_id` PRIMARY KEY(`id`),
	CONSTRAINT `countertop_slabs_supplier_material_unique` UNIQUE(`supplier`,`collection`,`materialName`,`finish`,`thicknessMm`)
);
--> statement-breakpoint
ALTER TABLE `countertop_takeoff_runs` ADD `sinkCutoutCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoff_runs` ADD `vanitySinkCutoutCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `slabId` int;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `supplierSlabPriceCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `supplierSlabPriceBasis` varchar(255) DEFAULT 'Supplier reference' NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `laborRateId` int;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `sinkCutoutCentsEach` int DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `vanitySinkCutoutCentsEach` int DEFAULT 10000 NOT NULL;--> statement-breakpoint
CREATE INDEX `countertop_slabs_supplier_idx` ON `countertop_slabs` (`supplier`);--> statement-breakpoint
CREATE INDEX `countertop_slabs_collection_idx` ON `countertop_slabs` (`collection`);--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD CONSTRAINT `countertop_takeoffs_slabId_countertop_slabs_id_fk` FOREIGN KEY (`slabId`) REFERENCES `countertop_slabs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD CONSTRAINT `countertop_takeoffs_laborRateId_countertop_labor_rates_id_fk` FOREIGN KEY (`laborRateId`) REFERENCES `countertop_labor_rates`(`id`) ON DELETE no action ON UPDATE no action;