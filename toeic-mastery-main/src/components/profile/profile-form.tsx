"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { updateProfileAction } from "@/lib/actions/profile";

export function ProfileForm({ defaultValues }: { defaultValues: ProfileInput }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(profileSchema), defaultValues });

  async function onSubmit(values: ProfileInput) {
    const result = await updateProfileAction(values);
    if (result.error) toast.error(result.error);
    else toast.success("Đã lưu hồ sơ");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Họ và tên</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="targetScore">Điểm mục tiêu</Label>
          <Input id="targetScore" type="number" min={10} max={990} step={5} {...register("targetScore")} />
          {errors.targetScore && <p className="text-xs text-destructive">{errors.targetScore.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="examDate">Ngày thi dự kiến</Label>
          <Input id="examDate" type="date" {...register("examDate")} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dailyStudyTargetMinutes">Mục tiêu học mỗi ngày (phút)</Label>
        <Input id="dailyStudyTargetMinutes" type="number" min={5} max={600} {...register("dailyStudyTargetMinutes")} />
        {errors.dailyStudyTargetMinutes && <p className="text-xs text-destructive">{errors.dailyStudyTargetMinutes.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Lưu thay đổi
      </Button>
    </form>
  );
}
