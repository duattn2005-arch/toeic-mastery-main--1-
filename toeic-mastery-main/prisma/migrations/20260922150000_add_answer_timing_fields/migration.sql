-- AlterTable
ALTER TABLE "attempt_answers" ADD COLUMN "first_answered_at" TIMESTAMP(3),
ADD COLUMN "initial_selected_label" VARCHAR(1),
ADD COLUMN "answer_change_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "mentor_test_questions" ADD COLUMN "time_spent_sec" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "first_answered_at" TIMESTAMP(3),
ADD COLUMN "initial_selected_label" VARCHAR(1),
ADD COLUMN "answer_change_count" INTEGER NOT NULL DEFAULT 0;
