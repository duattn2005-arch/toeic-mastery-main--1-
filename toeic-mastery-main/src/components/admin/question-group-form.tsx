"use client";

import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionAudioUploader } from "@/components/admin/question-audio-uploader";
import { ImageUploader } from "@/components/admin/image-uploader";
import { QuestionGroupQuestionFields } from "@/components/admin/question-group-question-fields";
import {
  questionGroupFormSchema,
  PASSAGE_PART_VALUES,
  PASSAGE_FORMAT_VALUES,
  PASSAGE_LAYOUT_VALUES,
  type QuestionGroupFormInput,
} from "@/lib/validations/admin";
import { createQuestionGroupAction } from "@/lib/actions/admin-passages";
import { PART_META } from "@/lib/constants/toeic";

const FORMAT_LABEL_VI: Record<(typeof PASSAGE_FORMAT_VALUES)[number], string> = {
  CONVERSATION: "Hội thoại",
  TALK: "Bài nói ngắn",
  EMAIL: "E-mail",
  ADVERTISEMENT: "Quảng cáo",
  MEMO: "Ghi chú nội bộ",
  NOTICE: "Thông báo",
  ARTICLE: "Bài báo",
  CHAT: "Tin nhắn",
  INVOICE: "Hóa đơn",
  SCHEDULE: "Lịch trình",
  FORM: "Biểu mẫu",
  LETTER: "Thư",
  OTHER: "Khác",
};

const LAYOUT_LABEL_VI: Record<(typeof PASSAGE_LAYOUT_VALUES)[number], string> = {
  SINGLE: "1 bài đọc",
  DOUBLE: "2 bài đọc",
  TRIPLE: "3 bài đọc",
};

const BLANK_QUESTION: QuestionGroupFormInput["questions"][number] = {
  prompt: "",
  correctLabel: "A",
  explanationVi: "",
  grammarTopicSlug: "",
  vocabularyFocus: "",
  evidenceText: "",
  options: [
    { label: "A", content: "" },
    { label: "B", content: "" },
    { label: "C", content: "" },
    { label: "D", content: "" },
  ],
};

