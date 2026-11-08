import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { RoleNavFallback } from "./reporter-nav";
import { SignedInNav } from "./signed-in-nav";

export const metadata: Metadata = {
  title: "Python Bug Workflow",
  description: "CS3227 MP4 project workspace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><Suspense fallback={<RoleNavFallback />}><SignedInNav /></Suspense>{children}</body>
    </html>
  );
}
