"use client";

import * as React from "react";
import { toast } from "sonner";

/** Surfaces a toast when the connection drops or comes back — the exam
 * engine keeps working offline (local autosave), so this is informational. */
export function OfflineIndicator() {
  React.useEffect(() => {
    function handleOffline() {
      toast.warning("Mất kết nối mạng. Bài làm vẫn được lưu tạm trên máy và sẽ đồng bộ khi có mạng trở lại.", {
        id: "offline-toast",
        duration: Infinity,
      });
    }
    function handleOnline() {
      toast.dismiss("offline-toast");
      toast.success("Đã kết nối lại mạng.", { duration: 3000 });
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
