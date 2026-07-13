import { Request, Response } from "express";
import prisma from "../lib/db.js";
import { FasilitasName, RestaurantCategory, MenuCategory } from "@prisma/client";

// Pke metode WP
//
// Jenis kriteria (cost/benefit) DAN bobot diambil dari tabel `Kriteria`.
// Customer TIDAK input bobot — bobot udah dikonfigurasi di database
// (lewat seed atau Prisma Studio), customer cuma pilih FILTER aja.
//
// Rumus:
//   S(i) = Π (skor_kriteria ^ (±bobot))   → pangkat negatif kalau jenis = "cost"
//   V(i) = S(i) / Σ semua S               → normalisasi
//
// Mekanisme filter sebelum WP dihitung:
// - Harga, FoodKualitas, Kenyamanan, Estetika → dropdown SubKriteria (body.filters, isi subKriteriaId)
// - Fasilitas → checklist nama fasilitas langsung (body.fasilitasNames, array of FasilitasName)
// - category → filter kategori RESTORAN (RestaurantCategory: FAST_FOOD, CAFE_COFFEE, dst)
// - menuCategory → filter kategori MENU (MenuCategory: MAKANAN, MINUMAN, dst)

// key kriteria → nama Kriteria di database
const KEY_TO_NAMA: Record<string, string> = {
    harga: "Harga",
    fasilitas: "Fasilitas",
    foodKualitas: "FoodKualitas",
    kenyamanan: "Kenyamanan",
    estetika: "Estetika",
};

// Helper: cari skor 1-5 untuk avgPrice restaurant berdasarkan rentang SubKriteria
const getSkorHarga = (
    avgPrice: number,
    subKriteriaHarga: { minNilai: number | null; maxNilai: number | null; skor: number }[]
): number => {
    for (const sk of subKriteriaHarga) {
        const min = sk.minNilai ?? 0;
        const max = sk.maxNilai ?? Infinity;
        if (avgPrice >= min && avgPrice <= max) return sk.skor;
    }
    return 1;
};

// Helper: konversi jumlah fasilitas ke skala 1-5 (tetap dipakai buat hitung WP,
// meskipun filternya sekarang berbasis nama fasilitas, bukan jumlah)
const konversiFasilitasKeSkala = (jumlahFasilitas: number): number => {
    if (jumlahFasilitas >= 5) return 5;
    if (jumlahFasilitas <= 0) return 1;
    return jumlahFasilitas;
};

// Helper: ambil nilai mentah restoran sesuai key kriteria (buat filter SubKriteria)
const getRawValue = (
    restaurant: { avgPrice: number; fasilitasScore: number; avgFoodKualitas: number; avgKenyamanan: number; avgEstetika: number },
    key: string
): number => {
    switch (key) {
        case "harga":
            return restaurant.avgPrice;
        case "foodKualitas":
            return restaurant.avgFoodKualitas;
        case "kenyamanan":
            return restaurant.avgKenyamanan;
        case "estetika":
            return restaurant.avgEstetika;
        default:
            return 0;
    }
};

