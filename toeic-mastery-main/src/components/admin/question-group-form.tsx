"use client";

import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardPaste, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuestionAudioUploader } from "@/components/admin/question-audio-uploader";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ImportGuideCallout } from "@/components/admin/import-guide-callout";
import { QuestionGroupQuestionFields } from "@/components/admin/question-group-question-fields";
import {
  questionGroupFormSchema,
  PASSAGE_PART_VALUES,
  PASSAGE_FORMAT_VALUES,
  PASSAGE_LAYOUT_VALUES,
  OPTION_LABEL_VALUES,
  type QuestionGroupFormInput,
} from "@/lib/validations/admin";
import { createQuestionGroupAction, updateQuestionGroupAction } from "@/lib/actions/admin-passages";
import { parseGroupPaste } from "@/lib/services/azota-question-parser";
import { PART_META } from "@/lib/constants/toeic";
import { cn } from "@/lib/utils";

const NO_EXPLANATION_PLACEHOLDER = "(Chưa có giải thích — vui lòng bổ sung)";

const GROUP_PASTE_EXAMPLE = `Questions 135-137 refer to the following conversation.

W: Hi, I'm calling about the marketing proposal we sent over last week.
M: Right, I remember. Did you have any questions about the budget section?
W: Yes, actually — could you send me the updated figures by Friday afternoon?

Câu 135. What is the conversation mainly about?
A. A job interview
*B. A marketing proposal
C. A new client
D. An office move

Câu 136. What does the woman ask the man to do?
A. Call her back
*B. Send updated figures
C. Cancel the meeting
D. Book a room

Câu 137. When does the woman need the information?
A. By Monday
B. By Wednesday
*C. By Friday afternoon
D. By the end of the month`;

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

/**
 * One group's authoring form — QuestionGroupWorkspace mounts one instance per
 * tab (all simultaneously, toggling `hidden` to switch between them) so each
 * tab keeps its own react-hook-form state instead of having to serialize and
 * restore it on every switch.
 */
