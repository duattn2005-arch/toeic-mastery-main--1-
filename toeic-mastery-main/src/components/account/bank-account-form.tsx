"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bankAccountSchema, type BankAccountInput } from "@/lib/validations/account";
import { updateBankAccountAction } from "@/lib/actions/account";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function BankAccountForm({ defaultValues }: { defaultValues: BankAccountInput }) {
  const [qrUrl, setQrUrl] = React.useState(defaultValues.qrImageUrl ?? null);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(bankAccountSchema), defaultValues });

  async function handleQrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Chỉ hỗ trợ ảnh PNG, JPEG hoặc WebP");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload/bank-qr", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Tải ảnh QR thất bại");

      setQrUrl(data.url);
      setValue("qrImageUrl", data.url);
      toast.success("Đã tải ảnh QR");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tải ảnh QR thất bại");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: BankAccountInput) {
    const result = await updateBankAccountAction(values);
    if (result.error) toast.error(result.error);
    else toast.success("Đã lưu thông tin ngân hàng");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bankName">Ngân hàng</Label>
          <Input id="bankName" placeholder="VD: MB Bank" {...register("bankName")} />
          {errors.bankName && <p className="text-xs text-destructive">{errors.bankName.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="accountNumber">Số tài khoản</Label>
          <Input id="accountNumber" {...register("accountNumber")} />
          {errors.accountNumber && <p className="text-xs text-destructive">{errors.accountNumber.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="accountHolder">Chủ tài khoản</Label>
        <Input id="accountHolder" {...register("accountHolder")} />
        {errors.accountHolder && <p className="text-xs text-destructive">{errors.accountHolder.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Ảnh QR chuyển khoản (không bắt buộc)</Label>
        <div className="flex items-center gap-3">
          {qrUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="" className="size-16 rounded-lg border border-border object-cover" />
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={handleQrChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
            {qrUrl ? "Đổi ảnh QR" : "Tải ảnh QR"}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Lưu thông tin ngân hàng
      </Button>
    </form>
  );
}
