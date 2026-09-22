/**
 * Cấp A "nhãn chiến lược" (StrategicLabel) taxonomy — see docs/ai-mentor-
 * architecture.md section 11.2 điểm 2. Proposed from the spec's own worked
 * examples (inference, author's purpose, NOT stated, three-speaker
 * conversation, double/triple passage synthesis, phonetic-distractor
 * intent questions...), mapped onto the Parts that actually carry each
 * question style in a real TOEIC test. Deliberately about DECISION
 * STRATEGY, not grammar/vocabulary knowledge — that's what GrammarTopic
 * already covers (a Part 5/6/7 question can carry both a grammarTopicSlug
 * AND one or more of these, since Question.strategicLabelSlugs is a
 * separate array field).
 *
 * This taxonomy alone doesn't make the I→A gate usable — no Question has
 * been tagged with any of these slugs yet (that's real content-review
 * work, left for an admin to do via Admin → Câu hỏi, same as every other
 * "ngân hàng câu hỏi chưa đủ" gap noted in section 10.5/content-sources.md).
 */
export interface StrategicLabelSeed {
  slug: string;
  title: string;
  category: string;
  appliesToParts: ("PART1" | "PART2" | "PART3" | "PART4" | "PART5" | "PART6" | "PART7")[];
}

export const STRATEGIC_LABELS: StrategicLabelSeed[] = [
  {
    slug: "indirect-response",
    title: "Câu trả lời gián tiếp (không lặp từ khóa câu hỏi)",
    category: "Listening — suy luận",
    appliesToParts: ["PART2", "PART3"],
  },
  {
    slug: "phonetic-distractor-intent",
    title: "Câu hỏi ý định người nói với đáp án nhiễu cùng âm/từ",
    category: "Listening — suy luận",
    appliesToParts: ["PART3", "PART4"],
  },
  {
    slug: "three-speaker-role",
    title: "Hội thoại ba người — phân biệt vai trò/quan điểm từng người nói",
    category: "Listening — suy luận",
    appliesToParts: ["PART3"],
  },
  {
    slug: "implied-meaning",
    title: "Suy luận hàm ý câu nói (what does the speaker imply/mean)",
    category: "Listening — suy luận",
    appliesToParts: ["PART3", "PART4"],
  },
  {
    slug: "speaker-purpose",
    title: "Mục đích người nói/đoạn thông báo (purpose of the talk)",
    category: "Listening — suy luận",
    appliesToParts: ["PART4"],
  },
  {
    slug: "graphic-info-synthesis",
    title: "Kết hợp lời thoại với thông tin đồ họa kèm theo (graphic prompt)",
    category: "Listening — suy luận",
    appliesToParts: ["PART3", "PART4"],
  },
  {
    slug: "word-form-distractor",
    title: "Đáp án nhiễu cùng họ từ (word family) khác từ loại cần điền",
    category: "Reading — loại suy đáp án nhiễu",
    appliesToParts: ["PART5"],
  },
  {
    slug: "collocation-trap",
    title: "Đáp án nhiễu đúng ngữ pháp nhưng sai collocation/ngữ cảnh",
    category: "Reading — loại suy đáp án nhiễu",
    appliesToParts: ["PART5", "PART6"],
  },
  {
    slug: "sentence-insertion-logic",
    title: "Chọn câu điền vào chỗ trống dựa trên mạch logic đoạn văn",
    category: "Reading — mạch logic đoạn văn",
    appliesToParts: ["PART6"],
  },
  {
    slug: "connector-logic",
    title: "Từ nối chuyển ý giữa các câu (liên từ, trạng từ liên kết)",
    category: "Reading — mạch logic đoạn văn",
    appliesToParts: ["PART6"],
  },
  {
    slug: "inference",
    title: "Suy luận (inference) — kết luận không nêu trực tiếp trong văn bản",
    category: "Reading — suy luận",
    appliesToParts: ["PART7"],
  },
  {
    slug: "not-stated",
    title: "NOT/TRUE stated — loại đáp án không được văn bản xác nhận",
    category: "Reading — suy luận",
    appliesToParts: ["PART7"],
  },
  {
    slug: "authors-purpose",
    title: "Mục đích tác giả (why was this written/mentioned)",
    category: "Reading — suy luận",
    appliesToParts: ["PART7"],
  },
  {
    slug: "cross-paragraph-cause-effect",
    title: "Quan hệ nhân quả giữa hai đoạn/hai câu cách xa nhau",
    category: "Reading — suy luận",
    appliesToParts: ["PART7"],
  },
  {
    slug: "vocabulary-in-context",
    title: "Nghĩa của từ trong ngữ cảnh (the word 'X' means)",
    category: "Reading — suy luận",
    appliesToParts: ["PART7"],
  },
  {
    slug: "double-triple-passage-synthesis",
    title: "Tổng hợp thông tin từ 2-3 văn bản để trả lời 1 câu hỏi",
    category: "Reading — suy luận",
    appliesToParts: ["PART7"],
  },
];
