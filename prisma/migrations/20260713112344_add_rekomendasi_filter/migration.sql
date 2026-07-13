-- CreateTable
CREATE TABLE `rekomendasi_filters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestId` INTEGER NOT NULL,
    `kriteriaId` INTEGER NOT NULL,
    `subKriteriaId` INTEGER NOT NULL,

    UNIQUE INDEX `rekomendasi_filters_requestId_kriteriaId_key`(`requestId`, `kriteriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rekomendasi_filters` ADD CONSTRAINT `rekomendasi_filters_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `rekomendasi_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rekomendasi_filters` ADD CONSTRAINT `rekomendasi_filters_kriteriaId_fkey` FOREIGN KEY (`kriteriaId`) REFERENCES `kriterias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rekomendasi_filters` ADD CONSTRAINT `rekomendasi_filters_subKriteriaId_fkey` FOREIGN KEY (`subKriteriaId`) REFERENCES `sub_kriterias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
