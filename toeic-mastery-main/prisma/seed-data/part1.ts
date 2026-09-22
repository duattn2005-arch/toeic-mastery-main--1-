export interface SeedPart1Question {
  /** Internal note for admins — describes the photo an image should show once uploaded. */
  sceneNote: string;
  statements: string[];
  correctIndex: number;
  explanationVi: string;
}

// No stock photos are bundled with this seed (see docs/content-sources.md).
// Each question ships with 4 original spoken statements and a scene note so
// an admin can attach a matching photo later via /admin/questions.
export const PART1_QUESTIONS: SeedPart1Question[] = [
  {
    sceneNote: "Một người phụ nữ đang ngồi tại bàn làm việc, gõ máy tính, có tách cà phê bên cạnh.",
    statements: [
      "The woman is typing on a laptop at her desk.",
      "The woman is watering a plant on the shelf.",
      "The woman is talking on the phone while standing.",
      "The woman is printing a document near the window.",
    ],
    correctIndex: 0,
    explanationVi: "Bức ảnh mô tả người phụ nữ đang gõ máy tính tại bàn làm việc, đúng với câu A.",
  },
  {
    sceneNote: "Hai người đàn ông đang bắt tay nhau trước cửa văn phòng.",
    statements: [
      "The men are loading boxes into a van.",
      "The men are shaking hands in front of an office building.",
      "The men are walking away from each other.",
      "The men are sitting across a conference table.",
    ],
    correctIndex: 1,
    explanationVi: "Hình ảnh mô tả hai người đàn ông bắt tay trước tòa nhà văn phòng, khớp với câu B.",
  },
  {
    sceneNote: "Công nhân đang vận hành máy móc trong nhà xưởng, đeo đồ bảo hộ.",
    statements: [
      "The workers are removing their safety equipment.",
      "The machine has been turned off for repairs.",
      "The workers are operating machinery in the factory.",
      "The factory floor is completely empty.",
    ],
    correctIndex: 2,
    explanationVi: "Công nhân đang vận hành máy móc trong nhà máy, đúng với câu C.",
  },
  {
    sceneNote: "Một nhóm người đang ngồi họp quanh bàn tròn, có máy chiếu phía sau.",
    statements: [
      "The chairs have been stacked against the wall.",
      "A presentation is being given to a seated group.",
      "The room is being cleaned by a staff member.",
      "The projector screen has been rolled up.",
    ],
    correctIndex: 1,
    explanationVi: "Một bài thuyết trình đang được trình bày cho nhóm người ngồi quanh bàn, khớp với câu B.",
  },
  {
    sceneNote: "Nhân viên đang xếp hàng hóa lên kệ trong kho.",
    statements: [
      "Boxes are being stacked onto the shelves.",
      "The warehouse is being demolished.",
      "The forklift is parked outside the building.",
      "The shelves have all been removed.",
    ],
    correctIndex: 0,
    explanationVi: "Các thùng hàng đang được xếp lên kệ, đúng với câu A.",
  },
  {
    sceneNote: "Đầu bếp đang chuẩn bị món ăn trong bếp nhà hàng.",
    statements: [
      "The chef is washing dishes in the sink.",
      "The kitchen appliances are being repaired.",
      "The chef is preparing food at the counter.",
      "The restaurant is closed for the evening.",
    ],
    correctIndex: 2,
    explanationVi: "Đầu bếp đang chuẩn bị món ăn tại quầy bếp, khớp với câu C.",
  },
  {
    sceneNote: "Một nhân viên đang dán nhãn lên các hộp hàng trong kho.",
    statements: [
      "The employee is labeling boxes in the warehouse.",
      "The boxes have already been shipped out.",
      "The warehouse is completely empty.",
      "The employee is sweeping the floor.",
    ],
    correctIndex: 0,
    explanationVi: "Nhân viên đang dán nhãn lên các hộp hàng, đúng với câu A.",
  },
  {
    sceneNote: "Hai đồng nghiệp đang cùng xem tài liệu trên máy tính bảng.",
    statements: [
      "The colleagues are arguing loudly.",
      "The colleagues are reviewing a document on a tablet.",
      "One colleague is sleeping at the desk.",
      "The document has been thrown into the trash.",
    ],
    correctIndex: 1,
    explanationVi: "Hai đồng nghiệp đang xem tài liệu trên máy tính bảng, khớp với câu B.",
  },
  {
    sceneNote: "Một người phụ nữ đang trình bày biểu đồ trước hội đồng quản trị.",
    statements: [
      "The woman is filing paperwork alone.",
      "The chairs in the room are stacked against the wall.",
      "The woman is presenting a chart to the board.",
      "The projector is being repaired.",
    ],
    correctIndex: 2,
    explanationVi: "Người phụ nữ đang thuyết trình biểu đồ trước hội đồng, đúng với câu C.",
  },
  {
    sceneNote: "Công nhân đang lắp đặt các tấm pin năng lượng mặt trời trên mái nhà.",
    statements: [
      "The workers are installing solar panels on the roof.",
      "The roof is being painted.",
      "The workers are taking a break in the yard.",
      "The panels have been removed from the roof.",
    ],
    correctIndex: 0,
    explanationVi: "Công nhân đang lắp tấm pin mặt trời trên mái nhà, khớp với câu A.",
  },
  {
    sceneNote: "Một nhân viên tiếp tân đang chỉ đường cho khách tới thang máy.",
    statements: [
      "The receptionist is closing the office for the day.",
      "The receptionist is directing a visitor toward the elevator.",
      "The visitor is signing a delivery form.",
      "The lobby is under construction.",
    ],
    correctIndex: 1,
    explanationVi: "Nhân viên tiếp tân đang chỉ hướng thang máy cho khách, đúng với câu B.",
  },
  {
    sceneNote: "Đầu bếp đang bày món ăn ra đĩa trong bếp nhà hàng.",
    statements: [
      "The chef is plating a dish in the kitchen.",
      "The chef is taking an order from a customer.",
      "The kitchen equipment is being cleaned.",
      "The restaurant is closed for renovation.",
    ],
    correctIndex: 0,
    explanationVi: "Đầu bếp đang bày món ăn ra đĩa, khớp với câu A.",
  },
  {
    sceneNote: "Một người đàn ông đang sạc xe điện tại trạm sạc ngoài trời.",
    statements: [
      "The man is washing his car.",
      "The man is charging an electric vehicle at a station.",
      "The parking lot is completely full.",
      "The charging station is out of service.",
    ],
    correctIndex: 1,
    explanationVi: "Người đàn ông đang sạc xe điện tại trạm, đúng với câu B.",
  },
  {
    sceneNote: "Nhân viên bảo trì đang kiểm tra hệ thống điện trong phòng kỹ thuật.",
    statements: [
      "The technician is inspecting the electrical system.",
      "The room is being painted.",
      "The technician is asleep at his desk.",
      "The equipment has been unplugged and stored away.",
    ],
    correctIndex: 0,
    explanationVi: "Nhân viên bảo trì đang kiểm tra hệ thống điện, khớp với câu A.",
  },
  {
    sceneNote: "Một nhóm khách hàng đang xếp hàng chờ trước quầy thu ngân.",
    statements: [
      "The customers are lining up at the checkout counter.",
      "The store has just closed for the night.",
      "The cashier is on a phone call.",
      "The shelves are being restocked.",
    ],
    correctIndex: 0,
    explanationVi: "Khách hàng đang xếp hàng trước quầy thu ngân, đúng với câu A.",
  },
  {
    sceneNote: "Người giao hàng đang ký nhận tại cửa văn phòng.",
    statements: [
      "The delivery person is signing at the office door.",
      "The package is being returned to the sender.",
      "The office door is locked.",
      "The delivery van has already left.",
    ],
    correctIndex: 0,
    explanationVi: "Người giao hàng đang ký nhận tại cửa, khớp với câu A.",
  },
];
