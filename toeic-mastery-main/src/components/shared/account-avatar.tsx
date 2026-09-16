import { XpShopItemVisual } from "@/components/shop/xp-shop-item-visual";
import { XP_SHOP_ITEMS } from "@/lib/constants/xp-shop";

/**
 * The account's avatar wherever it's shown chrome-side (header dropdown,
 * sidebar profile card): an equipped XP shop frame (see xp-shop.ts actions)
 * takes over entirely — those scenes draw their own mascot illustration, not
 * an overlay on top of a photo — falling back to the uploaded avatarUrl
 * photo, then to the caller's placeholder icon.
 */
export function AccountAvatar({
  avatarUrl,
  equippedShopItemId,
  size,
  fallback,
}: {
  avatarUrl: string | null;
  equippedShopItemId: string | null;
  size: number;
  fallback: React.ReactNode;
}) {
  const equippedItem = equippedShopItemId ? XP_SHOP_ITEMS.find((i) => i.id === equippedShopItemId) : undefined;

  if (equippedItem) {
    return <XpShopItemVisual id={equippedItem.id} rarity={equippedItem.rarity} size={size} />;
  }

  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt="" className="size-full rounded-full object-cover" />;
  }

  return <>{fallback}</>;
}
