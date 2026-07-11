import { Request, Response } from "express";
import prisma from "../lib/db.js";

// Pke metode WP
// Kriteria:
//   harga         COST    (makin murah makin baik) → pangkat negatif (-W)
//   foodKualitas  BENEFIT (makin tinggi makin baik) → pangkat positif (+W)
//   kenyamanan    BENEFIT
//   estetika      BENEFIT
//   fasilitas     BENEFIT
//
// Rumus:
//   S(i) = (harga^-W) * (foodKualitas^W) * (kenyamanan^W) * (estetika^W) * (fasilitas^W)
//   V(i) = S(i) / jumlah semua S  ← normalisasi

//  Helper: konversi harga ke skala 1-5 (RANGE TETAP, bukan dinamis) 
// Range Harga                   Nilai (Skala Cost)
// Rp 0      - Rp 10.000         5 (sangat murah)
// Rp 10.001 - Rp 20.000         4 (murah)
// Rp 20.001 - Rp 30.000         3 (sedang)
// Rp 30.001 - Rp 40.000         2 (mahal)
// Rp 40.001 ke atas             1 (sangat mahal)
const konversiHargaKeSkala = (harga: number): number => {
    if (harga <= 10000) return 5;
    if (harga <= 20000) return 4;
    if (harga <= 30000) return 3;
    if (harga <= 40000) return 2;
    return 1;
}

// Helper: konversi jumlah fasilitas ke skala 1-5 (RANGE TETAP)
// Jumlah Fasilitas = Nilai (Skala Benefit)
// 1                  1
// 2                  2
// 3                  3
// 4                  4
// 5 atau lebih       5
const konversiFasilitasKeSkala = (jumlahFasilitas: number): number => {
    if (jumlahFasilitas >= 5) return 5;
    if (jumlahFasilitas <= 0) return 1;
    return jumlahFasilitas;
}

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

    // normalisasi bobot agar totalnya = 1
    const totalWeight = harga + foodKualitas + kenyamanan + estetika + fasilitas;
    if (totalWeight === 0) {
        return res.status(400).json({ message: "Total bobot tidak boleh 0" });
    }

    const W = {
        harga: harga / totalWeight,
        foodKualitas: foodKualitas / totalWeight,
        kenyamanan: kenyamanan / totalWeight,
        estetika: estetika / totalWeight,
        fasilitas: fasilitas / totalWeight,
    };

    // ambil data restaurant sesuai filter
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
                        name: { contains: String(facilities) },
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

    // hitung S(i) untuk setiap restaurant
    // hindari nilai 0 agar tidak error saat pangkat (pakai minimal 0.01)
    const scored = restaurants.map((r: any) => {
        const nilaiHarga = Math.max(konversiHargaKeSkala(r.avgPrice), 0.01);
        const nilaiFood = Math.max(r.avgFoodKualitas, 0.01);
        const nilaiKenyamanan = Math.max(r.avgKenyamanan, 0.01);
        const nilaiEstetika = Math.max(r.avgEstetika, 0.01);
        const nilaiFasilitas = Math.max(konversiFasilitasKeSkala(r.fasilitasScore), 0.01);

        const sScore =
            Math.pow(nilaiHarga, -W.harga) *
            Math.pow(nilaiFood, W.foodKualitas) *
            Math.pow(nilaiKenyamanan, W.kenyamanan) *
            Math.pow(nilaiEstetika, W.estetika) *
            Math.pow(nilaiFasilitas, W.fasilitas);

        return {
            restaurant: r,
            sScore,
            nilaiSkala: {
                harga: nilaiHarga,
                foodKualitas: nilaiFood,
                kenyamanan: nilaiKenyamanan,
                estetika: nilaiEstetika,
                fasilitas: nilaiFasilitas,
            }
        };
    });

    // hitung V(i) = normalisasi
    const totalScore = scored.reduce((sum: number, s: any) => sum + s.sScore, 0);

    const ranked = scored
        .map((s: any) => ({
            ...s,
            vScore: s.sScore / totalScore
        }))
        .sort((a: any, b: any) => b.vScore - a.vScore)
        .map((s: any, index: number) => ({ ...s, rank: index + 1 }));

    // simpan request & hasil ke DB
    const request = await prisma.rekomendasiRequest.create({
        data: {
            userId,
            keyword: keyword ?? null,
            maxPrice: maxPrice ?? null,
            category: category ?? null,
            facilities: facilities ?? null,
            weights: {
                create: Object.entries(W).map(([criteria, weight]) => ({
                    criteria,
                    weight
                }))
            },
            results: {
                create: ranked.map((r: any) => ({
                    restaurantId: r.restaurant.id,
                    rank: r.rank,
                    wpScore: r.vScore
                }))
            }
        }
    });

    // return hasil
    const result = ranked.map((r: any) => ({
        rank: r.rank,
        wpScore: parseFloat(r.vScore.toFixed(4)),
        nilaiSkala: r.nilaiSkala, // ← tampilkan nilai skala yg dipakai untuk hitung
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
        }
    }));

    res.json({
        message: "Rekomendasi berhasil dibuat",
        requestId: request.id,
        totalRestaurant: result.length,
        weights: W,
        data: result
    });
}

// 2. menampilkan history rekomendasi user
export const getRekomendasiHistory = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const history = await prisma.rekomendasiRequest.findMany({
        where: { userId },
        include: {
            weights: true,
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
}

// 3. menampilkan detail rekomendasi berdasarkan id
export const getRekomendasiDetail = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const userId = (req as any).user.userId;

    const request = await prisma.rekomendasiRequest.findUnique({
        where: { id },
        include: {
            weights: true,
            results: {
                include: {
                    restaurant: {
                        include: { fasilitases: true }
                    }
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
}