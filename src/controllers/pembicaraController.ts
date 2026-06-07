import { Request, Response } from "express";
import { prisma } from "../lib/db";

// 1. Menampilkan semua pembicara
export const getPembicara = async (req: Request, res: Response) => {
  const allPembicara = await prisma.pembicara.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(allPembicara);
};

// 2. Menyimpan data pembicara
export const createPembicara = async (req: Request, res: Response) => {
  const { name, role } = req.body;

  if (!name || !role) {
    return res.status(400).json({ message: "Nama dan role wajib diisi" });
  }

  const newPembicara = await prisma.pembicara.create({
    data: { name, role },
  });

  res.status(201).json(newPembicara);
};

// 3. Mengambil pembicara berdasarkan id
export const getPembicaraById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const pembicara = await prisma.pembicara.findUnique({ where: { id } });
  if (!pembicara) {
    return res.status(404).json({ message: "Pembicara tidak ditemukan" });
  }

  res.json(pembicara);
};

// 4. Update data pembicara berdasarkan id
export const updatePembicara = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const pembicara = await prisma.pembicara.findUnique({ where: { id } });
  if (!pembicara) {
    return res.status(404).json({ message: "Pembicara tidak ditemukan" });
  }

  const updated = await prisma.pembicara.update({
    where: { id },
    data: {
      name: req.body.name ?? pembicara.name,
      role: req.body.role ?? pembicara.role,
    },
  });

  res.json(updated);
};

// 5. Hapus data pembicara berdasarkan id
export const deletePembicara = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const pembicara = await prisma.pembicara.findUnique({ where: { id } });
  if (!pembicara) {
    return res.status(404).json({ message: "Pembicara tidak ditemukan" });
  }

  const eventTerkait = await prisma.event.findFirst({
    where: { pembicaraId: id },
  });

  if (eventTerkait) {
    return res.status(400).json({
      message: "Pembicara tidak bisa dihapus karena masih dipakai oleh event",
    });
  }

  await prisma.pembicara.delete({ where: { id } });
  res.json({ message: "Pembicara berhasil dihapus" });
};