import Image from "next/image";
import { cn } from "@/lib/utils";

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
