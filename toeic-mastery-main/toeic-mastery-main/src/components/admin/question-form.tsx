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
import { questionFormSchema, TEST_PART_VALUES, type QuestionFormInput } from "@/lib/validations/admin";
import { createQuestionAction, updateQuestionAction } from "@/lib/actions/admin-questions";
import { PART_META } from "@/lib/constants/toeic";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export function QuestionForm({ questionId, defaultValues, testOptions }: {
  questionId?: string;
  defaultValues: QuestionFormInput;
  testOptions: { id: string; title: string }[];
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(questionFormSchema), defaultValues });

  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const part = watch("part");
  const correctLabel = watch("correctLabel");
  const status = watch("status");
  const isAudioPart = part === "PART1" || part === "PART2" || part === "PART3" || part === "PART4";

  async function onSubmit(values: QuestionFormInput) {
    const result = questionId ? await updateQuestionAction(questionId, values) : await createQuestionAction(values);
    if (result?.error) toast.error(result.error);
    else if (questionId) toast.success(values.status === "PUBLISHED" ? "Đã xuất bản câu hỏi" : "Đã lưu câu hỏi");
  }

  async function onPublishNow() {
    setValue("status", "PUBLISHED");
    await handleSubmit(onSubmit)();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Part">
          <Select value={part} onValueChange={(v) => setValue("part", v as QuestionFormInput["part"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEST_PART_VALUES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PART_META[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Độ khó">
          <Select value={watch("difficulty")} onValueChange={(v) => setValue("difficulty", v as QuestionFormInput["difficulty"])}>
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
          <Select value={status} onValueChange={(v) => setValue("status", v as QuestionFormInput["status"])}>
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

      <Field label={isAudioPart ? "Văn bản câu hỏi (không bắt buộc với Part 1/2)" : "Câu hỏi"} error={errors.prompt?.message}>
        <Textarea rows={2} {...register("prompt")} />
      </Field>

      {isAudioPart && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Audio" error={errors.audioUrl?.message}>
            <QuestionAudioUploader value={watch("audioUrl") ?? ""} onChange={(url) => setValue("audioUrl", url, { shouldValidate: true })} />
          </Field>
          <Field label="Ảnh (Part 1 hoặc bảng biểu)" error={errors.imageUrl?.message}>
            <ImageUploader value={watch("imageUrl") ?? ""} onChange={(url) => setValue("imageUrl", url, { shouldValidate: true })} />
          </Field>
        </div>
      )}

      {!isAudioPart && (
        <Field label="Ảnh minh họa (không bắt buộc)" error={errors.imageUrl?.message}>
          <ImageUploader value={watch("imageUrl") ?? ""} onChange={(url) => setValue("imageUrl", url, { shouldValidate: true })} />
        </Field>
      )}

      {isAudioPart && (
        <Field label="Transcript">
          <Textarea rows={3} {...register("transcript")} />
        </Field>
      )}

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <Label>Đáp án</Label>
          {fields.length < 4 && (
            <button
              type="button"
              onClick={() => append({ label: OPTION_LABELS[fields.length], content: "" })}
              className="text-xs font-medium text-primary hover:underline"
            >
              + Thêm lựa chọn
            </button>
          )}
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setValue("correctLabel", OPTION_LABELS[index])}
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                correctLabel === OPTION_LABELS[index] ? "border-success bg-success text-white" : "border-input text-muted-foreground"
              }`}
              title="Đánh dấu là đáp án đúng"
            >
              {OPTION_LABELS[index]}
            </button>
            <Input {...register(`options.${index}.content` as const)} placeholder={`Nội dung lựa chọn ${OPTION_LABELS[index]}`} />
            {fields.length > 2 && (
              <button type="button" onClick={() => remove(index)} className="text-xs text-muted-foreground hover:text-destructive">
                Xóa
              </button>
            )}
          </div>
        ))}
        {errors.correctLabel && <p className="text-xs text-destructive">{errors.correctLabel.message}</p>}
        {errors.options && <p className="text-xs text-destructive">Vui lòng nhập đủ nội dung các lựa chọn</p>}
      </div>

      <Field label="Giải thích (Tiếng Việt)" error={errors.explanationVi?.message}>
        <Textarea rows={3} {...register("explanationVi")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Chủ điểm ngữ pháp (slug, không bắt buộc)">
          <Input {...register("grammarTopicSlug")} placeholder="prepositions-of-time" />
        </Field>
        <Field label="Từ vựng trọng tâm (phân tách bởi dấu phẩy)">
          <Input {...register("vocabularyFocus")} placeholder="negotiation, deadline" />
        </Field>
      </div>

      {!isAudioPart && (
        <Field label="Bằng chứng trong bài đọc (evidence, không bắt buộc)">
          <Textarea rows={2} {...register("evidenceText")} />
        </Field>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting} variant={status === "PUBLISHED" ? "default" : "outline"}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {questionId ? "Lưu thay đổi" : status === "PUBLISHED" ? "Tạo & xuất bản" : "Tạo (nháp)"}
        </Button>
        {status !== "PUBLISHED" && (
          <Button type="button" disabled={isSubmitting} onClick={onPublishNow}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Xuất bản ngay
          </Button>
        )}
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
