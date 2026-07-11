-- CreateTable
CREATE TABLE `sub_kriterias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kriteriaId` INTEGER NOT NULL,
    `keterangan` VARCHAR(191) NOT NULL,
    `minNilai` DOUBLE NULL,
    `maxNilai` DOUBLE NULL,
    `skor` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sub_kriterias` ADD CONSTRAINT `sub_kriterias_kriteriaId_fkey` FOREIGN KEY (`kriteriaId`) REFERENCES `kriterias`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
