-- Lets a MentorTest represent the Beginner->Intermediate/Intermediate->
-- Advanced level-up exam (see src/lib/services/mentor/level-gate.ts)
-- alongside the existing single-dimension (PART/GRAMMAR_TOPIC/VOCAB_TOPIC)
-- mini-tests and the PLACEMENT diagnostic.
ALTER TYPE "SkillDimensionType" ADD VALUE 'LEVEL_GATE';
