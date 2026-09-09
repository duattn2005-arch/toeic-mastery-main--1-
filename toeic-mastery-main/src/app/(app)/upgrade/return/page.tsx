import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Kết quả thanh toán" };

/**
 * Display-only — the browser return redirect from VNPay is not guaranteed to
 * fire and can be replayed/spoofed, so it never grants Pro itself. The
 * server-to-server IPN (`/api/vnpay/ipn`) is what actually flips the plan;
 * by the time a user lands here the IPN has usually already run, but there's
 * no hard guarantee of ordering, hence the "sẽ được cập nhật trong ít phút"
 * hedge in the success copy.
 */
export default async function UpgradeReturnPage({ searchParams }: { searchParams: Promise<{ vnp_ResponseCode?: string }> }) {
  const { vnp_ResponseCode } = await searchParams;
  const isSuccess = vnp_ResponseCode === "00";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      {isSuccess ? (
        <>
          <CheckCircle2 className="size-14 text-success" />
          <h1 className="text-xl font-semibold">Thanh toán thành công!</h1>
          <p className="text-sm text-muted-foreground">
            Tài khoản của bạn sẽ được nâng cấp lên Pro trong ít phút. Nếu chưa thấy cập nhật, hãy tải lại trang Bảng giá.
          </p>
        </>
      ) : (
        <>
          <XCircle className="size-14 text-destructive" />
          <h1 className="text-xl font-semibold">Thanh toán chưa thành công</h1>
          <p className="text-sm text-muted-foreground">Giao dịch đã bị hủy hoặc thất bại. Bạn có thể thử lại bất cứ lúc nào.</p>
        </>
      )}
      <Button asChild>
        <Link href="/pricing">Về trang Bảng giá</Link>
      </Button>
    </div>
  );
}
