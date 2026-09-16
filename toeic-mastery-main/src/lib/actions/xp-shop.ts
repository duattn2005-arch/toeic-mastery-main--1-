"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";
import { getSpendableXp } from "@/lib/data/xp-shop";
import { XP_SHOP_ITEMS, getShopItemStatus } from "@/lib/constants/xp-shop";

export interface RedeemShopItemResult {
  error?: string;
  spendableXp?: number;
}

export async function redeemShopItemAction(itemId: string): Promise<RedeemShopItemResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  const item = XP_SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return { error: "Vật phẩm không tồn tại" };

  const alreadyOwned = await db.userShopItem.findUnique({
    where: { userId_itemId: { userId: profile.id, itemId } },
  });
  if (alreadyOwned) return { error: "Bạn đã sở hữu vật phẩm này" };

  const spendableXp = await getSpendableXp(profile.id);
  if (!getShopItemStatus(spendableXp, item.priceXp).canAfford) {
    return { error: "Không đủ XP để đổi vật phẩm này" };
  }

  try {
    await db.$transaction([
      // Redeeming immediately wears it too — a shop full of items no one
      // ever sees applied anywhere isn't much of a shop.
      db.profile.update({
        where: { id: profile.id },
        data: { xpSpent: { increment: item.priceXp }, equippedShopItemId: item.id },
      }),
      db.userShopItem.create({ data: { userId: profile.id, itemId: item.id, priceXp: item.priceXp } }),
    ]);
  } catch (err) {
    // Two redeems for the same item raced past the findUnique check above —
    // the unique constraint on [userId, itemId] is the real guard.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Bạn đã sở hữu vật phẩm này" };
    }
    throw err;
  }

  revalidatePath("/shop");
  revalidatePath("/", "layout");
  return { spendableXp: spendableXp - item.priceXp };
}

export interface EquipShopItemResult {
  error?: string;
}

/** Switches the account's displayed avatar frame to an already-owned item —
 * redeeming a new one auto-equips it (see above), this is for going back to
 * a previously bought one instead. */
export async function equipShopItemAction(itemId: string): Promise<EquipShopItemResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Vui lòng đăng nhập" };

  const owned = await db.userShopItem.findUnique({
    where: { userId_itemId: { userId: profile.id, itemId } },
  });
  if (!owned) return { error: "Bạn chưa sở hữu vật phẩm này" };

  await db.profile.update({ where: { id: profile.id }, data: { equippedShopItemId: itemId } });

  revalidatePath("/shop");
  revalidatePath("/", "layout");
  return {};
}
