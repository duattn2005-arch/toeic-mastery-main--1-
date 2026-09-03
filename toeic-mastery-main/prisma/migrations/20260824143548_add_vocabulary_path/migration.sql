-- CreateTable
CREATE TABLE "vocabulary_paths" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabulary_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_path_days" (
    "id" UUID NOT NULL,
    "path_id" UUID NOT NULL,
    "day_number" INTEGER NOT NULL,
    "tier_label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabulary_path_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_path_day_words" (
    "id" UUID NOT NULL,
    "day_id" UUID NOT NULL,
    "vocabulary_word_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vocabulary_path_day_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_vocabulary_path_day_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "day_id" UUID NOT NULL,
    "steps_completed" INTEGER NOT NULL DEFAULT 0,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_vocabulary_path_day_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_paths_slug_key" ON "vocabulary_paths"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_path_days_path_id_day_number_key" ON "vocabulary_path_days"("path_id", "day_number");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_path_day_words_day_id_vocabulary_word_id_key" ON "vocabulary_path_day_words"("day_id", "vocabulary_word_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_vocabulary_path_day_progress_user_id_day_id_key" ON "user_vocabulary_path_day_progress"("user_id", "day_id");

-- AddForeignKey
ALTER TABLE "vocabulary_path_days" ADD CONSTRAINT "vocabulary_path_days_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "vocabulary_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_path_day_words" ADD CONSTRAINT "vocabulary_path_day_words_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "vocabulary_path_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_path_day_words" ADD CONSTRAINT "vocabulary_path_day_words_vocabulary_word_id_fkey" FOREIGN KEY ("vocabulary_word_id") REFERENCES "vocabulary_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabulary_path_day_progress" ADD CONSTRAINT "user_vocabulary_path_day_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabulary_path_day_progress" ADD CONSTRAINT "user_vocabulary_path_day_progress_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "vocabulary_path_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
