export interface SeedGrammarQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanationVi: string;
}

export interface SeedGrammarTopic {
  slug: string;
  title: string;
  category: string;
  summary: string;
  theory: string;
  tips: string[];
  examples: { en: string; vi: string }[];
  questions: SeedGrammarQuestion[];
}

export const GRAMMAR_TOPICS: SeedGrammarTopic[] = [
  {
    slug: "nouns",
    title: "Nouns (Danh từ)",
    category: "Word Forms",
    summary: "Nhận biết danh từ đếm được/không đếm được và vị trí của danh từ trong câu.",
    theory:
      "Danh từ (noun) là từ chỉ người, vật, sự việc hoặc khái niệm. Trong TOEIC Part 5, câu hỏi danh từ thường kiểm tra khả năng nhận biết đâu là danh từ trong 4 lựa chọn (thường có đuôi -tion, -ment, -ness, -ity, -ance/-ence) và vị trí của danh từ: sau mạo từ (a/an/the), sau tính từ sở hữu, hoặc làm chủ ngữ/tân ngữ của câu.\nDanh từ đếm được có dạng số ít/số nhiều (a proposal / proposals); danh từ không đếm được không có dạng số nhiều (information, equipment, furniture).",
    tips: [
      "Danh từ thường đứng sau: a/an/the, tính từ sở hữu (his, our...), tính từ mô tả.",
      "Nhận diện đuôi danh từ phổ biến: -tion, -sion, -ment, -ness, -ity, -ance, -ence, -er/-or.",
      "Một số danh từ không đếm được hay gặp trong TOEIC: information, equipment, furniture, advice, research.",
    ],
    examples: [
      { en: "The company's expansion into new markets was a major success.", vi: "Sự mở rộng của công ty sang các thị trường mới là một thành công lớn." },
      { en: "Employees must follow safety regulations at all times.", vi: "Nhân viên phải tuân thủ các quy định an toàn mọi lúc." },
    ],
    questions: [
      {
        prompt: "The ----- of the new policy will be announced next week.",
        options: ["implement", "implementation", "implemented", "implementing"],
        correctIndex: 1,
        explanationVi: "Sau mạo từ 'the' và trước 'of', ta cần một danh từ. 'Implementation' (sự triển khai) là danh từ phù hợp.",
      },
      {
        prompt: "All visitors must sign in at the front ----- before entering the building.",
        options: ["reception", "receptive", "receptively", "receive"],
        correctIndex: 0,
        explanationVi: "Sau tính từ 'front' cần một danh từ; 'reception' (quầy lễ tân) là đáp án đúng.",
      },
    ],
  },
  {
    slug: "pronouns",
    title: "Pronouns (Đại từ)",
    category: "Word Forms",
    summary: "Phân biệt đại từ chủ ngữ, tân ngữ, sở hữu và đại từ phản thân.",
    theory:
      "Đại từ (pronoun) thay thế cho danh từ đã được nhắc đến trước đó. Có 4 loại chính: đại từ chủ ngữ (I, you, he, she, it, we, they), đại từ tân ngữ (me, you, him, her, it, us, them), tính từ sở hữu (my, your, his, her, its, our, their), và đại từ phản thân (myself, yourself, himself...).\nTrong TOEIC, câu hỏi đại từ thường kiểm tra việc chọn đúng dạng dựa trên vị trí ngữ pháp: chủ ngữ đứng đầu câu/mệnh đề, tân ngữ đứng sau động từ hoặc giới từ.",
    tips: [
      "Đại từ phản thân dùng khi chủ ngữ và tân ngữ là cùng một đối tượng: He hurt himself.",
      "Tính từ sở hữu luôn đứng trước danh từ: their proposal, not they proposal.",
      "Đại từ tân ngữ đứng sau động từ hoặc giới từ: Please contact him / for her.",
    ],
    examples: [
      { en: "The manager reviewed the report himself before submitting it.", vi: "Người quản lý tự mình xem lại báo cáo trước khi nộp." },
      { en: "Each employee is responsible for their own workspace.", vi: "Mỗi nhân viên chịu trách nhiệm về không gian làm việc của riêng mình." },
    ],
    questions: [
      {
        prompt: "Ms. Tran completed the analysis ----- without any assistance.",
        options: ["she", "her", "hers", "herself"],
        correctIndex: 3,
        explanationVi: "Cần đại từ phản thân để nhấn mạnh chủ ngữ tự làm việc đó: 'herself'.",
      },
      {
        prompt: "The board approved ----- proposal during yesterday's meeting.",
        options: ["they", "them", "their", "theirs"],
        correctIndex: 2,
        explanationVi: "Trước danh từ 'proposal' cần tính từ sở hữu: 'their'.",
      },
    ],
  },
  {
    slug: "adjectives",
    title: "Adjectives (Tính từ)",
    category: "Word Forms",
    summary: "Vị trí và cách dùng tính từ để bổ nghĩa cho danh từ.",
    theory:
      "Tính từ (adjective) bổ nghĩa cho danh từ, thường đứng trước danh từ hoặc sau động từ liên kết (be, become, seem, appear). Đuôi tính từ phổ biến: -ful, -less, -able/-ible, -al, -ive, -ous.\nMột số tính từ có hình thức giống phân từ (participle adjective) như 'interesting/interested' cần phân biệt: -ing mang nghĩa chủ động (gây ra cảm giác), -ed mang nghĩa bị động (cảm thấy).",
    tips: [
      "Tính từ đứng trước danh từ: a reliable service, an affordable price.",
      "Phân biệt -ing (gây cảm giác) và -ed (cảm thấy): The meeting was boring vs. I was bored.",
      "Tính từ đứng sau: be, become, seem, remain, appear, look, feel.",
    ],
    examples: [
      { en: "The new software is extremely reliable and easy to use.", vi: "Phần mềm mới cực kỳ đáng tin cậy và dễ sử dụng." },
      { en: "Employees found the training session very informative.", vi: "Nhân viên thấy buổi đào tạo rất bổ ích." },
    ],
    questions: [
      {
        prompt: "The company received ----- feedback from customers after the product launch.",
        options: ["favor", "favorable", "favorably", "favoring"],
        correctIndex: 1,
        explanationVi: "Trước danh từ 'feedback' cần tính từ: 'favorable' (thuận lợi, tích cực).",
      },
      {
        prompt: "Many employees felt ----- about the upcoming restructuring plan.",
        options: ["concern", "concerned", "concerning", "concerns"],
        correctIndex: 1,
        explanationVi: "Sau động từ liên kết 'felt' cần tính từ dạng -ed để diễn tả cảm giác: 'concerned' (lo lắng).",
      },
    ],
  },
  {
    slug: "adverbs",
    title: "Adverbs (Trạng từ)",
    category: "Word Forms",
    summary: "Vị trí trạng từ bổ nghĩa cho động từ, tính từ, hoặc cả câu.",
    theory:
      "Trạng từ (adverb) bổ nghĩa cho động từ, tính từ, trạng từ khác hoặc cả câu, thường có đuôi -ly (quickly, efficiently). Vị trí phổ biến: giữa trợ động từ và động từ chính (has recently completed), trước tính từ (extremely useful), hoặc đầu/cuối câu (Recently, the company...).",
    tips: [
      "Trạng từ tần suất (always, often, usually) thường đứng trước động từ thường nhưng sau 'to be'.",
      "Trạng từ thường đứng giữa trợ động từ và động từ chính: has carefully reviewed.",
      "Không dùng trạng từ để bổ nghĩa cho danh từ — vị trí đó cần tính từ.",
    ],
    examples: [
      { en: "The team worked efficiently to meet the tight deadline.", vi: "Nhóm đã làm việc hiệu quả để đáp ứng hạn chót gấp rút." },
      { en: "The manager has recently approved the new budget.", vi: "Người quản lý gần đây đã phê duyệt ngân sách mới." },
    ],
    questions: [
      {
        prompt: "The technician ----- repaired the printer within an hour.",
        options: ["quick", "quickly", "quicker", "quickness"],
        correctIndex: 1,
        explanationVi: "Cần trạng từ bổ nghĩa cho động từ 'repaired': 'quickly'.",
      },
      {
        prompt: "The new regulations will be ----- enforced starting next month.",
        options: ["strict", "stricter", "strictly", "strictness"],
        correctIndex: 2,
        explanationVi: "Trạng từ 'strictly' đứng giữa trợ động từ 'will be' và động từ 'enforced'.",
      },
    ],
  },
  {
    slug: "prepositions",
    title: "Prepositions (Giới từ)",
    category: "Sentence Structure",
    summary: "Giới từ chỉ thời gian, nơi chốn và các collocation thường gặp.",
    theory:
      "Giới từ (preposition) thể hiện mối quan hệ giữa các thành phần trong câu, thường đi trước danh từ hoặc đại từ. TOEIC hay kiểm tra giới từ chỉ thời gian (in, on, at, by, since, for) và giới từ trong collocation cố định (responsible for, in charge of, according to).\n'By + thời điểm' diễn tả deadline (hạn chót phải hoàn thành trước hoặc đúng lúc đó), khác với 'until' diễn tả một hành động kéo dài liên tục đến thời điểm đó.",
    tips: [
      "'By' + thời điểm = deadline; 'until' = kéo dài đến thời điểm đó.",
      "Ghi nhớ các collocation giới từ: responsible for, according to, in charge of, prior to.",
      "'In' dùng cho tháng/năm, 'on' dùng cho ngày, 'at' dùng cho giờ cụ thể.",
    ],
    examples: [
      { en: "The report must be submitted by Friday afternoon.", vi: "Báo cáo phải được nộp trước chiều thứ Sáu." },
      { en: "She is responsible for managing the client accounts.", vi: "Cô ấy chịu trách nhiệm quản lý tài khoản khách hàng." },
    ],
    questions: [
      {
        prompt: "The marketing team will submit the revised proposal ----- Friday afternoon.",
        options: ["at", "by", "from", "during"],
        correctIndex: 1,
        explanationVi: "\"By + thời điểm\" diễn tả deadline (hạn chót).",
      },
      {
        prompt: "The new employee is ----- charge of coordinating the training sessions.",
        options: ["in", "on", "at", "for"],
        correctIndex: 0,
        explanationVi: "Collocation cố định: 'in charge of' (phụ trách).",
      },
    ],
  },
  {
    slug: "conjunctions",
    title: "Conjunctions (Liên từ)",
    category: "Sentence Structure",
    summary: "Liên từ kết hợp mệnh đề, nhóm từ và câu.",
    theory:
      "Liên từ (conjunction) nối hai mệnh đề hoặc thành phần câu. Liên từ kết hợp (and, but, or, so) nối hai thành phần ngang hàng. Liên từ phụ thuộc (although, because, since, if, while) nối mệnh đề phụ với mệnh đề chính. Cần phân biệt liên từ với giới từ có nghĩa tương tự: 'because' (liên từ, theo sau là mệnh đề đầy đủ chủ-vị) khác với 'because of' (giới từ, theo sau là cụm danh từ).",
    tips: [
      "'Although/Even though' + mệnh đề, còn 'Despite/In spite of' + cụm danh từ.",
      "'Because' + mệnh đề (S+V), 'because of' + cụm danh từ.",
      "Cặp liên từ tương quan: not only...but also, either...or, neither...nor.",
    ],
    examples: [
      { en: "Although the budget was limited, the project was completed successfully.", vi: "Mặc dù ngân sách hạn chế, dự án vẫn được hoàn thành thành công." },
      { en: "The flight was delayed because of bad weather.", vi: "Chuyến bay bị hoãn vì thời tiết xấu." },
    ],
    questions: [
      {
        prompt: "----- the manager was on vacation, the team still met the deadline.",
        options: ["Because of", "Although", "Despite", "Due to"],
        correctIndex: 1,
        explanationVi: "Sau chỗ trống là mệnh đề đầy đủ (the manager was on vacation), cần liên từ 'Although'.",
      },
      {
        prompt: "The seminar was postponed ----- the low number of registrations.",
        options: ["because", "although", "due to", "even though"],
        correctIndex: 2,
        explanationVi: "Sau chỗ trống là cụm danh từ (the low number...), cần giới từ 'due to'.",
      },
    ],
  },
  {
    slug: "verb-tense",
    title: "Verb Tense (Thì của động từ)",
    category: "Verbs",
    summary: "Cách chọn đúng thì dựa vào dấu hiệu thời gian trong câu.",
    theory:
      "TOEIC Part 5 thường kiểm tra khả năng nhận biết thì động từ dựa trên các từ/cụm từ chỉ thời gian: 'yesterday' (quá khứ đơn), 'since 2020' (hiện tại hoàn thành), 'next week' (tương lai), 'currently/at the moment' (hiện tại tiếp diễn), 'by the time' (tương lai hoàn thành).\nThì hiện tại hoàn thành (have/has + V3) dùng cho hành động bắt đầu trong quá khứ và còn liên quan đến hiện tại, thường đi với 'since', 'for', 'already', 'yet'.",
    tips: [
      "'Since + mốc thời gian' và 'for + khoảng thời gian' đi với hiện tại hoàn thành.",
      "'By the time + mệnh đề quá khứ' thường đi với quá khứ hoàn thành ở mệnh đề chính.",
      "Trạng từ tần suất như 'currently', 'now' báo hiệu thì hiện tại (đơn hoặc tiếp diễn).",
    ],
    examples: [
      { en: "The company has expanded its operations since 2020.", vi: "Công ty đã mở rộng hoạt động kể từ năm 2020." },
      { en: "By the time the client arrived, the presentation had already ended.", vi: "Đến khi khách hàng đến, buổi thuyết trình đã kết thúc." },
    ],
    questions: [
      {
        prompt: "The firm ----- three new branches since last year.",
        options: ["opens", "opened", "has opened", "will open"],
        correctIndex: 2,
        explanationVi: "'Since last year' là dấu hiệu của thì hiện tại hoàn thành: 'has opened'.",
      },
      {
        prompt: "By the time the inspector arrived, the workers ----- the equipment.",
        options: ["already fixed", "had already fixed", "have already fixed", "fix"],
        correctIndex: 1,
        explanationVi: "'By the time + quá khứ đơn' đi với quá khứ hoàn thành ở mệnh đề chính: 'had already fixed'.",
      },
    ],
  },
  {
    slug: "passive-voice",
    title: "Passive Voice (Câu bị động)",
    category: "Verbs",
    summary: "Cấu trúc và cách nhận biết câu bị động trong TOEIC.",
    theory:
      "Câu bị động (passive voice) được dùng khi muốn nhấn mạnh đối tượng chịu tác động của hành động thay vì người/vật thực hiện. Cấu trúc: be + V3/ed. TOEIC thường kiểm tra việc chọn đúng dạng bị động phù hợp với thì của câu: is completed, was submitted, has been approved, will be announced.\nDấu hiệu nhận biết cần câu bị động: chủ ngữ là vật/sự việc không thể tự thực hiện hành động (The report was written by...).",
    tips: [
      "Nếu chủ ngữ là vật nhận hành động (không tự làm được), khả năng cao cần bị động.",
      "Bị động luôn có 'be' + V3, chia 'be' theo đúng thì của câu.",
      "Modal + be + V3 cho câu bị động với động từ khiếm khuyết: must be submitted, can be found.",
    ],
    examples: [
      { en: "The new policy will be announced at the meeting tomorrow.", vi: "Chính sách mới sẽ được công bố tại cuộc họp ngày mai." },
      { en: "All applications must be submitted online.", vi: "Mọi đơn đăng ký phải được nộp trực tuyến." },
    ],
    questions: [
      {
        prompt: "The annual report ----- by the finance team every January.",
        options: ["prepares", "is prepared", "preparing", "has prepare"],
        correctIndex: 1,
        explanationVi: "Chủ ngữ 'the annual report' nhận hành động 'prepare' nên cần bị động hiện tại đơn: 'is prepared'.",
      },
      {
        prompt: "The construction project ----- next spring, according to the latest schedule.",
        options: ["will complete", "completes", "will be completed", "is completing"],
        correctIndex: 2,
        explanationVi: "Dự án là đối tượng bị hoàn thành, cần bị động tương lai: 'will be completed'.",
      },
    ],
  },
  {
    slug: "gerund",
    title: "Gerund (Danh động từ)",
    category: "Verbs",
    summary: "V-ing đóng vai trò danh từ trong câu.",
    theory:
      "Danh động từ (gerund) là V-ing đóng vai trò như một danh từ, có thể làm chủ ngữ, tân ngữ của động từ hoặc tân ngữ của giới từ. Một số động từ chỉ theo sau bởi gerund: enjoy, suggest, avoid, consider, finish, recommend, mind.\nSau giới từ luôn dùng gerund, không dùng động từ nguyên mẫu: interested in working, responsible for managing.",
    tips: [
      "Sau giới từ luôn là V-ing: without checking, by submitting, before signing.",
      "Động từ + gerund phổ biến: suggest, avoid, consider, recommend, finish, enjoy.",
      "Gerund có thể làm chủ ngữ của câu: Reviewing contracts carefully is essential.",
    ],
    examples: [
      { en: "The manager recommended revising the proposal before the meeting.", vi: "Người quản lý đề xuất chỉnh sửa lại đề xuất trước cuộc họp." },
      { en: "Submitting the report late may affect the evaluation.", vi: "Việc nộp báo cáo trễ có thể ảnh hưởng đến đánh giá." },
    ],
    questions: [
      {
        prompt: "The committee suggested ----- the meeting until all members are available.",
        options: ["postpone", "postponing", "to postpone", "postponed"],
        correctIndex: 1,
        explanationVi: "'Suggest' theo sau bởi gerund: 'suggested postponing'.",
      },
      {
        prompt: "Before ----- the contract, please review every clause carefully.",
        options: ["sign", "signing", "signed", "to sign"],
        correctIndex: 1,
        explanationVi: "Sau giới từ 'before' cần V-ing: 'signing'.",
      },
    ],
  },
  {
    slug: "infinitive",
    title: "Infinitive (Động từ nguyên mẫu có to)",
    category: "Verbs",
    summary: "To-infinitive sau tính từ, động từ và để diễn tả mục đích.",
    theory:
      "Động từ nguyên mẫu có 'to' (to-infinitive) dùng để diễn tả mục đích (in order to), sau một số tính từ (able to, ready to, difficult to), và sau một số động từ nhất định: decide, want, plan, agree, promise, need, hope.\nCần phân biệt với gerund: động từ như 'decide, want, plan' theo sau bởi to-infinitive, trong khi 'suggest, avoid, consider' theo sau bởi gerund.",
    tips: [
      "Diễn tả mục đích: 'to + V' hoặc 'in order to + V'.",
      "Động từ + to-infinitive phổ biến: decide, want, plan, agree, promise, need, hope, offer.",
      "Cấu trúc 'too...to' và 'enough to' đều dùng to-infinitive.",
    ],
    examples: [
      { en: "The company plans to open a new branch next year.", vi: "Công ty có kế hoạch mở chi nhánh mới vào năm sau." },
      { en: "Staff members need to complete the training to renew their certification.", vi: "Nhân viên cần hoàn thành khóa đào tạo để gia hạn chứng chỉ." },
    ],
    questions: [
      {
        prompt: "The board has decided ----- the merger proposal next quarter.",
        options: ["review", "reviewing", "to review", "reviewed"],
        correctIndex: 2,
        explanationVi: "'Decide' theo sau bởi to-infinitive: 'decided to review'.",
      },
      {
        prompt: "The budget was too limited ----- all the proposed renovations.",
        options: ["completing", "to complete", "complete", "completed"],
        correctIndex: 1,
        explanationVi: "Cấu trúc 'too...to' luôn dùng to-infinitive.",
      },
    ],
  },
  {
    slug: "relative-clause",
    title: "Relative Clause (Mệnh đề quan hệ)",
    category: "Sentence Structure",
    summary: "Who, which, that, whose và cách rút gọn mệnh đề quan hệ.",
    theory:
      "Mệnh đề quan hệ bổ nghĩa cho danh từ đứng trước nó. 'Who/whom' dùng cho người, 'which' dùng cho vật, 'that' dùng được cho cả người và vật (trong mệnh đề xác định), 'whose' chỉ sở hữu. Mệnh đề quan hệ có thể rút gọn thành cụm phân từ khi đại từ quan hệ làm chủ ngữ: The man who is standing there → The man standing there.",
    tips: [
      "'Who' cho người, 'which' cho vật, 'whose' chỉ sở hữu (của ai).",
      "Có thể lược bỏ đại từ quan hệ làm tân ngữ: the report (that) I submitted.",
      "Mệnh đề quan hệ không xác định (có dấu phẩy) không dùng 'that'.",
    ],
    examples: [
      { en: "The employee who received the award works in the sales department.", vi: "Nhân viên nhận giải thưởng làm việc ở phòng kinh doanh." },
      { en: "The proposal, which was submitted last week, is still under review.", vi: "Đề xuất, được nộp tuần trước, vẫn đang được xem xét." },
    ],
    questions: [
      {
        prompt: "The consultant ----- advice helped us reduce costs has left the firm.",
        options: ["who", "which", "whose", "whom"],
        correctIndex: 2,
        explanationVi: "Cần đại từ quan hệ chỉ sở hữu 'whose' vì 'advice' là của consultant.",
      },
      {
        prompt: "This is the software ----- our team uses to track project progress.",
        options: ["who", "whose", "which", "whom"],
        correctIndex: 2,
        explanationVi: "'Which' dùng cho vật (software).",
      },
    ],
  },
  {
    slug: "conditionals",
    title: "Conditionals (Câu điều kiện)",
    category: "Sentence Structure",
    summary: "Câu điều kiện loại 0, 1, 2, 3 trong ngữ cảnh công việc.",
    theory:
      "Câu điều kiện diễn tả một điều kiện và kết quả tương ứng. Loại 1 (khả năng có thật ở hiện tại/tương lai): If + hiện tại đơn, S + will + V. Loại 2 (giả định trái thực tế ở hiện tại): If + quá khứ đơn, S + would + V. Loại 3 (giả định trái thực tế trong quá khứ): If + quá khứ hoàn thành, S + would have + V3.",
    tips: [
      "Loại 1: If + S + V(hiện tại), S + will + V — dùng cho khả năng có thật.",
      "Loại 2: If + S + V(quá khứ), S + would + V — giả định không có thật ở hiện tại.",
      "Loại 3: If + S + had + V3, S + would have + V3 — giả định về quá khứ.",
    ],
    examples: [
      { en: "If the shipment arrives on time, we will begin production immediately.", vi: "Nếu lô hàng đến đúng giờ, chúng tôi sẽ bắt đầu sản xuất ngay." },
      { en: "If the team had received the funding earlier, the project would have finished on schedule.", vi: "Nếu nhóm nhận được nguồn tài trợ sớm hơn, dự án đã hoàn thành đúng tiến độ." },
    ],
    questions: [
      {
        prompt: "If the client ----- the contract by Friday, we will proceed with production.",
        options: ["sign", "signs", "will sign", "signed"],
        correctIndex: 1,
        explanationVi: "Câu điều kiện loại 1: mệnh đề if dùng hiện tại đơn 'signs'.",
      },
      {
        prompt: "If the budget had been approved sooner, the campaign ----- earlier.",
        options: ["would launch", "would have launched", "launches", "will launch"],
        correctIndex: 1,
        explanationVi: "Câu điều kiện loại 3: mệnh đề chính dùng 'would have + V3'.",
      },
    ],
  },
  {
    slug: "comparatives",
    title: "Comparatives (So sánh)",
    category: "Word Forms",
    summary: "So sánh hơn, so sánh nhất và so sánh bằng.",
    theory:
      "So sánh hơn (comparative) dùng để so sánh hai đối tượng: tính từ ngắn + er, hoặc more + tính từ dài. So sánh nhất (superlative) dùng 'the' + tính từ + est, hoặc 'the most' + tính từ dài, để so sánh từ ba đối tượng trở lên. So sánh bằng dùng cấu trúc 'as...as'.",
    tips: [
      "Tính từ 1 âm tiết: thêm -er/-est. Tính từ dài: dùng more/most.",
      "So sánh bằng: as + tính từ/trạng từ + as.",
      "'The + so sánh nhất' luôn cần mạo từ 'the' đứng trước.",
    ],
    examples: [
      { en: "This model is more efficient than the previous version.", vi: "Mẫu này hiệu quả hơn phiên bản trước." },
      { en: "The new office is the largest branch in the region.", vi: "Văn phòng mới là chi nhánh lớn nhất trong khu vực." },
    ],
    questions: [
      {
        prompt: "The revised proposal is ----- than the original one.",
        options: ["more detailed", "most detailed", "detailed", "more detail"],
        correctIndex: 0,
        explanationVi: "So sánh hơn với tính từ dài dùng 'more + tính từ': 'more detailed'.",
      },
      {
        prompt: "Of all the candidates, she has ----- experience in project management.",
        options: ["more", "most", "the most", "much"],
        correctIndex: 2,
        explanationVi: "So sánh nhất cần 'the most' khi so sánh từ ba đối tượng trở lên.",
      },
    ],
  },
  {
    slug: "subject-verb-agreement",
    title: "Subject-Verb Agreement (Hòa hợp chủ-vị)",
    category: "Sentence Structure",
    summary: "Chia động từ đúng theo chủ ngữ số ít/số nhiều.",
    theory:
      "Động từ phải hòa hợp với chủ ngữ về số ít/số nhiều. Chủ ngữ số ít (a proposal, each employee, everyone) đi với động từ số ít (chia -s/-es). Chủ ngữ số nhiều đi với động từ nguyên thể. Các danh từ tập hợp như 'staff, team, committee' thường được coi là số ít trong tiếng Anh trang trọng.\nCụm từ chêm giữa chủ ngữ và động từ (as well as, along with, in addition to) không ảnh hưởng đến việc chia động từ.",
    tips: [
      "'Each/Every + danh từ số ít' luôn đi với động từ số ít.",
      "Cụm 'together with, as well as, along with' không làm chủ ngữ thành số nhiều.",
      "'The number of' + danh từ số nhiều + động từ số ít; 'A number of' + động từ số nhiều.",
    ],
    examples: [
      { en: "Each department is responsible for its own budget.", vi: "Mỗi phòng ban chịu trách nhiệm về ngân sách riêng của mình." },
      { en: "The number of applicants has increased significantly this year.", vi: "Số lượng ứng viên đã tăng đáng kể trong năm nay." },
    ],
    questions: [
      {
        prompt: "The manager, along with two assistants, ----- responsible for the event.",
        options: ["are", "is", "were", "have been"],
        correctIndex: 1,
        explanationVi: "Cụm 'along with...' không ảnh hưởng đến chủ ngữ chính 'the manager' (số ít): 'is'.",
      },
      {
        prompt: "A number of employees ----- requested flexible working hours.",
        options: ["has", "have", "is", "was"],
        correctIndex: 1,
        explanationVi: "'A number of' + danh từ số nhiều đi với động từ số nhiều: 'have'.",
      },
    ],
  },
  {
    slug: "participles",
    title: "Participles (Phân từ)",
    category: "Verbs",
    summary: "Phân từ hiện tại (V-ing) và phân từ quá khứ (V-ed/V3) làm tính từ.",
    theory:
      "Phân từ hiện tại (V-ing) mang nghĩa chủ động, thường bổ nghĩa cho danh từ thực hiện hành động: the leading company (công ty dẫn đầu). Phân từ quá khứ (V-ed/V3) mang nghĩa bị động, bổ nghĩa cho danh từ chịu tác động: the attached document (tài liệu được đính kèm).\nCụm phân từ (participial phrase) có thể thay thế cho mệnh đề quan hệ để rút gọn câu: Employees who are working overtime → Employees working overtime.",
    tips: [
      "V-ing bổ nghĩa cho danh từ chủ động thực hiện hành động: the increasing demand.",
      "V-ed/V3 bổ nghĩa cho danh từ bị tác động: the completed report, attached file.",
      "Cụm phân từ đầu câu phải có cùng chủ ngữ với mệnh đề chính.",
    ],
    examples: [
      { en: "Please review the attached document before the meeting.", vi: "Vui lòng xem lại tài liệu đính kèm trước cuộc họp." },
      { en: "The company is looking for a highly motivated candidate.", vi: "Công ty đang tìm kiếm một ứng viên có động lực cao." },
    ],
    questions: [
      {
        prompt: "Please find the ----- invoice for your recent purchase.",
        options: ["attach", "attaching", "attached", "attachment"],
        correctIndex: 2,
        explanationVi: "Hóa đơn 'bị' đính kèm nên dùng phân từ quá khứ mang nghĩa bị động: 'attached'.",
      },
      {
        prompt: "The company reported ----- sales figures for the third quarter.",
        options: ["increase", "increasing", "increased", "increases"],
        correctIndex: 1,
        explanationVi: "'Increasing sales figures' (doanh số đang tăng) mang nghĩa chủ động, dùng V-ing.",
      },
    ],
  },
];
