/**
 * Clusters a list of questions (already ordered so a shared-passage group's
 * rows are contiguous — e.g. by [part, orderIndex] or just orderIndex) into
 * blocks: consecutive rows pointing at the same Passage become one group
 * block, everything else stays its own single-row block. Used by both the
 * admin questions list and a single test's own question list so a Part
 * 3/4/6/7 group renders as one visual unit in either place instead of
 * indistinguishable individual rows.
 */
export function clusterQuestionsByPassage<T extends { passage: { id: string } | null }>(
  questions: T[]
): { passage: T["passage"]; rows: T[] }[] {
  const blocks: { passage: T["passage"]; rows: T[] }[] = [];
  for (const q of questions) {
    const last = blocks[blocks.length - 1];
    if (q.passage && last?.passage?.id === q.passage.id) last.rows.push(q);
    else blocks.push({ passage: q.passage, rows: [q] });
  }
  return blocks;
}
