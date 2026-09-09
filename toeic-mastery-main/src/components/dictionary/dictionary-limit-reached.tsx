import Link from "next/link";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FREE_DICTIONARY_LOOKUPS_PER_DAY } from "@/lib/constants/limits";

export function DictionaryLimitReached() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-16 text-center">
      <Crown className="size-10 text-primary" />
      <h1 className="text-lg font-semibold">Nâng cấp tài khoản để tiếp tục tra cứu</h1>
      <p className="text-sm text-muted-foreground">
        Bạn đã dùng hết {FREE_DICTIONARY_LOOKUPS_PER_DAY} lượt tra miễn phí hôm nay. Nâng cấp Pro để tra từ không giới hạn, mọi lúc mọi nơi.
      </p>
      <Button asChild>
        <Link href="/pricing">Nâng cấp Pro</Link>
      </Button>
    </div>
  );
}
