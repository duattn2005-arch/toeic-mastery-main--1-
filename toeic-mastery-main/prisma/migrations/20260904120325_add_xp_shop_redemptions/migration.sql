-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "xp_spent" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_shop_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "item_id" TEXT NOT NULL,
    "price_xp" INTEGER NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_shop_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_shop_items_user_id_idx" ON "user_shop_items"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_shop_items_user_id_item_id_key" ON "user_shop_items"("user_id", "item_id");

-- AddForeignKey
ALTER TABLE "user_shop_items" ADD CONSTRAINT "user_shop_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
