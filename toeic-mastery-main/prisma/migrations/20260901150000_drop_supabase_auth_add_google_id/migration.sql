-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "google_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_google_id_key" ON "profiles"("google_id");
