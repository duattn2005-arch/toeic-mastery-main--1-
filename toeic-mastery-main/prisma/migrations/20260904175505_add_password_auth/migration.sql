-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "reset_code_hash" TEXT,
ADD COLUMN     "reset_code_expires_at" TIMESTAMP(3);