export function QuestionGroupForm({
  testOptions,
  defaultTestId = "",
  defaultPart = "PART3",
  hidden = false,
  initialValues,
  initialPassageId,
  onSaved,
  tabsBar,
}: {
  testOptions: { id: string; title: string }[];
  defaultTestId?: string;
  defaultPart?: QuestionGroupFormInput["part"];
  /** Kept mounted but visually hidden — see the class comment above. */
  hidden?: boolean;
  /** Full prefill for editing an existing group (the standalone
   * /admin/questions/groups/[passageId]/edit page) — overrides
   * defaultTestId/defaultPart/the blank-question defaults entirely. */
  initialValues?: QuestionGroupFormInput;
  /** Pairs with initialValues: the group being edited, so the first Save
   * here updates it instead of creating a new one. */
  initialPassageId?: string;
  /** Fires after every successful save (create AND update) so the
   * workspace can mark this tab done and hand off to the next one. */
  onSaved?: (passageId?: string) => void;
  /** QuestionGroupWorkspace's group-tab strip, rendered just below the "Dán
   * nhanh" bar — passed in rather than wrapping this component so it can
   * sit inside the same visual block without lifting the paste dialog
   * (which needs this form's own textsArray/questionsArray/setValue) up
   * into the workspace. */
  tabsBar?: React.ReactNode;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<QuestionGroupFormInput>({
    resolver: zodResolver(questionGroupFormSchema),
    defaultValues: initialValues ?? {
      testId: defaultTestId,
      part: defaultPart,
      format: "CONVERSATION",
      layout: "SINGLE",
      title: "",
      audioUrl: "",
      imageUrls: [],
      transcript: "",
      texts: [],
      difficulty: "MEDIUM",
      status: "PUBLISHED",
      questions: [{ ...BLANK_QUESTION }, { ...BLANK_QUESTION }],
    },
  });

  // Tracks whether this form has been saved yet — once it has (either it
  // started as an edit of an existing group, or a create just succeeded),
  // every further Save updates that same group instead of creating a
  // second one. This is what actually fixes "changing anything after
  // saving has no way to save again": the old code just disabled the
  // button once saved and never had an update path at all.
  const [passageId, setPassageId] = React.useState(initialPassageId);

  const part = watch("part");
  const isReadingPart = part === "PART6" || part === "PART7";

  const textsArray = useFieldArray({ control, name: "texts" });
  const questionsArray = useFieldArray({ control, name: "questions" });
  // Up to 3 image slots. The zod schema validates imageUrls as real URLs
  // only (no blanks allowed), but a slot the admin just added via "+ Thêm
  // ảnh" starts empty until they paste/upload into it — so slot *positions*
  // live in local state (can include a blank one being filled) while the
  // RHF/zod `imageUrls` value it syncs into only ever holds the non-empty
  // URLs, in slot order.
  const [imageSlots, setImageSlots] = React.useState<string[]>(initialValues?.imageUrls ?? []);
  function syncImageUrls(slots: string[]) {
    setImageSlots(slots);
    setValue(
      "imageUrls",
      slots.filter((u) => u !== ""),
      { shouldValidate: true }
    );
  }
  function addImageSlot() {
    setImageSlots((prev) => [...prev, ""]);
  }
  function setImageSlot(i: number, url: string) {
    syncImageUrls(imageSlots.map((u, idx) => (idx === i ? url : u)));
  }
  function removeImageSlot(i: number) {
    syncImageUrls(imageSlots.filter((_, idx) => idx !== i));
  }

  const [pasteOpen, setPasteOpen] = React.useState(false);
  const [pasteText, setPasteText] = React.useState("");
  const groupPaste = React.useMemo(() => parseGroupPaste(pasteText), [pasteText]);

  // Fills the shared stimulus (transcript for Part 3/4, reading passage for
  // Part 6/7) and replaces the whole questions array in one go — same
  // "parse into a preview, apply on confirm" flow as QuestionCardListEditor's
  // own "Nhập nhiều câu cùng lúc", just extended with the passage/transcript
  // half a group also needs. Doesn't touch audio/image/title/test — those
  // still need to be set by hand either way.
  function applyGroupPaste() {
    if (groupPaste.questions.length === 0) return;

    if (groupPaste.passageText) {
      if (isReadingPart) {
        textsArray.replace([{ label: textsArray.fields[0]?.label || "Đoạn 1", content: groupPaste.passageText }]);
      } else {
        setValue("transcript", groupPaste.passageText);
      }
    }

    questionsArray.replace(
      groupPaste.questions.map((q) => ({
        prompt: q.question,
        correctLabel: q.correctAnswer,
        explanationVi: NO_EXPLANATION_PLACEHOLDER,
        grammarTopicSlug: "",
        vocabularyFocus: "",
        evidenceText: "",
        options: q.options.map((content, i) => ({ label: OPTION_LABEL_VALUES[i], content })),
      }))
    );

    setPasteOpen(false);
    setPasteText("");
  }

  async function onSubmit(values: QuestionGroupFormInput) {
    const result = passageId ? await updateQuestionGroupAction(passageId, values) : await createQuestionGroupAction(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(passageId ? "Đã cập nhật nhóm câu hỏi." : "Đã lưu nhóm câu hỏi.");
    if (result?.passageId) setPassageId(result.passageId);
    onSaved?.(result?.passageId);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn(hidden ? "hidden" : "flex", "flex-col gap-6")} noValidate>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
        <div className="flex flex-col gap-0.5">
          <Button type="button" onClick={() => setPasteOpen(true)} className="w-fit shadow-sm">
            <ClipboardPaste className="size-4" /> Dán nhanh
          </Button>
          <p className="text-xs text-muted-foreground">Dán cả đoạn hội thoại/bài đọc + các câu hỏi cùng lúc, thay vì nhập tay từng câu.</p>
        </div>
      </div>

      {tabsBar}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left column: the shared stimulus (audio/passage) all questions below reference. */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-6 lg:w-[420px] lg:shrink-0">
          <p className="text-sm font-semibold">Đề chung (audio / bài đọc)</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Part">
              <Select
                value={part}
                onValueChange={(v) => setValue("part", v as QuestionGroupFormInput["part"])}
                disabled={!!passageId}
              >
                <SelectTrigger title={passageId ? "Không thể đổi Part sau khi đã lưu — tạo nhóm mới nếu cần đổi" : undefined}>
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

          <Field label={isReadingPart ? "Ảnh bài đọc (không bắt buộc, tối đa 3 ảnh)" : "Ảnh minh họa (không bắt buộc, tối đa 3 ảnh)"}>
            <div className="flex flex-col gap-2">
              {imageSlots.map((url, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1">
                    <ImageUploader value={url} onChange={(newUrl) => setImageSlot(i, newUrl)} />
                  </div>
                  <button type="button" onClick={() => removeImageSlot(i)} className="mt-2 text-xs text-muted-foreground hover:text-destructive">
                    Xóa
                  </button>
                </div>
              ))}
              {imageSlots.length < 3 && (
                <button type="button" onClick={addImageSlot} className="w-fit text-xs font-medium text-primary hover:underline">
                  + Thêm ảnh
                </button>
              )}
            </div>
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
              <Select value={watch("testId") || "none"} onValueChange={(v) => setValue("testId", v === "none" ? "" : v)} disabled={!!passageId}>
                <SelectTrigger title={passageId ? "Không thể đổi đề thi sau khi đã lưu — tạo nhóm mới nếu cần đổi" : undefined}>
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
            {passageId ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </div>

      <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Dán nhanh cả nhóm câu hỏi</DialogTitle>
            <DialogDescription>
              Dán đoạn hội thoại/bài đọc rồi tới các câu hỏi — hệ thống tự tách ra để bạn chỉnh sửa trước khi lưu.
            </DialogDescription>
          </DialogHeader>

          <ImportGuideCallout>
            <p className="font-medium">Định dạng cần dán</p>
            <p className="text-muted-foreground">
              Toàn bộ nội dung phía trên dòng &quot;Câu N.&quot; đầu tiên được coi là đoạn hội thoại/bài đọc chung (điền vào ô{" "}
              {isReadingPart ? "Nội dung bài đọc" : "Transcript"} bên trái). Từ đó trở đi, mỗi câu bắt đầu bằng &quot;Câu N.&quot; (hoặc
              &quot;Question N.&quot;), theo sau là 2-4 dòng lựa chọn A./B./C./D. — đánh dấu đáp án đúng bằng dấu <b>*</b> trước chữ cái (VD:{" "}
              <code className="rounded bg-background px-1.5 py-0.5">*B. by</code>) hoặc <b>in đậm</b> (VD:{" "}
              <code className="rounded bg-background px-1.5 py-0.5">**by**</code>). Với bài đọc đôi/ba (Part 7), hệ thống chỉ gộp thành 1
              đoạn — dùng &quot;+ Thêm đoạn văn&quot; để tách thủ công sau khi nhập. Bấm &quot;Điền ví dụ&quot; bên dưới để xem mẫu.
            </p>
          </ImportGuideCallout>

          <Textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={14}
            placeholder={GROUP_PASTE_EXAMPLE}
            className="font-mono text-xs"
          />
          <p className="text-sm font-medium">
            Nhận diện được <span className="text-success">{groupPaste.questions.length} câu</span>
            {groupPaste.passageText && <span className="text-muted-foreground"> · có đoạn hội thoại/bài đọc chung</span>}
            {groupPaste.skippedCount > 0 && (
              <span className="text-destructive"> · bỏ qua {groupPaste.skippedCount} câu (thiếu đáp án đúng hoặc thiếu lựa chọn)</span>
            )}
          </p>

          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setPasteText(GROUP_PASTE_EXAMPLE)} className="sm:mr-auto">
              Điền ví dụ
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setPasteOpen(false)}>
                Hủy nhập
              </Button>
              <Button type="button" onClick={applyGroupPaste} disabled={groupPaste.questions.length === 0}>
                Nhập {groupPaste.questions.length > 0 ? groupPaste.questions.length : ""} câu
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
