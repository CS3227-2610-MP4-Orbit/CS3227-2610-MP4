"use client";

import { useActionState } from "react";

import { authenticate, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(authenticate, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input name="email" type="email" required autoComplete="email" className="rounded border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="rounded border px-3 py-2"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button name="intent" value="signin" disabled={pending} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
          Sign in
        </button>
        <button name="intent" value="signup" disabled={pending} className="rounded border px-4 py-2 disabled:opacity-50">
          Create account
        </button>
      </div>
    </form>
  );
}
