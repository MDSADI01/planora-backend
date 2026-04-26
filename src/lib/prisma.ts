import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const rawConnectionString = `${process.env.DATABASE_URL}`;

const normalizeSslMode = (connectionString: string) => {
  if (!connectionString || connectionString === "undefined") return connectionString;

  const hasLibpqCompat = /([?&])uselibpqcompat=true(&|$)/i.test(connectionString);
  if (hasLibpqCompat) return connectionString;

  return connectionString.replace(
    /([?&])sslmode=(prefer|require|verify-ca)(&|$)/gi,
    "$1sslmode=verify-full$3"
  );
};

const connectionString = normalizeSslMode(rawConnectionString);

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };