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
      console.log(`Admin with email ${adminEmail} already exists.`);
      process.exit(0);
    }

    const admin = await createUser(adminName, adminEmail, adminPassword, adminImage, Role.ADMIN);
    console.log(`Admin created successfully: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
