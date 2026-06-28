"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function signupRedirect(error: string) {
  redirect(`/signup?error=${encodeURIComponent(error)}`);
}

function normalisePhone(value: string) {
  return value.replace(/[^0-9+]/g, "");
}

export async function signUp(formData: FormData) {
  const fullName = getFormString(formData, "fullName");
  const email = getFormString(formData, "email");
  const password = getFormString(formData, "password");
  const phone = normalisePhone(getFormString(formData, "phone"));

  if (!fullName) {
    signupRedirect("Enter your full name.");
  }

  if (!email || !password) {
    signupRedirect("Enter your email and password.");
  }

  if (password.length < 6) {
    signupRedirect("Use a password with at least 6 characters.");
  }

  if (!phone || phone.replace(/\D/g, "").length < 10) {
    signupRedirect("Enter a phone number with at least 10 digits.");
  }

  // Create the user with email pre-confirmed (skip the confirmation email).
  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone,
    },
  });

  if (createError || !created.user) {
    const msg = createError?.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered")) {
      signupRedirect("That email is already registered. Try logging in.");
    }
    signupRedirect("We could not create that account. Please try again.");
  }

  // Save the phone (and full name) onto the public profile.
  await admin
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", created!.user!.id);

  // Sign the freshly-created user in so they land on the account page.
  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirect("/login?next=/account");
  }

  redirect("/account");
}
