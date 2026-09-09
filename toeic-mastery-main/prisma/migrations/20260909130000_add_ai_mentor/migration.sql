-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'PLACEMENT_PENDING', 'READY');

-- CreateEnum
CREATE TYPE "VocabOrigin" AS ENUM ('MANUAL', 'AI_DETECTED_WEAKNESS');

-- CreateEnum
CREATE TYPE "MentorRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MentorConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SkillDimensionType" AS ENUM ('PART', 'GRAMMAR_TOPIC', 'VOCAB_TOPIC');

-- CreateEnum
CREATE TYPE "LearningPathStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "LearningDayStatus" AS ENUM ('LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LearningItemType" AS ENUM ('GRAMMAR_LESSON', 'VOCAB_TOPIC', 'VOCAB_REVIEW', 'LISTENING_PRACTICE', 'READING_PRACTICE', 'MINI_TEST', 'FULL_TEST', 'TIP');

-- CreateEnum
CREATE TYPE "LearningItemStatus" AS ENUM ('PENDING', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "MentorTestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "EmbeddingSourceType" AS ENUM ('GRAMMAR_LESSON', 'VOCABULARY_WORD', 'QUESTION_EXPLANATION', 'VOCABULARY_TOPIC');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "onboarding_status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "profiles" ADD COLUMN "onboarding_completed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_vocabulary" ADD COLUMN "origin" "VocabOrigin" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "user_vocabulary" ADD COLUMN "source_attempt_answer_id" UUID;

-- CreateTable
CREATE TABLE "mentor_conversations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT,
    "status" "MentorConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "origin_question_id" UUID,
    "origin_attempt_id" UUID,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" "MentorRole" NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "token_count" INTEGER,
    "model_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_memories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "summarized_through" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_mastery" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "dimension_type" "SkillDimensionType" NOT NULL,
    "dimension_key" TEXT NOT NULL,
    "attempted_count" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "mastery_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_practiced_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_mastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_unlocks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "dimension_type" "SkillDimensionType" NOT NULL,
    "dimension_key" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "LearningPathStatus" NOT NULL DEFAULT 'ACTIVE',
    "target_score" INTEGER NOT NULL,
    "exam_date" DATE,
    "rationale" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_days" (
    "id" UUID NOT NULL,
    "path_id" UUID NOT NULL,
    "day_number" INTEGER NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "focus_parts" "TestPart"[] NOT NULL DEFAULT ARRAY[]::"TestPart"[],
    "status" "LearningDayStatus" NOT NULL DEFAULT 'LOCKED',
    "summary" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_path_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_items" (
    "id" UUID NOT NULL,
    "day_id" UUID NOT NULL,
    "item_type" "LearningItemType" NOT NULL,
    "ref_id" UUID,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "status" "LearningItemStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_path_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_tests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "conversation_id" UUID,
    "dimension_type" "SkillDimensionType" NOT NULL,
    "dimension_key" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "status" "MentorTestStatus" NOT NULL DEFAULT 'PENDING',
    "pass_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "score" DOUBLE PRECISION,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_test_questions" (
    "id" UUID NOT NULL,
    "mentor_test_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "selected_label" VARCHAR(1),
    "is_correct" BOOLEAN,
    "answered_at" TIMESTAMP(3),

    CONSTRAINT "mentor_test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_embeddings" (
    "id" UUID NOT NULL,
    "source_type" "EmbeddingSourceType" NOT NULL,
    "source_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "embedding_model" TEXT NOT NULL,
    "source_updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mentor_conversations_user_id_last_message_at_idx" ON "mentor_conversations"("user_id", "last_message_at");

-- CreateIndex
CREATE INDEX "mentor_messages_conversation_id_created_at_idx" ON "mentor_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_memories_user_id_key" ON "mentor_memories"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_mastery_user_id_dimension_type_dimension_key_key" ON "skill_mastery"("user_id", "dimension_type", "dimension_key");

-- CreateIndex
CREATE INDEX "skill_mastery_user_id_mastery_score_idx" ON "skill_mastery"("user_id", "mastery_score");

-- CreateIndex
CREATE UNIQUE INDEX "skill_unlocks_user_id_dim_type_dim_key_difficulty_key" ON "skill_unlocks"("user_id", "dimension_type", "dimension_key", "difficulty");

-- CreateIndex
CREATE INDEX "learning_paths_user_id_status_idx" ON "learning_paths"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_days_path_id_day_number_key" ON "learning_path_days"("path_id", "day_number");

-- CreateIndex
CREATE INDEX "learning_path_days_path_id_scheduled_date_idx" ON "learning_path_days"("path_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "learning_path_items_day_id_order_index_idx" ON "learning_path_items"("day_id", "order_index");

-- CreateIndex
CREATE INDEX "mentor_tests_user_id_status_idx" ON "mentor_tests"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_test_questions_mentor_test_id_question_id_key" ON "mentor_test_questions"("mentor_test_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_embeddings_source_type_source_id_chunk_index_key" ON "content_embeddings"("source_type", "source_id", "chunk_index");

-- CreateIndex
CREATE INDEX "user_vocabulary_user_id_origin_idx" ON "user_vocabulary"("user_id", "origin");

-- AddForeignKey
ALTER TABLE "user_vocabulary" ADD CONSTRAINT "user_vocabulary_source_attempt_answer_id_fkey" FOREIGN KEY ("source_attempt_answer_id") REFERENCES "attempt_answers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_conversations" ADD CONSTRAINT "mentor_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_conversations" ADD CONSTRAINT "mentor_conversations_origin_question_id_fkey" FOREIGN KEY ("origin_question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_conversations" ADD CONSTRAINT "mentor_conversations_origin_attempt_id_fkey" FOREIGN KEY ("origin_attempt_id") REFERENCES "attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_messages" ADD CONSTRAINT "mentor_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "mentor_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_memories" ADD CONSTRAINT "mentor_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_mastery" ADD CONSTRAINT "skill_mastery_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_unlocks" ADD CONSTRAINT "skill_unlocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_days" ADD CONSTRAINT "learning_path_days_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_items" ADD CONSTRAINT "learning_path_items_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "learning_path_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_tests" ADD CONSTRAINT "mentor_tests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_tests" ADD CONSTRAINT "mentor_tests_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "mentor_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_test_questions" ADD CONSTRAINT "mentor_test_questions_mentor_test_id_fkey" FOREIGN KEY ("mentor_test_id") REFERENCES "mentor_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_test_questions" ADD CONSTRAINT "mentor_test_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Manual (Prisma cannot generate DDL for `Unsupported` column types or
-- vector indexes — see the ContentEmbedding model comment in schema.prisma).
-- Requires the `vector` extension to be installed on the Postgres server
-- itself first (self-hosted VPS: e.g. `apt install postgresql-16-pgvector`,
-- matching whatever major version the server runs, then restart Postgres)
-- before this migration can run.
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "content_embeddings" ADD COLUMN "embedding" vector(1024) NOT NULL;

-- HNSW: better query recall/speed than ivfflat at this content volume
-- (low thousands of chunks), and unlike ivfflat needs no pre-existing rows
-- to train against, so it can be created up front on an empty table.
CREATE INDEX "content_embeddings_embedding_hnsw_idx" ON "content_embeddings" USING hnsw ("embedding" vector_cosine_ops);
