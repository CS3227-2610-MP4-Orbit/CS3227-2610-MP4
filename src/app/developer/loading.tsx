export default function Loading() {
  return (
    <main aria-busy="true" className="mx-auto w-full max-w-4xl flex-1 p-6">
      <div className="h-9 w-64 animate-pulse rounded bg-gray-200" />
      <div className="mt-6 h-28 animate-pulse rounded-xl bg-gray-100" />
    </main>
  );
}
