import { Skeleton } from "@/components/ui/skeleton";

interface StatusCardSkeletonProps {
  titleWidth?: string;
  subtitleWidth?: string;
  labelWidth?: string;
}

const StatusCardSkeleton = ({
  titleWidth = "w-16",
  subtitleWidth = "w-24",
  labelWidth = "w-14",
}: StatusCardSkeletonProps) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted animate-fade-in">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className={`h-4 ${titleWidth}`} />
          <Skeleton className={`h-3 ${subtitleWidth}`} />
        </div>
      </div>
      <Skeleton className={`h-4 ${labelWidth}`} />
    </div>
  );
};

export default StatusCardSkeleton;
