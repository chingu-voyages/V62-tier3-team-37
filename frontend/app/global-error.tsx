"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown by the root layout itself.
 *
 * Must render its own `<html>`/`<body>` because the root layout that would
 * normally supply them has already failed.
 */
export default function GlobalError({ error, retry }: { error: Error; retry: () => void }) {
  useEffect(() => {
    console.error("Root layout failed", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            HealthHub is temporarily unavailable
          </h1>
          <p style={{ marginTop: "0.75rem", color: "#52525b" }}>
            The application failed to start. Please reload the page.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1.25rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid currentColor",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
