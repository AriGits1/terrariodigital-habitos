import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth/queries";
import OnboardingForm from "@/features/onboarding/OnboardingForm";

/**
 * First-run welcome page (UC-05).
 *
 * Access rules:
 *  – Not authenticated → /login
 *  – Already onboarded → / (skip)
 *  – Not onboarded    → show this page
 *
 * Intentionally does NOT call requireProfile() because that would create an
 * infinite redirect loop (requireProfile redirects here, this page redirects
 * there, etc.). Instead we resolve the profile manually.
 */
export default async function OnboardingPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.onboarded) {
    redirect("/");
  }

  return <OnboardingForm profileName={profile.name} />;
}
