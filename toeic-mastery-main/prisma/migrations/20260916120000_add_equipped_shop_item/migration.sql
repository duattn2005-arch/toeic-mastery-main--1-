-- Tracks which XP shop item (an avatar frame) an account currently has
-- equipped, so redeeming/equipping one actually shows up as the account's
-- avatar in the header/sidebar instead of just sitting in their collection.
ALTER TABLE "profiles" ADD COLUMN "equipped_shop_item_id" TEXT;
