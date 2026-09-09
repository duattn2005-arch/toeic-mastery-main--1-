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
];
