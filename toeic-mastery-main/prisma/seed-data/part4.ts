import type { SeedListeningQuestion } from "./part3";

export interface SeedTalk {
  title: string;
  transcript: string;
  questions: SeedListeningQuestion[];
}

export const PART4_TALKS: SeedTalk[] = [
  {
    title: "Store announcement — Closing time change",
    transcript:
      "Attention shoppers. Please note that starting this weekend, our store hours will be extended. We will now be open until 10 p.m. on Fridays and Saturdays to better serve our customers during the holiday season. All other store hours remain the same. Thank you for shopping with us, and we look forward to seeing you this weekend.",
    questions: [
      { prompt: "What is the announcement mainly about?", options: ["A price change", "Extended store hours", "A new store location", "A staff shortage"], correctIndex: 1, explanationVi: "Thông báo về việc kéo dài giờ mở cửa cuối tuần." },
      { prompt: "On which days will the store close later?", options: ["Monday and Tuesday", "Fridays and Saturdays", "Sundays only", "Every day"], correctIndex: 1, explanationVi: "Giờ đóng cửa muộn hơn áp dụng vào thứ Sáu và thứ Bảy." },
      { prompt: "Why is the store extending its hours?", options: ["Due to renovation", "For the holiday season", "Because of a special event", "Due to a staff increase"], correctIndex: 1, explanationVi: "Nhằm phục vụ khách hàng tốt hơn trong mùa lễ hội." },
    ],
  },
  {
    title: "Voicemail — Rescheduling a delivery",
    transcript:
      "Hi, this message is for Mr. Tran. This is Lan calling from Express Logistics regarding your delivery scheduled for tomorrow morning. Unfortunately, our driver reported a vehicle issue, so we need to reschedule your delivery to tomorrow afternoon, between 2 and 5 p.m. We apologize for any inconvenience. If this new time does not work for you, please call us back at 555-0142 to arrange another option.",
    questions: [
      { prompt: "Why is Lan calling?", options: ["To confirm an order", "To reschedule a delivery", "To offer a discount", "To request payment"], correctIndex: 1, explanationVi: "Lan gọi để dời lịch giao hàng." },
      { prompt: "Why was the delivery rescheduled?", options: ["Bad weather", "A vehicle issue", "An address error", "A staffing shortage"], correctIndex: 1, explanationVi: "Do tài xế gặp sự cố xe." },
      { prompt: "What should Mr. Tran do if the new time is inconvenient?", options: ["Cancel the order", "Visit the store", "Call back at 555-0142", "Wait for another message"], correctIndex: 2, explanationVi: "Ông Tran nên gọi lại số 555-0142 để sắp xếp thời gian khác." },
    ],
  },
  {
    title: "Radio advertisement — Fitness center promotion",
    transcript:
      "Looking for a new way to stay active this year? PowerFit Gym is now offering a special membership deal — sign up before the end of the month and receive your first three months at half price. Our facility includes modern equipment, group classes, and a swimming pool. Visit our website or stop by our downtown location to learn more and claim this limited-time offer.",
    questions: [
      { prompt: "What is being advertised?", options: ["A restaurant", "A gym membership deal", "A clothing store", "A travel package"], correctIndex: 1, explanationVi: "Quảng cáo về ưu đãi thành viên phòng gym PowerFit." },
      { prompt: "What is the special offer?", options: ["A free trial week", "Half price for three months", "A free gift", "Unlimited classes for life"], correctIndex: 1, explanationVi: "Ba tháng đầu được giảm nửa giá." },
      { prompt: "What must customers do to receive the offer?", options: ["Refer a friend", "Sign up before the end of the month", "Pay a full year in advance", "Attend a free class first"], correctIndex: 1, explanationVi: "Cần đăng ký trước cuối tháng để nhận ưu đãi." },
    ],
  },
  {
    title: "Company announcement — New parking policy",
    transcript:
      "Good morning, everyone. I'd like to remind all staff about the new parking policy that takes effect next Monday. Employees will now need to display a parking permit on their dashboard at all times. Permits can be picked up at the front desk starting tomorrow. Vehicles without a visible permit may be subject to towing. If you have any questions, please reach out to the facilities office.",
    questions: [
      { prompt: "What is the announcement about?", options: ["A new parking policy", "A office renovation", "A change in work hours", "A new dress code"], correctIndex: 0, explanationVi: "Thông báo về chính sách đỗ xe mới." },
      { prompt: "When does the new policy take effect?", options: ["Immediately", "Next Monday", "At the end of the month", "Next year"], correctIndex: 1, explanationVi: "Chính sách có hiệu lực từ thứ Hai tuần sau." },
      { prompt: "What might happen to vehicles without a permit?", options: ["A warning notice", "A parking fine", "Towing", "Nothing"], correctIndex: 2, explanationVi: "Xe không có thẻ đỗ hợp lệ có thể bị kéo đi." },
    ],
  },
  {
    title: "Airport announcement — Flight delay",
    transcript:
      "May I have your attention, please. Flight 228 to Da Nang has been delayed due to a technical inspection. The new estimated departure time is 3:45 p.m. We apologize for the inconvenience. Passengers are welcome to use their meal vouchers at any restaurant in the terminal. We will provide another update in thirty minutes.",
    questions: [
      { prompt: "Why has the flight been delayed?", options: ["Bad weather", "A technical inspection", "A staffing issue", "A security alert"], correctIndex: 1, explanationVi: "Chuyến bay bị trễ do kiểm tra kỹ thuật." },
      { prompt: "What is the new departure time?", options: ["2:45 p.m.", "3:15 p.m.", "3:45 p.m.", "4:45 p.m."], correctIndex: 2, explanationVi: "Giờ khởi hành mới dự kiến là 3:45 chiều." },
      { prompt: "What can passengers do while waiting?", options: ["Board an earlier flight", "Use meal vouchers at the terminal", "Receive a refund", "Change their seats for free"], correctIndex: 1, explanationVi: "Hành khách có thể dùng phiếu ăn tại nhà hàng trong sân bay." },
    ],
  },
  {
    title: "Museum tour introduction",
    transcript:
      "Welcome, everyone, to the City History Museum. My name is Hoa, and I'll be your guide for today's one-hour tour. We'll begin on the first floor with exhibits from the early trading era, then move upstairs to the modern history section. Please feel free to take photos, but flash photography is not permitted near the older artifacts. If you have any questions along the way, just raise your hand.",
    questions: [
      { prompt: "How long will the tour last?", options: ["Thirty minutes", "One hour", "Two hours", "All day"], correctIndex: 1, explanationVi: "Chuyến tham quan kéo dài một giờ." },
      { prompt: "Where will the tour begin?", options: ["On the first floor", "In the gift shop", "On the rooftop", "In the parking lot"], correctIndex: 0, explanationVi: "Chuyến tham quan bắt đầu ở tầng một với khu trưng bày thời kỳ giao thương." },
      { prompt: "What are visitors asked not to do?", options: ["Take any photos", "Touch the exhibits", "Use flash photography near old artifacts", "Bring bags into the museum"], correctIndex: 2, explanationVi: "Không được sử dụng đèn flash gần các hiện vật cổ." },
    ],
  },
  {
    title: "Internal briefing — IT system upgrade",
    transcript:
      "Good afternoon, team. I want to give you a quick update on the IT system upgrade planned for this weekend. All servers will be offline from Saturday 10 p.m. to Sunday 6 a.m. for the migration. Please save and back up any important files before you leave on Friday. If you experience any issues Monday morning, contact the help desk immediately rather than trying to fix it yourself.",
    questions: [
      { prompt: "What is the purpose of this briefing?", options: ["To announce a new hire", "To explain an IT system upgrade", "To discuss a budget cut", "To introduce a new client"], correctIndex: 1, explanationVi: "Buổi họp thông báo về việc nâng cấp hệ thống IT." },
      { prompt: "When will the servers be offline?", options: ["Friday to Saturday", "Saturday 10 p.m. to Sunday 6 a.m.", "All weekend", "Monday morning only"], correctIndex: 1, explanationVi: "Máy chủ sẽ ngừng hoạt động từ 10 giờ tối thứ Bảy đến 6 giờ sáng Chủ Nhật." },
      { prompt: "What should employees do before Friday ends?", options: ["Shut down their computers", "Back up important files", "Submit a maintenance request", "Update their passwords"], correctIndex: 1, explanationVi: "Nhân viên nên sao lưu các tệp quan trọng trước khi rời văn phòng thứ Sáu." },
    ],
  },
  {
    title: "Podcast introduction — Career advice episode",
    transcript:
      "Welcome back to Career Talk. In today's episode, we'll be speaking with a hiring manager about the most common mistakes candidates make during interviews. Before we get started, I want to remind listeners that you can find full transcripts of every episode on our website. Now, let's welcome our guest and dive right into the discussion.",
    questions: [
      { prompt: "What is the topic of today's episode?", options: ["Starting a business", "Common interview mistakes", "Remote work trends", "Salary negotiation"], correctIndex: 1, explanationVi: "Chủ đề tập podcast là những sai lầm phổ biến khi phỏng vấn." },
      { prompt: "Who will the host be speaking with?", options: ["A career coach", "A hiring manager", "A company CEO", "A university professor"], correctIndex: 1, explanationVi: "Khách mời là một nhà quản lý tuyển dụng." },
      { prompt: "Where can listeners find full transcripts?", options: ["In a monthly newsletter", "On the podcast's website", "By email request", "In a printed booklet"], correctIndex: 1, explanationVi: "Bản ghi đầy đủ được đăng trên trang web của podcast." },
    ],
  },
  {
    title: "Factory safety briefing",
    transcript:
      "Before we begin the shift, I want to review one important safety update. Starting today, all visitors to the production floor must wear both a hard hat and safety goggles at all times, not just near the machinery. This change follows a recent inspection recommendation. Supervisors will have extra sets of goggles available at each entrance. Thank you for your cooperation in keeping our facility safe.",
    questions: [
      { prompt: "What is the safety update about?", options: ["New fire exits", "Required goggles for all visitors", "A change in shift hours", "New machine operating rules"], correctIndex: 1, explanationVi: "Cập nhật yêu cầu tất cả khách tham quan phải đeo kính bảo hộ." },
      { prompt: "Why was this change made?", options: ["A recent accident", "An inspection recommendation", "A new government law", "Employee feedback"], correctIndex: 1, explanationVi: "Thay đổi này dựa theo khuyến nghị từ một đợt kiểm tra gần đây." },
      { prompt: "Where can visitors get safety goggles?", options: ["From the front office", "At each entrance", "From their supervisor's desk", "They must bring their own"], correctIndex: 1, explanationVi: "Kính bảo hộ được cung cấp thêm tại mỗi lối vào." },
    ],
  },
  {
    title: "Restaurant reservation confirmation call",
    transcript:
      "Hello, this is a message for Ms. Vo confirming your reservation for six people this Saturday at 7 p.m. at Lotus Garden Restaurant. Please note that we do require a credit card to hold reservations for parties of six or more. If your plans change, kindly call us at least two hours in advance to avoid a cancellation fee. We look forward to serving you.",
    questions: [
      { prompt: "What is the purpose of this call?", options: ["To cancel a reservation", "To confirm a reservation", "To offer a discount", "To request a review"], correctIndex: 1, explanationVi: "Cuộc gọi nhằm xác nhận đặt bàn cho Ms. Vo." },
      { prompt: "What is required for parties of six or more?", options: ["A deposit in cash", "A credit card on file", "A signed contract", "A phone confirmation only"], correctIndex: 1, explanationVi: "Cần có thẻ tín dụng để giữ chỗ cho nhóm từ sáu người trở lên." },
      { prompt: "What should Ms. Vo do if her plans change?", options: ["Arrive earlier instead", "Call at least two hours in advance", "Email the restaurant", "Nothing is required"], correctIndex: 1, explanationVi: "Cô nên gọi trước ít nhất hai giờ để tránh phí hủy." },
    ],
  },
];
