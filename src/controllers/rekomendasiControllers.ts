import { Request, Response } from "express";
import prisma from "../lib/db.js";
import { FasilitasName } from "@prisma/client";

// Pke metode WP
//
// Sekarang jenis kriteria (cost/benefit) diambil dari tabel `Kriteria`,
// bukan hardcode lagi. Jadi kalau nanti mau ubah Harga jadi benefit
// (atau nambah kriteria baru), tinggal ubah di database, kode ini
// otomatis ikut menyesuaikan.
//
// Rumus:
//   S(i) = Π (skor_kriteria ^ (±bobot))   → pangkat negatif kalau jenis = "cost"
//   V(i) = S(i) / Σ semua S               → normalisasi

// key yang dikirim FE (body.weights) → nama Kriteria di database
const KEY_TO_NAMA: Record<string, string> = {
    harga: "Harga",
    fasilitas: "Fasilitas",
    foodKualitas: "FoodKualitas",
    kenyamanan: "Kenyamanan",
    estetika: "Estetika",
};

// Helper: cari skor 1-5 untuk avgPrice restaurant berdasarkan rentang
// yang tersimpan di tabel SubKriteria (bukan hardcode lagi)
const getSkorHarga = (
    avgPrice: number,
    subKriteriaHarga: { minNilai: number | null; maxNilai: number | null; skor: number }[]
): number => {
    for (const sk of subKriteriaHarga) {
        const min = sk.minNilai ?? 0;
        const max = sk.maxNilai ?? Infinity;
        if (avgPrice >= min && avgPrice <= max) return sk.skor;
    }
    // fallback kalau avgPrice di luar semua rentang yang didefinisikan
    return 1;
};

// Helper: konversi jumlah fasilitas ke skala 1-5 (RANGE TETAP)
// (tetap hardcode, karena sesuai desain: fasilitas & rating lain
// sudah alami di skala 1-5, cuma Harga yang butuh tabel SubKriteria)
const konversiFasilitasKeSkala = (jumlahFasilitas: number): number => {
    if (jumlahFasilitas >= 5) return 5;
    if (jumlahFasilitas <= 0) return 1;
    return jumlahFasilitas;
};

