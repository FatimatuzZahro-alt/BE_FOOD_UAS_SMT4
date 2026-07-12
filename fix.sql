ALTER TABLE `rekomendasi_hasil_detail` ADD CONSTRAINT `rekomendasi_hasil_detail_hasilId_fkey` FOREIGN KEY (`hasilId`) REFERENCES `rekomendasi_hasil`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rekomendasi_hasil_detail` ADD CONSTRAINT `rekomendasi_hasil_detail_kriteriaId_fkey` FOREIGN KEY (`kriteriaId`) REFERENCES `kriterias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
