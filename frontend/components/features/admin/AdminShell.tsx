import Link from "next/link";
import type { ReactNode } from "react";
import { AdminSignOut } from "@/components/features/admin/AdminSignOut";
import { HealthHubLogo } from "@/components/layout/HealthHubLogo";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "home", href: ROUTES.adminHome, label: "Home" },
  { id: "clinicians", href: ROUTES.adminClinicians, label: "Clinicians" },
  { id: "patients", href: ROUTES.adminPatients, label: "Patients" },
  { id: "reports", href: ROUTES.adminReports, label: "Reports" },
  { id: "requests", href: ROUTES.adminRequests, label: "Access" },
] as const;

export function AdminShell({
  name,
  section,
  children,
}: {
  name: string;
  section: (typeof SECTIONS)[number]["id"];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted">
      <header className="bg-background">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <HealthHubLogo />
          <div className="flex items-center gap-3">
            <p className="hidden type-label text-foreground sm:block">{name}</p>
            <AdminSignOut />
          </div>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-4 sm:px-6">
          {SECTIONS.map((item) => {
            const current = item.id === section;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "border-b-2 px-3 py-3 type-label",
                  current
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
