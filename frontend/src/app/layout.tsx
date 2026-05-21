import type { Metadata } from "next";
import "./globals.css";

import AuthProvider from "@/providers/AuthProvider";

export const metadata: Metadata = {
  title: "TaskHub",
  description: "AI Product Photography Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
