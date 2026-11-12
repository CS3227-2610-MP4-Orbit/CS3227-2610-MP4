import { PageContainer } from "@/components/app/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <div aria-busy="true" className="space-y-6">
        <Skeleton className="h-14 w-72" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64 w-full" />
      </div>
    </PageContainer>
  );
}
