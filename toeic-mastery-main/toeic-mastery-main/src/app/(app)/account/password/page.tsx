import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PasswordForm } from "@/components/account/password-form";

export const metadata: Metadata = { title: "Đổi mật khẩu" };

export default async function AccountPasswordPage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Đổi mật khẩu</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cập nhật mật khẩu đăng nhập cho tài khoản của bạn.</p>
      </div>

      <div className="max-w-md rounded-2xl border border-border bg-card p-6 shadow-soft">
        <PasswordForm />
      </div>
    </div>
  );
}
