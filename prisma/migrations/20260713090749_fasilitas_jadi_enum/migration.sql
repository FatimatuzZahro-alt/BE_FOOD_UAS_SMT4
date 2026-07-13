/*
  Warnings:

  - You are about to alter the column `name` on the `fasilitases` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.
  - Added the required column `category` to the `restaurants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `fasilitases` MODIFY `name` ENUM('AC', 'MUSHOLA', 'KAMAR_MANDI', 'WIFI', 'SMOKING_AREA') NOT NULL;

-- AlterTable
ALTER TABLE `restaurants` ADD COLUMN `category` ENUM('FAST_FOOD', 'CAFE_COFFEE', 'FAMILY_FRIENDLY', 'FINE_DINING') NOT NULL;
