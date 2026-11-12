import type { Metadata } from "next";
import { ClipboardCheck, FileCode2, Wrench } from "lucide-react";

import { Logo } from "@/components/app/logo";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const STEPS = [
  { icon: FileCode2, role: "Reporter", text: "Files a bug with a small Python snippet and what went wrong.", dot: "bg-zinc-400" },
  { icon: Wrench, role: "Developer", text: "Investigates, keeps notes and submits a versioned fix.", dot: "bg-sky-400" },
  { icon: ClipboardCheck, role: "QA tester", text: "Records tests against the fix, then approves or sends it back.", dot: "bg-amber-400" },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="flex flex-col px-6 py-8 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to BugFlow</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Your role decides which workspace opens after you sign in.</p>
          <div className="mt-8"><LoginForm /></div>
        </div>
        <p className="text-xs text-muted-foreground">CS3227 · Agentic Software Engineering</p>
      </section>

      <aside aria-label="How BugFlow works" className="relative hidden overflow-hidden bg-zinc-950 text-zinc-100 lg:flex lg:flex-col lg:justify-center">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_20%,oklch(0.45_0.2_275/0.45),transparent),radial-gradient(40%_40%_at_10%_90%,oklch(0.5_0.15_200/0.25),transparent)]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]" />
        <div className="relative mx-auto w-full max-w-lg px-12">
          <p className="text-xs font-medium tracking-widest text-indigo-300 uppercase">Report → Fix → Verify</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white">Every Python bug, from first report to verified fix.</h2>
          <p className="mt-3 text-sm text-zinc-400">Three roles, one shared record. Nothing closes until QA has tested the fix.</p>
          <ol className="mt-10 space-y-3">
            {STEPS.map(({ icon: Icon, role, text, dot }, index) => (
              <li key={role} className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10"><Icon className="size-4 text-white" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-white"><span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} />{index + 1}. {role}</p>
                  <p className="mt-0.5 text-sm text-zinc-400">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-400" /> Closed only after QA approves
          </div>
        </div>
      </aside>
    </main>
  );
}
