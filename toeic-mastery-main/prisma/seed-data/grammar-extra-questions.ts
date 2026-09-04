export interface SeedGrammarQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanationVi: string;
}

export const EXTRA_GRAMMAR_QUESTIONS: Record<string, SeedGrammarQuestion[]> = {
  nouns: [
    {
      prompt: "The company's ----- in the local market has been steady over the past decade.",
      options: ["grow", "growth", "growing", "grew"],
      correctIndex: 1,
      explanationVi: "Sau tính từ sở hữu 'company's' cần một danh từ: 'growth' (sự tăng trưởng).",
    },
    {
      prompt: "Please bring your ID card and proof of ----- to the registration desk.",
      options: ["identify", "identification", "identified", "identifying"],
      correctIndex: 1,
      explanationVi: "Sau giới từ 'of' cần danh từ: 'identification' (giấy tờ tùy thân).",
    },
    {
      prompt: "The department requested additional ----- to complete the audit on schedule.",
      options: ["assist", "assistance", "assisted", "assisting"],
      correctIndex: 1,
      explanationVi: "Sau tính từ 'additional' cần danh từ không đếm được: 'assistance' (sự hỗ trợ).",
    },
    {
      prompt: "Employees should direct all ----- regarding payroll to the HR office.",
      options: ["inquire", "inquiry", "inquiries", "inquiring"],
      correctIndex: 2,
      explanationVi: "'All' đi với danh từ đếm được ở dạng số nhiều: 'inquiries' (các thắc mắc).",
    },
    {
      prompt: "The manufacturing plant purchased new ----- to increase production capacity.",
      options: ["equip", "equipment", "equipments", "equipped"],
      correctIndex: 1,
      explanationVi: "'Equipment' là danh từ không đếm được nên không có dạng số nhiều 'equipments'; đây là danh từ đúng sau tính từ 'new'.",
    },
  ],
  pronouns: [
    {
      prompt: "The manager asked the assistant to send the documents to -----.",
      options: ["he", "him", "his", "himself"],
      correctIndex: 1,
      explanationVi: "Sau giới từ 'to' cần đại từ tân ngữ: 'him'.",
    },
    {
      prompt: "The empty desk near the window belongs to the interns; it is -----.",
      options: ["they", "them", "their", "theirs"],
      correctIndex: 3,
      explanationVi: "Đại từ sở hữu đứng một mình, không kèm danh từ theo sau, dùng 'theirs'.",
    },
    {
      prompt: "The CEO ----- announced the merger during the press conference.",
      options: ["he", "him", "his", "himself"],
      correctIndex: 3,
      explanationVi: "Đại từ phản thân dùng để nhấn mạnh chủ ngữ tự thực hiện hành động: 'himself'.",
    },
    {
      prompt: "Our team finished the project faster than ----- did.",
      options: ["them", "their", "they", "theirs"],
      correctIndex: 2,
      explanationVi: "Trước động từ 'did' cần đại từ chủ ngữ: 'they'.",
    },
    {
      prompt: "The corporation increased ----- investment in renewable energy last year.",
      options: ["it", "its", "itself", "it's"],
      correctIndex: 1,
      explanationVi: "Trước danh từ 'investment' cần tính từ sở hữu 'its', không nhầm với 'it's' (dạng rút gọn của 'it is').",
    },
  ],
  adjectives: [
    {
      prompt: "The clinic offers ----- healthcare services to all local residents.",
      options: ["afford", "affordable", "affordably", "affordability"],
      correctIndex: 1,
      explanationVi: "Trước danh từ 'healthcare services' cần tính từ: 'affordable' (có giá cả phải chăng).",
    },
    {
      prompt: "The new marketing strategy seems ----- compared to last year's approach.",
      options: ["effect", "effective", "effectively", "effectiveness"],
      correctIndex: 1,
      explanationVi: "Sau động từ liên kết 'seems' cần một tính từ: 'effective'.",
    },
    {
      prompt: "The quarterly sales results were quite ----- for the entire team.",
      options: ["surprise", "surprised", "surprising", "surprisingly"],
      correctIndex: 2,
      explanationVi: "'Results' là chủ thể gây ra cảm giác ngạc nhiên nên dùng tính từ -ing mang nghĩa chủ động: 'surprising'.",
    },
    {
      prompt: "Many customers were ----- with the delay in shipment.",
      options: ["disappoint", "disappointing", "disappointed", "disappointment"],
      correctIndex: 2,
      explanationVi: "'Customers' là người cảm thấy nên dùng tính từ -ed mang nghĩa bị động: 'disappointed'.",
    },
    {
      prompt: "The proposal appears ----- enough to gain approval from the board.",
      options: ["convince", "convinced", "convincing", "conviction"],
      correctIndex: 2,
      explanationVi: "'Proposal' chủ động tạo ra sự thuyết phục nên dùng tính từ -ing: 'convincing'.",
    },
  ],
  adverbs: [
    {
      prompt: "The assistant ----- organized the files before the inspection.",
      options: ["careful", "carefully", "care", "careless"],
      correctIndex: 1,
      explanationVi: "Cần trạng từ bổ nghĩa cho động từ 'organized': 'carefully'.",
    },
    {
      prompt: "The director ----- attends the weekly planning meetings.",
      options: ["usual", "usually", "usualness", "use"],
      correctIndex: 1,
      explanationVi: "Trạng từ tần suất 'usually' đứng trước động từ thường 'attends'.",
    },
    {
      prompt: "The revised contract terms are ----- different from the original draft.",
      options: ["significant", "significance", "significantly", "signify"],
      correctIndex: 2,
      explanationVi: "Cần trạng từ bổ nghĩa cho tính từ 'different': 'significantly'.",
    },
    {
      prompt: "The new safety procedures have been ----- implemented across all branches.",
      options: ["success", "successful", "successfully", "succeed"],
      correctIndex: 2,
      explanationVi: "Trạng từ 'successfully' đứng giữa trợ động từ 'have been' và động từ chính 'implemented'.",
    },
    {
      prompt: "-----, the company decided to postpone the product launch until further notice.",
      options: ["Consequent", "Consequence", "Consequently", "Consequential"],
      correctIndex: 2,
      explanationVi: "Trạng từ liên kết 'Consequently' (do đó) đứng đầu câu, theo sau là dấu phẩy, để nối ý kết quả với câu trước.",
    },
  ],
  prepositions: [
    {
      prompt: "The training workshop will take place ----- March 15th.",
      options: ["in", "on", "at", "by"],
      correctIndex: 1,
      explanationVi: "Giới từ 'on' dùng cho ngày cụ thể.",
    },
    {
      prompt: "All new hires are responsible ----- completing the orientation program within their first week.",
      options: ["for", "of", "to", "with"],
      correctIndex: 0,
      explanationVi: "Collocation cố định: 'responsible for' (chịu trách nhiệm về).",
    },
    {
      prompt: "The company has operated in this region ----- more than two decades.",
      options: ["since", "for", "during", "within"],
      correctIndex: 1,
      explanationVi: "'For' đi với khoảng thời gian ('more than two decades'), khác với 'since' đi với mốc thời gian.",
    },
    {
      prompt: "The budget report will be finalized ----- accordance with the new financial guidelines.",
      options: ["in", "on", "at", "by"],
      correctIndex: 0,
      explanationVi: "Collocation cố định: 'in accordance with' (phù hợp với).",
    },
    {
      prompt: "The new intern will assist the marketing team ----- the end of the internship period.",
      options: ["by", "until", "since", "from"],
      correctIndex: 1,
      explanationVi: "'Until' diễn tả một hành động kéo dài liên tục đến một thời điểm, khác với 'by' chỉ hạn chót.",
    },
  ],
  conjunctions: [
    {
      prompt: "The new manager is ----- skilled but also very approachable.",
      options: ["not only", "so", "either", "neither"],
      correctIndex: 0,
      explanationVi: "Cặp liên từ tương quan 'not only...but also'.",
    },
    {
      prompt: "The flight was delayed, ----- passengers were provided with meal vouchers.",
      options: ["so", "but", "or", "although"],
      correctIndex: 0,
      explanationVi: "'So' nối hai mệnh đề thể hiện quan hệ nguyên nhân - kết quả.",
    },
    {
      prompt: "The launch event was rescheduled ----- the venue was unavailable that week.",
      options: ["because", "because of", "due to", "despite"],
      correctIndex: 0,
      explanationVi: "Sau chỗ trống là mệnh đề đầy đủ chủ-vị ('the venue was unavailable'), cần liên từ 'because'.",
    },
    {
      prompt: "----- the tight deadline, the design team delivered the prototype on time.",
      options: ["Even though", "Although", "In spite of", "Because"],
      correctIndex: 2,
      explanationVi: "Sau chỗ trống là cụm danh từ ('the tight deadline'), cần giới từ 'in spite of', không dùng liên từ.",
    },
    {
      prompt: "The shipment will not be released ----- the payment is confirmed by the bank.",
      options: ["if", "unless", "although", "since"],
      correctIndex: 1,
      explanationVi: "'Unless' (= if...not) diễn tả điều kiện phủ định: lô hàng sẽ không được thả trừ khi thanh toán được xác nhận.",
    },
  ],
  "verb-tense": [
    {
      prompt: "The technician ----- the machine yesterday afternoon.",
      options: ["repairs", "repaired", "has repaired", "will repair"],
      correctIndex: 1,
      explanationVi: "'Yesterday afternoon' là dấu hiệu của thì quá khứ đơn: 'repaired'.",
    },
    {
      prompt: "The company ----- a new product line next month.",
      options: ["launches", "launched", "will launch", "has launched"],
      correctIndex: 2,
      explanationVi: "'Next month' là dấu hiệu của thì tương lai đơn: 'will launch'.",
    },
    {
      prompt: "The accounting department ----- the annual figures at the moment.",
      options: ["reviews", "reviewed", "is reviewing", "has reviewed"],
      correctIndex: 2,
      explanationVi: "'At the moment' là dấu hiệu của thì hiện tại tiếp diễn: 'is reviewing'.",
    },
    {
      prompt: "The consultant ----- with this client for over five years.",
      options: ["works", "worked", "has worked", "is working"],
      correctIndex: 2,
      explanationVi: "'For + khoảng thời gian' đi với thì hiện tại hoàn thành: 'has worked'.",
    },
    {
      prompt: "By the end of this year, the firm ----- over 200 new employees.",
      options: ["will hire", "will have hired", "has hired", "hires"],
      correctIndex: 1,
      explanationVi: "'By + mốc thời gian trong tương lai' đi với thì tương lai hoàn thành: 'will have hired'.",
    },
  ],
  "passive-voice": [
    {
      prompt: "New employees ----- orientation training during their first week.",
      options: ["give", "are given", "gave", "giving"],
      correctIndex: 1,
      explanationVi: "'Employees' là đối tượng nhận hành động 'give' nên cần bị động hiện tại đơn: 'are given'.",
    },
    {
      prompt: "The conference room ----- last weekend for the renovation.",
      options: ["closed", "was closed", "has closed", "closes"],
      correctIndex: 1,
      explanationVi: "'Conference room' là vật bị đóng, kết hợp với 'last weekend' cần bị động quá khứ đơn: 'was closed'.",
    },
    {
      prompt: "The security system ----- since the break-in last month.",
      options: ["has upgraded", "has been upgraded", "upgraded", "is upgrading"],
      correctIndex: 1,
      explanationVi: "'Since' + mốc thời gian cần bị động hiện tại hoàn thành: 'has been upgraded'.",
    },
    {
      prompt: "All expense reports ----- with receipts attached.",
      options: ["must submit", "must be submitted", "must submitting", "must submitted"],
      correctIndex: 1,
      explanationVi: "Modal 'must' kết hợp với bị động: 'must be submitted'.",
    },
    {
      prompt: "The new headquarters ----- by an award-winning architecture firm at present.",
      options: ["designs", "is designing", "is being designed", "was designed"],
      correctIndex: 2,
      explanationVi: "'At present' cùng chủ ngữ là vật bị tác động cần bị động tiếp diễn: 'is being designed'.",
    },
  ],
  gerund: [
    {
      prompt: "The manager avoided ----- any details about the layoffs during the meeting.",
      options: ["mention", "mentioning", "to mention", "mentioned"],
      correctIndex: 1,
      explanationVi: "'Avoid' theo sau bởi gerund: 'avoided mentioning'.",
    },
    {
      prompt: "The technician fixed the server without ----- any data.",
      options: ["lose", "losing", "to lose", "lost"],
      correctIndex: 1,
      explanationVi: "Sau giới từ 'without' cần V-ing: 'losing'.",
    },
    {
      prompt: "----- customer complaints promptly is essential for maintaining a good reputation.",
      options: ["Address", "Addressing", "To address", "Addressed"],
      correctIndex: 1,
      explanationVi: "Danh động từ (gerund) có thể làm chủ ngữ của câu: 'Addressing'.",
    },
    {
      prompt: "The board finished ----- the quarterly budget just before noon.",
      options: ["review", "reviewing", "to review", "reviewed"],
      correctIndex: 1,
      explanationVi: "'Finish' theo sau bởi gerund: 'finished reviewing'.",
    },
    {
      prompt: "The new hire is responsible for ----- the weekly inventory report.",
      options: ["compile", "compiling", "to compile", "compiled"],
      correctIndex: 1,
      explanationVi: "Sau giới từ trong collocation 'responsible for' cần V-ing: 'compiling'.",
    },
  ],
  infinitive: [
    {
      prompt: "The director wants ----- the new marketing campaign by next Monday.",
      options: ["launch", "launching", "to launch", "launched"],
      correctIndex: 2,
      explanationVi: "'Want' theo sau bởi to-infinitive: 'wants to launch'.",
    },
    {
      prompt: "The manager was ready ----- the final decision after reviewing all proposals.",
      options: ["make", "making", "to make", "made"],
      correctIndex: 2,
      explanationVi: "Tính từ 'ready' theo sau bởi to-infinitive: 'ready to make'.",
    },
    {
      prompt: "The team scheduled an extra meeting ----- the budget concerns before the deadline.",
      options: ["discussing", "to discuss", "discuss", "discussed"],
      correctIndex: 1,
      explanationVi: "To-infinitive diễn tả mục đích: 'to discuss' (để thảo luận).",
    },
    {
      prompt: "The candidate's experience was strong enough ----- the interview panel.",
      options: ["impress", "impressing", "to impress", "impressed"],
      correctIndex: 2,
      explanationVi: "Cấu trúc 'enough to' luôn dùng to-infinitive: 'to impress'.",
    },
    {
      prompt: "The supervisor asked the interns ----- the survey results before Friday.",
      options: ["summarize", "summarizing", "to summarize", "summarized"],
      correctIndex: 2,
      explanationVi: "Cấu trúc 'ask + tân ngữ + to-infinitive': 'asked the interns to summarize'.",
    },
  ],
  "relative-clause": [
    {
      prompt: "The candidate ----- impressed the interview panel was offered the position immediately.",
      options: ["who", "which", "whose", "whom"],
      correctIndex: 0,
      explanationVi: "'Who' làm chủ ngữ của mệnh đề quan hệ chỉ người.",
    },
    {
      prompt: "The new policy, ----- takes effect next month, will affect all departments.",
      options: ["who", "which", "that", "whose"],
      correctIndex: 1,
      explanationVi: "Mệnh đề quan hệ không xác định (có dấu phẩy) chỉ vật dùng 'which', không dùng 'that'.",
    },
    {
      prompt: "Mr. Lee, ----- the board recently promoted, will oversee the new division.",
      options: ["who", "whom", "whose", "which"],
      correctIndex: 1,
      explanationVi: "'Whom' làm tân ngữ của động từ 'promoted' trong mệnh đề quan hệ chỉ người.",
    },
    {
      prompt: "The report ----- the analyst submitted last week contained several errors.",
      options: ["who", "whom", "that", "whose"],
      correctIndex: 2,
      explanationVi: "'That' làm tân ngữ, thay thế cho danh từ chỉ vật 'the report' trong mệnh đề quan hệ xác định.",
    },
    {
      prompt: "Employees ----- overtime this month will receive additional compensation.",
      options: ["who work", "working", "whom work", "worked"],
      correctIndex: 1,
      explanationVi: "Rút gọn mệnh đề quan hệ chủ động ('who are working') thành cụm phân từ hiện tại: 'working'.",
    },
  ],
  conditionals: [
    {
      prompt: "If the weather improves tomorrow, the outdoor event ----- as planned.",
      options: ["proceeds", "will proceed", "would proceed", "proceeded"],
      correctIndex: 1,
      explanationVi: "Câu điều kiện loại 1: mệnh đề chính dùng 'will + V'.",
    },
    {
      prompt: "If an employee ----- late three times, the supervisor issues a formal warning.",
      options: ["arrives", "arrived", "will arrive", "has arrived"],
      correctIndex: 0,
      explanationVi: "Câu điều kiện loại 0 diễn tả sự thật/quy tắc chung: cả hai mệnh đề dùng hiện tại đơn.",
    },
    {
      prompt: "If the company had more funding, it ----- into international markets.",
      options: ["expands", "would expand", "will expand", "expanded"],
      correctIndex: 1,
      explanationVi: "Câu điều kiện loại 2: mệnh đề chính dùng 'would + V'.",
    },
    {
      prompt: "If the manager ----- more time, she would review every application personally.",
      options: ["has", "had", "have", "will have"],
      correctIndex: 1,
      explanationVi: "Câu điều kiện loại 2: mệnh đề if dùng quá khứ đơn 'had'.",
    },
    {
      prompt: "If the technician ----- the machine sooner, the factory would not have lost a full day of production.",
      options: ["repaired", "had repaired", "would repair", "repairs"],
      correctIndex: 1,
      explanationVi: "Câu điều kiện loại 3: mệnh đề if dùng quá khứ hoàn thành 'had repaired'.",
    },
  ],
  comparatives: [
    {
      prompt: "This year's turnout was ----- than last year's.",
      options: ["large", "larger", "largest", "more large"],
      correctIndex: 1,
      explanationVi: "So sánh hơn với tính từ ngắn thêm '-er': 'larger'.",
    },
    {
      prompt: "The updated software is ----- reliable as the previous version.",
      options: ["as", "so", "more", "than"],
      correctIndex: 0,
      explanationVi: "Cấu trúc so sánh bằng: 'as + tính từ + as'.",
    },
    {
      prompt: "Of all the branches, the downtown location is ----- to reach by public transport.",
      options: ["easy", "easier", "the easiest", "more easy"],
      correctIndex: 2,
      explanationVi: "So sánh nhất với tính từ ngắn: 'the easiest', dùng khi so sánh từ ba đối tượng trở lên.",
    },
    {
      prompt: "The updated model is ----- expensive than the previous one, making it more accessible to small businesses.",
      options: ["less", "least", "fewer", "few"],
      correctIndex: 0,
      explanationVi: "Cấu trúc so sánh kém hơn: 'less + tính từ + than'.",
    },
    {
      prompt: "----- more feedback the team receives, the more effective the final product becomes.",
      options: ["The", "A", "Much", "More"],
      correctIndex: 0,
      explanationVi: "Cấu trúc song song 'The + so sánh hơn..., the + so sánh hơn...' diễn tả hai sự việc tăng/giảm cùng nhau.",
    },
  ],
  "subject-verb-agreement": [
    {
      prompt: "Each member of the committee ----- required to submit a report.",
      options: ["is", "are", "were", "have been"],
      correctIndex: 0,
      explanationVi: "'Each + danh từ số ít' luôn đi với động từ số ít: 'is'.",
    },
    {
      prompt: "The research team ----- currently analyzing the survey results.",
      options: ["is", "are", "were", "have"],
      correctIndex: 0,
      explanationVi: "Danh từ tập hợp 'team' được coi là số ít trong tiếng Anh trang trọng: 'is'.",
    },
    {
      prompt: "The number of complaints ----- decreased significantly this quarter.",
      options: ["has", "have", "were", "are"],
      correctIndex: 0,
      explanationVi: "'The number of' + danh từ số nhiều nhưng đi với động từ số ít: 'has'.",
    },
    {
      prompt: "Neither the manager nor the assistants ----- available to attend the call.",
      options: ["is", "are", "was", "has"],
      correctIndex: 1,
      explanationVi: "Với 'neither...nor', động từ hòa hợp với chủ ngữ gần nó nhất ('the assistants' - số nhiều): 'are'.",
    },
    {
      prompt: "Enclosed with this letter ----- the documents you requested.",
      options: ["is", "are", "was", "has"],
      correctIndex: 1,
      explanationVi: "Câu đảo ngữ có chủ ngữ thực sự là 'the documents' (số nhiều) đứng sau động từ: 'are'.",
    },
  ],
  participles: [
    {
      prompt: "The ----- documents should be filed in the cabinet by end of day.",
      options: ["complete", "completing", "completed", "completion"],
      correctIndex: 2,
      explanationVi: "'Documents' bị hoàn thành nên dùng phân từ quá khứ mang nghĩa bị động: 'completed'.",
    },
    {
      prompt: "The seminar covered several ----- issues affecting small businesses today.",
      options: ["challenge", "challenging", "challenged", "challenges"],
      correctIndex: 1,
      explanationVi: "'Issues' chủ động gây ra thách thức nên dùng phân từ hiện tại: 'challenging'.",
    },
    {
      prompt: "----- for over a decade, the machine finally needs to be replaced.",
      options: ["Use", "Using", "Used", "To use"],
      correctIndex: 2,
      explanationVi: "Cụm phân từ rút gọn từ mệnh đề bị động ('which has been used'), dùng phân từ quá khứ 'Used' đứng đầu câu.",
    },
    {
      prompt: "----- the quarterly figures carefully, the auditor identified several discrepancies.",
      options: ["Review", "Reviewing", "Reviewed", "To review"],
      correctIndex: 1,
      explanationVi: "Cụm phân từ chủ động rút gọn từ mệnh đề 'As the auditor reviewed...', chủ ngữ của cụm phân từ trùng với chủ ngữ chính: 'Reviewing'.",
    },
    {
      prompt: "Investors expressed interest in the company's ----- plan to expand overseas operations.",
      options: ["propose", "proposing", "proposed", "proposal"],
      correctIndex: 2,
      explanationVi: "'Plan' là kế hoạch được đề xuất (bị động) nên dùng phân từ quá khứ: 'proposed'.",
    },
  ],
};
