"use client";

import { useActionState } from "react";
import { CircleAlert, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { authenticate, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(authenticate, {});

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="h-10" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="current-password" className="h-10" />
      </div>
      {state.error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{state.error}
        </p>
      )}
      <div className="grid gap-2.5 pt-1">
        <Button name="intent" value="signin" disabled={pending} size="lg" className="h-10">
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}Sign in
        </Button>
        <Button name="intent" value="signup" disabled={pending} variant="outline" size="lg" className="h-10">
          Create account
        </Button>
      </div>
    </form>
  );
}
