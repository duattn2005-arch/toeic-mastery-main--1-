import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập — TOEIC Mastery" };

export default function LoginPage() {
  return <LoginForm />;
}
