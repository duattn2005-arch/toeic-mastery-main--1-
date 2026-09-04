"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReferralLinkCard({ referralLink, referralCode }: { referralLink: string; referralCode: string | null }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Đã sao chép link giới thiệu");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép, vui lòng sao chép thủ công");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs font-medium text-muted-foreground">Link giới thiệu của bạn</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          readOnly
          value={referralLink}
          className="font-mono text-xs sm:text-sm"
          onFocus={(e) => e.target.select()}
        />
        <Button type="button" onClick={handleCopy} className="shrink-0">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          Sao chép
        </Button>
      </div>
      {referralCode && (
        <p className="mt-2 text-xs text-muted-foreground">
          Mã giới thiệu: <span className="font-mono font-medium text-foreground">{referralCode}</span>
        </p>
      )}
    </div>
  );
}
