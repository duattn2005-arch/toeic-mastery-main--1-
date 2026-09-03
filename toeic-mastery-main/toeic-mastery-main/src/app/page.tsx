import Link from "next/link";
import { ArrowRight, BarChart3, BookA, Headphones, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

const FEATURES = [
  {
    icon: Headphones,
    title: "Đề thi thử sát thực tế",
    description: "200 câu, 120 phút, giao diện thi giống thật với timer bền vững và tự động lưu bài làm.",
  },
  {
    icon: BookA,
    title: "Từ điển thông minh toàn trang",
    description: "Bôi đen bất kỳ từ tiếng Anh nào trên trang để tra nghĩa ngay lập tức, không rời trang.",
  },
  {
    icon: Layers,
    title: "Từ vựng lặp lại ngắt quãng",
    description: "Flashcard theo thuật toán SM-2, nhắc ôn đúng lúc để nhớ lâu hơn.",
  },
  {
    icon: BarChart3,
    title: "Phân tích điểm yếu theo Part",
    description: "Radar chart 7 Part, gợi ý luyện tập theo dữ liệu thực tế của bạn.",
  },
];

export default async function LandingPage() {
  const profile = await getCurrentProfile();
  if (profile) redirect("/dashboard");

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Headphones className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">TOEIC Mastery</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild>
            <Link href="/register">
              Bắt đầu miễn phí <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="size-3.5" /> Nền tảng luyện thi TOEIC toàn diện
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Chinh phục điểm TOEIC mục tiêu <br className="hidden sm:block" /> với lộ trình cá nhân hóa
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground text-balance">
          Luyện đề đầy đủ 7 Part, từ điển thông minh ngay trên trang, flashcard lặp lại ngắt quãng và phân tích
          điểm yếu chi tiết — tất cả trong một nền tảng, hoàn toàn miễn phí để bắt đầu.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/register">
              Tạo tài khoản miễn phí <ArrowRight />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Tôi đã có tài khoản</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <feature.icon className="size-5" />
            </span>
            <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </section>

      <footer className="mt-auto border-t border-border px-6 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4" /> Nội dung TOEIC-style nguyên bản, không sao chép đề thi có bản quyền.
          </span>
          <span>© {new Date().getFullYear()} TOEIC Mastery</span>
        </div>
      </footer>
    </div>
  );
}
