import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Đăng ký — TOEIC Mastery" };

export default function RegisterPage() {
  return <RegisterForm />;
}
