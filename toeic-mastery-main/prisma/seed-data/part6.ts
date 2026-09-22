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
  {
    title: "Notice — Building Access Card Update",
    format: "NOTICE",
    content:
      "NOTICE TO ALL TENANTS\n\nStarting next month, all building access cards will (31) reprogrammed to include the new parking garage entrance. Tenants should visit the management office between 9 a.m. and 5 p.m. to have their cards updated.\n\n(32)\n\nPlease allow up to ten minutes for each card to be reprogrammed. We appreciate your patience (33) this transition, and we apologize for (34) inconvenience this may cause.",
    blanks: [
      { options: ["be", "been", "being", "is"], correctIndex: 0, explanationVi: "Sau modal 'will' cần dạng nguyên mẫu của bị động: 'will be reprogrammed'.", grammarTopicSlug: "passive-voice" },
      {
        options: [
          "Cards not updated by the end of the month will no longer grant access to the garage.",
          "The building was constructed fifteen years ago.",
          "Rent payments are due on the first of each month.",
          "The lobby will be repainted next week.",
        ],
        correctIndex: 0,
        explanationVi: "Câu này tiếp nối trực tiếp thông tin về hạn cập nhật thẻ, nêu hậu quả nếu không cập nhật kịp.",
      },
      { options: ["during", "while", "for", "since"], correctIndex: 0, explanationVi: "'During + cụm danh từ' diễn tả 'trong suốt' một khoảng thời gian: 'during this transition'.", grammarTopicSlug: "prepositions" },
      { options: ["any", "the", "some", "much"], correctIndex: 0, explanationVi: "Cụm cố định 'apologize for any inconvenience this may cause'.", grammarTopicSlug: "pronouns" },
    ],
  },
  {
    title: "Memo — Updated IT Password Policy",
    format: "MEMO",
    content:
      "TO: All Staff\nFROM: IT Security Team\n\nEffective immediately, all employees (31) required to update their network passwords every ninety days instead of annually. This change follows a recommendation from our recent security audit.\n\nPasswords must contain at least one number and one special character to be considered (32).\n\n(33)\n\nIf you experience any trouble updating your password, please contact the help desk (34) assistance.",
    blanks: [
      { options: ["are", "is", "were", "have"], correctIndex: 0, explanationVi: "Chủ ngữ 'all employees' số nhiều cần động từ số nhiều: 'are required'.", grammarTopicSlug: "subject-verb-agreement" },
      { options: ["secure", "securely", "security", "securities"], correctIndex: 0, explanationVi: "Sau động từ liên kết 'to be considered' cần tính từ: 'secure'.", grammarTopicSlug: "adjectives" },
      {
        options: [
          "Passwords that do not meet these requirements will be automatically rejected by the system.",
          "The IT department was established five years ago.",
          "Employee badges must be worn at all times.",
          "The server room is located on the second floor.",
        ],
        correctIndex: 0,
        explanationVi: "Câu này tiếp nối trực tiếp yêu cầu về mật khẩu ở câu trước, nêu điều gì xảy ra nếu không đáp ứng.",
      },
      { options: ["for", "with", "of", "on"], correctIndex: 0, explanationVi: "Collocation cố định: 'contact someone for assistance'.", grammarTopicSlug: "prepositions" },
    ],
  },
  {
    title: "Article — New Public Transit Route",
    format: "ARTICLE",
    content:
      "The city transit authority announced this week that a new bus route (31) connect the downtown business district directly to the airport starting next month. Officials say the route is designed to reduce travel time for commuters who currently rely on multiple transfers.\n\n\"This route has been (32) requested by residents for years,\" said transit spokesperson Tuan Le. \"We are excited to finally make it a reality.\"\n\n(33)\n\nThe transit authority also announced plans to add more routes (34) response to continued population growth in the area.",
    blanks: [
      { options: ["will", "would", "is", "was"], correctIndex: 0, explanationVi: "Ngữ cảnh diễn tả kế hoạch trong tương lai gần (starting next month): 'will connect'.", grammarTopicSlug: "verb-tense" },
      { options: ["frequent", "frequently", "frequency", "frequented"], correctIndex: 1, explanationVi: "Cần trạng từ bổ nghĩa cho phân từ 'requested': 'frequently requested'.", grammarTopicSlug: "adverbs" },
      {
        options: [
          "The new route is expected to begin service on the fifteenth of next month.",
          "The airport was renovated two years ago.",
          "Bus fares will remain unchanged this year.",
          "The transit authority employs over 500 people.",
        ],
        correctIndex: 0,
        explanationVi: "Câu này bổ sung thông tin cụ thể về thời điểm vận hành tuyến mới, tiếp nối mạch bài viết.",
      },
      { options: ["in", "at", "on", "by"], correctIndex: 0, explanationVi: "Collocation cố định: 'in response to' (để đáp ứng với).", grammarTopicSlug: "prepositions" },
    ],
  },
];
