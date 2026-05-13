import { Skeleton } from "@/components/ui/skeleton";
import { HStack, VStack } from "@/components/ui/stack";

/**
 * Estado de carga para rutas del panel.
 */
export default function DashboardLoading() {
  return (
    <VStack className="gap-6 p-2">
      <Skeleton className="h-8 w-48" />
      <HStack className="gap-4">
        <Skeleton className="h-32 min-w-[200px] flex-1" />
        <Skeleton className="h-32 min-w-[200px] flex-1" />
        <Skeleton className="h-32 min-w-[200px] flex-1" />
      </HStack>
      <Skeleton className="min-h-[200px] w-full flex-1" />
    </VStack>
  );
}
