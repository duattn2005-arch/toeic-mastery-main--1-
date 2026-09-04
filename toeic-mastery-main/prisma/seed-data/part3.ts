export interface SeedListeningQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanationVi: string;
}

export interface SeedConversation {
  title: string;
  transcript: string;
  questions: SeedListeningQuestion[];
}

export const PART3_CONVERSATIONS: SeedConversation[] = [
  {
    title: "Scheduling a client meeting",
    transcript:
      "W: Hi, do you have time to review the Anderson proposal before our call with the client tomorrow?\nM: I can look at it this afternoon. What time is the call scheduled for?\nW: It's at 2 p.m. Could you send me your comments by noon so I can update the slides?\nM: Sure, I'll email you my notes by 11:30.",
    questions: [
      { prompt: "What are the speakers mainly discussing?", options: ["A budget report", "A client proposal", "A hiring decision", "An office move"], correctIndex: 1, explanationVi: "Hai người đang bàn về việc xem lại đề xuất cho khách hàng Anderson." },
      { prompt: "What time is the call with the client?", options: ["11:30", "12:00", "2:00", "3:00"], correctIndex: 2, explanationVi: "Cuộc gọi được lên lịch lúc 2 giờ chiều." },
      { prompt: "What does the woman ask the man to do?", options: ["Reschedule the call", "Send comments by noon", "Print the slides", "Call the client directly"], correctIndex: 1, explanationVi: "Người phụ nữ yêu cầu gửi nhận xét trước giờ trưa để cập nhật slide." },
    ],
  },
  {
    title: "Ordering office supplies",
    transcript:
      "M: We're almost out of printer paper again. Can you place an order today?\nW: I already ordered some last week, but the supplier said there's a delay due to high demand.\nM: That's not good — we need it before Thursday's presentation. Is there another supplier we could try?\nW: I'll check with the one we used last year and get back to you this afternoon.",
    questions: [
      { prompt: "What problem are the speakers discussing?", options: ["A printer malfunction", "A delayed supply order", "A canceled presentation", "A billing error"], correctIndex: 1, explanationVi: "Đơn hàng giấy in bị chậm do nhu cầu cao." },
      { prompt: "Why does the man want the paper soon?", options: ["For a client visit", "For a presentation on Thursday", "For a training session", "For an inventory check"], correctIndex: 1, explanationVi: "Cần giấy trước buổi thuyết trình vào thứ Năm." },
      { prompt: "What will the woman do next?", options: ["Cancel the order", "Contact a different supplier", "Ask for a refund", "Wait until next week"], correctIndex: 1, explanationVi: "Cô ấy sẽ liên hệ nhà cung cấp đã dùng năm ngoái." },
    ],
  },
  {
    title: "Discussing a flight itinerary",
    transcript:
      "W: I just booked your flight to the Singapore conference. You'll depart Monday morning and return Thursday evening.\nM: Great, thanks. Did you also book the hotel near the convention center?\nW: Yes, you're staying at the Riverside Hotel, just a ten-minute walk from the venue.\nM: Perfect. Could you send me the confirmation numbers before I leave today?",
    questions: [
      { prompt: "What is the man preparing for?", options: ["A vacation", "A business conference", "A job interview", "A training course"], correctIndex: 1, explanationVi: "Ông ấy chuẩn bị đi dự hội nghị ở Singapore." },
      { prompt: "Where is the hotel located?", options: ["Near the airport", "Near the convention center", "In the city center", "Near the train station"], correctIndex: 1, explanationVi: "Khách sạn Riverside cách địa điểm hội nghị 10 phút đi bộ." },
      { prompt: "What does the man ask the woman to do?", options: ["Cancel the hotel booking", "Send confirmation numbers", "Extend his trip", "Book a rental car"], correctIndex: 1, explanationVi: "Ông ấy yêu cầu gửi mã xác nhận trước khi rời văn phòng." },
    ],
  },
  {
    title: "Handling a customer complaint",
    transcript:
      "M: A customer just called saying the chair she ordered arrived damaged.\nW: Oh no. Did she provide an order number?\nM: Yes, I have it here. She'd like a replacement sent as soon as possible.\nW: I'll process the replacement order right now and arrange for the damaged item to be picked up.",
    questions: [
      { prompt: "What is the customer's problem?", options: ["A late delivery", "A damaged product", "A billing mistake", "A missing item"], correctIndex: 1, explanationVi: "Khách hàng nhận được ghế bị hư hỏng." },
      { prompt: "What does the customer want?", options: ["A refund", "A replacement", "A discount", "An apology letter"], correctIndex: 1, explanationVi: "Khách hàng muốn được gửi sản phẩm thay thế." },
      { prompt: "What will the woman do next?", options: ["Call the customer back", "Process a replacement order", "Cancel the order", "File a complaint report"], correctIndex: 1, explanationVi: "Cô ấy sẽ xử lý đơn hàng thay thế ngay lập tức." },
    ],
  },
  {
    title: "Planning a team lunch",
    transcript:
      "W: Should we book the Italian restaurant for the team lunch next Friday?\nM: I think so, but let's confirm how many people are coming first.\nW: I'll send out a quick survey today and close it by Wednesday.\nM: Sounds good. Let me know the final number so I can make the reservation.",
    questions: [
      { prompt: "What are the speakers planning?", options: ["A client dinner", "A team lunch", "A company retreat", "A product launch"], correctIndex: 1, explanationVi: "Họ đang lên kế hoạch cho bữa trưa của nhóm." },
      { prompt: "What will the woman send out today?", options: ["An invitation", "A survey", "A menu", "A budget report"], correctIndex: 1, explanationVi: "Cô ấy sẽ gửi một khảo sát nhanh hôm nay." },
      { prompt: "What does the man offer to do?", options: ["Pay for the meal", "Make the reservation", "Design the menu", "Drive everyone there"], correctIndex: 1, explanationVi: "Ông ấy sẽ đặt bàn khi biết số lượng người tham gia cuối cùng." },
    ],
  },
  {
    title: "Discussing a software issue",
    transcript:
      "M: The inventory system keeps crashing every time I try to generate a report.\nW: I've noticed the same thing since yesterday's update. I already reported it to IT.\nM: Did they say when it would be fixed?\nW: They estimated it would be resolved by tomorrow morning, but they suggested using the backup system in the meantime.",
    questions: [
      { prompt: "What problem is being discussed?", options: ["A printer error", "A software crash", "A network outage", "A billing issue"], correctIndex: 1, explanationVi: "Hệ thống quản lý kho bị lỗi liên tục khi tạo báo cáo." },
      { prompt: "When did the problem start?", options: ["This morning", "Since yesterday's update", "Last week", "Two days ago"], correctIndex: 1, explanationVi: "Vấn đề bắt đầu từ sau bản cập nhật hôm qua." },
      { prompt: "What does the woman suggest doing in the meantime?", options: ["Contacting a different department", "Using the backup system", "Waiting until next week", "Restarting the computer"], correctIndex: 1, explanationVi: "Cô ấy đề xuất dùng hệ thống dự phòng trong lúc chờ sửa." },
    ],
  },
  {
    title: "Reviewing a marketing budget",
    transcript:
      "W: I looked over the marketing budget, and we're actually under our projected spending for this quarter.\nM: That's good news. Do you think we could allocate the extra funds to social media ads?\nW: Possibly. Let's discuss it with the director before making a final decision.\nM: Agreed. I'll set up a meeting for Thursday.",
    questions: [
      { prompt: "What did the woman find when reviewing the budget?", options: ["Overspending", "Under budget spending", "A missing report", "An accounting error"], correctIndex: 1, explanationVi: "Chi tiêu quý này thấp hơn dự kiến." },
      { prompt: "What does the man propose?", options: ["Cutting the marketing budget", "Allocating extra funds to social media ads", "Hiring a new marketing manager", "Canceling the ad campaign"], correctIndex: 1, explanationVi: "Ông ấy đề xuất dùng phần dư ngân sách cho quảng cáo mạng xã hội." },
      { prompt: "What will happen next?", options: ["The budget will be cut", "A meeting will be arranged", "The campaign will launch immediately", "The director will be replaced"], correctIndex: 1, explanationVi: "Họ sẽ sắp xếp một cuộc họp vào thứ Năm để thảo luận thêm." },
    ],
  },
  {
    title: "Coordinating a warehouse shipment",
    transcript:
      "M: The truck from the warehouse should arrive by 10, but traffic is heavier than usual today.\nW: Should we notify the receiving team about a possible delay?\nM: Good idea. I'll call them now so they can adjust their schedule.\nW: Thanks. I'll also update the tracking system once the truck departs.",
    questions: [
      { prompt: "What might cause a delay?", options: ["Bad weather", "Heavy traffic", "A staff shortage", "A mechanical issue"], correctIndex: 1, explanationVi: "Giao thông đông đúc hơn bình thường có thể gây trễ." },
      { prompt: "What does the man decide to do?", options: ["Reschedule the delivery", "Call the receiving team", "Cancel the shipment", "Drive the truck himself"], correctIndex: 1, explanationVi: "Ông ấy sẽ gọi cho đội nhận hàng để thông báo." },
      { prompt: "What will the woman update?", options: ["The delivery invoice", "The tracking system", "The staff schedule", "The warehouse inventory"], correctIndex: 1, explanationVi: "Cô ấy sẽ cập nhật hệ thống theo dõi khi xe khởi hành." },
    ],
  },
  {
    title: "Discussing a job candidate",
    transcript:
      "W: What did you think of the candidate we interviewed this morning?\nM: She had strong experience in project management, but I'm not sure about her availability.\nW: Right, she mentioned she could only start in two months.\nM: Let's discuss it with HR to see if we can wait that long before making an offer.",
    questions: [
      { prompt: "What is the man unsure about?", options: ["The candidate's skills", "The candidate's availability", "The candidate's salary expectations", "The candidate's education"], correctIndex: 1, explanationVi: "Ông ấy không chắc về thời gian bắt đầu làm việc của ứng viên." },
      { prompt: "When can the candidate start?", options: ["Immediately", "Next week", "In two months", "Next year"], correctIndex: 2, explanationVi: "Ứng viên chỉ có thể bắt đầu sau hai tháng." },
      { prompt: "What will the speakers do next?", options: ["Reject the candidate", "Discuss with HR", "Offer a lower position", "Extend the interview process"], correctIndex: 1, explanationVi: "Họ sẽ trao đổi với phòng nhân sự trước khi quyết định." },
    ],
  },
  {
    title: "Setting up a video call",
    transcript:
      "M: Can you help me set up the video call with the Tokyo office? I'm not sure which platform they use.\nW: They usually prefer the same conferencing software we use, so it should be simple.\nM: Great. Could you also check the time difference so we schedule it at a reasonable hour for them?\nW: Sure, I'll send you a suggested time within the hour.",
    questions: [
      { prompt: "What does the man need help with?", options: ["Booking a flight", "Setting up a video call", "Translating a document", "Preparing a presentation"], correctIndex: 1, explanationVi: "Ông ấy cần giúp thiết lập cuộc gọi video với văn phòng Tokyo." },
      { prompt: "What does the woman say about the software?", options: ["It needs to be purchased", "It is the same one they already use", "It is not compatible", "It requires an upgrade"], correctIndex: 1, explanationVi: "Văn phòng Tokyo thường dùng cùng phần mềm hội nghị." },
      { prompt: "What will the woman check?", options: ["The meeting agenda", "The time difference", "The attendee list", "The internet connection"], correctIndex: 1, explanationVi: "Cô ấy sẽ kiểm tra chênh lệch múi giờ để chọn giờ hợp lý." },
    ],
  },
  {
    title: "Renewing an office lease",
    transcript:
      "W: The landlord sent over the renewal terms for our office lease. Rent is going up by about eight percent.\nM: That's higher than I expected. Do we have room to negotiate?\nW: I think so — we've been reliable tenants for five years. I'll ask if they can freeze it for one more year.\nM: Good idea. Let me know what they say by Friday so I can update the budget.",
    questions: [
      { prompt: "What are the speakers discussing?", options: ["A hiring freeze", "An office lease renewal", "A moving date", "A parking dispute"], correctIndex: 1, explanationVi: "Hai người đang bàn về điều khoản gia hạn hợp đồng thuê văn phòng." },
      { prompt: "What does the woman plan to do?", options: ["Sign the lease immediately", "Negotiate a lower increase", "Look for a new office", "Cancel the lease"], correctIndex: 1, explanationVi: "Cô ấy sẽ đề nghị chủ nhà giữ nguyên giá thêm một năm." },
      { prompt: "What does the man want to know by Friday?", options: ["The new address", "The outcome of the negotiation", "The moving schedule", "The number of tenants"], correctIndex: 1, explanationVi: "Ông ấy cần biết kết quả đàm phán để cập nhật ngân sách." },
    ],
  },
  {
    title: "Preparing for a product demo",
    transcript:
      "M: Are we all set for the product demo with the investors tomorrow?\nW: Almost. I still need to test the new prototype one more time tonight.\nM: Let me know if you need help. Also, did the marketing team finish the handouts?\nW: Yes, they dropped off two hundred copies at my desk this morning.",
    questions: [
      { prompt: "What are the speakers preparing for?", options: ["A job interview", "A product demo", "A store opening", "A training session"], correctIndex: 1, explanationVi: "Họ đang chuẩn bị cho buổi trình diễn sản phẩm với nhà đầu tư." },
      { prompt: "What does the woman still need to do?", options: ["Print more handouts", "Test the prototype again", "Book a meeting room", "Confirm the guest list"], correctIndex: 1, explanationVi: "Cô ấy cần kiểm tra lại nguyên mẫu sản phẩm một lần nữa." },
      { prompt: "What did the marketing team deliver?", options: ["A new prototype", "Two hundred handouts", "A revised budget", "Name tags for guests"], correctIndex: 1, explanationVi: "Đội marketing đã giao hai trăm bản tài liệu phát tay." },
    ],
  },
  {
    title: "Discussing an employee survey",
    transcript:
      "W: The results from the employee satisfaction survey just came in. Overall scores improved compared to last year.\nM: That's encouraging. Which area showed the biggest improvement?\nW: Work-life balance, actually. A lot of people mentioned they appreciate the flexible schedule.\nM: Let's highlight that in the next newsletter to keep up the momentum.",
    questions: [
      { prompt: "What is the woman reporting on?", options: ["A sales report", "An employee satisfaction survey", "A budget review", "A customer complaint"], correctIndex: 1, explanationVi: "Cô ấy đang báo cáo kết quả khảo sát mức độ hài lòng của nhân viên." },
      { prompt: "Which area improved the most?", options: ["Salary", "Work-life balance", "Office location", "Training programs"], correctIndex: 1, explanationVi: "Cân bằng công việc - cuộc sống có cải thiện nhiều nhất nhờ lịch làm việc linh hoạt." },
      { prompt: "What does the man suggest doing?", options: ["Conducting another survey", "Featuring the results in a newsletter", "Reducing flexible hours", "Interviewing employees again"], correctIndex: 1, explanationVi: "Ông ấy đề xuất nêu bật kết quả này trong bản tin nội bộ tiếp theo." },
    ],
  },
];
