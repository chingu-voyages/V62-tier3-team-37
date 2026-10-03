import type { ReactNode } from "react";

type MainLayoutProps = {
  children: ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-8xl flex-1 flex-col px-6 py-8 pb-24 md:pb-8 lg:px-8 xl:px-20">
        {children}
      </div>
    </main>
  );
}
