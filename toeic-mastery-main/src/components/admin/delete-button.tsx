"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteButton({
  label,
  description,
  action,
  redirectTo,
}: {
  label: string;
  description: string;
  action: () => Promise<{ error?: string }>;
  redirectTo?: string;
}) {
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã xóa");
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="size-3.5" /> {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
