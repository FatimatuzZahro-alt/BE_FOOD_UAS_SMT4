import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Seed Kriteria (5 master kriteria)
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
    { keterangan: "Rp 20.001 - Rp 30.000", minNilai: 20001, maxNilai: 30000, skor: 3 },
    { keterangan: "Rp 30.001 - Rp 40.000", minNilai: 30001, maxNilai: 40000, skor: 2 },
    { keterangan: "> Rp 40.000", minNilai: 40001, maxNilai: null, skor: 1 },
  ];

  // Hapus dulu sub kriteria Harga lama (kalau ada) biar seed idempotent,
  // baru insert ulang yang baru.
  await prisma.subKriteria.deleteMany({ where: { kriteriaId: hargaId } });

  await prisma.subKriteria.createMany({
    data: subKriteriaHarga.map((s) => ({ ...s, kriteriaId: hargaId })),
  });

  console.log("✅ SubKriteria (Harga) seeded");

  // 3. Seed SubKriteria (FoodKualitas, Kenyamanan, Estetika)
  // Ketiganya sama-sama diambil dari rata-rata rating customer (skala 1.0-5.0),
  // jadi rentang labelnya disamakan biar konsisten.
  // Catatan: Fasilitas TIDAK dapat SubKriteria di sini, karena customer
  // filter Fasilitas pakai checklist nama fasilitas langsung (bukan dropdown rentang).
  const subKriteriaRating = [
    { keterangan: "Kurang", minNilai: 1.0, maxNilai: 2.0, skor: 1 },
    { keterangan: "Cukup", minNilai: 2.1, maxNilai: 3.0, skor: 2 },
    { keterangan: "Baik", minNilai: 3.1, maxNilai: 3.5, skor: 3 },
    { keterangan: "Sangat Baik", minNilai: 3.6, maxNilai: 4.5, skor: 4 },
    { keterangan: "Istimewa", minNilai: 4.6, maxNilai: 5.0, skor: 5 },
  ];

  const namaRatingKriteria = ["FoodKualitas", "Kenyamanan", "Estetika"];

  for (const nama of namaRatingKriteria) {
    const kriteriaId = kriteriaMap[nama];
    if (kriteriaId === undefined) {
      throw new Error(`Kriteria '${nama}' tidak ditemukan di kriteriaMap — cek langkah seeding Kriteria di atas.`);
    }

    await prisma.subKriteria.deleteMany({ where: { kriteriaId } });
    await prisma.subKriteria.createMany({
      data: subKriteriaRating.map((s) => ({ ...s, kriteriaId })),
    });

    console.log(`✅ SubKriteria (${nama}) seeded`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });