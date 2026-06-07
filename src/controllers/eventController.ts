import { Request, Response } from "express";
import { prisma } from "../lib/db";

// 1. Menampilkan semua event
export const getEvents = async (req: Request, res: Response) => {
  const allEvents = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      pembicara: true,
    },
  });
  res.json(allEvents);
};

// 2. Menyimpan data event
export const createEvent = async (req: Request, res: Response) => {
  const { name, categoryId, pembicaraId, tanggal, description } = req.body;

  if (!name || !categoryId || !pembicaraId || !tanggal || !description) {
    return res.status(400).json({ message: "Semua field event harus diisi" });
  }

  const newEvent = await prisma.event.create({
    data: {
      name,
      categoryId: Number(categoryId),
      pembicaraId: Number(pembicaraId),
      tanggal: new Date(tanggal),
      description,
    },
  });

  res.status(201).json(newEvent);
};

// 3. Mengambil event berdasarkan id
export const getEventById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      category: true,
      pembicara: true,
    },
  });

  if (!event) {
    return res.status(404).json({ message: "Event tidak ditemukan" });
  }

  res.json(event);
};

// 4. Update data event berdasarkan id
export const updateEvent = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return res.status(404).json({ message: "Event tidak ditemukan" });
  }

  const updated = await prisma.event.update({
    where: { id },
    data: {
      name: req.body.name ?? event.name,
      categoryId: req.body.categoryId ? Number(req.body.categoryId) : event.categoryId,
      pembicaraId: req.body.pembicaraId ? Number(req.body.pembicaraId) : event.pembicaraId,
      tanggal: req.body.tanggal ? new Date(req.body.tanggal) : event.tanggal,
      description: req.body.description ?? event.description,
    },
  });

  res.json(updated);
};

// 5. Hapus data event berdasarkan id
export const deleteEvent = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return res.status(404).json({ message: "Event tidak ditemukan" });
  }

  await prisma.event.delete({ where: { id } });
  res.json({ message: "Event berhasil dihapus" });

};