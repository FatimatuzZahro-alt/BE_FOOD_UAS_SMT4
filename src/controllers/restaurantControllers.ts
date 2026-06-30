import { Request, Response } from "express";
import  prisma  from "../lib/db.js";


// 1. menampilkan data categori
export const getAllRestaurants = async (req: Request, res: Response) => {
  const { keyword, maxPrice, fasilitas } = req.query;

  const restaurants = await prisma.restaurant.findMany({
    where: {
      ...(keyword ? {
          OR: [
            { name: { contains: String(keyword) } },
            { address: { contains: String(keyword) } },
          ]
      } : {}),
      ...(maxPrice ? { avgPrice: { lte: Number(maxPrice) } } : {}),
            ...(fasilitas ? {
                fasilitases: {
                    some: {
                        name: { contains: String(fasilitas) },
                        available: true
                    }
                }
            } : {}),
        },
        include: {
            fasilitases: true,
            _count: { select: { ratings: true, menus: true } }
        },
        orderBy: { avgFoodKualitas: "desc" }
  });

  res.json(restaurants);
};

// 2. menampilkan restaurant berdasarkan id
export const getRestaurantById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        include: {
            menus: { where: { isAvailable: true } },
            fasilitases: true,
            ratings: {
                include: { user: { select: { id: true, name: true } } },
                orderBy: { createdAt: "desc" },
                take: 10,
            },
        }
    });

    if (!restaurant) {
        return res.status(404).json({ message: "Restaurant tidak ditemukan" });
    }

    res.json(restaurant);
}

// 3. menampilkan restaurant milik admin yang login
export const getMyRestaurant = async (req: Request, res: Response) => {
    const adminId = (req as any).user.userId;

    const restaurant = await prisma.restaurant.findUnique({
        where: { adminId },
        include: {
            menus: { orderBy: { category: "asc" } },
            fasilitases: true,
            _count: { select: { ratings: true } }
        }
    });

    if (!restaurant) {
        return res.status(404).json({ message: "Anda belum memiliki restaurant" });
    }

    res.json(restaurant);

}

// 4. Membuat resto baru
export const createRestaurant = async (req: Request, res: Response) => {
  const { name, address, description, imageUrl, phone, openTime, closeTime } = req.body;
  const adminId = (req as any).user.userId;

  if (!name || !address) {
    return res.status(400).json({message: "Nama dan alamat harus diisi!" });
  }

  const existing = await prisma.restaurant.findUnique({ where: { adminId } });
  if (existing) {
    return res.status(409).json({ message: "Anda sudah memiliki restaurant" });
  }

  const restaurant = await prisma.restaurant.create({
    data: { name, address, description, imageUrl, phone, openTime, closeTime, adminId }
  });

  res.status(201).json({ message: "Restaurant berhasil dibuat", data: restaurant });
}

// 5. update restaurant berdsarkan id
export const updateRestaurant = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, address, description, imageUrl, phone, openTime, closeTime } = req.body;
  const adminId = (req as any).user.userId;

  const restaurant = await prisma.restaurant.findUnique({ where: {id} });
  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant tidak ditemukan!"});
  }

  if (restaurant.adminId !== adminId) {
    return res.status(403).json({ message: "Bukan Restaurant milik anda" });
  }

  const updated = await prisma.restaurant.update({
    where: { id },
    data: { name, address, description, imageUrl, phone, openTime, closeTime }
  });

  res.json({ message: "Restaurant berhasil diupdate", data: updated});
} 

//6. menghapus restaurant berdasarkan id
export const deleteRestaurant = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const adminId = (req as any).user.userId;

  const restaurant = await prisma.restaurant.findUnique({ where: {id} });
  if (!restaurant) {
    return res.status(404).json({message: "Restaurant tidak ditemukan"});
  }

  if (restaurant.adminId !== adminId) {
    return res.status(403).json({message: "Bukan restaurant milik anda"});
  }

  await prisma.restaurant.delete({ where: { id } });

  res.json({ message: "Restaurant berhasil dihapus" });
}