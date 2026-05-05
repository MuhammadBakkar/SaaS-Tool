import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { requireDatabaseUrl } from "../config/database.js";

let prisma: PrismaClient | undefined;
let pool: Pool | undefined;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    const connectionString = requireDatabaseUrl();
    pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma?.$disconnect();
  await pool?.end();
  prisma = undefined;
  pool = undefined;
}
