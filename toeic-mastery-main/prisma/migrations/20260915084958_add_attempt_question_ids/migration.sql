-- Lets an Attempt cover an explicit set of specific question ids instead of
-- always being "the whole test" or "a Part subset of the whole test" — used
-- by "retry just the questions I got wrong" (see startMistakeRetryAction),
-- which can span the whole test rather than one contiguous Part range.
-- Empty (the default) means "use testId + parts as before" for every
-- existing attempt.
ALTER TABLE "attempts" ADD COLUMN "question_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
