"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { testFormSchema, type TestFormInput } from "@/lib/validations/admin";
import { createTestAction, updateTestAction } from "@/lib/actions/admin-tests";
import { ImageUploader } from "@/components/admin/image-uploader";

export function TestForm({ testId, defaultValues }: { testId?: string; defaultValues: TestFormInput }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(testFormSchema), defaultValues });

  async function onSubmit(values: TestFormInput) {
    const result = testId ? await updateTestAction(testId, values) : await createTestAction(values);
    if (result?.error) toast.error(result.error);
    else if (testId) toast.success("Đã lưu đề thi");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tiêu đề" error={errors.title?.message}>
          <Input {...register("title")} />
        </Field>
        <Field label="Slug" error={errors.slug?.message}>
          <Input {...register("slug")} placeholder="toeic-mock-test-01" />
        </Field>
      </div>

      <Field label="Mô tả">
        <Textarea rows={3} {...register("description")} />
      </Field>

      <Field label="Ảnh thumbnail" error={errors.thumbnailUrl?.message}>
        <ImageUploader value={watch("thumbnailUrl") ?? ""} onChange={(url) => setValue("thumbnailUrl", url, { shouldValidate: true })} />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Độ khó">
          <Select value={watch("difficulty")} onValueChange={(v) => setValue("difficulty", v as TestFormInput["difficulty"])}>
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
        <Field label="Trạng thái">
          <Select value={watch("status")} onValueChange={(v) => setValue("status", v as TestFormInput["status"])}>
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
        <Field label="Thời lượng (phút)" error={errors.durationMinutes?.message}>
          <Input type="number" {...register("durationMinutes")} />
        </Field>
        <Field label="Full Test?">
          <div className="flex h-9 items-center">
            <Switch checked={watch("isFullTest")} onCheckedChange={(v) => setValue("isFullTest", v)} />
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Số câu Listening" error={errors.listeningQuestions?.message}>
          <Input type="number" {...register("listeningQuestions")} />
        </Field>
        <Field label="Số câu Reading" error={errors.readingQuestions?.message}>
          <Input type="number" {...register("readingQuestions")} />
        </Field>
        <Field label="Cho phép nghe lại (thi thật)">
          <div className="flex h-9 items-center">
            <Switch checked={watch("allowReplay")} onCheckedChange={(v) => setValue("allowReplay", v)} />
          </div>
        </Field>
      </div>

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {testId ? "Lưu thay đổi" : "Tạo đề thi"}
      </Button>
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
