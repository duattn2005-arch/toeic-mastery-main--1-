import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ClipboardList,
  Headphones,
  BookOpen,
  SpellCheck2,
  Layers,
  BookA,
  Bookmark,
  History,
  BarChart3,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const MAIN_NAV: NavItem[] = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Luyện đề", href: "/practice", icon: ClipboardList },
  { label: "Listening", href: "/listening", icon: Headphones },
  { label: "Reading", href: "/reading", icon: BookOpen },
  { label: "Grammar", href: "/grammar", icon: SpellCheck2 },
  { label: "Từ vựng", href: "/vocabulary", icon: Layers },
  { label: "Từ điển", href: "/dictionary", icon: BookA },
  { label: "Đã lưu", href: "/bookmarks", icon: Bookmark },
  { label: "Lịch sử", href: "/history", icon: History },
  { label: "Thống kê", href: "/analytics", icon: BarChart3 },
];

export const MOBILE_NAV: NavItem[] = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Luyện đề", href: "/practice", icon: ClipboardList },
  { label: "Từ vựng", href: "/vocabulary", icon: Layers },
  { label: "Từ điển", href: "/dictionary", icon: BookA },
  { label: "Thống kê", href: "/analytics", icon: BarChart3 },
];
