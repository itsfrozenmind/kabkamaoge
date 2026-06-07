import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PM Radar — Nimesh",
  description: "Daily APM job scanner and PM people finder",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
