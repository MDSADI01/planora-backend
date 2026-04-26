import { Role } from "../generated/prisma/client";
import { createUser, findUserByEmail } from "../app/auth/auth.service";
import { prisma } from "../lib/prisma";
import dotenv from "dotenv";

dotenv.config();

interface AdminConfig {
  email: string;
  password: string;
  name: string;
  image?: string;
}

async function seedAdmin() {
  const adminConfig: AdminConfig = {
    email: process.env.ADMIN_EMAIL as string,
    password: process.env.ADMIN_PASSWORD as string,
    name: process.env.ADMIN_NAME as string,
    image: process.env.ADMIN_IMAGE as string,
  };

  try {
    const existingAdmin = await findUserByEmail(adminConfig.email);
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    const admin = await createUser(
      adminConfig.name,
      adminConfig.email,
      adminConfig.password,
      adminConfig.image,
      Role.ADMIN
    );
    console.log("Admin user created successfully");
  } catch (err) {
    process.exitCode = 1;
    console.error("Error seeding admin user:", err);
  } finally {
    await prisma.$disconnect();
    if (process.exitCode === 1) {
      process.exit(1);
    }
  }
}

seedAdmin();
