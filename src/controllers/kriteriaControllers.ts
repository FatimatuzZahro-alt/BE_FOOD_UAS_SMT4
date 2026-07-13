import { Request, Response } from "express";
import prisma from "../lib/db.js";

// 1. menampilkan semua kriteria
export const getAllKriteria = async (req: Request, res: Response) => {
    const kriterias = await prisma.kriteria.findMany({
        orderBy: { id: "asc" }
    });

    res.json(kriterias);
}

// 2. menampilkan kriteria berdasarkan id
export const getKriteriaById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const kriteria = await prisma.kriteria.findUnique({
        where: { id }
    });

    if (!kriteria) {
        return res.status(404).json({ message: "Kriteria tidak ditemukan" });
    }

    res.json(kriteria);
}

// 3. menambahkan kriteria baru
export const createKriteria = async (req: Request, res: Response) => {
    const { nama, jenis, bobot } = req.body;

    if (!nama || !jenis || bobot === undefined) {
        return res.status(400).json({ message: "Nama, jenis, dan bobot harus diisi" });
    }

    if (jenis !== "cost" && jenis !== "benefit") {
        return res.status(400).json({ message: "Jenis harus 'cost' atau 'benefit'" });
    }

    const existing = await prisma.kriteria.findUnique({ where: { nama } });
    if (existing) {
        return res.status(409).json({ message: "Kriteria sudah ada" });
    }

    const kriteria = await prisma.kriteria.create({
        data: { nama, jenis, bobot: Number(bobot) }
    });

    res.status(201).json({ message: "Kriteria berhasil ditambahkan", data: kriteria });
}

// 4. mengupdate kriteria berdasarkan id
export const updateKriteria = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { nama, jenis, bobot } = req.body;

    const kriteria = await prisma.kriteria.findUnique({ where: { id } });
    if (!kriteria) {
        return res.status(404).json({ message: "Kriteria tidak ditemukan" });
    }

    if (jenis && jenis !== "cost" && jenis !== "benefit") {
        return res.status(400).json({ message: "Jenis harus 'cost' atau 'benefit'" });
    }

    const updated = await prisma.kriteria.update({
        where: { id },
        data: {
            ...(nama ? { nama } : {}),
            ...(jenis ? { jenis } : {}),
            ...(bobot !== undefined ? { bobot: Number(bobot) } : {})
        }
    });

    res.json({ message: "Kriteria berhasil diupdate", data: updated });
}

// 6. menghapus kriteria berdasarkan id
export const deleteKriteria = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const kriteria = await prisma.kriteria.findUnique({ where: { id } });
    if (!kriteria) {
        return res.status(404).json({ message: "Kriteria tidak ditemukan" });
    }

    await prisma.kriteria.delete({ where: { id } });

    res.json({ message: "Kriteria berhasil dihapus" });
}

// 6. menampilkan semua SubKriteria, dikelompokkan per Kriteria
// Dipakai FE buat isi opsi dropdown filter (Harga, FoodKualitas, Kenyamanan, Estetika).
// Fasilitas nggak ikut di sini karena filternya pakai checklist nama fasilitas langsung,
// bukan dropdown SubKriteria.
export const getSubKriteria = async (req: Request, res: Response) => {
    const kriteriaList = await prisma.kriteria.findMany({
        include: {
            subKriteria: {
                orderBy: { minNilai: "asc" }
            }
        },
        orderBy: { id: "asc" }
    });

    // key ini harus konsisten sama key yang dipakai di body.filters
    // pada rekomendasiController (getRekomendasi)
    const NAMA_TO_KEY: Record<string, string> = {
        Harga: "harga",
        Fasilitas: "fasilitas",
        FoodKualitas: "foodKualitas",
        Kenyamanan: "kenyamanan",
        Estetika: "estetika",
    };

    const result = kriteriaList
        .filter((k) => k.subKriteria.length > 0)
        .map((k) => ({
            key: NAMA_TO_KEY[k.nama] ?? k.nama,
            kriteriaId: k.id,
            nama: k.nama,
            options: k.subKriteria.map((sk) => ({
                id: sk.id,
                keterangan: sk.keterangan
            }))
        }));

    res.json(result);
}