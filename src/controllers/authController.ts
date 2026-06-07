import {Request, Response} from 'express';
import {prisma} from "../lib/db";
import {Register} from "../types/register.ts";

//fungsi untuk register
export const register = async (req: Request, res: Response) => {
    const {name, email, password} = req.body;    //req.body=artinya yg dikirim dari user

    //validasi input
    if(!name || !email || !password){
        return res.status(400)
            .json({message: "nama, email, password harus diisi"});
    }

    //simpan data user
    const newUser = await prisma.users.create({
        data: {
            name,
            email,
            password,
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
}