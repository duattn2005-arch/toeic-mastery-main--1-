import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
