-- CreateTable
CREATE TABLE "answer_reveal_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_reveal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "answer_reveal_logs_user_id_created_at_idx" ON "answer_reveal_logs"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "answer_reveal_logs" ADD CONSTRAINT "answer_reveal_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_reveal_logs" ADD CONSTRAINT "answer_reveal_logs_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
