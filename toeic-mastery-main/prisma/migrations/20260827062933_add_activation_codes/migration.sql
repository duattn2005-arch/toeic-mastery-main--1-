-- CreateTable
CREATE TABLE "activation_codes" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "plan_duration_days" INTEGER NOT NULL,
    "used_by_user_id" UUID,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activation_codes_code_key" ON "activation_codes"("code");

-- AddForeignKey
ALTER TABLE "activation_codes" ADD CONSTRAINT "activation_codes_used_by_user_id_fkey" FOREIGN KEY ("used_by_user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
