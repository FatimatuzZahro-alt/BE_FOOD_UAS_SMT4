-- CreateTable
CREATE TABLE `rekomendasi_fasilitas_filters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestId` INTEGER NOT NULL,
    `name` ENUM('AC', 'MUSHOLA', 'KAMAR_MANDI', 'WIFI', 'SMOKING_AREA') NOT NULL,

    UNIQUE INDEX `rekomendasi_fasilitas_filters_requestId_name_key`(`requestId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rekomendasi_fasilitas_filters` ADD CONSTRAINT `rekomendasi_fasilitas_filters_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `rekomendasi_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
