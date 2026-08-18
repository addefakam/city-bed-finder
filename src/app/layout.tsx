import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "City Bed Finder - Check Real Availability",
  description:
    "Browse real-time room availability across all guest houses in the city. No hidden information.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bed Finder",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e40af",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-surface)] antialiased">
        {children}
      </body>
    </html>
  );
}
