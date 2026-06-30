import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    //logic nya disini
    const authHeader = req.headers.authorization;

    //jika header tdk ditemukan
    if (!authHeader) {
        return res.status(401)
            .json({message: "Unauthenticated. Token Tidak Ditemukan"})
    }

    const token = authHeader.split(" ")[1];

    //jika token tidak ditemukan
    if(!token){
        return res.status(401)
            .json({message: "Format tidak valid"})
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);

        (req as any).user = decoded;

        next();
    } catch (error) {
        return res.status(403)
            .json({message: "Invalid Token"})
    }
}

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" })
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({ message: "Akses ditolak: role tidak sesuai" })
        }

        next();
    }
}