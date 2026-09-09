"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Coins, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { getShopItemStatus, type ShopItem, type ShopItemRarity } from "@/lib/constants/xp-shop";
import { redeemShopItemAction } from "@/lib/actions/xp-shop";
import { XpShopItemVisual } from "@/components/shop/xp-shop-item-visual";

const RARITY_STYLES: Record<ShopItemRarity, { label: string; badge: string }> = {
  COMMON: { label: "Common", badge: "bg-muted text-muted-foreground" },
  RARE: { label: "Rare", badge: "bg-info/10 text-info" },
  EPIC: { label: "Epic", badge: "bg-primary/10 text-primary" },
  LEGENDARY: { label: "Legendary", badge: "bg-warning/15 text-warning" },
  MYTHIC: { label: "Mythic", badge: "bg-destructive/10 text-destructive" },
};

export function XpShopItemCard({ item, userXp, owned }: { item: ShopItem; userXp: number; owned: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const { canAfford, missingXp } = getShopItemStatus(userXp, item.priceXp);
  const rarity = RARITY_STYLES[item.rarity];
  const showStar = item.rarity === "LEGENDARY" || item.rarity === "MYTHIC";

  function handleRedeem() {
    startTransition(async () => {
      const result = await redeemShopItemAction(item.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Đã đổi "${item.name}"!`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-soft">
      <div className="py-1">
        <XpShopItemVisual id={item.id} rarity={item.rarity} size={92} />
      </div>

      <div>
        <p className="text-sm font-semibold">{item.name}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
      </div>

      <div className="mt-1 flex w-full items-end justify-between gap-2">
        <div className="flex flex-col items-start gap-1">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", rarity.badge)}>
            {showStar && <Star className="size-3 fill-current" />}
            {rarity.label}
          </span>
          <span className="flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400">
            <Coins className="size-3.5" />
            {item.priceXp.toLocaleString("vi-VN")}
          </span>
        </div>

        {owned ? (
          <span className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
            <Check className="size-3.5" /> Đã sở hữu
          </span>
        ) : canAfford ? (
          <button
            type="button"
            onClick={handleRedeem}
            disabled={pending}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {pending && <Loader2 className="size-3 animate-spin" />}
            Đổi ngay
          </button>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">Thiếu {missingXp.toLocaleString("vi-VN")} XP</span>
        )}
      </div>
    </div>
  );
}
