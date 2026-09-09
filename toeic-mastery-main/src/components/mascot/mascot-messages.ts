import type { MascotState } from "@/components/mascot/types";

const MESSAGES: Record<MascotState, string[]> = {
  idle: ["Hôm nay mình học tiếp nhé? 🦊", "Sẵn sàng chinh phục TOEIC chưa nào?", "Mình luôn ở đây nếu bạn cần động lực!"],
  studying: ["Tập trung nào, bạn làm được mà!", "Từng câu một thôi, đừng vội 🐰", "Bình tĩnh đọc kỹ đề nhé!"],
  encouraging: ["Cố thêm vài câu nữa nhé! 🐰", "Bạn đang làm rất tốt đó!", "Tuyệt vời, tiếp tục phát huy nhé!"],
  success: ["Xuất sắc! Bạn đã hoàn thành rồi 🎉", "Giỏi quá! Nghỉ ngơi rồi quay lại nhé.", "Một bước tiến gần hơn tới mục tiêu!"],
  reminder: ["Gần xong rồi đó, cố lên!", "Bạn vẫn ở đây chứ? Tập trung nào 🦊", "Đừng bỏ cuộc giữa chừng nhé!"],
};

/** Deterministic-ish pick so the same render doesn't flicker between calls
 * within a state, but different states/mounts feel varied rather than robotic. */
export function pickMascotMessage(state: MascotState, seed = 0): string {
  const pool = MESSAGES[state];
  return pool[seed % pool.length];
}
