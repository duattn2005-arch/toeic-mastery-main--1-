import { z } from "zod";

export const bankAccountSchema = z.object({
  bankName: z.string().trim().min(2, "Vui lòng nhập tên ngân hàng").max(120),
  accountNumber: z.string().trim().min(4, "Số tài khoản không hợp lệ").max(40),
  accountHolder: z.string().trim().min(2, "Vui lòng nhập tên chủ tài khoản").max(120),
  qrImageUrl: z.string().url().nullable().optional(),
});
export type BankAccountInput = z.infer<typeof bankAccountSchema>;
