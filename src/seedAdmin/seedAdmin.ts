import { Role } from "../generated/prisma/client";
import { createUser, findUserByEmail } from "../app/auth/auth.service";
import { prisma } from "../lib/prisma";
import dotenv from "dotenv";

dotenv.config();

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL as string;
  const adminPassword = process.env.ADMIN_PASSWORD as string;
  const adminName = process.env.ADMIN_NAME as string;
  const adminImage = process.env.ADMIN_IMAGE as string;

  try {
    const existingAdmin = await findUserByEmail(adminEmail);
    if (existingAdmin) {
      `Admin with email ${adminEmail} already exists.`;
      process.exit(0);
    }

    const admin = await createUser(
      adminName,
      adminEmail,
      adminPassword,
      adminImage,
      Role.ADMIN
    );
    `Admin created successfully: ${admin.email}`;
    `Role: ${admin.role}`;
    process.exit(0);
  } catch (error) {
    process.exitCode = 1;
    throw new Error(
      `Error seeding admin: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
