"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { WORKSPACES } from "@/lib/roles";
import { getSignedInRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

export type LoginState = { error?: string };

/** Signs in, or creates the account first when "Create account" was pressed. */
export async function authenticate(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: "Enter an email and a password of at least 8 characters." };

  const supabase = await createClient();
  const { error } =
    form.get("intent") === "signup"
      ? await supabase.auth.signUp(parsed.data)
      : await supabase.auth.signInWithPassword(parsed.data);

  // One message for every failure, so the form does not reveal which emails are registered.
  if (error) return { error: "Could not sign in with those details." };
  // Land on the role's workspace; home explains the role if the profile cannot be read yet.
  const session = await getSignedInRole();
  redirect(session ? WORKSPACES[session.role].home : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
