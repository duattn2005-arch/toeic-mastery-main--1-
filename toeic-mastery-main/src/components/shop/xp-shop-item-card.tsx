"use client";

import { Coins, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { getShopItemStatus, type ShopItem, type ShopItemRarity } from "@/lib/constants/xp-shop";
import { RabbitIllustration } from "@/components/mascot/mascot-illustration";

const RARITY_STYLES: Record<ShopItemRarity, { label: string; badge: string; ring: string }> = {
  COMMON: { label: "Common", badge: "bg-muted text-muted-foreground", ring: "from-slate-300 to-slate-400" },
  RARE: { label: "Rare", badge: "bg-info/10 text-info", ring: "from-sky-400 to-info" },
  EPIC: { label: "Epic", badge: "bg-primary/10 text-primary", ring: "from-primary/60 to-primary" },
  LEGENDARY: { label: "Legendary", badge: "bg-warning/15 text-warning", ring: "from-amber-300 to-warning" },
  MYTHIC: { label: "Mythic", badge: "bg-destructive/10 text-destructive", ring: "from-fuchsia-400 to-destructive" },
};

export function XpShopItemCard({ item, userXp }: { item: ShopItem; userXp: number }) {
  const { canAfford, missingXp } = getShopItemStatus(userXp, item.priceXp);
  const rarity = RARITY_STYLES[item.rarity];
  const showStar = item.rarity === "LEGENDARY" || item.rarity === "MYTHIC";

  function handleRedeem() {
    toast.info("Tính năng đổi vật phẩm sẽ sớm ra mắt!");
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-soft">
      <div className={cn("relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br p-[3px]", rarity.ring)}>
        <div className="flex size-full items-center justify-center rounded-full bg-card">
          <RabbitIllustration state="success" className="size-12" />
        </div>
        {showStar && <Sparkles className="absolute -top-1 -right-1 size-4 text-warning" />}
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

        {canAfford ? (
          <button
            type="button"
            onClick={handleRedeem}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Đổi ngay
          </button>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">Thiếu {missingXp.toLocaleString("vi-VN")} XP</span>
        )}
      </div>
    </div>
  );
}
