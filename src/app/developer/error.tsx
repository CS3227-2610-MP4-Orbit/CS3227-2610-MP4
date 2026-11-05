"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  void error;
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Developer workspace unavailable</h1>
      <p className="text-gray-600">The assigned reports could not be loaded. Try again.</p>
      <button className="w-fit rounded border px-4 py-2" onClick={() => reset()}>Retry</button>
    </main>
  );
}
