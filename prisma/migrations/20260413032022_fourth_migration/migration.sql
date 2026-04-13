-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ParticipantStatus" ADD VALUE 'PENDING';
ALTER TYPE "ParticipantStatus" ADD VALUE 'APPROVED';
ALTER TYPE "ParticipantStatus" ADD VALUE 'REJECTED';
ALTER TYPE "ParticipantStatus" ADD VALUE 'BANNED';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "eventCategory" "EventCategory" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "EventParticipant" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "rating" SET DATA TYPE DOUBLE PRECISION;
