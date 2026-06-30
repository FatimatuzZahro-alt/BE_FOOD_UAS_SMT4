import {Request, Response} from 'express';
import prisma from '../lib/db';
import {Register} from "../types/register";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

//fungsi untuk register
export const register = async (req: Request, res: Response) => {
    const {name, email, password, role} = req.body;    //req.body=artinya yg dikirim dari user

    //validasi input
    if(!name || !email || !password){
        return res.status(400)
            .json({message: "nama, email, password harus diisi"});
    }

    //validasi role
    const allowedRoles = ['CUSTOMER', 'RESTAURANT_ADMIN'];
    if (role && !allowedRoles.includes(role)) {
        return res.status(400).json({message: "role tidak valid"});
    }

    //cek apakah email sudah terdaftar ,biasanya digunakan buat yg unique
    const existingUser = await prisma.user.findUnique({
        where: {
            email : email
        }
    });

    //jika sudah ada
    if (existingUser) {
        return res.status(409)
            .json({message: "email sudah terdaftar"});
    }

    //hashing password dengan bcrypt (biar password jaddi aneh2 kek gitu loh)
    const hashedPassword = await bcrypt.hash(password, 10);    

    //simpan data user
    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            password:hashedPassword,
            role: role ?? 'CUSTOMER'
        },
    });

    return res.status(201).json({message: "Registrasi berhasil", user: newUser});
}

//fungsi untuk login
export const login = async (req: Request, res: Response) => {
    const {email, password} = req.body;

    //validasi input
    if(!email || !password){
        return res.status(400)
            .json({message: "email dan password harus diisi"});
    }

    //cek apakah email sudah terdaftar ,biasanya digunakan buat yg unique
    const existingUser = await prisma.user.findUnique({
        where: {
            email : email
        }
    });

    //jika tidak ada
    if (!existingUser) {
        return res.status(409)
            .json({message: "email tidak ditemukan"});
    }

    //cek password apakah sesuai engga
    const passwordCek = await bcrypt.compare(password, existingUser.password);

    //jika pw tdk sesuai 
    if (!passwordCek) {
        return res.status(401)
            .json({message: "password tidk sesuai"})
    }

    const token = jwt.sign(
        {
            userId: existingUser.id,
            email: existingUser.email,
            role: existingUser.role
        },
        process.env.JWT_SECRET!,
        {
            expiresIn: "1h"
        }
    )

    //login berhasil
    return res.json({
        message: "Login Berhasil", token,
        user:{
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email
        }
    })
}

export const getProfile = async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { id: (req as any).user.userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
        }
    });

    return res.json({ data:user });
}