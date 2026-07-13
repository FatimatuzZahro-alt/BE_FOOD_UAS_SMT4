import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Seed Kriteria (5 master kriteria)
  // "cost" = makin kecil nilainya makin bagus (Harga)
  // "benefit" = makin besar nilainya makin bagus (sisanya)
  const kriteriaData = [
    { nama: "Harga", jenis: "cost", bobot: 0.2 },
    { nama: "Fasilitas", jenis: "benefit", bobot: 0.2 },
    { nama: "FoodKualitas", jenis: "benefit", bobot: 0.2 },
    { nama: "Kenyamanan", jenis: "benefit", bobot: 0.2 },
    { nama: "Estetika", jenis: "benefit", bobot: 0.2 },
  ];

  const kriteriaMap: Record<string, number> = {};

  for (const k of kriteriaData) {
    const created = await prisma.kriteria.upsert({
      where: { nama: k.nama },
      update: { jenis: k.jenis, bobot: k.bobot },
      create: k,
    });
    kriteriaMap[k.nama] = created.id;
  }

  console.log("✅ Kriteria seeded:", kriteriaMap);

  // 2. Seed SubKriteria (KHUSUS Harga)
  // Rentang ini contoh — sesuaikan dengan avgPrice riil restoran di data kamu.
  // Karena Harga = cost, rentang termurah dapat skor tertinggi (5).
  const hargaId = kriteriaMap["Harga"];
  if (hargaId === undefined) {
  throw new Error("Kriteria 'Harga' tidak ditemukan di kriteriaMap — cek langkah seeding Kriteria di atas.");
}

  const subKriteriaHarga = [
    { keterangan: "≤ Rp 10.000", minNilai: 0, maxNilai: 10000, skor: 5 },
    { keterangan: "Rp 10.001 - Rp 20.000", minNilai: 10001, maxNilai: 20000, skor: 4 },
    { keterangan: "Rp 20.001 - Rp 35.000", minNilai: 20001, maxNilai: 35000, skor: 3 },
    { keterangan: "Rp 35.001 - Rp 50.000", minNilai: 35001, maxNilai: 50000, skor: 2 },
    { keterangan: "> Rp 50.000", minNilai: 50001, maxNilai: null, skor: 1 },
  ];

  // Hapus dulu sub kriteria Harga lama (kalau ada) biar seed idempotent,
  // baru insert ulang yang baru.
  await prisma.subKriteria.deleteMany({ where: { kriteriaId: hargaId } });

  await prisma.subKriteria.createMany({
    data: subKriteriaHarga.map((s) => ({ ...s, kriteriaId: hargaId })),
  });

  console.log("✅ SubKriteria (Harga) seeded");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
