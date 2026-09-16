import Image from "next/image";
import { cn } from "@/lib/utils";
import { XpShopItemVisual } from "@/components/shop/xp-shop-item-visual";
import { XP_SHOP_ITEMS } from "@/lib/constants/xp-shop";

/**
 * The site's brand mascot badge — replaces the old generic Headphones-icon-
 * in-a-colored-box used in the sidebar/header/auth layout. Same square
 * source image as the favicon/app icon (src/app/icon.png, public/logo-mark.png)
 * so the badge someone sees in the header always matches their browser tab.
 */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-xl", className)}
      style={{ width: size, height: size }}
      priority
    />
  );
}

/**
 * The brand mark for a logged-in viewer: shows their equipped XP shop frame
 * (same mascot scene as their avatar) instead of the plain static badge when
 * they have one equipped, so the sidebar/header logo reflects their account
 * the same way their own avatar does. Logged-out surfaces (auth pages,
 * public-app-shell) have no profile to equip anything, so they keep using
 * the plain `LogoMark` directly.
 */
export function EquippableLogoMark({ size = 36, equippedShopItemId }: { size?: number; equippedShopItemId: string | null }) {
  const equippedItem = equippedShopItemId ? XP_SHOP_ITEMS.find((i) => i.id === equippedShopItemId) : undefined;
  if (equippedItem) {
    return <XpShopItemVisual id={equippedItem.id} rarity={equippedItem.rarity} size={size} />;
  }
  return <LogoMark size={size} />;
}
