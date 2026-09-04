"use client";

import * as React from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function PushToggle() {
  const { supported, permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications();
  const [busy, setBusy] = React.useState(false);

  async function handleChange(checked: boolean) {
    setBusy(true);
    try {
      if (checked) {
        await subscribe();
        toast.success("Đã bật thông báo nhắc học mỗi ngày");
      } else {
        await unsubscribe();
        toast.success("Đã tắt thông báo nhắc học");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật thông báo");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Đang kiểm tra trình duyệt...
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <BellOff className="mt-0.5 size-4 shrink-0" />
        Trình duyệt này không hỗ trợ thông báo đẩy. Hãy thử trên Chrome, Edge hoặc Firefox phiên bản mới.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Bell className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium">Thông báo nhắc học mỗi ngày</p>
          <p className="text-xs text-muted-foreground">
            Nhận thông báo đẩy nhắc bạn duy trì streak học tập. Hiện tại thông báo được gửi vào một khung giờ cố định
            chung cho tất cả người dùng, chưa hỗ trợ chọn giờ riêng.
          </p>
          {permission === "denied" && (
            <p className="mt-1 text-xs text-destructive">
              Trình duyệt đang chặn thông báo — hãy bật lại quyền thông báo cho trang này trong cài đặt trình duyệt.
            </p>
          )}
        </div>
      </div>
      <Switch checked={subscribed} disabled={busy || permission === "denied"} onCheckedChange={handleChange} />
    </div>
  );
}
