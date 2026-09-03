export interface SeedPart7Question {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanationVi: string;
  evidenceText?: string;
}

export interface SeedPart7Passage {
  title: string;
  format: "NOTICE" | "ADVERTISEMENT" | "EMAIL" | "SCHEDULE" | "CHAT" | "MEMO" | "ARTICLE" | "INVOICE";
  layout: "SINGLE" | "DOUBLE" | "TRIPLE";
  texts: { label: string; content: string }[];
  questions: SeedPart7Question[];
}

export const PART7_PASSAGES: SeedPart7Passage[] = [
  {
    title: "Notice — Building Maintenance",
    format: "NOTICE",
    layout: "SINGLE",
    texts: [
      {
        label: "Notice",
        content:
          "NOTICE TO ALL TENANTS\n\nThe water supply to the building will be shut off on Saturday, June 14, from 9:00 a.m. to 3:00 p.m. for scheduled pipe maintenance. Tenants are advised to store water in advance if needed.\n\nThe elevators will remain in service throughout the maintenance period. For questions, please contact the building management office at extension 205.\n\nWe apologize for any inconvenience this may cause.",
      },
    ],
    questions: [
      {
        prompt: "What is the purpose of the notice?",
        options: ["To announce a new tenant", "To inform tenants of a water shutoff", "To advertise an apartment for rent", "To report an elevator malfunction"],
        correctIndex: 1,
        explanationVi: "Thông báo nói về việc ngắt nước để bảo trì đường ống.",
        evidenceText: "The water supply to the building will be shut off on Saturday, June 14",
      },
      {
        prompt: "How long will the water be turned off?",
        options: ["One hour", "Three hours", "Six hours", "All day"],
        correctIndex: 2,
        explanationVi: "Từ 9:00 a.m. đến 3:00 p.m. là 6 tiếng.",
        evidenceText: "from 9:00 a.m. to 3:00 p.m.",
      },
      {
        prompt: "What should tenants do if they have questions?",
        options: ["Visit the front desk", "Call extension 205", "Send an email", "Wait until Monday"],
        correctIndex: 1,
        explanationVi: "Thông báo yêu cầu liên hệ văn phòng quản lý qua số máy nhánh 205.",
        evidenceText: "please contact the building management office at extension 205",
      },
    ],
  },
  {
    title: "Advertisement — Office Furniture Sale",
    format: "ADVERTISEMENT",
    layout: "SINGLE",
    texts: [
      {
        label: "Advertisement",
        content:
          "URBAN OFFICE SUPPLY — END OF SEASON SALE\n\nUpgrade your workspace for less! From June 1 to June 30, enjoy up to 40% off all desks, chairs, and storage cabinets. Free delivery is available for orders over $300 within the city limits.\n\nVisit our showroom at 88 Le Loi Street or shop online at urbanofficesupply.example. Members of our loyalty program receive an additional 5% discount on top of sale prices.",
      },
    ],
    questions: [
      {
        prompt: "What is being advertised?",
        options: ["A job opening", "A furniture sale", "A software update", "A catering service"],
        correctIndex: 1,
        explanationVi: "Quảng cáo về đợt giảm giá đồ nội thất văn phòng.",
        evidenceText: "enjoy up to 40% off all desks, chairs, and storage cabinets",
      },
      {
        prompt: "How can customers receive free delivery?",
        options: ["By joining the loyalty program", "By spending over $300", "By shopping in person only", "By ordering before June 1"],
        correctIndex: 1,
        explanationVi: "Miễn phí giao hàng áp dụng cho đơn hàng trên $300.",
        evidenceText: "Free delivery is available for orders over $300",
      },
      {
        prompt: "What additional benefit do loyalty program members receive?",
        options: ["A free gift", "A 5% extra discount", "Priority delivery", "Extended warranty"],
        correctIndex: 1,
        explanationVi: "Thành viên chương trình khách hàng thân thiết được giảm thêm 5%.",
        evidenceText: "Members of our loyalty program receive an additional 5% discount",
      },
    ],
  },
  {
    title: "Email — Conference Registration Confirmation",
    format: "EMAIL",
    layout: "SINGLE",
    texts: [
      {
        label: "Email",
        content:
          "From: registration@bizsummit.example\nTo: attendee@example.com\nSubject: Registration Confirmed — Asia Business Summit\n\nDear Attendee,\n\nThank you for registering for the Asia Business Summit, taking place on September 10-11 at the Riverside Convention Center. Your registration includes access to all keynote sessions, workshops, and the networking dinner on September 10.\n\nPlease bring a printed copy of this email or show it on your phone to collect your badge at the registration desk starting at 8:00 a.m. on the first day.\n\nIf you need to cancel or transfer your registration, please notify us at least one week before the event for a full refund.",
      },
    ],
    questions: [
      {
        prompt: "What does the registration fee include?",
        options: ["Hotel accommodation", "Airport transportation", "Access to keynote sessions and workshops", "A one-year magazine subscription"],
        correctIndex: 2,
        explanationVi: "Email nêu rõ đăng ký bao gồm các phiên chính, workshop và tiệc networking.",
        evidenceText: "Your registration includes access to all keynote sessions, workshops, and the networking dinner",
      },
      {
        prompt: "What time does badge collection begin?",
        options: ["7:00 a.m.", "8:00 a.m.", "9:00 a.m.", "10:00 a.m."],
        correctIndex: 1,
        explanationVi: "Nhận thẻ bắt đầu lúc 8:00 sáng ngày đầu tiên.",
        evidenceText: "starting at 8:00 a.m. on the first day",
      },
      {
        prompt: "What must attendees do to receive a full refund?",
        options: ["Cancel within 24 hours of the event", "Cancel at least one week in advance", "Attend at least one session", "Provide a written reason"],
        correctIndex: 1,
        explanationVi: "Cần thông báo hủy ít nhất một tuần trước sự kiện để được hoàn tiền đầy đủ.",
        evidenceText: "please notify us at least one week before the event for a full refund",
      },
      {
        prompt: "The word 'notify' in the last paragraph is closest in meaning to",
        options: ["inform", "prevent", "delay", "ignore"],
        correctIndex: 0,
        explanationVi: "'Notify' nghĩa là thông báo cho ai đó, gần nghĩa nhất với 'inform'.",
      },
    ],
  },
  {
    title: "Email exchange — Product Delivery Delay",
    format: "EMAIL",
    layout: "DOUBLE",
    texts: [
      {
        label: "Email 1",
        content:
          "From: purchasing@brightretail.example\nTo: sales@northsupply.example\nSubject: Order #4521 — Delayed Delivery\n\nHello,\n\nOur order #4521, placed on May 3, was scheduled to arrive by May 15, but we have not yet received it. This delay is affecting our ability to restock shelves for the upcoming sale. Could you please provide an updated delivery estimate as soon as possible?\n\nThank you,\nBright Retail Purchasing Team",
      },
      {
        label: "Email 2 — Reply",
        content:
          "From: sales@northsupply.example\nTo: purchasing@brightretail.example\nSubject: RE: Order #4521 — Delayed Delivery\n\nDear Purchasing Team,\n\nWe apologize for the delay. Due to a shortage of packaging materials, several shipments, including yours, were held at our warehouse. We expect order #4521 to be dispatched by May 20 and to arrive at your location within three business days after that.\n\nAs a gesture of goodwill, we will waive the shipping fee for this order. Please let us know if you have further questions.\n\nBest regards,\nNorth Supply Sales Team",
      },
    ],
    questions: [
      {
        prompt: "Why is Bright Retail writing to North Supply?",
        options: ["To place a new order", "To ask about a delayed delivery", "To request a product catalog", "To cancel an order"],
        correctIndex: 1,
        explanationVi: "Email đầu tiên hỏi về tình trạng đơn hàng bị trễ.",
        evidenceText: "we have not yet received it",
      },
      {
        prompt: "What caused the delivery delay, according to North Supply?",
        options: ["A staffing shortage", "A shortage of packaging materials", "A system error", "Bad weather"],
        correctIndex: 1,
        explanationVi: "North Supply giải thích do thiếu nguyên liệu đóng gói.",
        evidenceText: "Due to a shortage of packaging materials",
      },
      {
        prompt: "When does North Supply expect to dispatch the order?",
        options: ["May 15", "May 18", "May 20", "May 25"],
        correctIndex: 2,
        explanationVi: "North Supply dự kiến gửi hàng vào ngày 20 tháng 5.",
        evidenceText: "We expect order #4521 to be dispatched by May 20",
      },
      {
        prompt: "What will North Supply do to compensate Bright Retail?",
        options: ["Offer a discount on the next order", "Waive the shipping fee", "Send a replacement product", "Extend the payment deadline"],
        correctIndex: 1,
        explanationVi: "North Supply sẽ miễn phí vận chuyển cho đơn hàng này.",
        evidenceText: "we will waive the shipping fee for this order",
      },
      {
        prompt: "How many days after dispatch is the order expected to arrive?",
        options: ["One day", "Three days", "Five days", "Seven days"],
        correctIndex: 1,
        explanationVi: "Đơn hàng dự kiến đến trong vòng ba ngày làm việc sau khi gửi đi.",
        evidenceText: "to arrive at your location within three business days after that",
      },
    ],
  },
  {
    title: "Schedule — Regional Sales Conference",
    format: "SCHEDULE",
    layout: "SINGLE",
    texts: [
      {
        label: "Schedule",
        content:
          "REGIONAL SALES CONFERENCE — DAY 1 SCHEDULE\n\n8:00 a.m. – Registration and welcome coffee\n9:00 a.m. – Opening remarks (Main Hall)\n9:30 a.m. – Keynote: \"Winning in a Competitive Market\"\n11:00 a.m. – Breakout sessions (Rooms A, B, and C)\n12:30 p.m. – Lunch (Garden Terrace)\n2:00 p.m. – Panel discussion: Regional Growth Strategies\n4:00 p.m. – Networking reception\n\nNote: Breakout session topics will be posted on the lobby board each morning. Attendees should bring their conference badge to all sessions.",
      },
    ],
    questions: [
      {
        prompt: "Where will the opening remarks take place?",
        options: ["The Garden Terrace", "The Main Hall", "Room A", "The lobby"],
        correctIndex: 1,
        explanationVi: "Phát biểu khai mạc diễn ra tại Main Hall.",
        evidenceText: "Opening remarks (Main Hall)",
      },
      {
        prompt: "What time does lunch begin?",
        options: ["11:00 a.m.", "12:30 p.m.", "2:00 p.m.", "4:00 p.m."],
        correctIndex: 1,
        explanationVi: "Bữa trưa bắt đầu lúc 12:30 chiều.",
        evidenceText: "12:30 p.m. – Lunch (Garden Terrace)",
      },
      {
        prompt: "What are attendees required to bring to sessions?",
        options: ["A printed agenda", "A laptop", "Their conference badge", "A business card"],
        correctIndex: 2,
        explanationVi: "Người tham dự cần mang theo thẻ hội nghị đến mọi phiên họp.",
        evidenceText: "Attendees should bring their conference badge to all sessions",
      },
    ],
  },
  {
    title: "Memo — Updated Dress Code",
    format: "MEMO",
    layout: "SINGLE",
    texts: [
      {
        label: "Memo",
        content:
          "TO: All Staff\nFROM: Human Resources\nRE: Updated Dress Code Policy\n\nEffective next Monday, business casual attire will be permitted every day of the week, not just on Fridays. Jeans are acceptable as long as they are free of tears and worn with a collared shirt or blouse.\n\nClient-facing staff should continue to wear formal business attire on days when they have scheduled meetings with clients. Athletic wear and flip-flops remain prohibited at all times.\n\nQuestions about the policy can be directed to the HR office.",
      },
    ],
    questions: [
      {
        prompt: "What change is being announced?",
        options: ["A new vacation policy", "An expanded dress code", "A change in office hours", "A new client contract"],
        correctIndex: 1,
        explanationVi: "Thông báo về việc mở rộng áp dụng trang phục business casual cả tuần.",
        evidenceText: "business casual attire will be permitted every day of the week",
      },
      {
        prompt: "Under what condition are jeans acceptable?",
        options: ["Only on Fridays", "When worn with a collared shirt or blouse", "Only for remote staff", "Never, they remain banned"],
        correctIndex: 1,
        explanationVi: "Quần jeans được chấp nhận nếu mặc cùng áo có cổ, không rách.",
        evidenceText: "worn with a collared shirt or blouse",
      },
      {
        prompt: "Who must wear formal attire on certain days?",
        options: ["New employees", "Client-facing staff with scheduled meetings", "Only managers", "Everyone, at all times"],
        correctIndex: 1,
        explanationVi: "Nhân viên tiếp xúc khách hàng cần mặc trang phục trang trọng vào ngày có lịch gặp khách.",
        evidenceText: "Client-facing staff should continue to wear formal business attire on days when they have scheduled meetings with clients",
      },
      {
        prompt: "What is still not allowed under the policy?",
        options: ["Collared shirts", "Business casual attire", "Athletic wear and flip-flops", "Blouses"],
        correctIndex: 2,
        explanationVi: "Đồ thể thao và dép xỏ ngón vẫn bị cấm trong mọi trường hợp.",
        evidenceText: "Athletic wear and flip-flops remain prohibited at all times",
      },
    ],
  },
  {
    title: "Article — New Bike-Share Program Launches Downtown",
    format: "ARTICLE",
    layout: "SINGLE",
    texts: [
      {
        label: "Article",
        content:
          "The city officially launched its new bike-share program last week, placing 300 bicycles at 25 stations throughout the downtown area. Riders can unlock a bike using a mobile app and are charged based on the length of their trip.\n\nCity officials say the program is intended to reduce traffic congestion and offer residents an affordable alternative for short trips. \"We've seen strong demand in the first few days,\" said transportation director Mai Le. \"Several stations near the business district have already needed extra bikes.\"\n\nThe program will run as a one-year pilot, after which the city will evaluate whether to expand it to other neighborhoods. Annual memberships are available at a discounted rate for students and senior citizens.",
      },
    ],
    questions: [
      {
        prompt: "What is the article mainly about?",
        options: ["A new subway line", "A new bike-share program", "A road construction project", "A change in bus fares"],
        correctIndex: 1,
        explanationVi: "Bài báo nói về chương trình xe đạp chia sẻ mới của thành phố.",
        evidenceText: "The city officially launched its new bike-share program last week",
      },
      {
        prompt: "How do riders unlock a bicycle?",
        options: ["With a physical key", "Using a mobile app", "At a staffed booth", "With a membership card only"],
        correctIndex: 1,
        explanationVi: "Người dùng mở khóa xe đạp bằng ứng dụng di động.",
        evidenceText: "Riders can unlock a bike using a mobile app",
      },
      {
        prompt: "What has happened at some stations near the business district?",
        options: ["They have been closed", "They have needed extra bikes", "They have been relocated", "They have raised their prices"],
        correctIndex: 1,
        explanationVi: "Một số trạm gần khu kinh doanh cần bổ sung thêm xe do nhu cầu cao.",
        evidenceText: "Several stations near the business district have already needed extra bikes",
      },
      {
        prompt: "Who is eligible for a discounted annual membership?",
        options: ["City employees", "Students and senior citizens", "First-time users only", "Downtown residents only"],
        correctIndex: 1,
        explanationVi: "Học sinh/sinh viên và người cao tuổi được giảm giá gói thành viên năm.",
        evidenceText: "Annual memberships are available at a discounted rate for students and senior citizens",
      },
    ],
  },
  {
    title: "Chat — Coordinating a Client Presentation",
    format: "CHAT",
    layout: "SINGLE",
    texts: [
      {
        label: "Text Message Chain",
        content:
          "Duy (10:02 a.m.): Are the slides for the Meridian pitch ready? The meeting got moved up to 1 p.m.\n\nAnh (10:04 a.m.): Almost — I'm still waiting on the updated pricing numbers from finance.\n\nDuy (10:05 a.m.): Can you ping them now? We really can't present without accurate figures.\n\nAnh (10:07 a.m.): Just did. They said they'll have it to me by 11:30.\n\nDuy (10:08 a.m.): Perfect, that gives us an hour to finalize everything before the meeting.",
      },
    ],
    questions: [
      {
        prompt: "Why did the meeting time change?",
        options: ["The client requested a later time", "It was moved up to 1 p.m.", "It was postponed to tomorrow", "The venue was unavailable"],
        correctIndex: 1,
        explanationVi: "Cuộc họp được đổi sang sớm hơn, lúc 1 giờ chiều.",
        evidenceText: "The meeting got moved up to 1 p.m.",
      },
      {
        prompt: "What is Anh waiting for?",
        options: ["Approval from a manager", "Updated pricing numbers", "A signed contract", "A room booking confirmation"],
        correctIndex: 1,
        explanationVi: "Anh đang chờ số liệu giá đã cập nhật từ phòng tài chính.",
        evidenceText: "I'm still waiting on the updated pricing numbers from finance",
      },
      {
        prompt: "At 10:08 a.m., what does Duy mean when he writes \"that gives us an hour\"?",
        options: ["The meeting will last one hour", "They will have time to finish preparing", "Finance needs one more hour", "The flight is delayed by an hour"],
        correctIndex: 1,
        explanationVi: "Duy có ý rằng họ sẽ có một giờ để hoàn thiện mọi thứ trước cuộc họp.",
      },
    ],
  },
  {
    title: "Job posting and application email — Marketing Coordinator",
    format: "EMAIL",
    layout: "DOUBLE",
    texts: [
      {
        label: "Job Posting",
        content:
          "MARKETING COORDINATOR — Brightline Media\n\nWe are seeking a detail-oriented Marketing Coordinator to join our growing team. Responsibilities include managing social media calendars, coordinating with outside vendors, and assisting with event planning.\n\nRequirements: at least two years of marketing experience, strong writing skills, and familiarity with design software. This is a hybrid role requiring three days per week in our downtown office.\n\nTo apply, send your resume and a brief cover letter to careers@brightlinemedia.example by June 20.",
      },
      {
        label: "Email",
        content:
          "From: t.hoang@example.com\nTo: careers@brightlinemedia.example\nSubject: Application — Marketing Coordinator\n\nDear Hiring Manager,\n\nI am writing to apply for the Marketing Coordinator position posted on your careers page. I have three years of experience managing social media campaigns for a retail brand and am comfortable with major design software.\n\nI have attached my resume for your review. I am available for an interview any weekday afternoon and can begin the hybrid schedule immediately upon hiring.\n\nThank you for your consideration.\n\nSincerely,\nThanh Hoang",
      },
    ],
    questions: [
      {
        prompt: "What is one responsibility of the Marketing Coordinator role?",
        options: ["Managing the company budget", "Coordinating with outside vendors", "Supervising the sales team", "Conducting job interviews"], correctIndex: 1,
        explanationVi: "Tin tuyển dụng nêu rõ trách nhiệm phối hợp với các nhà cung cấp bên ngoài.",
        evidenceText: "coordinating with outside vendors",
      },
      {
        prompt: "How many days per week must the employee work in the office?",
        options: ["One", "Two", "Three", "Five"],
        correctIndex: 2,
        explanationVi: "Vị trí yêu cầu làm việc tại văn phòng ba ngày mỗi tuần (hybrid).",
        evidenceText: "requiring three days per week in our downtown office",
      },
      {
        prompt: "What is the deadline to apply?",
        options: ["June 10", "June 20", "July 1", "It is not mentioned"],
        correctIndex: 1,
        explanationVi: "Hạn nộp hồ sơ là ngày 20 tháng 6.",
        evidenceText: "by June 20",
      },
      {
        prompt: "How much marketing experience does Thanh Hoang have?",
        options: ["One year", "Two years", "Three years", "Five years"],
        correctIndex: 2,
        explanationVi: "Thanh Hoang có ba năm kinh nghiệm quản lý chiến dịch mạng xã hội.",
        evidenceText: "I have three years of experience managing social media campaigns",
      },
      {
        prompt: "What does Thanh Hoang say about her availability?",
        options: ["She can only interview on weekends", "She is available any weekday afternoon", "She needs one month before starting", "She cannot start immediately"],
        correctIndex: 1,
        explanationVi: "Cô ấy cho biết có thể phỏng vấn vào bất kỳ buổi chiều trong tuần nào.",
        evidenceText: "I am available for an interview any weekday afternoon",
      },
    ],
  },
  {
    title: "Workshop flyer, registration email, and reminder notice",
    format: "ADVERTISEMENT",
    layout: "TRIPLE",
    texts: [
      {
        label: "Flyer",
        content:
          "PROFESSIONAL WRITING WORKSHOP\nHosted by the Riverside Business Association\n\nJoin us for a half-day workshop on effective business writing, covering emails, reports, and proposals. Open to members and non-members.\n\nDate: Saturday, August 8\nTime: 9:00 a.m. – 1:00 p.m.\nLocation: Riverside Community Center, Room 204\nFee: $40 (members), $60 (non-members) — includes materials and lunch\n\nSeats are limited to 30 participants. Register online at rba.example/writing-workshop by August 1.",
      },
      {
        label: "Registration Confirmation Email",
        content:
          "From: events@rba.example\nTo: k.tran@example.com\nSubject: Registration Confirmed — Professional Writing Workshop\n\nDear Ms. Tran,\n\nThank you for registering for the Professional Writing Workshop on August 8. Since you registered as a non-member, your fee of $60 has been charged to the card provided.\n\nPlease arrive by 8:45 a.m. to check in and collect your materials. Lunch will be provided at 12:00 p.m. If you need to cancel, please notify us by August 4 for a full refund.",
      },
      {
        label: "Reminder Notice",
        content:
          "REMINDER: Your workshop begins in two days!\n\nThis is a quick reminder that the Professional Writing Workshop takes place this Saturday. Please bring a laptop if possible, as one session will include a hands-on editing exercise. Free parking is available in Lot C behind the community center.\n\nWe look forward to seeing you there!",
      },
    ],
    questions: [
      {
        prompt: "What is the workshop mainly about?",
        options: ["Public speaking", "Business writing", "Financial planning", "Project management"],
        correctIndex: 1,
        explanationVi: "Hội thảo tập trung vào kỹ năng viết trong môi trường công việc.",
        evidenceText: "a half-day workshop on effective business writing",
      },
      {
        prompt: "How much did Ms. Tran pay for the workshop?",
        options: ["$40", "$50", "$60", "$70"],
        correctIndex: 2,
        explanationVi: "Vì đăng ký với tư cách không phải hội viên, cô Tran đóng $60.",
        evidenceText: "Since you registered as a non-member, your fee of $60 has been charged",
      },
      {
        prompt: "What time should participants arrive for check-in?",
        options: ["8:00 a.m.", "8:45 a.m.", "9:00 a.m.", "12:00 p.m."],
        correctIndex: 1,
        explanationVi: "Người tham dự cần đến trước 8:45 sáng để làm thủ tục check-in.",
        evidenceText: "Please arrive by 8:45 a.m. to check in",
      },
      {
        prompt: "What are participants advised to bring?",
        options: ["A printed ID", "A laptop", "Their own lunch", "A notebook only"],
        correctIndex: 1,
        explanationVi: "Thông báo nhắc mang laptop vì có phần thực hành chỉnh sửa văn bản.",
        evidenceText: "Please bring a laptop if possible",
      },
      {
        prompt: "By what date could Ms. Tran have canceled for a full refund?",
        options: ["August 1", "August 4", "August 6", "August 8"],
        correctIndex: 1,
        explanationVi: "Hạn hủy để được hoàn tiền đầy đủ là ngày 4 tháng 8.",
        evidenceText: "If you need to cancel, please notify us by August 4 for a full refund",
      },
    ],
  },
  {
    title: "Product complaint email, company reply, and satisfaction survey",
    format: "EMAIL",
    layout: "TRIPLE",
    texts: [
      {
        label: "Customer Email",
        content:
          "From: r.nguyen@example.com\nTo: support@homelinegoods.example\nSubject: Broken Blender — Order #7734\n\nHello,\n\nI received my order (#7734) yesterday, but the blender arrived with a cracked base and does not turn on. This was meant to be a birthday gift, so I need a resolution quickly. Could you send a replacement, or should I return this one first?\n\nThank you,\nRang Nguyen",
      },
      {
        label: "Company Reply",
        content:
          "From: support@homelinegoods.example\nTo: r.nguyen@example.com\nSubject: RE: Broken Blender — Order #7734\n\nDear Mr. Nguyen,\n\nWe're very sorry to hear about the damaged blender. We are shipping a replacement today via express delivery at no extra charge, and you do not need to return the damaged unit — please dispose of it safely.\n\nAs an apology for the inconvenience, we've also added a $15 store credit to your account. Your replacement should arrive within two business days.\n\nBest regards,\nHomeline Goods Customer Support",
      },
      {
        label: "Follow-up Survey",
        content:
          "HOMELINE GOODS — How did we do?\n\nThank you for allowing us to resolve your recent issue. Please take a moment to rate your experience:\n\n1. How satisfied were you with the resolution? (1–5)\n2. How would you rate our response time?\n3. Would you recommend Homeline Goods to a friend?\n\nAs a thank-you for completing this survey, you'll receive an additional 10% off your next purchase.",
      },
    ],
    questions: [
      {
        prompt: "What problem did Mr. Nguyen report?",
        options: ["A missing item", "A damaged blender", "A late delivery", "An incorrect charge"],
        correctIndex: 1,
        explanationVi: "Anh Nguyen phản ánh máy xay bị nứt đế và không hoạt động.",
        evidenceText: "the blender arrived with a cracked base and does not turn on",
      },
      {
        prompt: "Why did Mr. Nguyen want a quick resolution?",
        options: ["He was traveling soon", "The item was a birthday gift", "The store was closing", "He needed a refund for taxes"],
        correctIndex: 1,
        explanationVi: "Món hàng này là quà sinh nhật nên anh cần xử lý nhanh.",
        evidenceText: "This was meant to be a birthday gift",
      },
      {
        prompt: "What does Homeline Goods ask Mr. Nguyen to do with the damaged blender?",
        options: ["Return it for a refund", "Ship it to their warehouse", "Dispose of it safely", "Bring it to a local store"],
        correctIndex: 2,
        explanationVi: "Công ty yêu cầu anh tự bỏ chiếc máy hỏng đi, không cần trả lại.",
        evidenceText: "you do not need to return the damaged unit — please dispose of it safely",
      },
      {
        prompt: "What did the company offer as an apology?",
        options: ["A full refund", "A $15 store credit", "A free gift", "A one-year warranty extension"],
        correctIndex: 1,
        explanationVi: "Công ty đã thêm $15 tín dụng cửa hàng như một lời xin lỗi.",
        evidenceText: "we've also added a $15 store credit to your account",
      },
      {
        prompt: "What incentive is offered for completing the survey?",
        options: ["A free product", "10% off the next purchase", "A cash refund", "Priority shipping for life"],
        correctIndex: 1,
        explanationVi: "Người hoàn thành khảo sát sẽ được giảm thêm 10% cho lần mua tiếp theo.",
        evidenceText: "you'll receive an additional 10% off your next purchase",
      },
    ],
  },
  {
    title: "Job posting, cover letter, and interview invitation",
    format: "EMAIL",
    layout: "TRIPLE",
    texts: [
      {
        label: "Job Posting",
        content:
          "GRAPHIC DESIGNER — Northstar Creative Agency\n\nWe're looking for a Graphic Designer to join our branding team. You'll create visual assets for client campaigns, from logos to social media graphics.\n\nRequirements: a portfolio demonstrating brand identity work, proficiency in industry-standard design software, and at least one year of agency experience.\n\nThis is an on-site position based in our downtown studio. Interested candidates should send a portfolio link and cover letter to hiring@northstarcreative.example.",
      },
      {
        label: "Cover Letter Excerpt",
        content:
          "Dear Hiring Team,\n\nI am excited to apply for the Graphic Designer position at Northstar Creative Agency. I have spent the past two years at a boutique design studio, where I led branding projects for several local restaurants and retail clients.\n\nMy portfolio, linked below, highlights a recent rebrand I completed for a regional coffee chain, including logo design, packaging, and social media templates. I would welcome the opportunity to bring this experience to your team.\n\nSincerely,\nBao Le",
      },
      {
        label: "Interview Invitation Email",
        content:
          "From: hiring@northstarcreative.example\nTo: bao.le@example.com\nSubject: Interview Invitation — Graphic Designer\n\nDear Mr. Le,\n\nThank you for your application. Your portfolio impressed our creative director, and we would like to invite you for an interview this Thursday at 2:00 p.m. at our downtown studio.\n\nPlease bring two printed samples of your recent work. If this time does not work for you, let us know and we will find an alternative.\n\nWe look forward to meeting you.\n\nBest,\nNorthstar Creative Agency",
      },
    ],
    questions: [
      {
        prompt: "What does the Graphic Designer position mainly involve?",
        options: ["Writing marketing copy", "Creating visual assets for campaigns", "Managing client accounts", "Editing video content"],
        correctIndex: 1,
        explanationVi: "Vị trí này chủ yếu thiết kế các ấn phẩm hình ảnh cho chiến dịch khách hàng.",
        evidenceText: "You'll create visual assets for client campaigns",
      },
      {
        prompt: "How much agency experience does the posting require?",
        options: ["Six months", "At least one year", "Three years", "Five years"],
        correctIndex: 1,
        explanationVi: "Yêu cầu tối thiểu một năm kinh nghiệm làm việc tại agency.",
        evidenceText: "at least one year of agency experience",
      },
      {
        prompt: "What project does Bao Le highlight in his portfolio?",
        options: ["A restaurant menu redesign", "A rebrand for a coffee chain", "A mobile app interface", "A company annual report"],
        correctIndex: 1,
        explanationVi: "Anh nêu bật dự án rebrand cho một chuỗi cà phê trong hồ sơ năng lực.",
        evidenceText: "a recent rebrand I completed for a regional coffee chain",
      },
      {
        prompt: "When is the interview scheduled?",
        options: ["Monday morning", "Wednesday afternoon", "Thursday at 2:00 p.m.", "Friday at noon"],
        correctIndex: 2,
        explanationVi: "Buổi phỏng vấn được sắp xếp vào thứ Năm lúc 2 giờ chiều.",
        evidenceText: "invite you for an interview this Thursday at 2:00 p.m.",
      },
      {
        prompt: "What is Mr. Le asked to bring to the interview?",
        options: ["A signed contract", "Two printed work samples", "A reference letter", "His resume only"],
        correctIndex: 1,
        explanationVi: "Anh được yêu cầu mang theo hai bản in mẫu công việc gần đây.",
        evidenceText: "Please bring two printed samples of your recent work",
      },
    ],
  },
  {
    title: "Company memo, employee email, and updated policy notice",
    format: "MEMO",
    layout: "TRIPLE",
    texts: [
      {
        label: "Memo",
        content:
          "TO: All Staff\nFROM: Operations Department\nRE: Proposed Remote Work Policy\n\nWe are considering a new policy that would allow eligible employees to work from home up to two days per week, starting next quarter. Before finalizing the details, we would like feedback from staff.\n\nPlease send any questions or concerns to operations@company.example by the end of this week. A final decision will be announced after reviewing all feedback.",
      },
      {
        label: "Employee Email",
        content:
          "From: c.pham@company.example\nTo: operations@company.example\nSubject: RE: Proposed Remote Work Policy\n\nHello,\n\nThank you for considering this policy. I have one concern: for team members who rely on in-person collaboration, such as our design team, will there be any guidelines on which days we should be in the office together?\n\nIt might help to designate at least one shared in-office day per team so we don't lose collaboration time.\n\nBest,\nChau Pham",
      },
      {
        label: "Updated Policy Notice",
        content:
          "FINAL POLICY: Flexible Remote Work\n\nThank you to everyone who shared feedback. Based on your input, the final policy will allow up to two remote days per week, with one requirement: each team must designate a shared in-office day so that collaborative work is not disrupted.\n\nTeam leads will confirm their team's shared day by the end of this month. The policy takes effect at the start of next quarter.",
      },
    ],
    questions: [
      {
        prompt: "What is the memo proposing?",
        options: ["A new vacation policy", "A remote work policy", "A change in office location", "A revised dress code"],
        correctIndex: 1,
        explanationVi: "Bản ghi nhớ đề xuất chính sách làm việc từ xa mới.",
        evidenceText: "We are considering a new policy that would allow eligible employees to work from home",
      },
      {
        prompt: "What concern does Chau Pham raise?",
        options: ["Salary changes", "A lack of guidance on in-office collaboration days", "Insufficient equipment for remote work", "Unclear approval process"],
        correctIndex: 1,
        explanationVi: "Chau lo ngại về việc thiếu hướng dẫn ngày làm việc chung tại văn phòng cho các nhóm cần hợp tác trực tiếp.",
        evidenceText: "will there be any guidelines on which days we should be in the office together",
      },
      {
        prompt: "What does Chau Pham suggest?",
        options: ["Canceling the policy", "Designating a shared in-office day per team", "Requiring five office days", "Allowing unlimited remote days"],
        correctIndex: 1,
        explanationVi: "Chau đề xuất mỗi nhóm chọn một ngày làm việc chung tại văn phòng.",
        evidenceText: "It might help to designate at least one shared in-office day per team",
      },
      {
        prompt: "How many remote days per week does the final policy allow?",
        options: ["One", "Two", "Three", "Five"],
        correctIndex: 1,
        explanationVi: "Chính sách cuối cùng cho phép tối đa hai ngày làm việc từ xa mỗi tuần.",
        evidenceText: "the final policy will allow up to two remote days per week",
      },
      {
        prompt: "Who is responsible for confirming each team's shared in-office day?",
        options: ["The operations department", "Team leads", "Human resources", "Each individual employee"],
        correctIndex: 1,
        explanationVi: "Trưởng nhóm sẽ xác nhận ngày làm việc chung tại văn phòng cho nhóm mình.",
        evidenceText: "Team leads will confirm their team's shared day",
      },
    ],
  },
];
