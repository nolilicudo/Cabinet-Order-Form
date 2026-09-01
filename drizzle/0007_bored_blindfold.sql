ALTER TABLE `countertop_labor_rates` ADD `trimCentsPerLinearFoot` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoff_runs` ADD `runType` varchar(40) DEFAULT 'Perimeter' NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoff_runs` ADD `trimMilliFeet` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoff_runs` ADD `windowHeightMilliInches` int;--> statement-breakpoint
ALTER TABLE `countertop_takeoff_runs` ADD `integratedSink` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoff_runs` ADD `seamPreference` varchar(80) DEFAULT 'Auto plan' NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `trimCentsPerLinearFoot` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `slabLengthMilliInches` int DEFAULT 126000 NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `slabWidthMilliInches` int DEFAULT 63000 NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `planningWasteBasisPoints` int DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `edgeMode` varchar(40) DEFAULT 'Shared' NOT NULL;--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `sharedEdgeProfile` varchar(80);--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `perimeterEdgeProfile` varchar(80);--> statement-breakpoint
ALTER TABLE `countertop_takeoffs` ADD `islandEdgeProfile` varchar(80);