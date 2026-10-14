"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";

import { installFlushSyncWarningFilter } from "@/lib/dev/suppress-known-warnings";

// Module scope, not inside the component: this has to run before anything below
// renders, otherwise the first commit logs the warning before the filter exists.
// The install is a no-op on the server and in production, so it is safe to evaluate
// during SSR and in the production bundle.
installFlushSyncWarningFilter();

/**
 * The toast outlet is not on the critical path.
 *
 * Nothing renders a toast until the visitor has done something — a form submit,
 * a photo upload — and by then hydration has long finished. Loading the outlet
 * with `ssr: false` keeps `sonner` out of the initial payload of every route.
 *
 * Safe because `sonner` keeps its queue in a module-level store and replays
 * whatever is still active to each new subscriber, so a toast raised in the
 * moment before the chunk lands is shown rather than dropped.
 */
const Toaster = dynamic(() => import("sonner").then((m) => m.Toaster), { ssr: false });

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  // A fresh client per server render, one shared client per browser session.
  if (typeof window === "undefined") return makeQueryClient();

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: { fontFamily: "var(--font-outfit)" },
        }}
      />{" "}
    </QueryClientProvider>
  );
}
