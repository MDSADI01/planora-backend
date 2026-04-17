import { Role } from "../../generated/prisma/client";
import { createUser, findUserByEmail } from "../auth/auth.service";
import { prisma } from "../../lib/prisma";
import dotenv from "dotenv";

dotenv.config();

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@planora.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = "System Admin";

  try {
    const existingAdmin = await findUserByEmail(adminEmail);
    if (existingAdmin) {
      console.log(`Admin with email ${adminEmail} already exists.`);
      process.exit(0);
    }

    const admin = await createUser(adminName, adminEmail, adminPassword, undefined, Role.ADMIN);
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
