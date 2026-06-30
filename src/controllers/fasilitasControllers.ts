import { Request, Response } from "express";
import  prisma  from "../lib/db.js";

// 1. menampilkan fasilitas berdasarkan restaurant
export const getFasilitasByRestaurant = async (req: Request, res: Response) => {
    const restaurantId = Number(req.params.restaurantId);

    const fasilitases = await prisma.fasilitas.findMany({
        where: { restaurantId }
    });

    res.json(fasilitases);
}

// 2. menambahkan fasilitas baru
export const addFasilitas = async (req: Request, res: Response) => {
    const adminId = (req as any).user.userId;
    const { name, available } = req.body;

    if (!name) {
        return res.status(400).json({ message: "Nama fasilitas harus diisi" });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { adminId } });
    if (!restaurant) {
        return res.status(404).json({ message: "Anda belum memiliki restaurant" });
    }

    // cek apakah fasilitas sudah ada
    const existing = await prisma.fasilitas.findUnique({
        where: {
            restaurantId_name: {
                restaurantId: restaurant.id,
                name
            }
        }
    });

    if (existing) {
        return res.status(409).json({ message: "Fasilitas sudah ada" });
    }

    const fasilitas = await prisma.fasilitas.create({
        data: {
            name,
            available: available ?? true,
            restaurantId: restaurant.id
        }
    });

    // update fasilitasScore restaurant
    await recalcFasilitasScore(restaurant.id);

    res.status(201).json({ message: "Fasilitas berhasil ditambahkan", data: fasilitas });
}

// 3. mengupdate fasilitas berdasarkan id
export const updateFasilitas = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = (req as any).user.userId;
    const { name, available } = req.body;

    const restaurant = await prisma.restaurant.findUnique({ where: { adminId } });
    if (!restaurant) {
        return res.status(404).json({ message: "Anda belum memiliki restaurant" });
    }

    const fasilitas = await prisma.fasilitas.findUnique({ where: { id } });
    if (!fasilitas || fasilitas.restaurantId !== restaurant.id) {
        return res.status(404).json({ message: "Fasilitas tidak ditemukan" });
    }

    const updated = await prisma.fasilitas.update({
        where: { id },
        data: { name, available }
    });

    await recalcFasilitasScore(restaurant.id);

    res.json({ message: "Fasilitas berhasil diupdate", data: updated });
}

// 4. menghapus fasilitas berdasarkan id
export const deleteFasilitas = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = (req as any).user.userId;

    const restaurant = await prisma.restaurant.findUnique({ where: { adminId } });
    if (!restaurant) {
        return res.status(404).json({ message: "Anda belum memiliki restaurant" });
    }

    const fasilitas = await prisma.fasilitas.findUnique({ where: { id } });
    if (!fasilitas || fasilitas.restaurantId !== restaurant.id) {
        return res.status(404).json({ message: "Fasilitas tidak ditemukan" });
    }

    await prisma.fasilitas.delete({ where: { id } });

    await recalcFasilitasScore(restaurant.id);

    res.json({ message: "Fasilitas berhasil dihapus" });
}

// hitung jumlah fasilitas yang available 
const recalcFasilitasScore = async (restaurantId: number) => {
    const count = await prisma.fasilitas.count({
        where: { restaurantId, available: true }
    });

    await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { fasilitasScore: count }
    });
}