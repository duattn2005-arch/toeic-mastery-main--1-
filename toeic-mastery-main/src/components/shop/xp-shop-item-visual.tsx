import type { ShopItemRarity } from "@/lib/constants/xp-shop";
import {
  AuroraGenesisFrame,
  BambooSerenityFrame,
  CoconutBreezeFrame,
  DailySparkFrame,
  DevilHeadsetFrame,
  ElementalClashFrame,
  EmberCrownFrame,
  EmeraldWandAuraFrame,
  EternalBloomFrame,
  FrostHaloFrame,
  GlacierCrownFrame,
  LeafWhisperFrame,
  MoonlitPathFrame,
  MorningDewFrame,
  OceanRingFrame,
  PhoenixEmberFrame,
  RiptideRingFrame,
  RoyalAscensionFrame,
  SakuraShrineFrame,
  ShadowHornsFrame,
  SparkTrailFrame,
  StarforgedHaloFrame,
  StormSailFrame,
  ThunderCrestFrame,
  VerdantBladeFrame,
  VoidwalkerFrame,
} from "@/components/shop/xp-shop-scene-frames";

type SceneComponent = React.ComponentType<{ size: number; rarity: ShopItemRarity }>;

/** Every shop item gets its own illustrated scene (see
 * xp-shop-scene-frames.tsx), keyed by item id rather than theme — items
 * that share a theme (e.g. the three "ember" items) still need to look
 * different from each other. */
const ITEM_FRAMES: Record<string, SceneComponent> = {
  "daily-spark": DailySparkFrame,
  "morning-dew": MorningDewFrame,
  "leaf-whisper": LeafWhisperFrame,
  "ocean-ring": OceanRingFrame,
  "storm-sail": StormSailFrame,
  "spark-trail": SparkTrailFrame,
  "moonlit-path": MoonlitPathFrame,
  "bamboo-serenity": BambooSerenityFrame,
  "ember-crown": EmberCrownFrame,
  "coconut-breeze": CoconutBreezeFrame,
  "riptide-ring": RiptideRingFrame,
  "verdant-blade": VerdantBladeFrame,
  "frost-halo": FrostHaloFrame,
  "sakura-shrine": SakuraShrineFrame,
  "shadow-horns": ShadowHornsFrame,
  "royal-ascension": RoyalAscensionFrame,
  "glacier-crown": GlacierCrownFrame,
  "devil-headset": DevilHeadsetFrame,
  "thunder-crest": ThunderCrestFrame,
  "elemental-clash": ElementalClashFrame,
  "emerald-wand-aura": EmeraldWandAuraFrame,
  "phoenix-ember": PhoenixEmberFrame,
  voidwalker: VoidwalkerFrame,
  "aurora-genesis": AuroraGenesisFrame,
  "eternal-bloom": EternalBloomFrame,
  "starforged-halo": StarforgedHaloFrame,
};

/** An avatar frame preview for the XP shop — dispatches to the item's
 * bespoke illustrated scene by id. */
export function XpShopItemVisual({ id, rarity, size = 92 }: { id: string; rarity: ShopItemRarity; size?: number }) {
  const SceneFrame = ITEM_FRAMES[id];
  if (!SceneFrame) return null;
  return <SceneFrame size={size} rarity={rarity} />;
}
