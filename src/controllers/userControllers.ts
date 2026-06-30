import { Request, Response } from "express";
import prisma from "../lib/db.js";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

//1. menampilkan semua user
export const getAllUser = async (req: Request, res: Response)=>{
    const user = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            restaurant: { select: { id:true, name: true} }
        },
        orderBy: { createdAt: "desc" }
    });

    res.json(user);
}

//2. update profile user yang login
export const updateProfile = async (req: Request, res:Response) => {
    const userId = (req as any).user.userId;
    const { name, password } = req.body;

    if (!name && !password) {
        return res.status(400).json({ message: "Minimal isi nama atau password"})
    }

    const data: any = {};
    if (name) data.name = name;
    if (password) data.pasword=await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            email: true,
            name: true,
            role: true
        }
    });

    res.json({ message: "Profil berhasil di update", data: updated});
}