/*
  Warnings:

  - You are about to drop the column `createdAt` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `date_event` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `events` table. All the data in the column will be lost.
  - You are about to drop the `speakers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `pembicara_id` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tanggal` to the `events` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `category_id` on the `events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "categories" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "events" DROP COLUMN "date_event",
DROP COLUMN "location",
ADD COLUMN     "pembicara_id" INTEGER NOT NULL,
ADD COLUMN     "tanggal" TIMESTAMP(3) NOT NULL,
DROP COLUMN "category_id",
ADD COLUMN     "category_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "speakers";

-- CreateTable
CREATE TABLE "speakersnp" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speakersnp_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_pembicara_id_fkey" FOREIGN KEY ("pembicara_id") REFERENCES "speakersnp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
