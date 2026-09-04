-- AlterTable
ALTER TABLE "tests" ADD COLUMN "is_pro" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "tests_is_pro_idx" ON "tests"("is_pro");
