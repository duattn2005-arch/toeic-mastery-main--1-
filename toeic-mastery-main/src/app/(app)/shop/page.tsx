import type { Metadata } from "next";
import { Coins } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { MOCK_USER_XP, XP_SHOP_ITEMS } from "@/lib/constants/xp-shop";
import { XpShopItemCard } from "@/components/shop/xp-shop-item-card";

export const metadata: Metadata = { title: "Cửa hàng XP" };

export default async function ShopPage() {
  await requireUser();
  // Stand-in until a real XP ledger exists — see MOCK_USER_XP.
  const userXp = MOCK_USER_XP;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cửa hàng XP</h1>
          <p className="mt-1 text-sm text-muted-foreground">Đổi khung avatar và vật phẩm bằng XP tiêu dùng bạn tích lũy được.</p>
        </div>
        <span className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-soft">
          <Coins className="size-4 text-amber-500" />
          <span className="text-sm text-muted-foreground">XP tiêu dùng</span>
          <span className="text-lg font-bold">{userXp.toLocaleString("vi-VN")}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {XP_SHOP_ITEMS.map((item) => (
          <XpShopItemCard key={item.id} item={item} userXp={userXp} />
        ))}
      </div>
    </div>
  );
}
