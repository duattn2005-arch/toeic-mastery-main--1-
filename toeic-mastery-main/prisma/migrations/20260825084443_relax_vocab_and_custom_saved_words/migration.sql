-- AlterTable: relax required fields on vocabulary_words for quick bulk import
ALTER TABLE "vocabulary_words" ALTER COLUMN "part_of_speech" DROP NOT NULL;
ALTER TABLE "vocabulary_words" ALTER COLUMN "definition_en" DROP NOT NULL;
ALTER TABLE "vocabulary_words" ALTER COLUMN "example_en" DROP NOT NULL;
ALTER TABLE "vocabulary_words" ALTER COLUMN "example_vi" DROP NOT NULL;

-- AlterTable: let learners author their own word's meaning/example
ALTER TABLE "saved_words" ADD COLUMN "meaning_vi" TEXT;
ALTER TABLE "saved_words" ADD COLUMN "example_en" TEXT;
