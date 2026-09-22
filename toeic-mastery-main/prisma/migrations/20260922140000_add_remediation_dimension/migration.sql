-- Lets a MentorTest represent an auto-generated "học bù" (remediation)
-- mini-test pooled across the weak/hổng labels a LEVEL_GATE result just
-- produced (see src/lib/services/mentor/level-gate.ts's
-- generateRemediationTest).
ALTER TYPE "SkillDimensionType" ADD VALUE 'REMEDIATION';
