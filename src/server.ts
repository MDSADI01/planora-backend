import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = process.env.PORT || 8000;

const serverFunction = async () => {
  try {
    await prisma.$connect();
    ("Connected to database Successfully");

    app.listen(PORT, () => {
      `Server is running on http://localhost:${PORT}`;
    });
  } catch (err) {
    await prisma.$disconnect();
    throw new Error(
      `An error occurred while starting server: ${
        err instanceof Error ? err.message : "Unknown error"
      }`
    );
  }
};

serverFunction();
