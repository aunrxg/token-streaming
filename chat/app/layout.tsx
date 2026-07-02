import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alchemyst AI",
  description: "Hiring Assignment JUNE 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden bg-canvas text-text-primary">
        {children}
      </body>
    </html>
  );
}
