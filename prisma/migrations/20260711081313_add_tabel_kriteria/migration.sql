-- CreateTable
CREATE TABLE `kriterias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `jenis` VARCHAR(191) NOT NULL,
    `bobot` DOUBLE NOT NULL DEFAULT 0,

    UNIQUE INDEX `kriterias_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
