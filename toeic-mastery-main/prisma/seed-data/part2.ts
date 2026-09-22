export interface SeedPart2Question {
  question: string;
  responses: string[]; // exactly 3 (A, B, C)
  correctIndex: number;
  explanationVi: string;
}

export const PART2_QUESTIONS: SeedPart2Question[] = [
  {
    question: "When does the quarterly report need to be submitted?",
    responses: ["By the end of this week.", "In the top drawer.", "Yes, I submitted it."],
    correctIndex: 0,
    explanationVi: "Câu hỏi 'When' cần câu trả lời về thời gian: 'By the end of this week.'",
  },
  {
    question: "Who is going to lead the training session tomorrow?",
    responses: ["It starts at 9 a.m.", "Mr. Nguyen from HR will.", "It was very helpful."],
    correctIndex: 1,
    explanationVi: "Câu hỏi 'Who' cần câu trả lời chỉ người: 'Mr. Nguyen from HR will.'",
  },
  {
    question: "Could you send me the updated client list?",
    responses: ["Sure, I'll do it right away.", "I bought it yesterday.", "The client called this morning."],
    correctIndex: 0,
    explanationVi: "Đây là lời yêu cầu; phản hồi phù hợp là đồng ý thực hiện: 'Sure, I'll do it right away.'",
  },
  {
    question: "Where should we hold the annual company dinner?",
    responses: ["Around 200 people attended.", "At the Riverside Hotel, probably.", "It was rescheduled to March."],
    correctIndex: 1,
    explanationVi: "Câu hỏi 'Where' cần câu trả lời về địa điểm: 'At the Riverside Hotel, probably.'",
  },
  {
    question: "Isn't the marketing budget due for review this month?",
    responses: ["Yes, it's on the agenda for Friday.", "No, I haven't met him.", "It's on the second shelf."],
    correctIndex: 0,
    explanationVi: "Câu hỏi phủ định xác nhận; phản hồi hợp lý là xác nhận đúng: 'Yes, it's on the agenda for Friday.'",
  },
  {
    question: "How long will the system maintenance take?",
    responses: ["About two hours.", "I completely agree.", "Next to the elevator."],
    correctIndex: 0,
    explanationVi: "Câu hỏi 'How long' cần câu trả lời về khoảng thời gian: 'About two hours.'",
  },
  {
    question: "Would you prefer to meet in person or over the phone?",
    responses: ["I'd rather meet in person, if possible.", "She works in accounting.", "The meeting was canceled."],
    correctIndex: 0,
    explanationVi: "Câu hỏi lựa chọn cần câu trả lời chọn một trong hai phương án đã nêu.",
  },
  {
    question: "Why was the shipment delayed this time?",
    responses: ["It arrives every Tuesday.", "Because of a customs inspection.", "The warehouse is nearby."],
    correctIndex: 1,
    explanationVi: "Câu hỏi 'Why' cần câu trả lời nêu lý do: 'Because of a customs inspection.'",
  },
  {
    question: "Do you know who approved this purchase order?",
    responses: ["It costs about $500.", "I believe it was the finance director.", "It arrived last week."],
    correctIndex: 1,
    explanationVi: "Câu hỏi gián tiếp hỏi về người; câu trả lời phù hợp nêu tên/chức danh người đó.",
  },
  {
    question: "The new hires start on Monday, don't they?",
    responses: ["Yes, all five of them.", "No, I haven't seen it.", "It's a great location."],
    correctIndex: 0,
    explanationVi: "Câu hỏi đuôi xác nhận; phản hồi hợp lý xác nhận thông tin: 'Yes, all five of them.'",
  },
  {
    question: "What time does the shuttle bus leave for the airport?",
    responses: ["Every thirty minutes.", "It's a comfortable ride.", "At six thirty sharp."],
    correctIndex: 2,
    explanationVi: "Câu hỏi 'What time' cần câu trả lời chỉ thời điểm cụ thể: 'At six thirty sharp.'",
  },
  {
    question: "Which printer should I use for the color brochures?",
    responses: ["The one on the third floor.", "I printed it twice.", "Yes, that's correct."],
    correctIndex: 0,
    explanationVi: "Câu hỏi 'Which' cần câu trả lời chỉ rõ đối tượng được chọn: 'The one on the third floor.'",
  },
  {
    question: "Haven't you finished the inventory count yet?",
    responses: ["Almost — just one more shelf to go.", "It's in the storage room.", "About two hundred units."],
    correctIndex: 0,
    explanationVi: "Câu hỏi phủ định hỏi về tiến độ; phản hồi hợp lý cập nhật tình trạng công việc.",
  },
  {
    question: "Would you like your receipt printed or emailed?",
    responses: ["Emailed is fine, thanks.", "I paid by credit card.", "The total was $42."],
    correctIndex: 0,
    explanationVi: "Câu hỏi lựa chọn cần câu trả lời chọn một trong hai phương án: 'Emailed is fine, thanks.'",
  },
  {
    question: "How much does it cost to upgrade our software license?",
    responses: ["It depends on the number of users.", "We upgraded last spring.", "The office is upstairs."],
    correctIndex: 0,
    explanationVi: "Câu hỏi 'How much' cần câu trả lời liên quan đến chi phí: 'It depends on the number of users.'",
  },
  {
    question: "Isn't Mr. Pham supposed to lead today's orientation?",
    responses: ["Yes, but he's running a bit late.", "No, I haven't met him.", "It's down the hall."],
    correctIndex: 0,
    explanationVi: "Câu hỏi phủ định xác nhận; phản hồi hợp lý xác nhận và bổ sung thông tin.",
  },
  {
    question: "Where did you leave the conference materials?",
    responses: ["On the table by the entrance.", "Around fifty copies.", "Yesterday afternoon."],
    correctIndex: 0,
    explanationVi: "Câu hỏi 'Where' cần câu trả lời chỉ vị trí: 'On the table by the entrance.'",
  },
  {
    question: "Do you want to grab lunch before or after the meeting?",
    responses: ["Let's go after, if that's okay.", "I already had breakfast.", "The meeting room is booked."],
    correctIndex: 0,
    explanationVi: "Câu hỏi lựa chọn cần câu trả lời chọn 'before' hoặc 'after': 'Let's go after, if that's okay.'",
  },
  {
    question: "Who's responsible for updating the company website?",
    responses: ["The IT department handles that.", "It was updated last week.", "It looks great now."],
    correctIndex: 0,
    explanationVi: "Câu hỏi 'Who' cần câu trả lời chỉ người/bộ phận: 'The IT department handles that.'",
  },
  {
    question: "Could you turn down the air conditioning a bit?",
    responses: ["Sure, no problem.", "It's quite warm today.", "I'll check the thermostat manual."],
    correctIndex: 0,
    explanationVi: "Đây là lời yêu cầu; phản hồi phù hợp là đồng ý thực hiện: 'Sure, no problem.'",
  },
  {
    question: "Why hasn't the invoice been sent to the client yet?",
    responses: ["We're still waiting on final approval.", "It arrived this morning.", "The client called yesterday."],
    correctIndex: 0,
    explanationVi: "Câu hỏi 'Why' cần câu trả lời nêu lý do: 'We're still waiting on final approval.'",
  },
  {
    question: "The training materials are ready for tomorrow, aren't they?",
    responses: ["Yes, I printed them this morning.", "No, I haven't seen him.", "It starts at nine."],
    correctIndex: 0,
    explanationVi: "Câu hỏi đuôi xác nhận; phản hồi hợp lý xác nhận thông tin: 'Yes, I printed them this morning.'",
  },
  {
    question: "How often does the maintenance team inspect the elevators?",
    responses: ["Once a month, I believe.", "They're very reliable.", "The elevator is on the left."],
    correctIndex: 0,
    explanationVi: "Câu hỏi 'How often' cần câu trả lời về tần suất: 'Once a month, I believe.'",
  },
  {
    question: "Should we postpone the product launch until next quarter?",
    responses: ["I think that's a wise decision.", "We launched it in May.", "The product sold out quickly."],
    correctIndex: 0,
    explanationVi: "Câu hỏi đề nghị ý kiến; phản hồi hợp lý bày tỏ sự đồng ý: 'I think that's a wise decision.'",
  },
  {
    question: "Do you have a preference for the meeting venue, or should I decide?",
    responses: ["Go ahead and pick whatever works.", "It lasted about an hour.", "I attended last year's event."],
    correctIndex: 0,
    explanationVi: "Câu hỏi lựa chọn; phản hồi hợp lý giao quyền quyết định lại cho người hỏi: 'Go ahead and pick whatever works.'",
  },
  {
    question: "When is the deadline for the grant application?",
    responses: ["By the end of next month.", "In the conference room.", "I already applied."],
    correctIndex: 0,
    explanationVi: "Câu hỏi 'When' cần câu trả lời về thời gian: 'By the end of next month.'",
  },
  {
    question: "Who's covering the front desk while Mai is on leave?",
    responses: ["It's a temporary position.", "Duc from the mailroom is.", "She'll be back Monday."],
    correctIndex: 1,
    explanationVi: "Câu hỏi 'Who' cần câu trả lời chỉ người: 'Duc from the mailroom is.'",
  },
  {
    question: "Could you proofread this press release before it goes out?",
    responses: ["Sure, send it over.", "I read the news yesterday.", "It was released last week."],
    correctIndex: 0,
    explanationVi: "Đây là lời yêu cầu; phản hồi phù hợp là đồng ý thực hiện: 'Sure, send it over.'",
  },
  {
    question: "Isn't the elevator supposed to be fixed by now?",
    responses: ["Yes, but the technician is running late.", "No, I haven't met her.", "It's on the fifth floor."],
    correctIndex: 0,
    explanationVi: "Câu hỏi phủ định xác nhận; phản hồi hợp lý xác nhận và giải thích thêm.",
  },
  {
    question: "How many attendees are we expecting at the seminar?",
    responses: ["It starts at nine.", "Around 150, based on registrations.", "The seminar was informative."],
    correctIndex: 1,
    explanationVi: "Câu hỏi 'How many' cần câu trả lời về số lượng: 'Around 150, based on registrations.'",
  },
  {
    question: "Would you rather take the train or drive to the client meeting?",
    responses: ["The train is usually faster.", "The meeting went well.", "I met the client last year."],
    correctIndex: 0,
    explanationVi: "Câu hỏi lựa chọn cần câu trả lời chọn một trong hai phương án: 'The train is usually faster.'",
  },
  {
    question: "Why did the vendor cancel our order?",
    responses: ["They ran out of stock.", "The order arrives Tuesday.", "It costs $300."],
    correctIndex: 0,
    explanationVi: "Câu hỏi 'Why' cần câu trả lời nêu lý do: 'They ran out of stock.'",
  },
  {
    question: "Do you know where the extra chairs are kept?",
    responses: ["In the storage closet down the hall.", "About twenty of them.", "They were delivered yesterday."],
    correctIndex: 0,
    explanationVi: "Câu hỏi gián tiếp hỏi về vị trí; câu trả lời phù hợp nêu địa điểm cụ thể.",
  },
  {
    question: "The quarterly figures look promising, don't they?",
    responses: ["Yes, much better than last quarter.", "No, I haven't seen him.", "They're due next Friday."],
    correctIndex: 0,
    explanationVi: "Câu hỏi đuôi xác nhận; phản hồi hợp lý xác nhận thông tin: 'Yes, much better than last quarter.'",
  },
  {
    question: "What's the best way to reach the IT support team?",
    responses: ["They're very responsive.", "Just submit a ticket online.", "The team has five members."],
    correctIndex: 1,
    explanationVi: "Câu hỏi 'What' hỏi về cách thức; câu trả lời phù hợp nêu phương thức liên hệ: 'Just submit a ticket online.'",
  },
  {
    question: "Shouldn't we double-check the figures before submitting the report?",
    responses: ["Good idea, let's review them now.", "The report is thirty pages.", "We submitted it last week."],
    correctIndex: 0,
    explanationVi: "Câu hỏi đề nghị; phản hồi hợp lý bày tỏ sự đồng ý: 'Good idea, let's review them now.'",
  },
  {
    question: "How long have you been working with this supplier?",
    responses: ["Since we opened this branch.", "They're based overseas.", "I'll contact them today."],
    correctIndex: 0,
    explanationVi: "Câu hỏi 'How long' cần câu trả lời về khoảng thời gian: 'Since we opened this branch.'",
  },
  {
    question: "Which conference room did you book for the interview?",
    responses: ["The one on the second floor.", "I scheduled it for 2 p.m.", "The candidate seemed qualified."],
    correctIndex: 0,
    explanationVi: "Câu hỏi 'Which' cần câu trả lời chỉ rõ đối tượng được chọn: 'The one on the second floor.'",
  },
  {
    question: "Haven't the new business cards arrived yet?",
    responses: ["Not yet, they're still being printed.", "I ordered two boxes.", "They look great."],
    correctIndex: 0,
    explanationVi: "Câu hỏi phủ định hỏi về tiến độ; phản hồi hợp lý cập nhật tình trạng: 'Not yet, they're still being printed.'",
  },
  {
    question: "Would you mind covering my shift on Saturday?",
    responses: ["Not at all, I'm free that day.", "My shift starts at ten.", "Saturday is my day off."],
    correctIndex: 0,
    explanationVi: "Đây là lời yêu cầu lịch sự; phản hồi phù hợp là đồng ý: 'Not at all, I'm free that day.'",
  },
];
