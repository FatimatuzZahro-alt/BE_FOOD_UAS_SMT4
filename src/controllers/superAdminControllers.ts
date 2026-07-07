import { Request, Response } from "express";
import  prisma  from "../lib/db.js";

//1.dashboard statistik
export const getDashboard = async (req: Request, res: Response) => {
    const totalUser = await prisma.user.count();
    const totalRestaurant = await prisma.restaurant.count();
    const totalRating = await prisma.rating.count();
    const totalMenu = await prisma.menu.count();
    const totalFasilitas = await prisma.fasilitas.count();
    const totalRekomendasi = await prisma.rekomendasiRequest.count();

    const restaurantTerbaru = await prisma.restaurant.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, createdAt: true }
    });

    const userTerbaru = await prisma.user.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, createdAt: true }
    });

    res.json({
        totalUser,
        totalRestaurant,
        totalRating,
        totalMenu,
        totalFasilitas,
        totalRekomendasi,
        restaurantTerbaru,
        userTerbaru
    });
}

//2. menampilkan semua user
export const getAllUsers = async (req:Request, res: Response) => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            restaurant: {
                 select: { id: true, name: true }
            },
            orderBy: { createdAt: " desc" }
        }
    });
    res.json(users);
}

//3. menampilkan user by Id
export const getUserById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            restaurant: { select: { id: true, name: true } },
            ratings: true
        }
    });

    if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json(user);
}

// 4. update user berdasarkan id (bisa update role)
export const updateUserById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { name, role } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const updated = await prisma.user.update({
        where: { id },
        data: {
            ...(name ? { name } : {}),
            ...(role ? { role } : {})
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true
        }
    });

    res.json({ message: "User berhasil diupdate", data: updated });
}

// 5. hapus user berdasarkan id
export const deleteUserById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // cegah super admin hapus dirinya sendiri
    if (id === (req as any).user.userId) {
        return res.status(403).json({ message: "Tidak bisa menghapus akun sendiri" });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: "User berhasil dihapus" });
}

// 6. menampilkan semua restaurant
export const getAllRestaurants = async (req: Request, res: Response) => {
    const restaurants = await prisma.restaurant.findMany({
        include: {
            admin: { select: { id: true, name: true, email: true } },
            fasilitases: true,
            _count: { select: { ratings: true, menus: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    res.json(restaurants);
}

// 7. menampilkan restaurant berdasarkan id
export const getRestaurantById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        include: {
            admin: { select: { id: true, name: true, email: true } },
            menus: true,
            fasilitases: true,
            ratings: {
                include: { user: { select: { id: true, name: true } } }
            }
        }
    });

    if (!restaurant) {
        return res.status(404).json({ message: "Restaurant tidak ditemukan" });
    }

    res.json(restaurant);
}

// 8. update restaurant berdasarkan id
export const updateRestaurantById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { name, address, description, imageUrl, phone, openTime, closeTime } = req.body;

    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
        return res.status(404).json({ message: "Restaurant tidak ditemukan" });
    }

    const updated = await prisma.restaurant.update({
        where: { id },
        data: { name, address, description, imageUrl, phone, openTime, closeTime }
    });

    res.json({ message: "Restaurant berhasil diupdate", data: updated });
}

// 9. hapus restaurant berdasarkan id
export const deleteRestaurantById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
        return res.status(404).json({ message: "Restaurant tidak ditemukan" });
    }

    await prisma.restaurant.delete({ where: { id } });

    res.json({ message: "Restaurant berhasil dihapus" });
}

// 10. menampilkan semua rating
export const getAllRatings = async (req: Request, res: Response) => {
    const ratings = await prisma.rating.findMany({
        include: {
            user: { select: { id: true, name: true } },
            restaurant: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    res.json(ratings);
}
