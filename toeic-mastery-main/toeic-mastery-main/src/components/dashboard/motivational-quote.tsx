const QUOTES = [
  "Mỗi câu bạn luyện hôm nay là một điểm số của ngày mai.",
  "Không cần giỏi ngay từ đầu, chỉ cần giỏi hơn hôm qua.",
  "990 điểm không phải một bước nhảy, mà là 990 bước đi nhỏ.",
  "Kiên trì 20 phút mỗi ngày hơn hẳn 5 tiếng một lần rồi bỏ cuộc.",
  "Từ vựng bạn học hôm nay sẽ là câu trả lời đúng ngày thi.",
  "Sai một câu không đáng sợ — sợ nhất là không làm lại câu đó lần hai.",
  "Chuỗi ngày học đều đặn chính là bí quyết của người đạt điểm cao.",
  "Tiếng Anh không phải môn học, đó là cánh cửa bạn đang tự mở cho mình.",
  "Đừng học để thi — hãy thi để biết mình đã học được bao nhiêu.",
  "Bạn không cần hoàn hảo, bạn chỉ cần bắt đầu.",
  "Người giỏi TOEIC không phải người không sai, mà là người luyện nhiều nhất.",
  "Một ngày không luyện tập là một ngày đối thủ của bạn tiến thêm một bước.",
  "Nghe — Nói — Đọc — Viết, mỗi kỹ năng là một viên gạch xây điểm số của bạn.",
  "Điểm số phản ánh nỗ lực, không phản ánh tài năng bẩm sinh.",
  "Câu hỏi khó hôm nay chính là câu hỏi dễ của ngày mai, nếu bạn luyện lại.",
] as const;

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

/** Deterministic "quote of the day" — same quote all day, no backend needed. */
export function MotivationalQuote() {
  const quote = QUOTES[dayOfYear(new Date()) % QUOTES.length];
  return <p className="text-sm italic text-white/90">&ldquo;{quote}&rdquo;</p>;
}
