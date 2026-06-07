import { Request, Response } from 'express';
import { prisma } from "../lib/db";

// 1. Menampilkan semua user
export const getUsers = async (req: Request, res: Response) => {
  const allUsers = await prisma.users.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(allUsers);
};

// 2. Menyimpan data user
export const createUsers = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Nama, email, dan password wajib diisi" });
  }

  const newUsers = await prisma.users.create({
    data: { name, email, password },
  });

  res.status(201).json(newUsers);
};

// 3. Mengambil user berdasarkan id
export const getUsersById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const byUserId = await prisma.users.findUnique({ where: { id } });
  if (!byUserId) {
    return res.status(404).json({ message: "User tidak ditemukan" });
  }

  res.json(byUserId);
};

// 4. Update data user berdasarkan id
export const updateUsers = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) {
        return res.status(400).json({ message: "User tidak ditemukan"});
    }

    const updatedUser = await prisma.users.update({
        where: { id },
        data: {
            name:req.body.name ?? user.name,
            email:req.body.email ?? user.email,
            password:req.body.password ?? user.password,
        },
    });
        res.json(updatedUser);
};

// 5. Hapus data user berdasarkan id
export const deleteUsers = async (req:Request, res:Response) => {
    const id = Number(req.params.id);

    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
    }

    await prisma.users.delete({ where: { id } });
    res.json({ message: "User berhasil dihapus" });

};