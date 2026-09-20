import { AuthScreen } from "@/components/features/auth/AuthScreen";

/**
 * The single login/register screen.
 *
 * Tabs ("Sign up" / "Log in") are local UI state handled inside AuthScreen —
 * no URL change, no route change.
 */
export default function AuthPage() {
  return <AuthScreen />;
}
