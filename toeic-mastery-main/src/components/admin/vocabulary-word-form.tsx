"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vocabularyWordFormSchema, type VocabularyWordFormInput } from "@/lib/validations/admin";
import { createVocabularyWordAction } from "@/lib/actions/admin-vocabulary";

export function VocabularyWordForm({ topics }: { topics: { id: string; name: string }[] }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(vocabularyWordFormSchema),
    defaultValues: {
      topicId: topics[0]?.id ?? "",
      word: "",
      ipa: "",
      partOfSpeech: "",
      meaningVi: "",
      definitionEn: "",
      exampleEn: "",
      exampleVi: "",
      synonyms: "",
      collocations: "",
      difficulty: "MEDIUM",
    },
  });

  async function onSubmit(values: VocabularyWordFormInput) {
    const result = await createVocabularyWordAction(values);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`Đã thêm "${values.word}"`);
      reset({ ...values, word: "", meaningVi: "", definitionEn: "", exampleEn: "", exampleVi: "", ipa: "", synonyms: "", collocations: "" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Chủ đề</Label>
          <Select value={watch("topicId")} onValueChange={(v) => setValue("topicId", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Từ</Label>
          <Input {...register("word")} />
          {errors.word && <p className="text-xs text-destructive">{errors.word.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Loại từ</Label>
          <Input {...register("partOfSpeech")} placeholder="noun / verb / adj..." />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>IPA</Label>
          <Input {...register("ipa")} placeholder="/nɪˈɡəʊʃieɪʃn/" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Nghĩa tiếng Việt</Label>
          <Input {...register("meaningVi")} />
          {errors.meaningVi && <p className="text-xs text-destructive">{errors.meaningVi.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Định nghĩa (tiếng Anh)</Label>
        <Input {...register("definitionEn")} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Ví dụ (Anh)</Label>
          <Input {...register("exampleEn")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Ví dụ (Việt)</Label>
          <Input {...register("exampleVi")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Đồng nghĩa (phân tách bởi dấu phẩy)</Label>
          <Input {...register("synonyms")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Collocations</Label>
          <Input {...register("collocations")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Độ khó</Label>
          <Select value={watch("difficulty")} onValueChange={(v) => setValue("difficulty", v as VocabularyWordFormInput["difficulty"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EASY">Dễ</SelectItem>
              <SelectItem value="MEDIUM">Trung bình</SelectItem>
              <SelectItem value="HARD">Khó</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Thêm từ vựng
      </Button>
    </form>
  );
}
