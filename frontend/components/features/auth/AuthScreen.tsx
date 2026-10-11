import { AuthPanels, type AuthTab } from "@/components/features/auth/AuthPanels";
import type { SignupRole } from "@/types/auth";

type AuthScreenProps = {
  initialTab?: AuthTab;
  initialRole?: SignupRole;
};

/**
 * The single login/register screen.
 *
 * A Server Component on purpose. It used to carry `"use client"` and hold the
 * tab and role state itself, which dragged the card, both forms and the whole
 * motion layer across the client boundary as one unit — everything below a
 * `"use client"` file is a client module, whether or not it needs to be.
 *
 * The state now lives in `AuthPanels`, a small island that sits above the tab
 * strip and the two panels and nothing else. Each panel is a `next/dynamic`
 * chunk, so a visitor only downloads the half of the screen they are looking at,
 * and the screen itself renders to HTML on the server like any other page.
 */
export function AuthScreen({ initialTab = "register", initialRole = "PATIENT" }: AuthScreenProps) {
  return <AuthPanels initialTab={initialTab} initialRole={initialRole} />;
}
