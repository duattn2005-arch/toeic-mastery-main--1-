/**
 * Seeds the database with original, hand-authored TOEIC-style content.
 * Safe to re-run: every upsert is keyed by a stable slug/unique field, and
 * the one full mock test is deleted and rebuilt each run.
 *
 * Run with: npm run db:seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { TestPart, PassageFormat, PassageLayout } from "../src/generated/prisma/enums";

import { VOCABULARY_TOPICS } from "./seed-data/vocabulary";
import { VOCABULARY_TOPICS_BAND } from "./seed-data/vocabulary-band";
import { VOCABULARY_TOPICS_PART } from "./seed-data/vocabulary-part";
import { VOCABULARY_TOPICS_PHRASES } from "./seed-data/vocabulary-phrases";
import { GRAMMAR_TOPICS } from "./seed-data/grammar";
import { EXTRA_GRAMMAR_QUESTIONS } from "./seed-data/grammar-extra-questions";
import { PART1_QUESTIONS } from "./seed-data/part1";
import { PART2_QUESTIONS } from "./seed-data/part2";
import { PART3_CONVERSATIONS } from "./seed-data/part3";
import { PART4_TALKS } from "./seed-data/part4";
import { PART5_QUESTIONS } from "./seed-data/part5";
import { PART6_PASSAGES } from "./seed-data/part6";
import { PART7_PASSAGES } from "./seed-data/part7";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const LABELS = ["A", "B", "C", "D"] as const;

const ALL_VOCABULARY_TOPICS = [...VOCABULARY_TOPICS, ...VOCABULARY_TOPICS_BAND, ...VOCABULARY_TOPICS_PART, ...VOCABULARY_TOPICS_PHRASES];

async function seedVocabulary() {
  console.log(`Seeding ${ALL_VOCABULARY_TOPICS.length} vocabulary topics...`);
  for (const [i, topic] of ALL_VOCABULARY_TOPICS.entries()) {
    const created = await db.vocabularyTopic.upsert({
      where: { slug: topic.slug },
      update: { name: topic.name, description: topic.description, category: topic.category ?? null, orderIndex: i },
      create: { slug: topic.slug, name: topic.name, description: topic.description, category: topic.category ?? null, orderIndex: i },
    });

    for (const word of topic.words) {
      await db.vocabularyWord.upsert({
        where: { topicId_word: { topicId: created.id, word: word.word } },
        update: {},
        create: {
          topicId: created.id,
          word: word.word,
          ipa: word.ipa,
          partOfSpeech: word.partOfSpeech,
          meaningVi: word.meaningVi,
          definitionEn: word.definitionEn,
          exampleEn: word.exampleEn,
          exampleVi: word.exampleVi,
          synonyms: word.synonyms ?? [],
          collocations: word.collocations ?? [],
          difficulty: word.difficulty ?? "MEDIUM",
        },
      });
    }
  }
}

async function seedGrammar() {
  console.log(`Seeding ${GRAMMAR_TOPICS.length} grammar topics...`);
  for (const [i, topic] of GRAMMAR_TOPICS.entries()) {
    const createdTopic = await db.grammarTopic.upsert({
      where: { slug: topic.slug },
      update: { title: topic.title, category: topic.category, summary: topic.summary, orderIndex: i },
      create: { slug: topic.slug, title: topic.title, category: topic.category, summary: topic.summary, orderIndex: i },
    });

    await db.grammarLesson.upsert({
      where: { slug: topic.slug },
      update: { title: topic.title, theory: topic.theory, tips: topic.tips, examples: topic.examples },
      create: {
        topicId: createdTopic.id,
        slug: topic.slug,
        title: topic.title,
        theory: topic.theory,
        tips: topic.tips,
        examples: topic.examples,
      },
    });

    // Practice questions for this topic are standalone (no test) — Part 5
    // style fill-in-the-blank, replaced on every re-run for simplicity.
    // Merged with EXTRA_GRAMMAR_QUESTIONS (grammar-extra-questions.ts) rather
    // than physically combined into topic.questions, so both files stay
    // small and independently readable.
    await db.question.deleteMany({ where: { grammarTopicId: createdTopic.id, testId: null } });
    const allQuestions = [...topic.questions, ...(EXTRA_GRAMMAR_QUESTIONS[topic.slug] ?? [])];
    for (const q of allQuestions) {
      await db.question.create({
        data: {
          grammarTopicId: createdTopic.id,
          part: "PART5",
          prompt: q.prompt,
          correctLabel: LABELS[q.correctIndex],
          explanationVi: q.explanationVi,
          grammarTopicSlug: topic.slug,
          status: "PUBLISHED",
          options: { create: q.options.map((content, i) => ({ label: LABELS[i], content, isCorrect: i === q.correctIndex })) },
        },
      });
    }
  }
}

interface SectionCount {
  part: TestPart;
  count: number;
}

async function seedMockTest01() {
  console.log("Seeding TOEIC Mastery Mock Test 01...");

  const existing = await db.test.findUnique({ where: { slug: "toeic-mastery-mock-test-01" } });
  if (existing) {
    await db.test.delete({ where: { id: existing.id } });
  }

  const sectionCounts: SectionCount[] = [
    { part: "PART1", count: PART1_QUESTIONS.length },
    { part: "PART2", count: PART2_QUESTIONS.length },
    { part: "PART3", count: PART3_CONVERSATIONS.length * 3 },
    { part: "PART4", count: PART4_TALKS.length * 3 },
    { part: "PART5", count: PART5_QUESTIONS.length },
    { part: "PART6", count: PART6_PASSAGES.length * 4 },
    { part: "PART7", count: PART7_PASSAGES.reduce((sum, p) => sum + p.questions.length, 0) },
  ];
  const listeningQuestions = sectionCounts.slice(0, 4).reduce((sum, s) => sum + s.count, 0);
  const readingQuestions = sectionCounts.slice(4).reduce((sum, s) => sum + s.count, 0);
  const totalQuestions = listeningQuestions + readingQuestions;

  const test = await db.test.create({
    data: {
      slug: "toeic-mastery-mock-test-01",
      title: "TOEIC Mastery Mock Test 01",
      description:
        "Đề thi thử đầy đủ 200 câu (7 Part) do TOEIC Mastery biên soạn nguyên bản, quy đổi ra thang điểm 990 khi hoàn thành ở chế độ Thi thử.",
      difficulty: "MEDIUM",
      status: "PUBLISHED",
      isFullTest: true,
      durationMinutes: 120,
      listeningQuestions,
      readingQuestions,
      totalQuestions,
      allowReplay: false,
    },
  });

  await db.testSection.createMany({
    data: sectionCounts.map((s, i) => ({
      testId: test.id,
      part: s.part,
      title: `Part ${s.part.replace("PART", "")}`,
      orderIndex: i,
      questionCount: s.count,
    })),
  });
  const sections = await db.testSection.findMany({ where: { testId: test.id } });
  const sectionByPart = new Map(sections.map((s) => [s.part, s.id]));

  let orderIndex = 0;

  // Part 1 — photographs (audio-only in a real exam; transcript feeds the
  // TTS fallback since no photo/audio assets are bundled with this seed).
  for (const q of PART1_QUESTIONS) {
    await db.question.create({
      data: {
        testId: test.id,
        testSectionId: sectionByPart.get("PART1"),
        part: "PART1",
        orderIndex: orderIndex++,
        prompt: "",
        transcript: q.statements.map((s, i) => `(${LABELS[i]}) ${s}`).join(" "),
        correctLabel: LABELS[q.correctIndex],
        explanationVi: `${q.explanationVi} (Gợi ý cho hình ảnh: ${q.sceneNote})`,
        status: "PUBLISHED",
        options: { create: q.statements.map((content, i) => ({ label: LABELS[i], content, isCorrect: i === q.correctIndex })) },
      },
    });
  }

  // Part 2 — question-response (3 choices, not 4).
  for (const q of PART2_QUESTIONS) {
    await db.question.create({
      data: {
        testId: test.id,
        testSectionId: sectionByPart.get("PART2"),
        part: "PART2",
        orderIndex: orderIndex++,
        prompt: "",
        transcript: `${q.question} (A) ${q.responses[0]} (B) ${q.responses[1]} (C) ${q.responses[2]}`,
        correctLabel: LABELS[q.correctIndex],
        explanationVi: q.explanationVi,
        status: "PUBLISHED",
        options: { create: q.responses.map((content, i) => ({ label: LABELS[i], content, isCorrect: i === q.correctIndex })) },
      },
    });
  }

  // Part 3 — conversations (3 questions share one Passage).
  for (const convo of PART3_CONVERSATIONS) {
    const passage = await db.passage.create({
      data: {
        testId: test.id,
        part: "PART3",
        format: "CONVERSATION" as PassageFormat,
        layout: "SINGLE" as PassageLayout,
        title: convo.title,
        texts: [{ label: "Hội thoại", content: convo.transcript }],
        transcript: convo.transcript,
      },
    });
    for (const q of convo.questions) {
      await db.question.create({
        data: {
          testId: test.id,
          testSectionId: sectionByPart.get("PART3"),
          passageId: passage.id,
          part: "PART3",
          orderIndex: orderIndex++,
          prompt: q.prompt,
          correctLabel: LABELS[q.correctIndex],
          explanationVi: q.explanationVi,
          status: "PUBLISHED",
          options: { create: q.options.map((content, i) => ({ label: LABELS[i], content, isCorrect: i === q.correctIndex })) },
        },
      });
    }
  }

  // Part 4 — talks (3 questions share one Passage).
  for (const talk of PART4_TALKS) {
    const passage = await db.passage.create({
      data: {
        testId: test.id,
        part: "PART4",
        format: "TALK" as PassageFormat,
        layout: "SINGLE" as PassageLayout,
        title: talk.title,
        texts: [{ label: "Bài nói", content: talk.transcript }],
        transcript: talk.transcript,
      },
    });
    for (const q of talk.questions) {
      await db.question.create({
        data: {
          testId: test.id,
          testSectionId: sectionByPart.get("PART4"),
          passageId: passage.id,
          part: "PART4",
          orderIndex: orderIndex++,
          prompt: q.prompt,
          correctLabel: LABELS[q.correctIndex],
          explanationVi: q.explanationVi,
          status: "PUBLISHED",
          options: { create: q.options.map((content, i) => ({ label: LABELS[i], content, isCorrect: i === q.correctIndex })) },
        },
      });
    }
  }

  // Part 5 — incomplete sentences.
  for (const q of PART5_QUESTIONS) {
    await db.question.create({
      data: {
        testId: test.id,
        testSectionId: sectionByPart.get("PART5"),
        part: "PART5",
        orderIndex: orderIndex++,
        prompt: q.prompt,
        correctLabel: LABELS[q.correctIndex],
        explanationVi: q.explanationVi,
        grammarTopicSlug: q.grammarTopicSlug,
        vocabularyFocus: q.vocabularyFocus ?? [],
        status: "PUBLISHED",
        options: { create: q.options.map((content, i) => ({ label: LABELS[i], content, isCorrect: i === q.correctIndex })) },
      },
    });
  }

  // Part 6 — text completion (4 blanks share one Passage).
  for (const p of PART6_PASSAGES) {
    const passage = await db.passage.create({
      data: {
        testId: test.id,
        part: "PART6",
        format: p.format as PassageFormat,
        layout: "SINGLE" as PassageLayout,
        title: p.title,
        texts: [{ label: p.format, content: p.content }],
      },
    });
    for (const [i, blank] of p.blanks.entries()) {
      await db.question.create({
        data: {
          testId: test.id,
          testSectionId: sectionByPart.get("PART6"),
          passageId: passage.id,
          part: "PART6",
          orderIndex: orderIndex++,
          prompt: `Chọn từ/câu phù hợp nhất cho chỗ trống (${i + 1}) trong đoạn văn.`,
          correctLabel: LABELS[blank.correctIndex],
          explanationVi: blank.explanationVi,
          grammarTopicSlug: blank.grammarTopicSlug,
          status: "PUBLISHED",
          options: { create: blank.options.map((content, oi) => ({ label: LABELS[oi], content, isCorrect: oi === blank.correctIndex })) },
        },
      });
    }
  }

  // Part 7 — reading comprehension (single/double passages).
  for (const p of PART7_PASSAGES) {
    const passage = await db.passage.create({
      data: {
        testId: test.id,
        part: "PART7",
        format: p.format as PassageFormat,
        layout: p.layout as PassageLayout,
        title: p.title,
        texts: p.texts,
      },
    });
    for (const q of p.questions) {
      await db.question.create({
        data: {
          testId: test.id,
          testSectionId: sectionByPart.get("PART7"),
          passageId: passage.id,
          part: "PART7",
          orderIndex: orderIndex++,
          prompt: q.prompt,
          correctLabel: LABELS[q.correctIndex],
          explanationVi: q.explanationVi,
          evidenceText: q.evidenceText,
          status: "PUBLISHED",
          options: { create: q.options.map((content, i) => ({ label: LABELS[i], content, isCorrect: i === q.correctIndex })) },
        },
      });
    }
  }

  console.log(`  -> ${totalQuestions} questions created (Listening ${listeningQuestions}, Reading ${readingQuestions}).`);
}

async function seedDraftTests() {
  console.log("Seeding placeholder metadata for Mock Test 02/03...");
  for (const n of [2, 3]) {
    await db.test.upsert({
      where: { slug: `toeic-mastery-mock-test-0${n}` },
      update: {},
      create: {
        slug: `toeic-mastery-mock-test-0${n}`,
        title: `TOEIC Mastery Mock Test 0${n}`,
        description: "Đề thi đang được biên soạn — thêm câu hỏi qua Admin > Đề thi hoặc import JSON để xuất bản.",
        difficulty: "MEDIUM",
        status: "DRAFT",
        isFullTest: true,
        durationMinutes: 120,
        listeningQuestions: 100,
        readingQuestions: 100,
        totalQuestions: 200,
        allowReplay: false,
      },
    });
  }
}

async function main() {
  await seedVocabulary();
  await seedGrammar();
  await seedMockTest01();
  await seedDraftTests();
  console.log("\nSeed complete.");
  console.log("Next step: sign up a real account via /register, then promote it to admin with:");
  console.log("  npm run db:promote-admin -- your@email.com\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
