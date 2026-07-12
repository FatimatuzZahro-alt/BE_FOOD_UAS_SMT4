-- AddForeignKey
ALTER TABLE `rekomendasi_weights` ADD CONSTRAINT `rekomendasi_weights_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `rekomendasi_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
