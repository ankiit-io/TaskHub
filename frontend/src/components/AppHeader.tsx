"use client";

import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import { signOut, useSession } from "next-auth/react";

import {
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Shield,
  Sparkles,
  User,
} from "lucide-react";

interface Props {
  title?: string;
  showBack?: boolean;
}

export default function AppHeader({ title, showBack = true }: Props) {
  const router = useRouter();

  const pathname = usePathname();

  const { data: session } = useSession();

  const isDashboard = pathname === "/dashboard";

  const isAdmin = pathname.startsWith("/admin");

  const isProfile = pathname === "/profile";

  const isLogin = pathname === "/login";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {showBack &&
            pathname !== "/" &&
            !isDashboard &&
            !isAdmin &&
            !isLogin && (
              <button
                onClick={() => router.back()}
                className="h-11 w-11 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

          <Link href="/" className="flex items-center gap-4 shrink-0">
            <div className="relative h-12 w-12 rounded-2xl bg-white text-black flex items-center justify-center font-bold text-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-300" />

              <span className="relative z-10">T</span>
            </div>

            <div className="hidden sm:block">
            
              </div>
          </Link>

          {title && (
            <>
              <div className="hidden md:block h-7 w-px bg-white/10" />

              <p className="hidden md:block text-sm text-gray-400 truncate">
                {title}
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session && (
            <>
              <Link
                href="/dashboard"
                className={`hidden md:flex h-11 px-5 rounded-2xl border transition-all items-center gap-2 text-sm font-medium ${
                  isDashboard
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                    : "border-white/10 hover:bg-white/10"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              {session.user.role === "admin" && (
                <Link
                  href="/admin"
                  className={`hidden md:flex h-11 px-5 rounded-2xl border transition-all items-center gap-2 text-sm font-medium ${
                    isAdmin
                      ? "border-red-500/30 bg-red-500/10 text-red-400"
                      : "border-white/10 hover:bg-white/10"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}

              <Link
                href="/profile"
                className={`h-11 px-4 rounded-2xl border transition-all flex items-center gap-3 ${
                  isProfile
                    ? "border-green-500/30 bg-green-500/10"
                    : "border-white/10 hover:bg-white/10"
                }`}
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt="avatar"
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}

                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium leading-none">
                    {session.user.name}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {session.user.role === "admin" ? "Administrator" : "User"}
                  </p>
                </div>
              </Link>

              <button
                onClick={() =>
                  signOut({
                    callbackUrl: "/login",
                  })
                }
                className="h-11 w-11 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}

          {!session && (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 h-11 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-400 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                AI Workflow SaaS
              </div>

              <Link
                href="/login"
                className="h-11 px-6 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition-all flex items-center"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
