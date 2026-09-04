export type ShopItemRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  rarity: ShopItemRarity;
  priceXp: number;
}

/** Mock catalog for the XP shop — no purchase backend exists yet (see
 * XpShopItemCard's "Đổi ngay" handler), so this stands in until items are
 * modeled in the database. */
export const XP_SHOP_ITEMS: ShopItem[] = [
  { id: "daily-spark", name: "Daily Spark", description: "Viền sáng nhẹ mỗi khi bạn hoàn thành mục tiêu học tập trong ngày.", rarity: "COMMON", priceXp: 300 },
  { id: "morning-dew", name: "Morning Dew", description: "Khung avatar trong vắt như giọt sương sớm — khởi đầu nhẹ nhàng cho hành trình TOEIC.", rarity: "COMMON", priceXp: 600 },
  { id: "ocean-ring", name: "Ocean Ring", description: "Vòng sóng biển xanh mát, gợi nhắc sự bền bỉ như thủy triều không ngừng.", rarity: "RARE", priceXp: 2000 },
  { id: "storm-sail", name: "Storm Sail", description: "Cánh buồm vượt bão giữa biển ngữ pháp — không gì cản được bạn tiến lên.", rarity: "RARE", priceXp: 2000 },
  { id: "ember-crown", name: "Ember Crown", description: "Forged in relentless grind. The ring that burns.", rarity: "EPIC", priceXp: 3500 },
  { id: "frost-halo", name: "Frost Halo", description: "Ice-cold precision. Every answer is inevitable.", rarity: "EPIC", priceXp: 5000 },
  { id: "sakura-shrine", name: "Sakura Shrine", description: "Khung cổng torii giữa mưa hoa anh đào — phong cách Đông Phương cổ kính đầy mê hoặc.", rarity: "EPIC", priceXp: 5000 },
  { id: "shadow-horns", name: "Shadow Horns", description: "Vương miện sừng tím với pha lê lơ lửng — bí ẩn, uy nghi, không thể rời mắt.", rarity: "EPIC", priceXp: 5000 },
  { id: "devil-headset", name: "Devil Headset", description: "Tai nghe ác ma đỏ thẫm với sừng nhọn và chiếc đuôi cong — năng lượng nổi loạn của kẻ không bao giờ bỏ cuộc.", rarity: "LEGENDARY", priceXp: 15000 },
  { id: "thunder-crest", name: "Thunder Crest", description: "Vòng giáp vàng đen cùng những tia sét tím xé toạc bóng tối — biểu tượng của nhà vô địch thực thụ.", rarity: "LEGENDARY", priceXp: 15000 },
  { id: "elemental-clash", name: "Elemental Clash", description: "Nửa vòng băng giá, nửa vòng lửa cháy hòa quyện đối nghịch — sự cân bằng giữa lý trí và đam mê.", rarity: "LEGENDARY", priceXp: 15000 },
  { id: "emerald-wand-aura", name: "Emerald Wand Aura", description: "Cây đũa phép cổ tỏa luồng khói xanh ngọc lục bảo thành vòng tròn huyền bí — phép thuật của tri thức.", rarity: "LEGENDARY", priceXp: 15000 },
  { id: "aurora-genesis", name: "Aurora Genesis", description: "Cực quang huyền thoại hiếm khi xuất hiện — chỉ dành cho những học viên kiên trì nhất.", rarity: "MYTHIC", priceXp: 30000 },
];

/** Placeholder until a real XP ledger exists (see XP_SHOP_ITEMS) — the
 * shop page renders this as the signed-in user's spendable balance. */
export const MOCK_USER_XP = 6000;

export function getShopItemStatus(userXp: number, priceXp: number): { canAfford: boolean; missingXp: number } {
  return { canAfford: userXp >= priceXp, missingXp: Math.max(0, priceXp - userXp) };
}
