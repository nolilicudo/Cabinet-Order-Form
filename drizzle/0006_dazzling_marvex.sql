ALTER TABLE `countertop_slabs` ADD `imageUrl` text;--> statement-breakpoint
ALTER TABLE `countertop_slabs` ADD `supplierMaterialUrl` text;--> statement-breakpoint
ALTER TABLE `countertop_slabs` ADD `imageFallbackLabel` varchar(160) DEFAULT 'Supplier visual reference' NOT NULL;