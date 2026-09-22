-- CreateEnum
CREATE TYPE "MentorLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "mentor_level" "MentorLevel" NOT NULL DEFAULT 'BEGINNER';
