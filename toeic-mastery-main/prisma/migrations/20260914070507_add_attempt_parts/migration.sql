-- Scopes an Attempt to a subset of a test's Parts (Listening-only,
-- Reading-only, or a hand-picked set) instead of always covering the whole
-- test. Empty array (the default, and every existing row) means "the whole
-- test" — unchanged behavior for every attempt that already exists.
ALTER TABLE "attempts" ADD COLUMN "parts" "TestPart"[] NOT NULL DEFAULT ARRAY[]::"TestPart"[];
