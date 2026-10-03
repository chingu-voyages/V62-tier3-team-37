import type { Metadata } from "next";
import { Outfit, Sora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "./providers";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  // Required for absolute OG/canonical URLs to resolve.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "HealthHub", template: "%s | HealthHub" },
  description: "One connected care journey for every patient and healthcare professional.",
  openGraph: {
    type: "website",
    siteName: "HealthHub",
    title: "HealthHub",
    description: "One connected care journey for every patient and healthcare professional.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("font-sans", sora.variable, outfit.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
