export interface SeedPart6Blank {
  options: string[];
  correctIndex: number;
  explanationVi: string;
  grammarTopicSlug?: string;
}

export interface SeedPart6Passage {
  title: string;
  format: "EMAIL" | "MEMO" | "ARTICLE" | "NOTICE";
  content: string; // contains (31) (32) (33) (34) placeholders
  blanks: SeedPart6Blank[];
}

export const PART6_PASSAGES: SeedPart6Passage[] = [
  {
    title: "Email — Office Relocation Notice",
    format: "EMAIL",
    content:
      "Subject: Office Relocation Update\n\nDear Team,\n\nAs previously announced, our office will (31) to the new building on Nguyen Hue Street starting next Monday. Please pack your personal belongings by Friday afternoon so the moving company can begin (32) the furniture over the weekend.\n\n(33)\n\nIf you have any questions about the relocation schedule, please contact the facilities team directly. We appreciate your patience and cooperation (34) this transition.\n\nBest regards,\nFacilities Management",
    blanks: [
      { options: ["move", "moves", "moving", "will move"], correctIndex: 3, explanationVi: "Ngữ cảnh diễn tả kế hoạch trong tương lai gần: 'will move'.", grammarTopicSlug: "verb-tense" },
      { options: ["transport", "transporting", "transported", "transports"], correctIndex: 1, explanationVi: "Sau 'begin' cần V-ing hoặc to-infinitive; ở đây dùng gerund: 'transporting'.", grammarTopicSlug: "gerund" },
      {
        options: [
          "The new office will include a larger break room and additional meeting spaces.",
          "The company was founded over twenty years ago.",
          "Please remember to submit your timesheet every Friday.",
          "Our quarterly results exceeded expectations this year.",
        ],
        correctIndex: 0,
        explanationVi: "Câu này cần bổ sung thông tin liên quan trực tiếp đến việc chuyển văn phòng mới, phù hợp với mạch nội dung.",
      },
      { options: ["during", "while", "for", "since"], correctIndex: 0, explanationVi: "'During + cụm danh từ' diễn tả 'trong suốt' một khoảng thời gian/sự kiện.", grammarTopicSlug: "prepositions" },
    ],
  },
  {
    title: "Memo — New Expense Reporting Policy",
    format: "MEMO",
    content:
      "To: All Staff\nFrom: Accounting Department\n\nStarting next month, all expense reports must be (31) through the new online portal instead of paper forms. This change is intended to make the reimbursement process faster and more (32).\n\nEmployees should attach digital copies of all receipts before submitting a claim. (33)\n\nWe understand that adapting to a new system takes time, so a short training video is available on the intranet to help you get started (34) the new tool.",
    blanks: [
      { options: ["submit", "submitted", "submitting", "submits"], correctIndex: 1, explanationVi: "Báo cáo chi phí 'được nộp' — cần bị động: 'must be submitted'.", grammarTopicSlug: "passive-voice" },
      { options: ["efficient", "efficiently", "efficiency", "efficiencies"], correctIndex: 0, explanationVi: "Sau 'more' và trước liên từ 'and', cần tính từ song song với 'faster': 'efficient'.", grammarTopicSlug: "adjectives" },
      {
        options: [
          "Claims submitted without receipts will not be processed.",
          "The company picnic will be held in October.",
          "Please update your emergency contact information.",
          "The new office opens at 8 a.m. on weekdays.",
        ],
        correctIndex: 0,
        explanationVi: "Câu này tiếp nối trực tiếp yêu cầu về việc đính kèm hóa đơn ở câu trước, nêu hậu quả nếu không tuân thủ.",
      },
      { options: ["with", "in", "at", "by"], correctIndex: 0, explanationVi: "Collocation: 'get started with something' (bắt đầu làm quen với cái gì).", grammarTopicSlug: "prepositions" },
    ],
  },
  {
    title: "Article — Local Business Expansion",
    format: "ARTICLE",
    content:
      "Greenfield Logistics, a local shipping company, announced this week that it (31) a new distribution center in the industrial park by the end of the year. The expansion is expected to create approximately 50 new jobs in the area.\n\n\"We have seen (32) demand for our services over the past two years,\" said company spokesperson Linh Pham. \"This new facility will allow us to serve customers more quickly.\"\n\n(33)\n\nLocal officials welcomed the announcement, noting that the project will bring significant economic benefits (34) the community.",
    blanks: [
      { options: ["will open", "opens", "opened", "has opened"], correctIndex: 0, explanationVi: "Ngữ cảnh diễn tả kế hoạch trong tương lai (by the end of the year): 'will open'.", grammarTopicSlug: "verb-tense" },
      { options: ["increase", "increasing", "increased", "increases"], correctIndex: 2, explanationVi: "Phân từ quá khứ 'increased' bổ nghĩa cho danh từ 'demand', mang nghĩa đã tăng lên.", grammarTopicSlug: "participles" },
      {
        options: [
          "The new center is scheduled to begin operations in January.",
          "The company was originally founded in a small garage.",
          "Traffic in the area has improved significantly this year.",
          "Employees will receive a holiday bonus this December.",
        ],
        correctIndex: 0,
        explanationVi: "Câu này bổ sung thông tin cụ thể về thời điểm vận hành trung tâm mới, tiếp nối mạch bài viết.",
      },
      { options: ["to", "for", "with", "at"], correctIndex: 0, explanationVi: "Collocation: 'bring benefits to someone/something'.", grammarTopicSlug: "prepositions" },
    ],
  },
  {
    title: "Notice — Annual Fire Drill",
    format: "NOTICE",
    content:
      "NOTICE TO ALL STAFF\n\nAn annual fire drill (31) held on Thursday, October 9, at 10:00 a.m. When the alarm sounds, please leave your desk immediately and proceed to the nearest exit in a calm and (32) manner.\n\nDo not use the elevators during the drill. (33)\n\nOnce outside, gather at the designated assembly point in the parking lot so that floor wardens can confirm (34) everyone has evacuated safely.",
    blanks: [
      { options: ["will be", "was", "is being", "has been"], correctIndex: 0, explanationVi: "Ngữ cảnh thông báo trước một sự kiện trong tương lai: 'will be held'.", grammarTopicSlug: "passive-voice" },
      { options: ["order", "orderly", "orderliness", "ordered"], correctIndex: 1, explanationVi: "Cần tính từ song song với 'calm', bổ nghĩa cho 'manner': 'orderly'.", grammarTopicSlug: "adjectives" },
      {
        options: [
          "Use the stairs instead and follow the posted evacuation routes.",
          "The building was renovated two years ago.",
          "Employee parking permits are available at the front desk.",
          "The cafeteria will be closed for cleaning that day.",
        ],
        correctIndex: 0,
        explanationVi: "Câu này tiếp nối trực tiếp việc cấm dùng thang máy, hướng dẫn dùng thang bộ thay thế.",
      },
      { options: ["that", "what", "which", "who"], correctIndex: 0, explanationVi: "'Confirm that + mệnh đề' — 'that' dẫn mệnh đề danh từ làm tân ngữ.", grammarTopicSlug: "conjunctions" },
    ],
  },
];
