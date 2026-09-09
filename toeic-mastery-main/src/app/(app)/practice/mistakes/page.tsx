import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getMistakeQuestions } from "@/lib/data/mistakes";
import { MistakeBankClient } from "@/components/practice/mistake-bank-client";

export const metadata: Metadata = { title: "Ngân hàng lỗi sai" };

export default async function MistakeBankPage() {
  const profile = await requireUser();
  const { questions, countByPart } = await getMistakeQuestions(profile.id);

  return <MistakeBankClient questions={questions} countByPart={countByPart} />;
}
