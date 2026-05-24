"use client";

import { useEffect } from "react";

import { signIn, useSession } from "next-auth/react";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (session) {
      if (session.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-white/10 bg-white/5 backdrop-blur-sm rounded-3xl p-8 space-y-5">
        <div>
          <h1 className="text-4xl font-bold">Welcome to TaskHub</h1>

          <p className="text-gray-400 mt-3">AI Workflow Platform</p>
        </div>

        <button
          onClick={() =>
            signIn("google", {
              callbackUrl: "/dashboard",
            })
          }
          className="w-full bg-white text-black py-3 rounded-xl font-medium hover:opacity-90 transition-all duration-200"
        >
          Continue with Google
        </button>

        <button
          onClick={() =>
            signIn("github", {
              callbackUrl: "/dashboard",
            })
          }
          className="w-full border border-white/10 hover:border-white/20 transition-all duration-200 py-3 rounded-xl"
        >
          Continue with GitHub
        </button>
      </div>
    </div>
  );
}
