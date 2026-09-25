ALTER TABLE `custom_cabinet_package_items` DROP FOREIGN KEY `custom_cabinet_package_items_packageId_custom_cabinet_packages_id_fk`;
--> statement-breakpoint
ALTER TABLE `custom_cabinet_package_items` ADD CONSTRAINT `cc_pkg_items_pkg_id_fk` FOREIGN KEY (`packageId`) REFERENCES `custom_cabinet_packages`(`id`) ON DELETE no action ON UPDATE no action;