import { Request, Response } from "express";
import  prisma  from "../lib/db";

// 1. menampilkan semua rating berdasarkan restaurant
export const getRatingByRestaurant = async (req: Request, res: Response) => {
    const restaurantId = Number(req.params.restaurantId);

    const ratings = await prisma.rating.findMany({
        where: { restaurantId },
        include: {
            user: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    res.json(ratings);
}

// 2. menambahkan rating baru
export const createRating = async (req: Request, res: Response) => {
    const restaurantId = Number(req.params.restaurantId);
    const userId = (req as any).user.userId;
    const { foodKualitasScore, kenyamananScore, estetikaScore, comment } = req.body;

    if (!foodKualitasScore || !kenyamananScore || !estetikaScore) {
        return res.status(400).json({ message: "Semua score harus diisi" });
    }

    // validasi range 1-5
    if (foodKualitasScore < 1 || foodKualitasScore > 5 ||
        kenyamananScore < 1 || kenyamananScore > 5 ||
        estetikaScore < 1 || estetikaScore > 5) {
        return res.status(400).json({ message: "Score harus antara 1-5" });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
        return res.status(404).json({ message: "Restaurant tidak ditemukan" });
    }

    // cek apakah user adalah admin restaurant ini
    if (restaurant.adminId === userId) {
        return res.status(403).json({ message: "Admin tidak bisa memberi rating restaurantnya sendiri" });
    }

    // cek apakah user sudah pernah rating restaurant ini
    const existing = await prisma.rating.findUnique({
        where: {
            userId_restaurantId: { userId, restaurantId }
        }
    });

    if (existing) {
        return res.status(409).json({ message: "Anda sudah memberi rating untuk restaurant ini" });
    }

    const rating = await prisma.rating.create({
        data: {
            userId,
            restaurantId,
            foodKualitasScore: Number(foodKualitasScore),
            kenyamananScore: Number(kenyamananScore),
            estetikaScore: Number(estetikaScore),
            comment
        }
    });

    // update avg rating restaurant
    await recalcRestaurantRating(restaurantId);

    res.status(201).json({ message: "Rating berhasil ditambahkan", data: rating });
}

// 3. mengupdate rating berdasarkan id
export const updateRating = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const userId = (req as any).user.userId;
    const { foodKualitasScore, kenyamananScore, estetikaScore, comment } = req.body;

    const rating = await prisma.rating.findUnique({ where: { id } });
    if (!rating) {
        return res.status(404).json({ message: "Rating tidak ditemukan" });
    }

    if (rating.userId !== userId) {
        return res.status(403).json({ message: "Bukan rating milik Anda" });
    }

    const updated = await prisma.rating.update({
        where: { id },
        data: {
            foodKualitasScore: Number(foodKualitasScore),
            kenyamananScore: Number(kenyamananScore),
            estetikaScore: Number(estetikaScore),
            comment
        }
    });

    await recalcRestaurantRating(rating.restaurantId);

    res.json({ message: "Rating berhasil diupdate", data: updated });
}

// 4. menghapus rating berdasarkan id
export const deleteRating = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const userId = (req as any).user.userId;

    const rating = await prisma.rating.findUnique({ where: { id } });
    if (!rating) {
        return res.status(404).json({ message: "Rating tidak ditemukan" });
    }

    if (rating.userId !== userId) {
        return res.status(403).json({ message: "Bukan rating milik Anda" });
    }

    await prisma.rating.delete({ where: { id } });

    await recalcRestaurantRating(rating.restaurantId);

    res.json({ message: "Rating berhasil dihapus" });
}

// ── Helper: recalculate avg rating restaurant ───────────────
const recalcRestaurantRating = async (restaurantId: number) => {
    const result = await prisma.rating.aggregate({
        where: { restaurantId },
        _avg: {
            foodKualitasScore: true,
            kenyamananScore: true,
            estetikaScore: true,
        },
        _count: true
    });

    await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
            avgFoodKualitas: result._avg.foodKualitasScore ?? 0,
            avgKenyamanan: result._avg.kenyamananScore ?? 0,
            avgEstetika: result._avg.estetikaScore ?? 0,
            totalRating: result._count
        }
    });
}