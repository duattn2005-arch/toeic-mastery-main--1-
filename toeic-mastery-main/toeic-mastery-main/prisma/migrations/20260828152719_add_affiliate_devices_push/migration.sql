-- CreateEnum
CREATE TYPE "AttributionSource" AS ENUM ('COOKIE', 'FINGERPRINT');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'WITHDRAWABLE', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('COMPUTER', 'PHONE', 'TABLET');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "refunded_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "attribution_source" "AttributionSource",
ADD COLUMN     "first_pro_payment_at" TIMESTAMP(3),
ADD COLUMN     "fraud_note" TEXT,
ADD COLUMN     "is_flagged_fraud" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_late_attribution" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referral_code" TEXT,
ADD COLUMN     "referred_at" TIMESTAMP(3),
ADD COLUMN     "referred_by_profile_id" UUID,
ADD COLUMN     "successful_referral_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "referral_clicks" (
    "id" UUID NOT NULL,
    "referral_code" TEXT NOT NULL,
    "referrer_profile_id" UUID NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "fingerprint_hash" TEXT NOT NULL,
    "landing_path" TEXT,
    "clicked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" UUID NOT NULL,
    "referrer_id" UUID NOT NULL,
    "referred_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "rate_percent" INTEGER NOT NULL,
    "tier" TEXT,
    "is_late_attribution" BOOLEAN NOT NULL DEFAULT false,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "withdrawal_id" UUID,
    "fraud_note" TEXT,
    "confirm_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "qr_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "admin_note" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "DeviceType" NOT NULL,
    "label" TEXT NOT NULL,
    "fingerprint_hash" TEXT NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_ip" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sent_at" TIMESTAMP(3),

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "referral_clicks_fingerprint_hash_clicked_at_idx" ON "referral_clicks"("fingerprint_hash", "clicked_at");

-- CreateIndex
CREATE INDEX "referral_clicks_referrer_profile_id_clicked_at_idx" ON "referral_clicks"("referrer_profile_id", "clicked_at");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_payment_id_key" ON "commissions"("payment_id");

-- CreateIndex
CREATE INDEX "commissions_referrer_id_status_idx" ON "commissions"("referrer_id", "status");

-- CreateIndex
CREATE INDEX "commissions_status_confirm_at_idx" ON "commissions"("status", "confirm_at");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_user_id_key" ON "bank_accounts"("user_id");

-- CreateIndex
CREATE INDEX "bank_accounts_account_number_idx" ON "bank_accounts"("account_number");

-- CreateIndex
CREATE INDEX "withdrawals_user_id_idx" ON "withdrawals"("user_id");

-- CreateIndex
CREATE INDEX "withdrawals_status_idx" ON "withdrawals"("status");

-- CreateIndex
CREATE INDEX "devices_user_id_idx" ON "devices"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "devices_user_id_fingerprint_hash_key" ON "devices"("user_id", "fingerprint_hash");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_referral_code_key" ON "profiles"("referral_code");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_referred_by_profile_id_fkey" FOREIGN KEY ("referred_by_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_referrer_profile_id_fkey" FOREIGN KEY ("referrer_profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "withdrawals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

