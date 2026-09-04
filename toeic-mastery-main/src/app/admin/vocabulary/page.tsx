import type { Metadata } from "next";
import { db } from "@/lib/db";
import { VocabularyAddPanel } from "@/components/admin/vocabulary-add-panel";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteVocabularyWordAction } from "@/lib/actions/admin-vocabulary";

export const metadata: Metadata = { title: "Quản lý từ vựng" };

export default async function AdminVocabularyPage() {
  const [topics, words] = await Promise.all([
    db.vocabularyTopic.findMany({ orderBy: { orderIndex: "asc" } }),
    db.vocabularyWord.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { topic: { select: { name: true } } } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quản lý từ vựng</h1>
        <p className="mt-1 text-sm text-muted-foreground">{topics.length} chủ đề</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">THÊM TỪ VỰNG</h2>
        <VocabularyAddPanel topics={topics.map((t) => ({ id: t.id, name: t.name }))} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">TỪ VỰNG GẦN ĐÂY ({words.length})</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Từ</th>
                <th className="px-4 py-3 font-medium">Nghĩa</th>
                <th className="px-4 py-3 font-medium">Chủ đề</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {words.map((w) => (
                <tr key={w.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{w.word}</td>
                  <td className="px-4 py-3 text-muted-foreground">{w.meaningVi}</td>
                  <td className="px-4 py-3 text-muted-foreground">{w.topic.name}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton
                      label="Xóa"
                      description={`Xóa từ "${w.word}" khỏi hệ thống?`}
                      action={deleteVocabularyWordAction.bind(null, w.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
