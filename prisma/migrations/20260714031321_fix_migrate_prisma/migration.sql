/*
  Warnings:

  - You are about to drop the column `facilities` on the `rekomendasi_requests` table. All the data in the column will be lost.
  - You are about to drop the column `keyword` on the `rekomendasi_requests` table. All the data in the column will be lost.
  - You are about to drop the column `maxPrice` on the `rekomendasi_requests` table. All the data in the column will be lost.
  - You are about to alter the column `category` on the `rekomendasi_requests` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(5))`.

*/
-- AlterTable
ALTER TABLE `rekomendasi_requests` DROP COLUMN `facilities`,
    DROP COLUMN `keyword`,
    DROP COLUMN `maxPrice`,
    ADD COLUMN `menuCategory` ENUM('MAKANAN', 'MINUMAN', 'DESSERT', 'SNACK') NULL,
    MODIFY `category` ENUM('FAST_FOOD', 'CAFE_COFFEE', 'FAMILY_FRIENDLY', 'FINE_DINING') NULL;
