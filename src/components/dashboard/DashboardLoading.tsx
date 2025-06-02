
import { CalendarSidebar } from "@/components/dashboard/CalendarSidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLoading() {
  return (
    <div className="min-h-screen" tabIndex={0}>
      <div className="flex">
        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <CalendarSidebar events={[]} nonnegotiables={[]} />
      </div>
    </div>
  );
}
