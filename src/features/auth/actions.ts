"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword, hashPassword } from "./password";
import { createSession, destroySession } from "./session";
import { requireAdmin } from "./guards";

const GENERIC_AUTH_ERROR = "Invalid email or password";

/**
 * Authenticate a user by email + password.
 * Signature matches useActionState: (prevState, formData).
 * Returns { error } on failure; redirects to / on success.
 * Generic error message prevents user enumeration.
 */
export async function loginAction(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return { error: GENERIC_AUTH_ERROR };
  }

  const profile = await prisma.profile.findUnique({ where: { email } });

  // Always call verifyPassword even when profile is missing to neutralize
  // timing-based user enumeration. Use a fixed dummy hash.
  const DUMMY_HASH =
    "$2a$12$invalidhashfortimingneutralizationonly............";
  const hash = profile?.passwordHash ?? DUMMY_HASH;

  const valid = await verifyPassword(password, hash);

  if (!profile || !valid) {
    return { error: GENERIC_AUTH_ERROR };
  }

  await createSession(profile.id);
  redirect("/");
}

/**
 * Log out the current user: delete the session row + clear cookie.
 * Always redirects to /login, even if the session was already invalid.
 */
export async function logoutAction(): Promise<void> {
  const token = (await cookies()).get("session")?.value;
  if (token) {
    await destroySession(token);
  } else {
    // No token — still clear any stale cookie value
    const cookieStore = await cookies();
    cookieStore.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  redirect("/login");
}

/**
 * Admin-only: create a new user account.
 * Enforces requireAdmin() server-side — this action is a public endpoint.
 * Returns { error } on validation failures; returns { success: true } on success.
 */
export async function createUserAction(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  // Role check must happen in the action body, not just on the admin page.
  await requireAdmin();

  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;
  const role = (formData.get("role") as string | null) ?? "user";
  const name = (formData.get("name") as string | null)?.trim() ?? "User";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists" };
  }

  const passwordHash = await hashPassword(password);

  await prisma.profile.create({
    data: {
      name,
      email,
      passwordHash,
      role,
    },
  });

  return { success: true };
}
