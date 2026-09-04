"use client";

import { useSequentialTour } from "@/hooks/use-tour-driver";
import { TOUR_IDS } from "@/lib/constants/tour";
import { DashboardTourIconCluster } from "@/components/dashboard/dashboard-tour-icon-cluster";

/**
 * Dashboard onboarding tour — 1 welcome modal + 5 spotlight steps, all on
 * this one page so a single `driver.js` instance drives the whole thing.
 * Anchors live in `app-sidebar.tsx`/`top-header.tsx` (mounted globally by
 * `app-shell.tsx`, not by this page) and in `dashboard-hero.tsx` — driver.js
 * finds them by `document.querySelector`, so this component doesn't need to
 * be their DOM ancestor.
 *
 * Finishing step 5/5 marks the tour done and does not force
 * `WelcomeOfferModal` open — that modal already self-mounts in
 * `app-shell.tsx` and shows itself independently once eligible.
 */
export function DashboardTour() {
  useSequentialTour(
    TOUR_IDS.DASHBOARD,
    [
      {
        title: "Chào mừng bạn đến với TOEIC Mastery! 🎉",
        description:
          "Khám phá nhanh các tính năng giúp bạn nâng band điểm hiệu quả, duy trì thói quen học tập và tối ưu hóa thời gian ôn luyện mỗi ngày.",
        nextBtnText: "Bắt đầu khám phá (1 phút)",
        noProgress: true,
      },
      {
        element: '[data-tour="dashboard-sidebar-nav"]',
        title: "Kho học liệu toàn diện",
        description:
          "Dễ dàng chuyển đổi giữa các phòng luyện đề chuẩn format, rèn luyện chuyên sâu từng kỹ năng Nghe – Đọc, củng cố ngữ pháp và tra cứu từ vựng nhanh chóng.",
        nextBtnText: "Tiếp tục",
        side: "right",
        align: "start",
      },
      {
        element: '[data-tour="dashboard-quick-study"]',
        title: "Luyện tập nhanh chỉ với 7 phút",
        description:
          "Tận dụng thời gian rảnh làm ngay một bài mini-test theo kỹ năng bạn muốn, giúp duy trì phản xạ làm đề và chuỗi ngày học mà không bị áp lực.",
        nextBtnText: "Tiếp tục",
        side: "bottom",
        align: "end",
      },
      {
        element: '[data-tour="dashboard-icons"]',
        title: "Không gian học theo phong cách riêng ✨",
        description:
          "Bật nhạc Lo-fi/Chill để tăng độ tập trung, đổi Live theme cho cả trang web theo phong cách bạn thích, tùy chỉnh giao diện Dark Mode bảo vệ mắt và nhận thông báo nhắc lịch học để không đứt chuỗi Streak.",
        descriptionNode: <DashboardTourIconCluster />,
        nextBtnText: "Tiếp tục",
        side: "bottom",
        align: "end",
      },
      {
        element: '[data-tour="dashboard-avatar"]',
        title: "Tài khoản & giới thiệu bạn bè",
        description:
          "Quản lý hồ sơ cá nhân, xem thiết bị đăng nhập — và đặc biệt, tham gia chương trình giới thiệu bạn bè để nhận hoa hồng.",
        nextBtnText: "Tiếp tục",
        side: "bottom",
        align: "end",
      },
      {
        element: '[data-tour="dashboard-goals"]',
        title: "Theo dõi thói quen & Cấp độ",
        description:
          "Kiểm soát mục tiêu học trong tuần, giữ vững chuỗi học liên tục và tích lũy điểm XP qua từng câu hỏi để thăng hạng và đổi nền.",
        nextBtnText: "Hoàn tất",
        side: "top",
        align: "start",
      },
    ],
    { welcomeCountsAsStep: false }
  );

  return null;
}
