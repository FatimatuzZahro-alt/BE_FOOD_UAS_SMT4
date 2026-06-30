import { Request, Response } from "express";
import  prisma  from "../lib/db";

// 1. Menampilkan semua menu berdasarkan restaurant
export const getMenuByRestaurant = async (req: Request, res: Response)=> {
    const restaurantId = Number(req.params.restaurantId);
    const { category } = req.query;

    const menus = await prisma.menu.findMany({
        where: {
            restaurantId,
            isAvailable: true,
            ...(category ? {category: category as any} : {}),
        },
        orderBy: [{ category: "asc" }, { name: "asc" }]
    });

    res.json(menus);
}


// 2. Menampilkan semua menu milik admin yg sudah login 
export const getMyMenus = async (req: Request, res: Response) => {
    const adminId = (req as any).user.userId;

    const restaurant = await prisma.restaurant.findUnique({
        where: { adminId }
    });

    if (!restaurant) {
        return res.status(404).json({ message: "Anda belum memiliki restaurant" });
    }

    const menus = await prisma.menu.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: [{ category: "asc" }, { name: "asc" }]
    });

    res.json(menus);
}


//3. menambahkan menu baru
export const createMenu = async (req: Request, res: Response) => {
    const adminId = (req as any).user.userId;
    const { name, description, price, category, imageUrl, isAvailable } = req.body;

    if (!name || !price ||!category) {
        return res.status(400).json({message: "Name, harga, dan kategori harus diisi"});
    }

    const restaurant = await prisma.restaurant.findUnique({
        where: { adminId }
    });

    if (!restaurant) {
        return res.status(404).json({ message: "Anda belum memiliki restaurant" });
    }

    const menu = await prisma.menu.create({
        data: {
            name,
            description,
            price: Number(price),
            category,
            imageUrl,
            isAvailable: isAvailable ?? true,
            restaurantId: restaurant.id
        }
    });

    //update avgPrice restaurant
    await recalcAvgPrice(restaurant.id);

    res.status(201).json({ message: "Menu berhasil ditambahkan", data:menu});
}

// 4. Update menu berdasarkan id
export const updateMenu = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = (req as any).user.userId;
    const { name, description, price, category, imageUrl, isAvailable } = req.body;

    const restaurant = await prisma.restaurant.findUnique({ where: { adminId } });
    if (!restaurant) {
        return res.status(404).json({ message: "Anda belum memiliki restaurant" });
    }

    const menu = await prisma.menu.findUnique({ where: { id } });
    if (!menu || menu.restaurantId !== restaurant.id) {
        return res.status(404).json({ message: "Menu tidak ditemukan" });
    }

    const updated = await prisma.menu.update({
        where: { id },
        data: { name, description, price: Number(price), category, imageUrl, isAvailable }
    });

    await recalcAvgPrice(restaurant.id);

    res.json({ message: "Menu berhasil diupdate", data: updated });
}



// 5. menghapus menu berdasarkan id
export const deleteMenu = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = (req as any).user.userId;

    const restaurant = await prisma.restaurant.findUnique({ where: { adminId } });
    if (!restaurant) {
        return res.status(404).json({ message: "Anda belum memiliki restaurant" });
    }

    const menu = await prisma.menu.findUnique({ where: { id } });
    if (!menu || menu.restaurantId !== restaurant.id) {
        return res.status(404).json({ message: "Menu tidak ditemukan" });
    }

    await prisma.menu.delete({ where: { id } });

    await recalcAvgPrice(restaurant.id);

    res.json({ message: "Menu berhasil dihapus" });
}

// recalcAvgPrice dipanggil otomatis untuk update rata2 harga di table resto/ setiap ada perubahan di menu
const recalcAvgPrice = async (restaurantId: number) => {
    const result = await prisma.menu.aggregate({
        where: { restaurantId, isAvailable: true },
        _avg: { price: true }
    });

    await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { avgPrice: result._avg.price ?? 0 }
    });
}