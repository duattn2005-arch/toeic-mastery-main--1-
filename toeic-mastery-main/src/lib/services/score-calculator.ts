import { db } from "@/lib/db";

export interface ScoreResult {
  listening: number;
  reading: number;
  total: number;
  /** Always true until an admin uploads a licensed ETS conversion table. */
  isEstimated: boolean;
}

type ConversionTable = Record<string, number>;

/**
 * TOEIC scaled scores run 5-495 per skill in steps of 5. Nobody outside ETS
 * publishes the official raw->scaled curve, so the default table below is a
 * smooth, monotonic estimate — never presented as the real ETS conversion.
 * Admins can override it with `ScoreConversionTable` (see admin/settings).
 */
function buildDefaultTable(): ConversionTable {
  const table: ConversionTable = {};
  for (let correct = 0; correct <= 100; correct++) {
    const raw = 5 + (correct / 100) * 490;
    table[String(correct)] = Math.round(raw / 5) * 5;
  }
  return table;
}

const DEFAULT_TABLE = buildDefaultTable();

function lookup(table: ConversionTable, correct: number): number {
  const clamped = Math.max(0, Math.min(100, Math.round(correct)));
  return table[String(clamped)] ?? DEFAULT_TABLE[String(clamped)];
}

export class ScoreCalculator {
  private listeningTable: ConversionTable;
  private readingTable: ConversionTable;
  private isEstimated: boolean;

  private constructor(listeningTable: ConversionTable, readingTable: ConversionTable, isEstimated: boolean) {
    this.listeningTable = listeningTable;
    this.readingTable = readingTable;
    this.isEstimated = isEstimated;
  }

  static async load(): Promise<ScoreCalculator> {
    const active = await db.scoreConversionTable.findFirst({ where: { isActive: true } });
    if (active) {
      return new ScoreCalculator(
        active.listeningTable as ConversionTable,
        active.readingTable as ConversionTable,
        false
      );
    }
    return new ScoreCalculator(DEFAULT_TABLE, DEFAULT_TABLE, true);
  }

  static withDefaultTable(): ScoreCalculator {
    return new ScoreCalculator(DEFAULT_TABLE, DEFAULT_TABLE, true);
  }

  calculate(listeningCorrect: number, readingCorrect: number): ScoreResult {
    const listening = lookup(this.listeningTable, listeningCorrect);
    const reading = lookup(this.readingTable, readingCorrect);
    return { listening, reading, total: listening + reading, isEstimated: this.isEstimated };
  }
}
