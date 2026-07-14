import { Request, Response } from "express";
import prisma from "../lib/db.js";
import { FasilitasName, RestaurantCategory, MenuCategory } from "@prisma/client";

const KEY_TO_NAMA: Record<string, string> = {
    harga: "Harga",
    fasilitas: "Fasilitas",
    foodKualitas: "FoodKualitas",
    kenyamanan: "Kenyamanan",
    estetika: "Estetika",
};

// Helper untuk mencari skor skala 1-5 berdasarkan range minNilai & maxNilai di DB
const dapatkanSkorDariRange = (
    nilaiRiil: number,
    masterSubKriteria: { minNilai: number | null; maxNilai: number | null; skor: number }[]
): number => {
    for (const sk of masterSubKriteria) {
        const min = sk.minNilai ?? 0;
        const max = sk.maxNilai ?? Infinity;
        if (nilaiRiil >= min && nilaiRiil <= max) return sk.skor;
    }
    return 1; // Default fallback terendah
};

const konversiFasilitasKeSkala = (jumlahFasilitas: number): number => {
    if (jumlahFasilitas >= 5) return 5;
    if (jumlahFasilitas <= 0) return 1;
    return jumlahFasilitas;
};

export const getRekomendasi = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { category, menuCategory, filters, fasilitasNames } = req.body;

    // 1. Validasi awal Kategori
    if (category && !Object.values(RestaurantCategory).includes(category)) {
        return res.status(400).json({ message: `Category restoran '${category}' tidak valid` });
    }
    if (menuCategory && !Object.values(MenuCategory).includes(menuCategory)) {
        return res.status(400).json({ message: `Category menu '${menuCategory}' tidak valid` });
    }

    // 2. Ambil master data kriteria & subkriteria untuk konversi rating ke skala bulat 1-5
    const kriteriaList = await prisma.kriteria.findMany();
    const kriteriaByNama = new Map(kriteriaList.map((k) => [k.nama, k]));
    
    // Ambil data acuan range sub-kriteria dari database untuk mencocokkan data
    const subKriteriaMaster = await prisma.subKriteria.findMany();

    // 3. PROSES OPSI B: Mengambil pilihan dropdown customer untuk dijadikan BOBOT MENTAH (1-5)
    const bobotMentah: Record<string, number> = {
        harga: 3, // Default netral jika kustomer tidak memilih
        fasilitas: 3,
        foodKualitas: 3,
        kenyamanan: 3,
        estetika: 3
    };

    const filterEntriesForLog: { kriteriaId: number; subKriteriaId: number }[] = [];

    if (filters) {
        for (const [key, nama] of Object.entries(KEY_TO_NAMA)) {
            if (key === "fasilitas") continue; 

            const subKriteriaId = filters[key];
            if (!subKriteriaId) continue;

            const sub = await prisma.subKriteria.findUnique({ where: { id: Number(subKriteriaId) } });
            if (sub) {
                // Skor pilihan dropdown customer langsung disulap menjadi bobot pencarian!
                bobotMentah[key] = sub.skor; 
                filterEntriesForLog.push({ kriteriaId: sub.kriteriaId, subKriteriaId: sub.id });
            }
        }
    }

    // Ambil bobot fasilitas dinamis dari seberapa banyak checklist kustomer
    const validFasilitasNames: FasilitasName[] = Array.isArray(fasilitasNames) ? fasilitasNames : [];
    if (validFasilitasNames.length > 0) {
        bobotMentah["fasilitas"] = konversiFasilitasKeSkala(validFasilitasNames.length);
    }

    // 4. NORMALISASI BOBOT DINAMIS (Σ W_j = 1)
    const totalBobotMentah = Object.values(bobotMentah).reduce((sum, val) => sum + val, 0);

    const kriteriaTerpakai = Object.entries(KEY_TO_NAMA).map(([key, nama]) => {
        const k = kriteriaByNama.get(nama);
        
        // Pastikan kriteria ditemukan agar tidak error undefined
        if (!k) {
            throw new Error(`Kriteria dengan nama '${nama}' tidak ditemukan di database.`);
        }

        return {
            key,
            nama,
            kriteriaId: k.id,
            jenis: k.jenis,
            bobot: (bobotMentah[key] ?? 3) / totalBobotMentah, // Menggunakan ?? 3 sebagai fallback aman jika key tidak pas
        };
    });

    // 5. AMBIL SEMUA RESTORAN (TIDAK ADA SANGATAN / ELIMINASI MUTLAK DI AWAL)
    const restaurants = await prisma.restaurant.findMany({
        where: {
            ...(category ? { category: category as RestaurantCategory } : {}),
            ...(menuCategory ? { menus: { some: { category: menuCategory as MenuCategory, isAvailable: true } } } : {}),
        },
        include: { fasilitases: { where: { available: true } } }
    });

    if (restaurants.length === 0) {
        return res.status(404).json({ message: "Tidak ada restaurant yang tersedia" });
    }

    // 6. HITUNG MATEMATIKA METODE WP
    const scored = restaurants.map((r) => {
        // Kelompokkan master subkriteria berdasarkan id kriteria induknya masing-masing
        const skHarga = subKriteriaMaster.filter(s => s.kriteriaId === kriteriaByNama.get("Harga")?.id);
        const skFood = subKriteriaMaster.filter(s => s.kriteriaId === kriteriaByNama.get("FoodKualitas")?.id);
        const skNyaman = subKriteriaMaster.filter(s => s.kriteriaId === kriteriaByNama.get("Kenyamanan")?.id);
        const skEstetika = subKriteriaMaster.filter(s => s.kriteriaId === kriteriaByNama.get("Estetika")?.id);

        // Konversi nilai mentah/desimal dari restoran menjadi skala bulat 1-5 berdasarkan data Prisma Studio kamu
        const skorPerKriteria: Record<string, number> = {
            harga: Math.max(dapatkanSkorDariRange(r.avgPrice, skHarga), 0.01),
            fasilitas: Math.max(konversiFasilitasKeSkala(r.fasilitases.length), 0.01),
            foodKualitas: Math.max(dapatkanSkorDariRange(r.avgFoodKualitas, skFood), 0.01),
            kenyamanan: Math.max(dapatkanSkorDariRange(r.avgKenyamanan, skNyaman), 0.01),
            estetika: Math.max(dapatkanSkorDariRange(r.avgEstetika, skEstetika), 0.01),
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

    // 7. SIMPAN HISTORI REQUEST KE DATABASE PRISMA
    const request = await prisma.rekomendasiRequest.create({
        data: {
            userId,
            category: category ? (category as RestaurantCategory) : null,
            menuCategory: menuCategory ? (menuCategory as MenuCategory) : null,
            weights: {
                create: kriteriaTerpakai.map((kt) => ({
                    kriteriaId: kt.kriteriaId,
                    weight: kt.bobot,
                })),
            },
            filters: { create: filterEntriesForLog },
            fasilitasFilters: { create: validFasilitasNames.map((name) => ({ name })) },
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

    // 8. KEMBALIKAN HASIL RESPONS KE FRONT-END
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
        restaurant: r.restaurant,
    }));

    res.json({
        message: "Rekomendasi metode WP Dinamis berhasil dibuat",
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