// biome-ignore-all lint/security/noDangerouslySetInnerHtml: this helper only receives static script code
"use client";

/**
 * Renders an inline script that must run synchronously while the browser
 * parses the HTML, before React hydrates.
 *
 * The `type` differs per environment on purpose. On the server it is an
 * executable script, so the browser runs it during parsing. On the client it
 * is a data block, which stops React's client renderer from warning about a
 * script tag it cannot execute once the document has been parsed. The type
 * mismatch during hydration is expected and suppressed.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
