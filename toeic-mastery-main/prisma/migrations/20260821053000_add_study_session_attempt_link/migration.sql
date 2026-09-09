-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN "attempt_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "study_sessions_attempt_id_key" ON "study_sessions"("attempt_id");

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
