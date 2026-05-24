import type { Metadata } from "next";

import "./globals.css";

import AuthProvider from "@/providers/AuthProvider";

import AppHeader from "@/components/AppHeader";

import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "TaskHub",
  description: "AI Workflow Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#050505] text-white min-h-screen antialiased">
        <AuthProvider>
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[140px]" />

            <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[140px]" />
          </div>

          <AppHeader />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          <Toaster richColors position="top-right" theme="dark" />
        </AuthProvider>
      </body>
    </html>
  );
}
