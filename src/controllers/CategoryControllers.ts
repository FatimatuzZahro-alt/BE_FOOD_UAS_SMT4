<<<<<<< HEAD
import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { Category } from "../types/category.ts";

let categories: Category[] = [];


// dalam categori controller bisa:
//1. menampilkan data categori
export const getCategories = async (req: Request, res: Response) => {
  const AllCategory = await prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  res.json(AllCategory);
};

//2. menyimpan data categori
export const createCategory = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "nama harus diisi" });
  }
  const newCategory = await prisma.category.create({
    data: { name },
  });
  res.status(201).json(newCategory);
};
//3.mengambil data categori berdasarkan id
export const getCategoryById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const category = await prisma.category.findUnique({
    where: { id },
  });
  if (!category) {
    return res.status(404).json({ message: "category tidak ditemukan" });
  }
  res.json(category);
};

//4.mengupdate data berdasarkan id
export const updateCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "nama harus diisi" });
  }
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return res.status(404).json({ message: "category tidak ditemukan" });
  }
  const updated = await prisma.category.update({
    where: { id },
    data: { name },
  });
  res.json(updated);
};

//5.menghapus data categori berdasarkan id
export const deleteCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return res.status(404).json({ message: "category tidak ditemukan" });
  }


  const eventTerkait = await prisma.event.findFirst({
    where: { categoryId: id }
  });

  if (eventTerkait) {
    return res.status(400).json({ 
      message: "Category tidak bisa dihapus karena masih dipakai oleh event" 
    });
  }

  await prisma.category.delete({ where: { id } });
  res.json({ message: "category berhasil dihapus" });
};
=======
import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { Category } from "../types/category.ts";

let categories: Category[] = [];


// dalam categori controller bisa:
//1. menampilkan data categori
export const getCategories = async (req: Request, res: Response) => {
  const AllCategory = await prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  res.json(AllCategory);
};

//2. menyimpan data categori
export const createCategory = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "nama harus diisi" });
  }
  const newCategory = await prisma.category.create({
    data: { name },
  });
  res.status(201).json(newCategory);
};
//3.mengambil data categori berdasarkan id
export const getCategoryById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const category = await prisma.category.findUnique({
    where: { id },
  });
  if (!category) {
    return res.status(404).json({ message: "category tidak ditemukan" });
  }
  res.json(category);
};

//4.mengupdate data berdasarkan id
export const updateCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "nama harus diisi" });
  }
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return res.status(404).json({ message: "category tidak ditemukan" });
  }
  const updated = await prisma.category.update({
    where: { id },
    data: { name },
  });
  res.json(updated);
};

//5.menghapus data categori berdasarkan id
export const deleteCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return res.status(404).json({ message: "category tidak ditemukan" });
  }


  const eventTerkait = await prisma.event.findFirst({
    where: { categoryId: id }
  });

  if (eventTerkait) {
    return res.status(400).json({ 
      message: "Category tidak bisa dihapus karena masih dipakai oleh event" 
    });
  }

  await prisma.category.delete({ where: { id } });
  res.json({ message: "category berhasil dihapus" });
};
>>>>>>> 2fac8cfae754bc637848f97e3af7df95ca5fd8ff
