-- Cấp A "nhãn chiến lược" (StrategicLabel) — the dual-label signal used
-- alongside PART/GRAMMAR_TOPIC for Intermediate→Advanced gating and
-- internal Advanced-readiness classification (see level-gate.ts,
-- advanced-readiness.ts).
ALTER TYPE "SkillDimensionType" ADD VALUE 'STRATEGIC_LABEL';
