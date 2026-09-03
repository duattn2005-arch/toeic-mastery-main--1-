export interface SeedWord {
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaningVi: string;
  definitionEn: string;
  exampleEn: string;
  exampleVi: string;
  synonyms?: string[];
  collocations?: string[];
  difficulty?: "EASY" | "MEDIUM" | "HARD";
}

export interface SeedVocabularyTopic {
  slug: string;
  name: string;
  description: string;
  /** Groups topics into sections on /vocabulary/topics. Omitted for these
   * original context-based topics — see VocabularyTopic.category. */
  category?: string;
  words: SeedWord[];
}

export const VOCABULARY_TOPICS: SeedVocabularyTopic[] = [
  {
    slug: "office",
    name: "Office",
    description: "Từ vựng văn phòng thường gặp trong TOEIC Part 5-7.",
    words: [
      { word: "colleague", ipa: "ˈkɒliːɡ", partOfSpeech: "noun", meaningVi: "đồng nghiệp", definitionEn: "A person one works with in a profession.", exampleEn: "She discussed the budget with her colleague before the meeting.", exampleVi: "Cô ấy đã thảo luận về ngân sách với đồng nghiệp trước cuộc họp.", synonyms: ["coworker", "associate"] },
      { word: "deadline", ipa: "ˈdɛdlaɪn", partOfSpeech: "noun", meaningVi: "hạn chót", definitionEn: "The latest time by which something must be completed.", exampleEn: "The report must be submitted before the deadline on Friday.", exampleVi: "Báo cáo phải được nộp trước hạn chót vào thứ Sáu.", collocations: ["meet a deadline", "extend a deadline"] },
      { word: "supervisor", ipa: "ˈsuːpərvaɪzər", partOfSpeech: "noun", meaningVi: "người giám sát", definitionEn: "A person who oversees the work of employees.", exampleEn: "Please ask your supervisor for approval before printing the documents.", exampleVi: "Vui lòng xin phép người giám sát trước khi in tài liệu.", synonyms: ["manager", "overseer"] },
      { word: "stationery", ipa: "ˈsteɪʃəneri", partOfSpeech: "noun", meaningVi: "văn phòng phẩm", definitionEn: "Writing materials such as paper and pens.", exampleEn: "The office manager ordered new stationery for the department.", exampleVi: "Quản lý văn phòng đã đặt văn phòng phẩm mới cho bộ phận." },
      { word: "photocopier", ipa: "ˈfoʊtoʊkɒpiər", partOfSpeech: "noun", meaningVi: "máy photocopy", definitionEn: "A machine that makes copies of documents.", exampleEn: "The photocopier on the third floor is currently out of order.", exampleVi: "Máy photocopy ở tầng ba hiện đang hỏng." },
      { word: "workload", ipa: "ˈwɜːrkloʊd", partOfSpeech: "noun", meaningVi: "khối lượng công việc", definitionEn: "The amount of work to be done.", exampleEn: "Our workload has increased significantly since the merger.", exampleVi: "Khối lượng công việc của chúng tôi tăng đáng kể kể từ khi sáp nhập." },
      { word: "correspondence", ipa: "ˌkɔːrəˈspɒndəns", partOfSpeech: "noun", meaningVi: "thư từ giao dịch", definitionEn: "Letters or emails exchanged between people.", exampleEn: "All correspondence with clients should be filed accordingly.", exampleVi: "Mọi thư từ giao dịch với khách hàng nên được lưu trữ tương ứng.", difficulty: "HARD" },
    ],
  },
  {
    slug: "meetings",
    name: "Meetings",
    description: "Từ vựng liên quan đến họp hành, thảo luận.",
    words: [
      { word: "agenda", ipa: "əˈdʒɛndə", partOfSpeech: "noun", meaningVi: "chương trình nghị sự", definitionEn: "A list of items to be discussed at a meeting.", exampleEn: "The first item on the agenda is the quarterly sales report.", exampleVi: "Mục đầu tiên trong chương trình nghị sự là báo cáo doanh số quý." },
      { word: "postpone", ipa: "poʊstˈpoʊn", partOfSpeech: "verb", meaningVi: "hoãn lại", definitionEn: "To delay an event to a later time.", exampleEn: "The board meeting has been postponed until next Monday.", exampleVi: "Cuộc họp hội đồng đã bị hoãn đến thứ Hai tuần sau.", synonyms: ["delay", "reschedule"] },
      { word: "attendee", ipa: "əˌtɛnˈdiː", partOfSpeech: "noun", meaningVi: "người tham dự", definitionEn: "A person who is present at an event.", exampleEn: "Every attendee will receive a copy of the presentation.", exampleVi: "Mỗi người tham dự sẽ nhận được một bản sao của bài thuyết trình." },
      { word: "minutes", ipa: "ˈmɪnɪts", partOfSpeech: "noun", meaningVi: "biên bản họp", definitionEn: "The official written record of a meeting.", exampleEn: "Could you take the minutes for today's meeting?", exampleVi: "Bạn có thể ghi biên bản cho cuộc họp hôm nay không?" },
      { word: "consensus", ipa: "kənˈsɛnsəs", partOfSpeech: "noun", meaningVi: "sự đồng thuận", definitionEn: "General agreement among a group.", exampleEn: "The team reached a consensus on the new marketing strategy.", exampleVi: "Nhóm đã đạt được sự đồng thuận về chiến lược marketing mới.", difficulty: "HARD" },
      { word: "brief", ipa: "briːf", partOfSpeech: "verb", meaningVi: "báo cáo ngắn gọn", definitionEn: "To give someone essential information.", exampleEn: "The manager will brief the staff on the new policy tomorrow.", exampleVi: "Quản lý sẽ báo cáo ngắn gọn cho nhân viên về chính sách mới vào ngày mai." },
      { word: "proposal", ipa: "prəˈpoʊzəl", partOfSpeech: "noun", meaningVi: "đề xuất", definitionEn: "A plan or suggestion put forward for consideration.", exampleEn: "The committee approved the proposal after a lengthy discussion.", exampleVi: "Ủy ban đã phê duyệt đề xuất sau một cuộc thảo luận dài." },
    ],
  },
  {
    slug: "marketing",
    name: "Marketing",
    description: "Từ vựng tiếp thị, quảng cáo, thương hiệu.",
    words: [
      { word: "campaign", ipa: "kæmˈpeɪn", partOfSpeech: "noun", meaningVi: "chiến dịch", definitionEn: "A series of organized activities to achieve a goal.", exampleEn: "The advertising campaign helped increase brand awareness significantly.", exampleVi: "Chiến dịch quảng cáo đã giúp tăng đáng kể nhận diện thương hiệu." },
      { word: "target audience", ipa: "ˈtɑːrɡɪt ˈɔːdiəns", partOfSpeech: "noun", meaningVi: "đối tượng khách hàng mục tiêu", definitionEn: "The specific group a product is intended for.", exampleEn: "Our target audience for this product is young professionals.", exampleVi: "Đối tượng khách hàng mục tiêu cho sản phẩm này là người trẻ đi làm." },
      { word: "endorsement", ipa: "ɪnˈdɔːrsmənt", partOfSpeech: "noun", meaningVi: "sự chứng thực/bảo trợ", definitionEn: "Public approval or support of a product.", exampleEn: "The company signed a celebrity endorsement deal for the new line.", exampleVi: "Công ty đã ký hợp đồng chứng thực với người nổi tiếng cho dòng sản phẩm mới.", difficulty: "HARD" },
      { word: "market share", ipa: "ˈmɑːrkɪt ʃer", partOfSpeech: "noun", meaningVi: "thị phần", definitionEn: "The portion of a market controlled by a company.", exampleEn: "The company's market share grew by 12 percent last year.", exampleVi: "Thị phần của công ty tăng 12% trong năm ngoái." },
      { word: "brand loyalty", ipa: "brænd ˈlɔɪəlti", partOfSpeech: "noun", meaningVi: "lòng trung thành với thương hiệu", definitionEn: "Consumers' consistent preference for one brand.", exampleEn: "Excellent customer service builds long-term brand loyalty.", exampleVi: "Dịch vụ khách hàng xuất sắc xây dựng lòng trung thành thương hiệu lâu dài." },
      { word: "promote", ipa: "prəˈmoʊt", partOfSpeech: "verb", meaningVi: "quảng bá", definitionEn: "To publicize a product to increase sales.", exampleEn: "The store is promoting its summer collection with a 20% discount.", exampleVi: "Cửa hàng đang quảng bá bộ sưu tập mùa hè với mức giảm giá 20%." },
      { word: "survey", ipa: "ˈsɜːrveɪ", partOfSpeech: "noun", meaningVi: "khảo sát", definitionEn: "A method of gathering information from a sample of people.", exampleEn: "The survey results showed strong customer satisfaction.", exampleVi: "Kết quả khảo sát cho thấy mức độ hài lòng cao của khách hàng." },
    ],
  },
  {
    slug: "finance",
    name: "Finance",
    description: "Từ vựng tài chính, kế toán, ngân sách.",
    words: [
      { word: "invoice", ipa: "ˈɪnvɔɪs", partOfSpeech: "noun", meaningVi: "hóa đơn", definitionEn: "A document requesting payment for goods or services.", exampleEn: "Please send the invoice to the accounting department.", exampleVi: "Vui lòng gửi hóa đơn đến phòng kế toán." },
      { word: "revenue", ipa: "ˈrɛvənuː", partOfSpeech: "noun", meaningVi: "doanh thu", definitionEn: "Income generated from business activities.", exampleEn: "Annual revenue exceeded expectations for the third consecutive year.", exampleVi: "Doanh thu hàng năm vượt kỳ vọng trong năm thứ ba liên tiếp." },
      { word: "expenditure", ipa: "ɪkˈspɛndɪtʃər", partOfSpeech: "noun", meaningVi: "chi tiêu", definitionEn: "Money spent on something.", exampleEn: "The company reduced expenditure on office supplies this quarter.", exampleVi: "Công ty đã giảm chi tiêu cho văn phòng phẩm trong quý này.", difficulty: "HARD" },
      { word: "budget", ipa: "ˈbʌdʒɪt", partOfSpeech: "noun", meaningVi: "ngân sách", definitionEn: "An estimate of income and expenses for a period.", exampleEn: "The marketing budget was approved by the finance director.", exampleVi: "Ngân sách marketing đã được giám đốc tài chính phê duyệt." },
      { word: "audit", ipa: "ˈɔːdɪt", partOfSpeech: "noun", meaningVi: "kiểm toán", definitionEn: "An official inspection of financial accounts.", exampleEn: "The annual audit will begin next month.", exampleVi: "Cuộc kiểm toán hàng năm sẽ bắt đầu vào tháng tới." },
      { word: "installment", ipa: "ɪnˈstɔːlmənt", partOfSpeech: "noun", meaningVi: "trả góp", definitionEn: "One of several payments made over time.", exampleEn: "Customers can pay for the equipment in monthly installments.", exampleVi: "Khách hàng có thể trả tiền thiết bị theo từng đợt hàng tháng." },
      { word: "asset", ipa: "ˈæsɛt", partOfSpeech: "noun", meaningVi: "tài sản", definitionEn: "A resource owned by a company with economic value.", exampleEn: "The building is listed as a fixed asset on the balance sheet.", exampleVi: "Tòa nhà được liệt kê là tài sản cố định trên bảng cân đối kế toán." },
    ],
  },
  {
    slug: "travel",
    name: "Travel",
    description: "Từ vựng du lịch, công tác.",
    words: [
      { word: "itinerary", ipa: "aɪˈtɪnəreri", partOfSpeech: "noun", meaningVi: "lịch trình", definitionEn: "A planned route or schedule of a journey.", exampleEn: "The travel agency sent us a detailed itinerary for the trip.", exampleVi: "Đại lý du lịch đã gửi cho chúng tôi lịch trình chi tiết cho chuyến đi.", difficulty: "HARD" },
      { word: "reimburse", ipa: "ˌriːɪmˈbɜːrs", partOfSpeech: "verb", meaningVi: "hoàn trả (chi phí)", definitionEn: "To pay back money spent by someone.", exampleEn: "The company will reimburse employees for travel expenses.", exampleVi: "Công ty sẽ hoàn trả chi phí đi lại cho nhân viên." },
      { word: "layover", ipa: "ˈleɪoʊvər", partOfSpeech: "noun", meaningVi: "thời gian quá cảnh", definitionEn: "A stop between flights.", exampleEn: "We have a two-hour layover in Singapore before the connecting flight.", exampleVi: "Chúng tôi có thời gian quá cảnh hai tiếng ở Singapore trước chuyến bay nối chuyến." },
      { word: "accommodation", ipa: "əˌkɒməˈdeɪʃən", partOfSpeech: "noun", meaningVi: "chỗ ở", definitionEn: "A place where someone can stay.", exampleEn: "Accommodation for the conference has been arranged near the venue.", exampleVi: "Chỗ ở cho hội nghị đã được sắp xếp gần địa điểm tổ chức." },
      { word: "fare", ipa: "fer", partOfSpeech: "noun", meaningVi: "giá vé", definitionEn: "The price charged for a journey.", exampleEn: "The train fare increased by ten percent this year.", exampleVi: "Giá vé tàu tăng mười phần trăm trong năm nay." },
      { word: "destination", ipa: "ˌdɛstɪˈneɪʃən", partOfSpeech: "noun", meaningVi: "điểm đến", definitionEn: "The place someone is traveling to.", exampleEn: "Our final destination is the branch office in Tokyo.", exampleVi: "Điểm đến cuối cùng của chúng tôi là văn phòng chi nhánh ở Tokyo." },
      { word: "delay", ipa: "dɪˈleɪ", partOfSpeech: "noun", meaningVi: "sự trì hoãn", definitionEn: "A period of time by which something is late.", exampleEn: "Passengers were informed of a two-hour delay due to weather.", exampleVi: "Hành khách được thông báo về sự trì hoãn hai giờ do thời tiết." },
    ],
  },
  {
    slug: "airport",
    name: "Airport",
    description: "Từ vựng tại sân bay.",
    words: [
      { word: "boarding pass", ipa: "ˈbɔːrdɪŋ pæs", partOfSpeech: "noun", meaningVi: "thẻ lên máy bay", definitionEn: "A document allowing a passenger to board a flight.", exampleEn: "Please have your boarding pass and passport ready for inspection.", exampleVi: "Vui lòng chuẩn bị sẵn thẻ lên máy bay và hộ chiếu để kiểm tra." },
      { word: "customs", ipa: "ˈkʌstəmz", partOfSpeech: "noun", meaningVi: "hải quan", definitionEn: "The place where luggage is inspected when entering a country.", exampleEn: "Travelers must declare goods at customs upon arrival.", exampleVi: "Du khách phải khai báo hàng hóa tại hải quan khi đến." },
      { word: "check-in counter", ipa: "ˈtʃɛk ɪn ˈkaʊntər", partOfSpeech: "noun", meaningVi: "quầy làm thủ tục", definitionEn: "The desk where passengers check in for a flight.", exampleEn: "The check-in counter for international flights is on the second floor.", exampleVi: "Quầy làm thủ tục cho các chuyến bay quốc tế nằm ở tầng hai." },
      { word: "baggage claim", ipa: "ˈbæɡɪdʒ kleɪm", partOfSpeech: "noun", meaningVi: "khu vực nhận hành lý", definitionEn: "The area where passengers collect their luggage.", exampleEn: "Your suitcase will arrive at baggage claim number 4.", exampleVi: "Vali của bạn sẽ đến khu vực nhận hành lý số 4." },
      { word: "security screening", ipa: "sɪˈkjʊərəti ˈskriːnɪŋ", partOfSpeech: "noun", meaningVi: "kiểm tra an ninh", definitionEn: "The process of checking passengers and luggage for safety.", exampleEn: "Security screening may take longer during peak travel season.", exampleVi: "Kiểm tra an ninh có thể mất nhiều thời gian hơn vào mùa cao điểm du lịch." },
      { word: "departure gate", ipa: "dɪˈpɑːrtʃər ɡeɪt", partOfSpeech: "noun", meaningVi: "cổng khởi hành", definitionEn: "The location where passengers board their flight.", exampleEn: "Passengers should proceed to departure gate 12 immediately.", exampleVi: "Hành khách nên đến ngay cổng khởi hành số 12." },
    ],
  },
  {
    slug: "hotel",
    name: "Hotel",
    description: "Từ vựng khách sạn, lưu trú.",
    words: [
      { word: "reservation", ipa: "ˌrɛzərˈveɪʃən", partOfSpeech: "noun", meaningVi: "đặt phòng/đặt chỗ", definitionEn: "An arrangement to secure something in advance.", exampleEn: "I would like to confirm my reservation for two nights.", exampleVi: "Tôi muốn xác nhận đặt phòng của mình cho hai đêm." },
      { word: "amenities", ipa: "əˈmɛnətiz", partOfSpeech: "noun", meaningVi: "tiện nghi", definitionEn: "Useful or desirable features of a place.", exampleEn: "The hotel offers amenities such as a gym and free breakfast.", exampleVi: "Khách sạn cung cấp các tiện nghi như phòng gym và bữa sáng miễn phí.", difficulty: "HARD" },
      { word: "vacancy", ipa: "ˈveɪkənsi", partOfSpeech: "noun", meaningVi: "phòng trống", definitionEn: "An available room in a hotel.", exampleEn: "Unfortunately, the hotel has no vacancy this weekend.", exampleVi: "Rất tiếc, khách sạn không còn phòng trống vào cuối tuần này." },
      { word: "checkout", ipa: "ˈtʃɛkaʊt", partOfSpeech: "noun", meaningVi: "trả phòng", definitionEn: "The process of leaving a hotel and settling the bill.", exampleEn: "Checkout time is 11 a.m. unless a late checkout is requested.", exampleVi: "Thời gian trả phòng là 11 giờ sáng trừ khi yêu cầu trả phòng muộn." },
      { word: "complimentary", ipa: "ˌkɒmplɪˈmɛntəri", partOfSpeech: "adjective", meaningVi: "miễn phí (như một sự ưu đãi)", definitionEn: "Given free as a courtesy.", exampleEn: "Complimentary Wi-Fi is available throughout the hotel.", exampleVi: "Wi-Fi miễn phí có sẵn trong toàn bộ khách sạn.", difficulty: "HARD" },
      { word: "concierge", ipa: "ˌkɒnsiˈɛrʒ", partOfSpeech: "noun", meaningVi: "nhân viên hỗ trợ khách", definitionEn: "A hotel staff member who assists guests.", exampleEn: "Ask the concierge for restaurant recommendations nearby.", exampleVi: "Hãy hỏi nhân viên hỗ trợ khách về các gợi ý nhà hàng gần đó." },
    ],
  },
  {
    slug: "restaurant",
    name: "Restaurant",
    description: "Từ vựng nhà hàng, ẩm thực.",
    words: [
      { word: "reservation", ipa: "ˌrɛzərˈveɪʃən", partOfSpeech: "noun", meaningVi: "đặt bàn", definitionEn: "An arrangement to have a table held for you.", exampleEn: "We made a reservation for four people at 7 p.m.", exampleVi: "Chúng tôi đã đặt bàn cho bốn người lúc 7 giờ tối." },
      { word: "cuisine", ipa: "kwɪˈziːn", partOfSpeech: "noun", meaningVi: "ẩm thực", definitionEn: "A style of cooking, especially from a particular region.", exampleEn: "The restaurant specializes in authentic Italian cuisine.", exampleVi: "Nhà hàng chuyên về ẩm thực Ý chính gốc." },
      { word: "complimentary", ipa: "ˌkɒmplɪˈmɛntəri", partOfSpeech: "adjective", meaningVi: "được tặng kèm miễn phí", definitionEn: "Provided free of charge.", exampleEn: "The chef offers a complimentary dessert to loyal customers.", exampleVi: "Đầu bếp tặng món tráng miệng miễn phí cho khách hàng thân thiết." },
      { word: "gratuity", ipa: "ɡrəˈtuːəti", partOfSpeech: "noun", meaningVi: "tiền boa", definitionEn: "A tip given for service.", exampleEn: "A 10% gratuity is included in the bill for large groups.", exampleVi: "Tiền boa 10% được bao gồm trong hóa đơn cho nhóm đông người.", difficulty: "HARD" },
      { word: "menu", ipa: "ˈmɛnjuː", partOfSpeech: "noun", meaningVi: "thực đơn", definitionEn: "A list of dishes available at a restaurant.", exampleEn: "The menu changes seasonally to feature fresh ingredients.", exampleVi: "Thực đơn thay đổi theo mùa để sử dụng nguyên liệu tươi." },
      { word: "catering", ipa: "ˈkeɪtərɪŋ", partOfSpeech: "noun", meaningVi: "dịch vụ cung cấp thực phẩm sự kiện", definitionEn: "The business of providing food for events.", exampleEn: "We hired a catering company for the office party.", exampleVi: "Chúng tôi thuê một công ty cung cấp thực phẩm cho tiệc văn phòng." },
    ],
  },
  {
    slug: "contracts",
    name: "Contracts",
    description: "Từ vựng hợp đồng, pháp lý kinh doanh.",
    words: [
      { word: "clause", ipa: "klɔːz", partOfSpeech: "noun", meaningVi: "điều khoản", definitionEn: "A specific section of a legal document.", exampleEn: "Please review the termination clause before signing.", exampleVi: "Vui lòng xem lại điều khoản chấm dứt hợp đồng trước khi ký." },
      { word: "obligation", ipa: "ˌɒblɪˈɡeɪʃən", partOfSpeech: "noun", meaningVi: "nghĩa vụ", definitionEn: "A duty required by law or agreement.", exampleEn: "Both parties must fulfill their contractual obligations.", exampleVi: "Cả hai bên phải hoàn thành nghĩa vụ hợp đồng của mình.", difficulty: "HARD" },
      { word: "terminate", ipa: "ˈtɜːrmɪneɪt", partOfSpeech: "verb", meaningVi: "chấm dứt", definitionEn: "To bring something to an end.", exampleEn: "The company may terminate the agreement with 30 days' notice.", exampleVi: "Công ty có thể chấm dứt thỏa thuận với thông báo trước 30 ngày." },
      { word: "binding", ipa: "ˈbaɪndɪŋ", partOfSpeech: "adjective", meaningVi: "có tính ràng buộc", definitionEn: "Legally required to be obeyed.", exampleEn: "This is a legally binding agreement between both companies.", exampleVi: "Đây là thỏa thuận có tính ràng buộc pháp lý giữa hai công ty." },
      { word: "amendment", ipa: "əˈmɛndmənt", partOfSpeech: "noun", meaningVi: "sửa đổi", definitionEn: "A change made to a document.", exampleEn: "An amendment to the contract was signed last week.", exampleVi: "Một bản sửa đổi hợp đồng đã được ký vào tuần trước.", difficulty: "HARD" },
      { word: "breach", ipa: "briːtʃ", partOfSpeech: "noun", meaningVi: "vi phạm", definitionEn: "A failure to comply with a contract.", exampleEn: "Late delivery is considered a breach of contract.", exampleVi: "Giao hàng trễ được coi là vi phạm hợp đồng." },
    ],
  },
  {
    slug: "human-resources",
    name: "Human Resources",
    description: "Từ vựng nhân sự, tuyển dụng.",
    words: [
      { word: "recruit", ipa: "rɪˈkruːt", partOfSpeech: "verb", meaningVi: "tuyển dụng", definitionEn: "To find and hire new employees.", exampleEn: "The company plans to recruit ten new engineers this year.", exampleVi: "Công ty có kế hoạch tuyển dụng mười kỹ sư mới trong năm nay." },
      { word: "candidate", ipa: "ˈkændɪdeɪt", partOfSpeech: "noun", meaningVi: "ứng viên", definitionEn: "A person applying for a job.", exampleEn: "Three candidates were shortlisted for the manager position.", exampleVi: "Ba ứng viên đã được chọn vào danh sách rút gọn cho vị trí quản lý." },
      { word: "onboarding", ipa: "ˈɒnbɔːrdɪŋ", partOfSpeech: "noun", meaningVi: "quá trình hòa nhập nhân viên mới", definitionEn: "The process of integrating a new employee.", exampleEn: "The onboarding program lasts for the first two weeks.", exampleVi: "Chương trình hòa nhập kéo dài trong hai tuần đầu tiên." },
      { word: "benefits", ipa: "ˈbɛnɪfɪts", partOfSpeech: "noun", meaningVi: "phúc lợi", definitionEn: "Non-wage compensation provided to employees.", exampleEn: "Health insurance is one of the benefits offered to full-time staff.", exampleVi: "Bảo hiểm y tế là một trong những phúc lợi dành cho nhân viên toàn thời gian." },
      { word: "performance review", ipa: "pərˈfɔːrməns rɪˈvjuː", partOfSpeech: "noun", meaningVi: "đánh giá hiệu suất", definitionEn: "A formal assessment of an employee's work.", exampleEn: "Annual performance reviews determine salary increases.", exampleVi: "Đánh giá hiệu suất hàng năm quyết định việc tăng lương." },
      { word: "resign", ipa: "rɪˈzaɪn", partOfSpeech: "verb", meaningVi: "từ chức", definitionEn: "To formally leave a job.", exampleEn: "She decided to resign from her position after five years.", exampleVi: "Cô ấy quyết định từ chức sau năm năm làm việc." },
    ],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    description: "Từ vựng sản xuất, nhà máy.",
    words: [
      { word: "assembly line", ipa: "əˈsɛmbli laɪn", partOfSpeech: "noun", meaningVi: "dây chuyền lắp ráp", definitionEn: "A production process where products are assembled in stages.", exampleEn: "The new assembly line increased production efficiency by 30 percent.", exampleVi: "Dây chuyền lắp ráp mới tăng hiệu suất sản xuất lên 30%." },
      { word: "defective", ipa: "dɪˈfɛktɪv", partOfSpeech: "adjective", meaningVi: "bị lỗi", definitionEn: "Having a fault or imperfection.", exampleEn: "Defective products are removed during the quality inspection.", exampleVi: "Sản phẩm bị lỗi bị loại bỏ trong quá trình kiểm tra chất lượng." },
      { word: "output", ipa: "ˈaʊtpʊt", partOfSpeech: "noun", meaningVi: "sản lượng", definitionEn: "The amount produced by a factory.", exampleEn: "Factory output rose sharply after the new machinery was installed.", exampleVi: "Sản lượng nhà máy tăng mạnh sau khi lắp đặt máy móc mới." },
      { word: "raw material", ipa: "rɔː məˈtɪəriəl", partOfSpeech: "noun", meaningVi: "nguyên liệu thô", definitionEn: "Basic material used to produce goods.", exampleEn: "The price of raw materials has increased this quarter.", exampleVi: "Giá nguyên liệu thô đã tăng trong quý này." },
      { word: "inspection", ipa: "ɪnˈspɛkʃən", partOfSpeech: "noun", meaningVi: "kiểm tra", definitionEn: "A careful examination to check quality or safety.", exampleEn: "Every unit undergoes a strict inspection before shipping.", exampleVi: "Mỗi đơn vị sản phẩm đều trải qua kiểm tra nghiêm ngặt trước khi vận chuyển." },
      { word: "warehouse", ipa: "ˈwɛərhaʊs", partOfSpeech: "noun", meaningVi: "nhà kho", definitionEn: "A large building for storing goods.", exampleEn: "The finished products are stored in the warehouse until delivery.", exampleVi: "Sản phẩm hoàn thiện được lưu trữ trong nhà kho cho đến khi giao hàng." },
    ],
  },
  {
    slug: "shipping",
    name: "Shipping",
    description: "Từ vựng vận chuyển, logistics.",
    words: [
      { word: "shipment", ipa: "ˈʃɪpmənt", partOfSpeech: "noun", meaningVi: "lô hàng", definitionEn: "A batch of goods sent together.", exampleEn: "The shipment is expected to arrive at the port on Monday.", exampleVi: "Lô hàng dự kiến sẽ đến cảng vào thứ Hai." },
      { word: "freight", ipa: "freɪt", partOfSpeech: "noun", meaningVi: "hàng hóa vận chuyển", definitionEn: "Goods transported in bulk by ship, train, or truck.", exampleEn: "Freight costs have risen due to fuel price increases.", exampleVi: "Chi phí vận chuyển hàng hóa đã tăng do giá nhiên liệu tăng." },
      { word: "customs clearance", ipa: "ˈkʌstəmz ˈklɪərəns", partOfSpeech: "noun", meaningVi: "thông quan", definitionEn: "Official permission for goods to enter or leave a country.", exampleEn: "Customs clearance may take up to three business days.", exampleVi: "Thông quan có thể mất đến ba ngày làm việc.", difficulty: "HARD" },
      { word: "tracking number", ipa: "ˈtrækɪŋ ˈnʌmbər", partOfSpeech: "noun", meaningVi: "mã số theo dõi", definitionEn: "A code used to track a package's location.", exampleEn: "You can check the status of your order using the tracking number.", exampleVi: "Bạn có thể kiểm tra trạng thái đơn hàng bằng mã số theo dõi." },
      { word: "logistics", ipa: "loʊˈdʒɪstɪks", partOfSpeech: "noun", meaningVi: "hậu cần", definitionEn: "The management of the flow of goods.", exampleEn: "The logistics team coordinates deliveries across the region.", exampleVi: "Đội hậu cần điều phối việc giao hàng trên toàn khu vực." },
      { word: "carrier", ipa: "ˈkæriər", partOfSpeech: "noun", meaningVi: "đơn vị vận chuyển", definitionEn: "A company that transports goods or people.", exampleEn: "We switched to a more reliable shipping carrier last year.", exampleVi: "Chúng tôi đã chuyển sang đơn vị vận chuyển đáng tin cậy hơn vào năm ngoái." },
    ],
  },
  {
    slug: "customer-service",
    name: "Customer Service",
    description: "Từ vựng dịch vụ khách hàng.",
    words: [
      { word: "inquiry", ipa: "ɪnˈkwaɪəri", partOfSpeech: "noun", meaningVi: "yêu cầu/thắc mắc", definitionEn: "A request for information.", exampleEn: "Our staff will respond to your inquiry within 24 hours.", exampleVi: "Nhân viên của chúng tôi sẽ phản hồi thắc mắc của bạn trong vòng 24 giờ." },
      { word: "refund", ipa: "ˈriːfʌnd", partOfSpeech: "noun", meaningVi: "hoàn tiền", definitionEn: "Money given back for returned goods.", exampleEn: "Customers can request a full refund within 30 days.", exampleVi: "Khách hàng có thể yêu cầu hoàn tiền đầy đủ trong vòng 30 ngày." },
      { word: "complaint", ipa: "kəmˈpleɪnt", partOfSpeech: "noun", meaningVi: "khiếu nại", definitionEn: "An expression of dissatisfaction.", exampleEn: "The manager personally handled the customer's complaint.", exampleVi: "Người quản lý đã đích thân xử lý khiếu nại của khách hàng." },
      { word: "warranty", ipa: "ˈwɒrənti", partOfSpeech: "noun", meaningVi: "bảo hành", definitionEn: "A guarantee to repair or replace a faulty product.", exampleEn: "This appliance comes with a two-year warranty.", exampleVi: "Thiết bị này đi kèm với bảo hành hai năm." },
      { word: "satisfaction", ipa: "ˌsætɪsˈfækʃən", partOfSpeech: "noun", meaningVi: "sự hài lòng", definitionEn: "Contentment with a product or service.", exampleEn: "Customer satisfaction is our top priority.", exampleVi: "Sự hài lòng của khách hàng là ưu tiên hàng đầu của chúng tôi." },
      { word: "assist", ipa: "əˈsɪst", partOfSpeech: "verb", meaningVi: "hỗ trợ", definitionEn: "To help someone.", exampleEn: "A representative is available to assist you at any time.", exampleVi: "Một đại diện luôn sẵn sàng hỗ trợ bạn bất cứ lúc nào." },
    ],
  },
  {
    slug: "technology",
    name: "Technology",
    description: "Từ vựng công nghệ thông tin, kỹ thuật.",
    words: [
      { word: "upgrade", ipa: "ˈʌpɡreɪd", partOfSpeech: "verb", meaningVi: "nâng cấp", definitionEn: "To improve a system to a newer version.", exampleEn: "The IT department will upgrade all computers next week.", exampleVi: "Phòng IT sẽ nâng cấp tất cả máy tính vào tuần tới." },
      { word: "malfunction", ipa: "mælˈfʌŋkʃən", partOfSpeech: "noun", meaningVi: "trục trặc", definitionEn: "A failure to function normally.", exampleEn: "A system malfunction delayed the online orders.", exampleVi: "Trục trặc hệ thống đã làm chậm trễ các đơn hàng trực tuyến." },
      { word: "backup", ipa: "ˈbækʌp", partOfSpeech: "noun", meaningVi: "sao lưu", definitionEn: "A copy of data stored separately for safety.", exampleEn: "Always create a backup before updating the software.", exampleVi: "Luôn tạo bản sao lưu trước khi cập nhật phần mềm." },
      { word: "troubleshoot", ipa: "ˈtrʌbəlʃuːt", partOfSpeech: "verb", meaningVi: "khắc phục sự cố", definitionEn: "To identify and fix problems.", exampleEn: "The technician will troubleshoot the network issue remotely.", exampleVi: "Kỹ thuật viên sẽ khắc phục sự cố mạng từ xa." },
      { word: "software", ipa: "ˈsɒftwɛər", partOfSpeech: "noun", meaningVi: "phần mềm", definitionEn: "Programs used to operate computers.", exampleEn: "The company developed new software to manage inventory.", exampleVi: "Công ty đã phát triển phần mềm mới để quản lý hàng tồn kho." },
      { word: "install", ipa: "ɪnˈstɔːl", partOfSpeech: "verb", meaningVi: "cài đặt", definitionEn: "To set up software or equipment for use.", exampleEn: "IT staff will install the new application on all devices.", exampleVi: "Nhân viên IT sẽ cài đặt ứng dụng mới trên tất cả thiết bị." },
    ],
  },
  {
    slug: "sales",
    name: "Sales",
    description: "Từ vựng bán hàng, kinh doanh.",
    words: [
      { word: "discount", ipa: "ˈdɪskaʊnt", partOfSpeech: "noun", meaningVi: "giảm giá", definitionEn: "A reduction in the usual price.", exampleEn: "Customers receive a 15% discount on their first purchase.", exampleVi: "Khách hàng được giảm giá 15% cho lần mua đầu tiên." },
      { word: "quota", ipa: "ˈkwoʊtə", partOfSpeech: "noun", meaningVi: "chỉ tiêu", definitionEn: "A fixed target amount to achieve.", exampleEn: "The sales team exceeded their monthly quota.", exampleVi: "Đội bán hàng đã vượt chỉ tiêu tháng của họ." },
      { word: "negotiate", ipa: "nɪˈɡoʊʃieɪt", partOfSpeech: "verb", meaningVi: "đàm phán", definitionEn: "To discuss terms to reach an agreement.", exampleEn: "Both companies negotiated a fair price for the contract.", exampleVi: "Cả hai công ty đã đàm phán mức giá hợp lý cho hợp đồng." },
      { word: "wholesale", ipa: "ˈhoʊlseɪl", partOfSpeech: "adjective", meaningVi: "bán sỉ", definitionEn: "Selling goods in large quantities at lower prices.", exampleEn: "The store offers wholesale prices for bulk orders.", exampleVi: "Cửa hàng cung cấp giá bán sỉ cho đơn hàng số lượng lớn." },
      { word: "client", ipa: "ˈklaɪənt", partOfSpeech: "noun", meaningVi: "khách hàng (doanh nghiệp)", definitionEn: "A person or company using professional services.", exampleEn: "The sales representative met with an important client today.", exampleVi: "Đại diện bán hàng đã gặp một khách hàng quan trọng hôm nay." },
      { word: "profit margin", ipa: "ˈprɒfɪt ˈmɑːrdʒɪn", partOfSpeech: "noun", meaningVi: "biên lợi nhuận", definitionEn: "The difference between cost and selling price.", exampleEn: "The new product has a higher profit margin than expected.", exampleVi: "Sản phẩm mới có biên lợi nhuận cao hơn dự kiến.", difficulty: "HARD" },
    ],
  },
];
