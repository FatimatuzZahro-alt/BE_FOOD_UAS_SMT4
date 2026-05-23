import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || "postgresql://postgres.iqeebafnkugqdyrsiscp:Invofest2026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres",
        },
    },
});