// 1. mendapatkan rekomendasi restaurant
export const getRekomendasi = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { keyword, maxPrice, category, menuCategory, facilities, filters, fasilitasNames } = req.body;
    // 👆 "weights" DIHAPUS — customer nggak input bobot lagi
    // 👆 "category" = filter RestaurantCategory, "menuCategory" = filter MenuCategory (dua hal beda)

    // Validasi awal: pastikan value enum yang dikirim valid, biar nggak jadi
    // PrismaClientValidationError (500) kalau salah ketik / salah value dari frontend.
    if (category && !Object.values(RestaurantCategory).includes(category)) {
        return res.status(400).json({ message: `Category restoran '${category}' tidak valid` });
    }
    if (menuCategory && !Object.values(MenuCategory).includes(menuCategory)) {
        return res.status(400).json({ message: `Category menu '${menuCategory}' tidak valid` });
    }

    // ambil semua master Kriteria (id + jenis + bobot) sekali di awal
    const kriteriaList = await prisma.kriteria.findMany();
    if (kriteriaList.length !== 5) {
        return res.status(500).json({ message: "Master data Kriteria belum lengkap, jalankan seed dulu" });
    }

    const kriteriaByNama = new Map(kriteriaList.map((k) => [k.nama, k]));

    // Validasi total bobot di database harus = 1 (jaga-jaga kalau ada yang
    // ubah manual lewat Prisma Studio dan lupa nyesuain totalnya)
    const totalBobotDb = kriteriaList.reduce((sum, k) => sum + k.bobot, 0);
    if (Math.abs(totalBobotDb - 1) > 0.001) {
        return res.status(500).json({ message: "Total bobot Kriteria di database tidak sama dengan 1, cek data Kriteria" });
    }

    const hargaKriteria = kriteriaByNama.get("Harga");
    if (!hargaKriteria) {
        return res.status(500).json({ message: "Kriteria 'Harga' tidak ditemukan di database, cek data Kriteria" });
    }
    const subKriteriaHarga = await prisma.subKriteria.findMany({
        where: { kriteriaId: hargaKriteria.id },
        orderBy: { minNilai: "asc" },
    });

    // Validasi & ambil detail SubKriteria filter (Harga, FoodKualitas, Kenyamanan, Estetika)
    // Fasilitas TIDAK masuk sini — ditangani lewat fasilitasNames di bawah.
    const filterEntries: {
        key: string;
        kriteriaId: number;
        subKriteriaId: number;
        minNilai: number | null;
        maxNilai: number | null;
    }[] = [];

    if (filters) {
        for (const [key, nama] of Object.entries(KEY_TO_NAMA)) {
            if (key === "fasilitas") continue; // fasilitas pakai mekanisme checklist, bukan SubKriteria

            const subKriteriaId = filters[key];
            if (subKriteriaId === undefined || subKriteriaId === null || subKriteriaId === "") continue;

            const parsedSubKriteriaId = Number(subKriteriaId);
            if (!Number.isFinite(parsedSubKriteriaId)) {
                return res.status(400).json({ message: `SubKriteria untuk '${nama}' harus berupa angka` });
            }

            const kriteria = kriteriaByNama.get(nama);
            if (!kriteria) {
                return res.status(500).json({ message: `Kriteria '${nama}' tidak ditemukan di database` });
            }

            const sub = await prisma.subKriteria.findUnique({
                where: { id: parsedSubKriteriaId },
            });

            if (!sub || sub.kriteriaId !== kriteria.id) {
                return res.status(400).json({ message: `SubKriteria untuk '${nama}' tidak valid` });
            }

            filterEntries.push({
                key,
                kriteriaId: kriteria.id,
                subKriteriaId: sub.id,
                minNilai: sub.minNilai,
                maxNilai: sub.maxNilai,
            });
        }
    }

    // Validasi fasilitasNames (kalau dikirim)
    const validFasilitasNames: FasilitasName[] = Array.isArray(fasilitasNames) ? fasilitasNames : [];

    // ambil data restaurant sesuai filter lama (keyword/maxPrice/category/menuCategory/facilities)
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
                category: category as RestaurantCategory   // filter kategori RESTORAN
            } : {}),
            ...(menuCategory ? {
                menus: {
                    some: {
                        category: menuCategory as MenuCategory,   // filter kategori MENU
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

    // Filter tambahan: restoran harus punya SEMUA fasilitas yang dicentang customer
    const filteredByFasilitas = restaurants.filter((r) => {
        if (validFasilitasNames.length === 0) return true;
        const namaFasilitasResto = r.fasilitases.map((f) => f.name);
        return validFasilitasNames.every((nama) => namaFasilitasResto.includes(nama));
    });

    // Filter tambahan: berdasarkan pilihan dropdown SubKriteria (Harga/FoodKualitas/Kenyamanan/Estetika)
    const filteredRestaurants = filteredByFasilitas.filter((r) => {
        return filterEntries.every((f) => {
            const rawValue = getRawValue(r, f.key);
            const min = f.minNilai ?? -Infinity;
            const max = f.maxNilai ?? Infinity;
            return rawValue >= min && rawValue <= max;
        });
    });

    if (filteredRestaurants.length === 0) {
        return res.status(404).json({ message: "Tidak ada restaurant yang sesuai filter yang dipilih" });
    }

    // Bobot sekarang diambil LANGSUNG dari database (kolom Kriteria.bobot),
    // bukan dari input customer lagi.
    const kriteriaTerpakai = Object.entries(KEY_TO_NAMA).map(([key, nama]) => {
        const k = kriteriaByNama.get(nama)!;
        return {
            key,
            nama,
            kriteriaId: k.id,
            jenis: k.jenis,
            bobot: k.bobot,   // 👈 dari database
        };
    });

    const scored = filteredRestaurants.map((r) => {
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

    const totalScore = scored.reduce((sum, s) => sum + s.sScore, 0);

    const ranked = scored
        .map((s) => ({ ...s, vScore: s.sScore / totalScore }))
        .sort((a, b) => b.vScore - a.vScore)
        .map((s, index) => ({ ...s, rank: index + 1 }));

    // simpan request, weights (dari DB), filters, fasilitasFilters, hasil, dan breakdown detail
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
            filters: {
                create: filterEntries.map((f) => ({
                    kriteriaId: f.kriteriaId,
                    subKriteriaId: f.subKriteriaId,
                })),
            },
            fasilitasFilters: {
                create: validFasilitasNames.map((name) => ({ name })),
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

    // return hasil (breakdown tetap nunjukin bobot yang dipakai — informasi transparansi,
    // bukan input, jadi tetap aman ditampilin ke customer di bagian detail hasil)
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
            filters: { include: { kriteria: true, subKriteria: true } },
            fasilitasFilters: true,
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

// 3. menampilkan detail rekomendasi berdasarkan id
export const getRekomendasiDetail = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const userId = (req as any).user.userId;

    const request = await prisma.rekomendasiRequest.findUnique({
        where: { id },
        include: {
            weights: { include: { kriteria: true } },
            filters: { include: { kriteria: true, subKriteria: true } },
            fasilitasFilters: true,
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