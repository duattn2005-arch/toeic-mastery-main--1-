-- Lets a MentorTest represent the AI Mentor's short, all-Parts placement
-- test (see generatePlacementTest) alongside the existing single-dimension
-- (PART/GRAMMAR_TOPIC/VOCAB_TOPIC) mini-tests.
ALTER TYPE "SkillDimensionType" ADD VALUE 'PLACEMENT';
