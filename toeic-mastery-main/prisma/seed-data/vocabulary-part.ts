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
  category: string;
  words: SeedWord[];
}

export const VOCABULARY_TOPICS_PART: SeedVocabularyTopic[] = [
  {
    slug: "vocab-part-1",
    name: "Từ vựng Part 1 (Photographs)",
    description:
      "Từ vựng mô tả hành động, vị trí và bối cảnh thường gặp trong tranh ảnh Part 1.",
    category: "Theo Part",
    words: [
      { word: "arrange", ipa: "əˈreɪndʒ", partOfSpeech: "verb", meaningVi: "sắp xếp", definitionEn: "To put objects in a neat or particular order.", exampleEn: "A worker is arranging boxes on the shelf.", exampleVi: "Một công nhân đang sắp xếp các hộp lên kệ.", synonyms: ["organize", "tidy"], difficulty: "EASY" },
      { word: "stack", ipa: "stæk", partOfSpeech: "verb", meaningVi: "xếp chồng lên nhau", definitionEn: "To pile things neatly one on top of another.", exampleEn: "Several crates are stacked near the loading dock.", exampleVi: "Vài thùng hàng được xếp chồng lên nhau gần bến bốc dỡ hàng.", collocations: ["stack boxes", "stacked neatly"], difficulty: "EASY" },
      { word: "sweep", ipa: "swiːp", partOfSpeech: "verb", meaningVi: "quét (sàn nhà)", definitionEn: "To clean a surface by brushing away dirt.", exampleEn: "A man is sweeping the floor of the store.", exampleVi: "Một người đàn ông đang quét sàn cửa hàng.", difficulty: "EASY" },
      { word: "adjust", ipa: "əˈdʒʌst", partOfSpeech: "verb", meaningVi: "điều chỉnh", definitionEn: "To change something slightly to make it correct or suitable.", exampleEn: "The technician is adjusting the height of the monitor.", exampleVi: "Kỹ thuật viên đang điều chỉnh độ cao của màn hình.", synonyms: ["set", "fix"], difficulty: "MEDIUM" },
      { word: "examine", ipa: "ɪɡˈzæmɪn", partOfSpeech: "verb", meaningVi: "kiểm tra, xem xét", definitionEn: "To look at something closely in order to inspect it.", exampleEn: "A woman is examining some merchandise before buying it.", exampleVi: "Một phụ nữ đang xem xét món hàng trước khi mua.", synonyms: ["inspect", "check"], difficulty: "MEDIUM" },
      { word: "pave", ipa: "peɪv", partOfSpeech: "verb", meaningVi: "trải/lát (đường)", definitionEn: "To cover a surface with a hard material such as concrete or stones.", exampleEn: "Workers are paving the road near the construction site.", exampleVi: "Công nhân đang trải nhựa con đường gần công trường.", difficulty: "HARD" },
      { word: "lean", ipa: "liːn", partOfSpeech: "verb", meaningVi: "tựa, nghiêng người", definitionEn: "To rest against something in a sloping position.", exampleEn: "A ladder is leaning against the wall of the building.", exampleVi: "Một chiếc thang đang tựa vào bức tường của tòa nhà.", difficulty: "MEDIUM" },
      { word: "unload", ipa: "ʌnˈloʊd", partOfSpeech: "verb", meaningVi: "dỡ hàng", definitionEn: "To remove goods from a vehicle or container.", exampleEn: "The men are unloading furniture from the truck.", exampleVi: "Những người đàn ông đang dỡ đồ nội thất xuống từ xe tải.", synonyms: ["offload"], difficulty: "EASY" },
      { word: "overlook", ipa: "ˌoʊvərˈlʊk", partOfSpeech: "verb", meaningVi: "nhìn ra, hướng ra", definitionEn: "To have a view of something from above or from a distance.", exampleEn: "The balcony overlooks a wide, empty field.", exampleVi: "Ban công nhìn ra một cánh đồng rộng, trống trải.", difficulty: "HARD" },
      { word: "pedestrian", ipa: "pəˈdɛstriən", partOfSpeech: "noun", meaningVi: "người đi bộ", definitionEn: "A person walking rather than traveling in a vehicle.", exampleEn: "Several pedestrians are crossing the street at the intersection.", exampleVi: "Vài người đi bộ đang băng qua đường tại giao lộ.", difficulty: "EASY" },
      { word: "railing", ipa: "ˈreɪlɪŋ", partOfSpeech: "noun", meaningVi: "lan can, tay vịn", definitionEn: "A fence or barrier made of rails, often on stairs or balconies.", exampleEn: "One of the workers is holding onto the railing while climbing the stairs.", exampleVi: "Một trong những công nhân đang bám vào lan can khi leo cầu thang.", difficulty: "MEDIUM" },
      { word: "potted plant", ipa: "ˈpɒtɪd plænt", partOfSpeech: "noun", meaningVi: "cây trồng trong chậu", definitionEn: "A plant grown in a container rather than in the ground.", exampleEn: "Potted plants have been placed along the walkway.", exampleVi: "Những chậu cây đã được đặt dọc theo lối đi.", difficulty: "EASY" },
      { word: "beneath", ipa: "bɪˈniːθ", partOfSpeech: "preposition", meaningVi: "bên dưới", definitionEn: "In a position lower than something else.", exampleEn: "A bag has been left beneath the table.", exampleVi: "Một chiếc túi đã được để lại bên dưới cái bàn.", synonyms: ["under", "below"], difficulty: "MEDIUM" },
      { word: "scaffolding", ipa: "ˈskæfəldɪŋ", partOfSpeech: "noun", meaningVi: "giàn giáo", definitionEn: "A temporary structure used to support workers during construction.", exampleEn: "Workers have set up scaffolding along the side of the building.", exampleVi: "Công nhân đã dựng giàn giáo dọc theo bên hông tòa nhà.", difficulty: "HARD" },
      { word: "row", ipa: "roʊ", partOfSpeech: "noun", meaningVi: "hàng, dãy", definitionEn: "A number of people or things arranged in a line.", exampleEn: "The chairs have been arranged in a single row.", exampleVi: "Các ghế đã được sắp xếp thành một hàng.", collocations: ["in a row", "a row of chairs"], difficulty: "EASY" },
    ],
  },
  {
    slug: "vocab-part-2",
    name: "Từ vựng Part 2 (Question-Response)",
    description:
      "Từ vựng và cụm từ phản hồi thường gặp trong các câu hỏi-đáp Part 2.",
    category: "Theo Part",
    words: [
      { word: "reckon", ipa: "ˈrɛkən", partOfSpeech: "verb", meaningVi: "cho rằng, nghĩ rằng", definitionEn: "To think or suppose something, used informally to give an opinion.", exampleEn: "I reckon we should reschedule the meeting for next week.", exampleVi: "Tôi nghĩ chúng ta nên dời cuộc họp sang tuần sau.", synonyms: ["suppose", "guess"], difficulty: "MEDIUM" },
      { word: "mind", ipa: "maɪnd", partOfSpeech: "verb", meaningVi: "phiền, ngại", definitionEn: "To be bothered or annoyed by something.", exampleEn: "Would you mind opening the window for me?", exampleVi: "Bạn có phiền mở cửa sổ giúp tôi không?", difficulty: "EASY" },
      { word: "rather", ipa: "ˈræðər", partOfSpeech: "adverb", meaningVi: "thà rằng, hơn là", definitionEn: "Used to express a preference for one thing over another.", exampleEn: "I would rather take the bus than drive in this traffic.", exampleVi: "Tôi thà đi xe buýt còn hơn là lái xe trong tình trạng kẹt xe này.", collocations: ["would rather"], difficulty: "MEDIUM" },
      { word: "suppose", ipa: "səˈpoʊz", partOfSpeech: "verb", meaningVi: "cho là, giả sử", definitionEn: "To assume that something is true.", exampleEn: "I suppose the shipment will arrive by Friday.", exampleVi: "Tôi cho là lô hàng sẽ đến vào thứ Sáu.", synonyms: ["assume", "guess"], difficulty: "EASY" },
      { word: "available", ipa: "əˈveɪləbəl", partOfSpeech: "adjective", meaningVi: "có sẵn, rảnh", definitionEn: "Able to be used or obtained; free to do something.", exampleEn: "Is Mr. Park available for a call this afternoon?", exampleVi: "Ông Park có rảnh để gọi điện chiều nay không?", difficulty: "EASY" },
      { word: "postponed", ipa: "poʊstˈpoʊnd", partOfSpeech: "adjective", meaningVi: "bị hoãn lại", definitionEn: "Delayed to a later time.", exampleEn: "Wasn't the training session postponed until Thursday?", exampleVi: "Buổi đào tạo chẳng phải đã bị hoãn đến thứ Năm sao?", synonyms: ["delayed"], difficulty: "MEDIUM" },
      { word: "in charge of", ipa: "ɪn tʃɑːrdʒ ʌv", partOfSpeech: "phrase", meaningVi: "phụ trách", definitionEn: "Having control or responsibility for something.", exampleEn: "Who is in charge of ordering office supplies this month?", exampleVi: "Ai phụ trách việc đặt văn phòng phẩm tháng này?", difficulty: "MEDIUM" },
      { word: "how about", ipa: "haʊ əˈbaʊt", partOfSpeech: "phrase", meaningVi: "còn... thì sao, hay là", definitionEn: "Used to make a suggestion or ask for someone's opinion.", exampleEn: "How about meeting at the café instead of the office?", exampleVi: "Hay là gặp nhau ở quán cà phê thay vì văn phòng nhỉ?", difficulty: "EASY" },
      { word: "certainly", ipa: "ˈsɜːrtənli", partOfSpeech: "adverb", meaningVi: "chắc chắn rồi", definitionEn: "Used to give a confident, affirmative response.", exampleEn: "Certainly, I'll send you the file right away.", exampleVi: "Chắc chắn rồi, tôi sẽ gửi tệp cho bạn ngay.", synonyms: ["surely", "of course"], difficulty: "EASY" },
      { word: "afraid", ipa: "əˈfreɪd", partOfSpeech: "adjective", meaningVi: "e rằng, e là", definitionEn: "Used politely to introduce unwelcome or negative news.", exampleEn: "I'm afraid the printer is out of order again.", exampleVi: "Tôi e là máy in lại bị hỏng nữa rồi.", collocations: ["I'm afraid"], difficulty: "MEDIUM" },
      { word: "renew", ipa: "rɪˈnuː", partOfSpeech: "verb", meaningVi: "gia hạn", definitionEn: "To extend the validity of something, such as a contract or membership.", exampleEn: "Did you remember to renew your parking permit?", exampleVi: "Bạn có nhớ gia hạn thẻ đỗ xe không?", difficulty: "MEDIUM" },
      { word: "instead", ipa: "ɪnˈstɛd", partOfSpeech: "adverb", meaningVi: "thay vào đó", definitionEn: "In place of something previously mentioned.", exampleEn: "The client canceled, so let's review the budget instead.", exampleVi: "Khách hàng đã hủy, vậy hãy xem lại ngân sách thay vào đó.", difficulty: "EASY" },
      { word: "whichever", ipa: "wɪtʃˈɛvər", partOfSpeech: "pronoun", meaningVi: "cái nào cũng được, bất kỳ cái nào", definitionEn: "Used to indicate that any option is acceptable.", exampleEn: "You can choose whichever time slot works best for you.", exampleVi: "Bạn có thể chọn bất kỳ khung giờ nào phù hợp nhất với bạn.", difficulty: "HARD" },
      { word: "on second thought", ipa: "ɒn ˈsɛkənd θɔːt", partOfSpeech: "phrase", meaningVi: "nghĩ lại thì", definitionEn: "Used to indicate a change of mind after further reflection.", exampleEn: "On second thought, let's hold the meeting online instead.", exampleVi: "Nghĩ lại thì, hãy tổ chức cuộc họp trực tuyến thay vào đó.", difficulty: "HARD" },
      { word: "keep track of", ipa: "kiːp træk ʌv", partOfSpeech: "phrase", meaningVi: "theo dõi", definitionEn: "To stay informed about something by monitoring it regularly.", exampleEn: "It's hard to keep track of all the pending orders.", exampleVi: "Thật khó để theo dõi tất cả các đơn hàng đang chờ xử lý.", difficulty: "MEDIUM" },
    ],
  },
  {
    slug: "vocab-part-3",
    name: "Từ vựng Part 3 (Conversations)",
    description:
      "Từ vựng hội thoại công sở, đời sống thường gặp trong các đoạn hội thoại Part 3.",
    category: "Theo Part",
    words: [
      { word: "malfunction", ipa: "mælˈfʌŋkʃən", partOfSpeech: "verb", meaningVi: "trục trặc, hỏng hóc", definitionEn: "To fail to work correctly.", exampleEn: "The scanner has been malfunctioning since yesterday morning.", exampleVi: "Máy quét đã bị trục trặc kể từ sáng hôm qua.", synonyms: ["break down"], difficulty: "MEDIUM" },
      { word: "apologize", ipa: "əˈpɒlədʒaɪz", partOfSpeech: "verb", meaningVi: "xin lỗi", definitionEn: "To express regret for a mistake or problem.", exampleEn: "I'd like to apologize for the delay in processing your order.", exampleVi: "Tôi muốn xin lỗi vì sự chậm trễ trong việc xử lý đơn hàng của bạn.", difficulty: "EASY" },
      { word: "reschedule", ipa: "ˌriːˈskɛdʒuːl", partOfSpeech: "verb", meaningVi: "sắp xếp lại lịch", definitionEn: "To change the time or date of a planned event.", exampleEn: "Could we reschedule our appointment for later this week?", exampleVi: "Chúng ta có thể sắp xếp lại lịch hẹn vào cuối tuần này không?", difficulty: "EASY" },
      { word: "cover for", ipa: "ˈkʌvər fɔːr", partOfSpeech: "phrasal verb", meaningVi: "làm thay cho ai đó", definitionEn: "To temporarily do someone else's job while they are absent.", exampleEn: "Could you cover for me at the front desk this afternoon?", exampleVi: "Bạn có thể làm thay tôi ở quầy lễ tân chiều nay không?", difficulty: "MEDIUM" },
      { word: "run out of", ipa: "rʌn aʊt ʌv", partOfSpeech: "phrasal verb", meaningVi: "hết, cạn kiệt", definitionEn: "To have no more of something left.", exampleEn: "We've run out of printer paper again this week.", exampleVi: "Chúng ta đã hết giấy in lại rồi trong tuần này.", difficulty: "EASY" },
      { word: "look into", ipa: "lʊk ˈɪntuː", partOfSpeech: "phrasal verb", meaningVi: "điều tra, tìm hiểu", definitionEn: "To investigate or examine a matter.", exampleEn: "I'll look into why the shipment hasn't arrived yet.", exampleVi: "Tôi sẽ tìm hiểu lý do tại sao lô hàng vẫn chưa đến.", synonyms: ["investigate"], difficulty: "MEDIUM" },
      { word: "put off", ipa: "pʊt ɒf", partOfSpeech: "phrasal verb", meaningVi: "trì hoãn", definitionEn: "To delay doing something until a later time.", exampleEn: "We shouldn't put off ordering new equipment any longer.", exampleVi: "Chúng ta không nên trì hoãn việc đặt mua thiết bị mới nữa.", synonyms: ["postpone", "delay"], difficulty: "MEDIUM" },
      { word: "fill in for", ipa: "fɪl ɪn fɔːr", partOfSpeech: "phrasal verb", meaningVi: "thay thế tạm thời", definitionEn: "To temporarily take someone's place at work.", exampleEn: "Can you fill in for the receptionist while she's on break?", exampleVi: "Bạn có thể thay thế tạm thời cho lễ tân trong lúc cô ấy nghỉ giải lao không?", difficulty: "MEDIUM" },
      { word: "voucher", ipa: "ˈvaʊtʃər", partOfSpeech: "noun", meaningVi: "phiếu mua hàng, phiếu quà tặng", definitionEn: "A piece of paper that can be exchanged for goods or a discount.", exampleEn: "Customers received a voucher for their next purchase.", exampleVi: "Khách hàng nhận được một phiếu mua hàng cho lần mua tiếp theo.", difficulty: "MEDIUM" },
      { word: "glitch", ipa: "ɡlɪtʃ", partOfSpeech: "noun", meaningVi: "trục trặc nhỏ (kỹ thuật)", definitionEn: "A minor, usually temporary problem, especially with equipment or software.", exampleEn: "IT support was called in to fix a glitch in the ordering system.", exampleVi: "Bộ phận CNTT đã được gọi đến để sửa một trục trặc trong hệ thống đặt hàng.", synonyms: ["hiccup", "malfunction"], difficulty: "MEDIUM" },
      { word: "clarify", ipa: "ˈklærəfaɪ", partOfSpeech: "verb", meaningVi: "làm rõ, giải thích rõ", definitionEn: "To make a statement or situation easier to understand.", exampleEn: "Could you clarify what time the shipment is expected?", exampleVi: "Bạn có thể làm rõ giờ dự kiến lô hàng sẽ đến không?", difficulty: "MEDIUM" },
      { word: "swap", ipa: "swɒp", partOfSpeech: "verb", meaningVi: "đổi, hoán đổi", definitionEn: "To exchange one thing for another.", exampleEn: "Would you mind swapping shifts with me next Friday?", exampleVi: "Bạn có phiền đổi ca với tôi vào thứ Sáu tới không?", synonyms: ["exchange", "switch"], difficulty: "EASY" },
      { word: "overbooked", ipa: "ˌoʊvərˈbʊkt", partOfSpeech: "adjective", meaningVi: "đặt chỗ quá số lượng cho phép", definitionEn: "Having accepted more reservations than there is space for.", exampleEn: "The restaurant was overbooked, so we had to wait outside.", exampleVi: "Nhà hàng đã bị đặt chỗ quá số lượng, nên chúng tôi phải đợi bên ngoài.", difficulty: "HARD" },
      { word: "get back to", ipa: "ɡɛt bæk tuː", partOfSpeech: "phrasal verb", meaningVi: "phản hồi lại, liên hệ lại", definitionEn: "To contact someone again after a request or question.", exampleEn: "I'll get back to you once I've checked the inventory.", exampleVi: "Tôi sẽ phản hồi lại bạn sau khi kiểm tra hàng tồn kho.", difficulty: "MEDIUM" },
      { word: "hold on", ipa: "hoʊld ɒn", partOfSpeech: "phrasal verb", meaningVi: "chờ một chút, giữ máy", definitionEn: "To wait briefly, especially during a phone call.", exampleEn: "Could you hold on while I transfer your call?", exampleVi: "Bạn có thể chờ một chút trong khi tôi chuyển máy không?", difficulty: "EASY" },
    ],
  },
  {
    slug: "vocab-part-4",
    name: "Từ vựng Part 4 (Talks)",
    description:
      "Từ vựng bài nói, thông báo, quảng cáo thường gặp trong các bài độc thoại Part 4.",
    category: "Theo Part",
    words: [
      { word: "announcement", ipa: "əˈnaʊnsmənt", partOfSpeech: "noun", meaningVi: "thông báo", definitionEn: "A public statement giving information about something.", exampleEn: "Attention, shoppers, please listen to this important announcement.", exampleVi: "Kính thưa quý khách, xin vui lòng nghe thông báo quan trọng sau đây.", difficulty: "EASY" },
      { word: "commence", ipa: "kəˈmɛns", partOfSpeech: "verb", meaningVi: "bắt đầu", definitionEn: "To begin something, often used in formal contexts.", exampleEn: "The orientation session will commence at nine o'clock sharp.", exampleVi: "Buổi định hướng sẽ bắt đầu đúng chín giờ.", synonyms: ["begin", "start"], difficulty: "HARD" },
      { word: "inconvenience", ipa: "ˌɪnkənˈviːniəns", partOfSpeech: "noun", meaningVi: "sự bất tiện", definitionEn: "Trouble or difficulty caused to a person or plan.", exampleEn: "We apologize for any inconvenience caused by the schedule change.", exampleVi: "Chúng tôi xin lỗi vì bất kỳ sự bất tiện nào do việc thay đổi lịch trình gây ra.", difficulty: "MEDIUM" },
      { word: "voicemail", ipa: "ˈvɔɪsmeɪl", partOfSpeech: "noun", meaningVi: "hộp thư thoại", definitionEn: "A system for recording spoken messages when a call is not answered.", exampleEn: "Please leave a voicemail and I'll return your call shortly.", exampleVi: "Vui lòng để lại tin nhắn thoại và tôi sẽ gọi lại cho bạn ngay.", difficulty: "EASY" },
      { word: "detour", ipa: "ˈdiːtʊər", partOfSpeech: "noun", meaningVi: "đường vòng, lối đi tắt", definitionEn: "An alternative route used when the main way is blocked.", exampleEn: "Drivers should take a detour due to road construction ahead.", exampleVi: "Tài xế nên đi đường vòng do có công trình xây dựng phía trước.", difficulty: "MEDIUM" },
      { word: "renovation", ipa: "ˌrɛnəˈveɪʃən", partOfSpeech: "noun", meaningVi: "sự cải tạo, tu sửa", definitionEn: "The process of repairing or improving a building.", exampleEn: "The lobby will be closed for renovation until next month.", exampleVi: "Sảnh chính sẽ đóng cửa để cải tạo cho đến tháng tới.", difficulty: "MEDIUM" },
      { word: "complimentary", ipa: "ˌkɑːmplɪˈmɛntəri", partOfSpeech: "adjective", meaningVi: "miễn phí (như một ưu đãi)", definitionEn: "Given free of charge as a courtesy.", exampleEn: "All attendees will receive a complimentary tote bag at registration.", exampleVi: "Tất cả người tham dự sẽ nhận được một túi xách tặng kèm miễn phí khi đăng ký.", difficulty: "MEDIUM" },
      { word: "keynote speaker", ipa: "ˈkiːnoʊt ˈspiːkər", partOfSpeech: "noun", meaningVi: "diễn giả chính", definitionEn: "The main speaker at a conference or event.", exampleEn: "Our keynote speaker will discuss trends in renewable energy.", exampleVi: "Diễn giả chính của chúng tôi sẽ thảo luận về các xu hướng năng lượng tái tạo.", difficulty: "MEDIUM" },
      { word: "proceed", ipa: "prəˈsiːd", partOfSpeech: "verb", meaningVi: "tiến hành, đi tiếp", definitionEn: "To continue with an action or move forward.", exampleEn: "Passengers should proceed directly to the departure gate.", exampleVi: "Hành khách nên đi thẳng đến cổng khởi hành.", difficulty: "EASY" },
      { word: "highlight", ipa: "ˈhaɪlaɪt", partOfSpeech: "verb", meaningVi: "nhấn mạnh, làm nổi bật", definitionEn: "To draw special attention to something important.", exampleEn: "The tour guide will highlight the museum's most famous exhibits.", exampleVi: "Hướng dẫn viên sẽ làm nổi bật các hiện vật nổi tiếng nhất của bảo tàng.", synonyms: ["emphasize"], difficulty: "EASY" },
      { word: "subscribe", ipa: "səbˈskraɪb", partOfSpeech: "verb", meaningVi: "đăng ký (nhận tin, dịch vụ)", definitionEn: "To arrange to receive a service, product, or publication regularly.", exampleEn: "Listeners can subscribe to our podcast for weekly updates.", exampleVi: "Người nghe có thể đăng ký podcast của chúng tôi để nhận cập nhật hàng tuần.", difficulty: "EASY" },
      { word: "unveil", ipa: "ʌnˈveɪl", partOfSpeech: "verb", meaningVi: "ra mắt, công bố", definitionEn: "To show or announce something publicly for the first time.", exampleEn: "The company will unveil its latest product line next week.", exampleVi: "Công ty sẽ ra mắt dòng sản phẩm mới nhất vào tuần tới.", difficulty: "HARD" },
      { word: "shuttle", ipa: "ˈʃʌtəl", partOfSpeech: "noun", meaningVi: "xe đưa đón", definitionEn: "A vehicle that travels regularly between two places.", exampleEn: "A free shuttle runs between the hotel and the convention center.", exampleVi: "Có xe đưa đón miễn phí chạy giữa khách sạn và trung tâm hội nghị.", difficulty: "MEDIUM" },
      { word: "capacity", ipa: "kəˈpæsəti", partOfSpeech: "noun", meaningVi: "sức chứa", definitionEn: "The maximum amount that something can hold or contain.", exampleEn: "The auditorium has a seating capacity of five hundred people.", exampleVi: "Khán phòng có sức chứa năm trăm người.", difficulty: "MEDIUM" },
      { word: "forecast", ipa: "ˈfɔːrkæst", partOfSpeech: "noun", meaningVi: "dự báo", definitionEn: "A prediction of what will happen, especially regarding weather or business.", exampleEn: "According to the forecast, heavy rain is expected this weekend.", exampleVi: "Theo dự báo, mưa lớn được dự đoán vào cuối tuần này.", difficulty: "EASY" },
    ],
  },
  {
    slug: "vocab-part-5",
    name: "Từ vựng Part 5 (Incomplete Sentences)",
    description:
      "Từ vựng trọng tâm về dạng từ và collocation thường được kiểm tra trong Part 5.",
    category: "Theo Part",
    words: [
      { word: "reliable", ipa: "rɪˈlaɪəbəl", partOfSpeech: "adjective", meaningVi: "đáng tin cậy", definitionEn: "Able to be trusted to work or behave well.", exampleEn: "The company chose a reliable supplier for its raw materials.", exampleVi: "Công ty đã chọn một nhà cung cấp đáng tin cậy cho nguyên liệu thô.", synonyms: ["dependable", "trustworthy"], difficulty: "EASY" },
      { word: "reliability", ipa: "rɪˌlaɪəˈbɪləti", partOfSpeech: "noun", meaningVi: "độ tin cậy", definitionEn: "The quality of being trustworthy or performing consistently well.", exampleEn: "Customers value the reliability of our delivery service.", exampleVi: "Khách hàng đánh giá cao độ tin cậy của dịch vụ giao hàng của chúng tôi.", difficulty: "MEDIUM" },
      { word: "significantly", ipa: "sɪɡˈnɪfɪkəntli", partOfSpeech: "adverb", meaningVi: "đáng kể", definitionEn: "To a noticeably large extent.", exampleEn: "Sales have increased significantly since the new campaign began.", exampleVi: "Doanh số đã tăng đáng kể kể từ khi chiến dịch mới bắt đầu.", difficulty: "MEDIUM" },
      { word: "productivity", ipa: "ˌproʊdʌkˈtɪvəti", partOfSpeech: "noun", meaningVi: "năng suất", definitionEn: "The rate at which goods or services are produced.", exampleEn: "The new software has improved employee productivity considerably.", exampleVi: "Phần mềm mới đã cải thiện năng suất nhân viên đáng kể.", collocations: ["increase productivity", "boost productivity"], difficulty: "MEDIUM" },
      { word: "productive", ipa: "prəˈdʌktɪv", partOfSpeech: "adjective", meaningVi: "có năng suất, hiệu quả", definitionEn: "Producing a large amount of goods, results, or work.", exampleEn: "The meeting was highly productive and resolved several issues.", exampleVi: "Cuộc họp rất hiệu quả và đã giải quyết được một số vấn đề.", difficulty: "EASY" },
      { word: "beneficial", ipa: "ˌbɛnɪˈfɪʃəl", partOfSpeech: "adjective", meaningVi: "có lợi", definitionEn: "Resulting in good or helpful effects.", exampleEn: "Regular training sessions are beneficial for new employees.", exampleVi: "Các buổi đào tạo thường xuyên có lợi cho nhân viên mới.", collocations: ["beneficial to", "mutually beneficial"], difficulty: "MEDIUM" },
      { word: "considerably", ipa: "kənˈsɪdərəbli", partOfSpeech: "adverb", meaningVi: "đáng kể", definitionEn: "By a fairly large amount; to a large degree.", exampleEn: "Production costs have dropped considerably this quarter.", exampleVi: "Chi phí sản xuất đã giảm đáng kể trong quý này.", synonyms: ["significantly", "substantially"], difficulty: "HARD" },
      { word: "comply", ipa: "kəmˈplaɪ", partOfSpeech: "verb", meaningVi: "tuân thủ", definitionEn: "To act in accordance with a rule or request.", exampleEn: "All employees must comply with the new safety regulations.", exampleVi: "Tất cả nhân viên phải tuân thủ các quy định an toàn mới.", collocations: ["comply with"], difficulty: "MEDIUM" },
      { word: "compliance", ipa: "kəmˈplaɪəns", partOfSpeech: "noun", meaningVi: "sự tuân thủ", definitionEn: "The act of obeying a rule, law, or request.", exampleEn: "The factory passed the inspection for compliance with fire codes.", exampleVi: "Nhà máy đã vượt qua kiểm tra về sự tuân thủ quy định phòng cháy chữa cháy.", difficulty: "HARD" },
      { word: "eligible", ipa: "ˈɛlɪdʒəbəl", partOfSpeech: "adjective", meaningVi: "đủ điều kiện", definitionEn: "Having the right to do or receive something.", exampleEn: "Only full-time staff are eligible for the health insurance plan.", exampleVi: "Chỉ nhân viên toàn thời gian mới đủ điều kiện tham gia chương trình bảo hiểm y tế.", collocations: ["eligible for"], difficulty: "MEDIUM" },
      { word: "informative", ipa: "ɪnˈfɔːrmətɪv", partOfSpeech: "adjective", meaningVi: "cung cấp nhiều thông tin", definitionEn: "Providing useful or interesting information.", exampleEn: "The workshop was both informative and enjoyable for participants.", exampleVi: "Buổi hội thảo vừa cung cấp nhiều thông tin vừa thú vị đối với người tham gia.", difficulty: "EASY" },
      { word: "widely", ipa: "ˈwaɪdli", partOfSpeech: "adverb", meaningVi: "rộng rãi", definitionEn: "Over a large area or to a great extent.", exampleEn: "The new policy has been widely accepted among staff members.", exampleVi: "Chính sách mới đã được chấp nhận rộng rãi trong đội ngũ nhân viên.", difficulty: "EASY" },
      { word: "extensive", ipa: "ɪkˈstɛnsɪv", partOfSpeech: "adjective", meaningVi: "sâu rộng, mở rộng", definitionEn: "Covering a large area or wide range; thorough.", exampleEn: "The engineer has extensive experience in industrial design.", exampleVi: "Kỹ sư này có kinh nghiệm sâu rộng trong lĩnh vực thiết kế công nghiệp.", synonyms: ["broad", "wide-ranging"], difficulty: "MEDIUM" },
      { word: "reluctant", ipa: "rɪˈlʌktənt", partOfSpeech: "adjective", meaningVi: "miễn cưỡng, không sẵn lòng", definitionEn: "Unwilling to do something and hesitant.", exampleEn: "Many customers were reluctant to switch to the new billing system.", exampleVi: "Nhiều khách hàng miễn cưỡng chuyển sang hệ thống thanh toán mới.", collocations: ["reluctant to"], difficulty: "HARD" },
      { word: "accordingly", ipa: "əˈkɔːrdɪŋli", partOfSpeech: "adverb", meaningVi: "theo đó, tương ứng", definitionEn: "In a way that is appropriate to the particular situation.", exampleEn: "Budgets will be adjusted accordingly once the audit is complete.", exampleVi: "Ngân sách sẽ được điều chỉnh tương ứng sau khi hoàn tất kiểm toán.", difficulty: "HARD" },
    ],
  },
];
