import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { site } from "@/content";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.appName} · ${site.chapterShort} Recruitment`,
  description: `Apply to join ${site.chapterName}. 7 levels, about 5 minutes, no sign-in.`,
  icons: { icon: "/brand/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f4e9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} antialiased`}>
      <body className="paper-bg min-h-dvh">{children}</body>
    </html>
  );
}