export function QuestionGroupForm({ testOptions }: { testOptions: { id: string; title: string }[] }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<QuestionGroupFormInput>({
    resolver: zodResolver(questionGroupFormSchema),
    defaultValues: {
      testId: "",
      part: "PART3",
      format: "CONVERSATION",
      layout: "SINGLE",
      title: "",
      audioUrl: "",
      imageUrl: "",
      transcript: "",
      texts: [],
      difficulty: "MEDIUM",
      status: "PUBLISHED",
      questions: [{ ...BLANK_QUESTION }, { ...BLANK_QUESTION }],
    },
  });

  const part = watch("part");
  const isReadingPart = part === "PART6" || part === "PART7";

  const textsArray = useFieldArray({ control, name: "texts" });
  const questionsArray = useFieldArray({ control, name: "questions" });

  async function onSubmit(values: QuestionGroupFormInput) {
    const result = await createQuestionGroupAction(values);
    if (result?.error) toast.error(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 lg:flex-row lg:items-start" noValidate>
      {/* Left column: the shared stimulus (audio/passage) all questions below reference. */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-6 lg:w-[420px] lg:shrink-0">
        <p className="text-sm font-semibold">Đề chung (audio / bài đọc)</p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Part">
            <Select value={part} onValueChange={(v) => setValue("part", v as QuestionGroupFormInput["part"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PASSAGE_PART_VALUES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PART_META[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Định dạng">
            <Select value={watch("format")} onValueChange={(v) => setValue("format", v as QuestionGroupFormInput["format"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PASSAGE_FORMAT_VALUES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {FORMAT_LABEL_VI[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {isReadingPart && (
          <Field label="Số bài đọc (Part 7 đôi/ba)">
            <Select value={watch("layout")} onValueChange={(v) => setValue("layout", v as QuestionGroupFormInput["layout"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PASSAGE_LAYOUT_VALUES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {LAYOUT_LABEL_VI[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <Field label="Tiêu đề (không bắt buộc)">
          <Input {...register("title")} placeholder="VD: Questions 135-138 refer to..." />
        </Field>

        {!isReadingPart && (
          <>
            <Field label="Audio">
              <QuestionAudioUploader value={watch("audioUrl") ?? ""} onChange={(url) => setValue("audioUrl", url, { shouldValidate: true })} />
            </Field>
            <Field label="Transcript (dùng đọc bằng giọng máy nếu chưa có file audio thật — học viên không nhìn thấy chữ này)">
              <Textarea rows={5} {...register("transcript")} />
            </Field>
          </>
        )}

        <Field label={isReadingPart ? "Ảnh bài đọc (không bắt buộc, VD: quảng cáo dạng ảnh)" : "Ảnh minh họa (không bắt buộc)"}>
          <ImageUploader value={watch("imageUrl") ?? ""} onChange={(url) => setValue("imageUrl", url, { shouldValidate: true })} />
        </Field>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>
              {isReadingPart
                ? "Nội dung bài đọc"
                : "Nội dung hội thoại hiển thị cho học viên đọc theo (không bắt buộc, khác với Transcript ở trên)"}
            </Label>
            {textsArray.fields.length < 3 && (
              <button
                type="button"
                onClick={() => textsArray.append({ label: `Đoạn ${textsArray.fields.length + 1}`, content: "" })}
                className="text-xs font-medium text-primary hover:underline"
              >
                + Thêm đoạn văn
              </button>
            )}
          </div>
          {textsArray.fields.map((field, i) => (
            <div key={field.id} className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
              <div className="flex items-center gap-2">
                <Input {...register(`texts.${i}.label` as const)} placeholder="VD: E-mail 1" className="flex-1" />
                {textsArray.fields.length > 1 && (
                  <button type="button" onClick={() => textsArray.remove(i)} className="text-xs text-muted-foreground hover:text-destructive">
                    Xóa
                  </button>
                )}
              </div>
              <Textarea rows={5} {...register(`texts.${i}.content` as const)} placeholder="Nội dung đoạn văn..." />
            </div>
          ))}
          {textsArray.fields.length === 0 && (
            <button
              type="button"
              onClick={() => textsArray.append({ label: isReadingPart ? "Đoạn 1" : "Hội thoại", content: "" })}
              className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              + Thêm nội dung {isReadingPart ? "bài đọc" : "hiển thị"}
            </button>
          )}
          {errors.texts && <p className="text-xs text-destructive">Vui lòng nhập đủ nội dung bài đọc</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Thuộc đề thi (không bắt buộc)">
            <Select value={watch("testId") || "none"} onValueChange={(v) => setValue("testId", v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Chưa gán —</SelectItem>
                {testOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Trạng thái">
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v as QuestionGroupFormInput["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Nháp</SelectItem>
                <SelectItem value="PUBLISHED">Xuất bản</SelectItem>
                <SelectItem value="ARCHIVED">Lưu trữ</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Độ khó (áp dụng cho cả nhóm)">
          <Select value={watch("difficulty")} onValueChange={(v) => setValue("difficulty", v as QuestionGroupFormInput["difficulty"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EASY">Dễ</SelectItem>
              <SelectItem value="MEDIUM">Trung bình</SelectItem>
              <SelectItem value="HARD">Khó</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Right column: the group's questions, added/removed independently of the stimulus. */}
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Các câu hỏi trong nhóm ({questionsArray.fields.length})</p>
          {questionsArray.fields.length < 6 && (
            <button
              type="button"
              onClick={() => questionsArray.append({ ...BLANK_QUESTION })}
              className="text-xs font-medium text-primary hover:underline"
            >
              + Thêm câu hỏi
            </button>
          )}
        </div>

        {errors.questions?.root && <p className="text-xs text-destructive">{errors.questions.root.message}</p>}
        {typeof errors.questions?.message === "string" && <p className="text-xs text-destructive">{errors.questions.message}</p>}

        {questionsArray.fields.map((field, index) => (
          <QuestionGroupQuestionFields
            key={field.id}
            control={control}
            register={register}
            watch={watch}
            setValue={setValue}
            index={index}
            errors={errors}
            onRemove={() => questionsArray.remove(index)}
            canRemove={questionsArray.fields.length > 2}
          />
        ))}

        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Tạo nhóm câu hỏi
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