// 1. mendapatkan rekomendasi restaurant
export const getRekomendasi = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { keyword, maxPrice, category, facilities, weights } = req.body;

    // validasi weights
    if (!weights) {
        return res.status(400).json({ message: "Bobot kriteria harus diisi" });
    }

    const { harga, foodKualitas, kenyamanan, estetika, fasilitas } = weights;

    if (harga === undefined || foodKualitas === undefined ||
        kenyamanan === undefined || estetika === undefined ||
        fasilitas === undefined) {
        return res.status(400).json({ message: "Semua bobot harus diisi" });
    }

    const totalWeight = harga + foodKualitas + kenyamanan + estetika + fasilitas;
    if (totalWeight === 0) {
        return res.status(400).json({ message: "Total bobot tidak boleh 0" });
    }

    // normalisasi bobot agar totalnya = 1, key-nya masih sesuai input FE
    const inputWeights: Record<string, number> = {
        harga: harga / totalWeight,
        foodKualitas: foodKualitas / totalWeight,
        kenyamanan: kenyamanan / totalWeight,
        estetika: estetika / totalWeight,
        fasilitas: fasilitas / totalWeight,
    };

    // ambil semua master Kriteria (id + jenis) sekali di awal
    const kriteriaList = await prisma.kriteria.findMany();
    if (kriteriaList.length !== 5) {
        return res.status(500).json({ message: "Master data Kriteria belum lengkap, jalankan seed dulu" });
    }

    // map nama -> { id, jenis } biar gampang di-lookup
    const kriteriaByNama = new Map(kriteriaList.map((k) => [k.nama, k]));

    // ambil rentang SubKriteria khusus Harga
    const hargaKriteria = kriteriaByNama.get("Harga")!;
    const subKriteriaHarga = await prisma.subKriteria.findMany({
        where: { kriteriaId: hargaKriteria.id },
        orderBy: { minNilai: "asc" },
    });

    // ambil data restaurant sesuai filter (Opsi A: filter dulu, baru WP)
    const restaurants = await prisma.restaurant.findMany({
        where: {
            ...(keyword ? {
                OR: [
                    { name: { contains: String(keyword) } },
                    { address: { contains: String(keyword) } },
                ]
            } : {}),
            ...(maxPrice ? { avgPrice: { lte: Number(maxPrice) } } : {}),
            ...(category ? {
                menus: {
                    some: {
                        category: category as any,
                        isAvailable: true
                    }
                }
            } : {}),
            ...(facilities ? {
                fasilitases: {
                    some: {
                        name: facilities as FasilitasName,
                        available: true
                    }
                }
            } : {}),
        },
        include: {
            fasilitases: { where: { available: true } }
        }
    });

    if (restaurants.length === 0) {
        return res.status(404).json({ message: "Tidak ada restaurant yang sesuai kriteria" });
    }

    // Susun daftar kriteria yang dipakai untuk hitung WP: nama, id, jenis, bobot, skor per restoran
    // (urutan ini yang dipakai konsisten di seluruh perhitungan & penyimpanan detail)
    const kriteriaTerpakai = Object.entries(KEY_TO_NAMA).map(([key, nama]) => {
        const k = kriteriaByNama.get(nama)!;
        return {
            key,               // key dari body.weights, misal "harga"
            nama,              // nama di DB, misal "Harga"
            kriteriaId: k.id,
            jenis: k.jenis,    // "cost" | "benefit"
            bobot: inputWeights[key]!,
        };
    });

    // hitung S(i) untuk setiap restaurant, sambil simpan breakdown per kriteria
    // hindari nilai 0 agar tidak error saat pangkat (pakai minimal 0.01)
    const scored = restaurants.map((r) => {
        const skorPerKriteria: Record<string, number> = {
            harga: Math.max(getSkorHarga(r.avgPrice, subKriteriaHarga), 0.01),
            fasilitas: Math.max(konversiFasilitasKeSkala(r.fasilitasScore), 0.01),
            foodKualitas: Math.max(r.avgFoodKualitas, 0.01),
            kenyamanan: Math.max(r.avgKenyamanan, 0.01),
            estetika: Math.max(r.avgEstetika, 0.01),
        };

        let sScore = 1;
        const detailPerKriteria = kriteriaTerpakai.map((kt) => {
            const skor = skorPerKriteria[kt.key]!;
            const sign = kt.jenis === "cost" ? -1 : 1;
            const nilaiTernormalisasi = Math.pow(skor, sign * kt.bobot);
            sScore *= nilaiTernormalisasi;

            return {
                kriteriaId: kt.kriteriaId,
                nama: kt.nama,
                skor,
                bobot: kt.bobot,
                nilaiTernormalisasi,
            };
        });

        return { restaurant: r, sScore, detailPerKriteria };
    });

    // hitung V(i) = normalisasi
    const totalScore = scored.reduce((sum, s) => sum + s.sScore, 0);

    const ranked = scored
        .map((s) => ({ ...s, vScore: s.sScore / totalScore }))
        .sort((a, b) => b.vScore - a.vScore)
        .map((s, index) => ({ ...s, rank: index + 1 }));

    // simpan request, weights, hasil, DAN breakdown detail ke DB
    const request = await prisma.rekomendasiRequest.create({
        data: {
            userId,
            keyword: keyword ?? null,
            maxPrice: maxPrice ?? null,
            category: category ?? null,
            facilities: facilities ?? null,
            weights: {
                create: kriteriaTerpakai.map((kt) => ({
                    kriteriaId: kt.kriteriaId,
                    weight: kt.bobot,
                })),
            },
            results: {
                create: ranked.map((r) => ({
                    restaurantId: r.restaurant.id,
                    rank: r.rank,
                    wpScore: r.vScore,
                    details: {
                        create: r.detailPerKriteria.map((d) => ({
                            kriteriaId: d.kriteriaId,
                            skor: d.skor,
                            bobot: d.bobot,
                            nilaiTernormalisasi: d.nilaiTernormalisasi,
                        })),
                    },
                })),
            },
        },
    });

    // return hasil (termasuk breakdown biar FE bisa nampilin tabel perhitungan)
    const result = ranked.map((r) => ({
        rank: r.rank,
        wpScore: parseFloat(r.vScore.toFixed(4)),
        sScore: parseFloat(r.sScore.toFixed(4)),
        breakdown: r.detailPerKriteria.map((d) => ({
            kriteria: d.nama,
            skor: d.skor,
            bobot: parseFloat(d.bobot.toFixed(4)),
            nilaiTernormalisasi: parseFloat(d.nilaiTernormalisasi.toFixed(4)),
        })),
        restaurant: {
            id: r.restaurant.id,
            name: r.restaurant.name,
            address: r.restaurant.address,
            imageUrl: r.restaurant.imageUrl,
            avgPrice: r.restaurant.avgPrice,
            avgFoodKualitas: r.restaurant.avgFoodKualitas,
            avgKenyamanan: r.restaurant.avgKenyamanan,
            avgEstetika: r.restaurant.avgEstetika,
            fasilitasScore: r.restaurant.fasilitasScore,
            totalRating: r.restaurant.totalRating,
            fasilitases: r.restaurant.fasilitases,
        },
    }));

    res.json({
        message: "Rekomendasi berhasil dibuat",
        requestId: request.id,
        totalRestaurant: result.length,
        weights: Object.fromEntries(kriteriaTerpakai.map((kt) => [kt.key, kt.bobot])),
        data: result,
    });
};

// 2. menampilkan history rekomendasi user
export const getRekomendasiHistory = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const history = await prisma.rekomendasiRequest.findMany({
        where: { userId },
        include: {
            weights: { include: { kriteria: true } },
            results: {
                include: {
                    restaurant: {
                        select: { id: true, name: true, imageUrl: true, avgPrice: true }
                    }
                },
                orderBy: { rank: "asc" }
            }
        },
        orderBy: { createdAt: "desc" },
        take: 10
    });

    res.json(history);
};

// 3. menampilkan detail rekomendasi berdasarkan id (termasuk breakdown per kriteria)
export const getRekomendasiDetail = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const userId = (req as any).user.userId;

    const request = await prisma.rekomendasiRequest.findUnique({
        where: { id },
        include: {
            weights: { include: { kriteria: true } },
            results: {
                include: {
                    restaurant: { include: { fasilitases: true } },
                    details: { include: { kriteria: true } },
                },
                orderBy: { rank: "asc" }
            }
        }
    });

    if (!request) {
        return res.status(404).json({ message: "Data rekomendasi tidak ditemukan" });
    }

    if (request.userId !== userId) {
        return res.status(403).json({ message: "Akses ditolak" });
    }

    res.json(request);
};