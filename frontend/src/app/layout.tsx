import type { Metadata } from "next";
import "./globals.css";

import AuthProvider from "@/providers/AuthProvider";
import { Toaster } from "sonner";
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
        <Toaster richColors position="top-right" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
