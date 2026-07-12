/*
  Warnings:

  - You are about to drop the column `criteria` on the `rekomendasi_weights` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[requestId,kriteriaId]` on the table `rekomendasi_weights` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kriteriaId` to the `rekomendasi_weights` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `rekomendasi_weights` DROP FOREIGN KEY `rekomendasi_weights_requestId_fkey`;

-- DropIndex
DROP INDEX `rekomendasi_weights_requestId_criteria_key` ON `rekomendasi_weights`;

-- AlterTable
ALTER TABLE `rekomendasi_weights` DROP COLUMN `criteria`,
    ADD COLUMN `kriteriaId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `rekomendasi_hasil_detail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hasilId` INTEGER NOT NULL,
    `kriteriaId` INTEGER NOT NULL,
    `skor` DOUBLE NOT NULL,
    `bobot` DOUBLE NOT NULL,
    `nilaiTernormalisasi` DOUBLE NOT NULL,

    UNIQUE INDEX `rekomendasi_hasil_detail_hasilId_kriteriaId_key`(`hasilId`, `kriteriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `rekomendasi_weights_requestId_kriteriaId_key` ON `rekomendasi_weights`(`requestId`, `kriteriaId`);


-- AddForeignKey
ALTER TABLE `rekomendasi_weights` ADD CONSTRAINT `rekomendasi_weights_kriteriaId_fkey` FOREIGN KEY (`kriteriaId`) REFERENCES `kriterias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rekomendasi_hasil_detail` ADD CONSTRAINT `rekomendasi_hasil_detail_hasilId_fkey` FOREIGN KEY (`hasilId`) REFERENCES `rekomendasi_hasil`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rekomendasi_hasil_detail` ADD CONSTRAINT `rekomendasi_hasil_detail_kriteriaId_fkey` FOREIGN KEY (`kriteriaId`) REFERENCES `kriterias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
