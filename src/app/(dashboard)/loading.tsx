import { Skeleton } from "@/components/ui/skeleton";
import { VStack } from "@/components/ui/stack";

/**
 * Estado de carga para rutas del panel.
 */
export default function DashboardLoading() {
  return (
    <VStack className="gap-6 py-1">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40 sm:h-6 sm:w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 w-full sm:h-32" />
        <Skeleton className="h-28 w-full sm:h-32" />
        <Skeleton className="h-28 w-full sm:h-32" />
      </div>
      <Skeleton className="min-h-[180px] w-full flex-1 sm:min-h-[220px]" />
    </VStack>
  );
}
