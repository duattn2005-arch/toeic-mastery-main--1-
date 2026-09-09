"use client";

import * as React from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { setUserRoleAction } from "@/lib/actions/admin-users";

const ROLE_LABEL: Record<"STUDENT" | "ADMIN", string> = { STUDENT: "Học viên", ADMIN: "Admin" };

export function RoleSelect({
  userId,
  role,
  canEdit = true,
}: {
  userId: string;
  role: "STUDENT" | "ADMIN";
  /** Off for every admin except the super-admin account — see
   * setUserRoleAction, which enforces this same restriction server-side. */
  canEdit?: boolean;
}) {
  const [pending, startTransition] = React.useTransition();
  const [value, setValue] = React.useState(role);

  function handleChange(next: string) {
    startTransition(async () => {
      const result = await setUserRoleAction(userId, next as "STUDENT" | "ADMIN");
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setValue(next as "STUDENT" | "ADMIN");
      toast.success("Đã cập nhật quyền");
    });
  }

  if (!canEdit) {
    return (
      <Badge variant={value === "ADMIN" ? "default" : "secondary"} className="w-fit">
        {ROLE_LABEL[value]}
      </Badge>
    );
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger size="sm" className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="STUDENT">Học viên</SelectItem>
        <SelectItem value="ADMIN">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
