"use client";

import * as React from "react";
import { useFieldArray, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OPTION_LABEL_VALUES, type QuestionGroupFormInput } from "@/lib/validations/admin";

const OPTION_LABELS = OPTION_LABEL_VALUES;

/**
 * One question's fields within a group's `questions` array — each instance
 * owns its own nested `useFieldArray` for that question's own `options`.
 * Nested useFieldArray-of-useFieldArray is the standard react-hook-form
 * pattern for this shape, as long as (like here) each nested array's hook
 * call lives in its own component instance rather than inside a parent
 * `.map()` — mirrors question-form.tsx's single-question options UI almost
 * verbatim so the two stay visually consistent.
 */
export function QuestionGroupQuestionFields({
  control,
  register,
  watch,
  setValue,
  index,
  errors,
  onRemove,
  canRemove,
}: {
  control: Control<QuestionGroupFormInput>;
  register: UseFormRegister<QuestionGroupFormInput>;
  watch: UseFormWatch<QuestionGroupFormInput>;
  setValue: UseFormSetValue<QuestionGroupFormInput>;
  index: number;
  errors: FieldErrors<QuestionGroupFormInput>;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: `questions.${index}.options` });
  const correctLabel = watch(`questions.${index}.correctLabel`);
  const questionErrors = errors.questions?.[index];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Câu hỏi #{index + 1}</p>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-muted-foreground hover:text-destructive">
            Xóa câu hỏi
          </button>
        )}
      </div>

      <Field label="Câu hỏi" error={questionErrors?.prompt?.message}>
        <Textarea rows={2} {...register(`questions.${index}.prompt` as const)} />
      </Field>

      <div className="flex flex-col gap-2">
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
        {fields.map((field, optionIndex) => (
          <div key={field.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setValue(`questions.${index}.correctLabel`, OPTION_LABELS[optionIndex])}
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                correctLabel === OPTION_LABELS[optionIndex] ? "border-success bg-success text-white" : "border-input text-muted-foreground"
              }`}
              title="Đánh dấu là đáp án đúng"
            >
              {OPTION_LABELS[optionIndex]}
            </button>
            <Input
              {...register(`questions.${index}.options.${optionIndex}.content` as const)}
              placeholder={`Nội dung lựa chọn ${OPTION_LABELS[optionIndex]}`}
            />
            {fields.length > 2 && (
              <button type="button" onClick={() => remove(optionIndex)} className="text-xs text-muted-foreground hover:text-destructive">
                Xóa
              </button>
            )}
          </div>
        ))}
        {questionErrors?.correctLabel && <p className="text-xs text-destructive">{questionErrors.correctLabel.message}</p>}
        {questionErrors?.options && <p className="text-xs text-destructive">Vui lòng nhập đủ nội dung các lựa chọn</p>}
      </div>

      <Field label="Giải thích (Tiếng Việt)" error={questionErrors?.explanationVi?.message}>
        <Textarea rows={2} {...register(`questions.${index}.explanationVi` as const)} />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Chủ điểm ngữ pháp (slug, không bắt buộc)">
          <Input {...register(`questions.${index}.grammarTopicSlug` as const)} placeholder="prepositions-of-time" />
        </Field>
        <Field label="Từ vựng trọng tâm (phân tách bởi dấu phẩy)">
          <Input {...register(`questions.${index}.vocabularyFocus` as const)} placeholder="negotiation, deadline" />
        </Field>
      </div>

      <Field label="Bằng chứng trong bài đọc (evidence, không bắt buộc)">
        <Textarea rows={2} {...register(`questions.${index}.evidenceText` as const)} />
      </Field>
    </div>
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
