import { User, Role } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";


export const createUser = async (name: string, email: string, password: string, image?: string, role: Role = Role.USER): Promise<User> => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create the user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      ...(image && { image }), // Only include image if it is provided
    },
  });

  return user;
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};
