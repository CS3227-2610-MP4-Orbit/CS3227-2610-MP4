import { PageContainer } from "@/components/app/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer wide>
      <div aria-busy="true" className="space-y-6">
        <Skeleton className="h-16 w-2/3" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"><Skeleton className="h-96" /><Skeleton className="h-72" /></div>
      </div>
    </PageContainer>
  );
}
