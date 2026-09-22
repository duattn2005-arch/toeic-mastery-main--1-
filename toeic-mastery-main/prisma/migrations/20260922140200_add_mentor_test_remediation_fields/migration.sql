-- AlterTable
ALTER TABLE "mentor_tests" ADD COLUMN "remediation_labels" JSONB,
ADD COLUMN "source_level_gate_test_id" UUID;

-- AddForeignKey
ALTER TABLE "mentor_tests" ADD CONSTRAINT "mentor_tests_source_level_gate_test_id_fkey" FOREIGN KEY ("source_level_gate_test_id") REFERENCES "mentor_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
