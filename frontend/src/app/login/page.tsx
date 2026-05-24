"use client";

import { signIn, useSession } from "next-auth/react";

import { redirect } from "next/navigation";

import {  Sparkles, Shield, ImageIcon, Globe } from "lucide-react";

export default function LoginPage() {
  const { data: session } = useSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="grid lg:grid-cols-2 gap-10 items-center w-full">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-gray-300">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            AI Powered Workflow Platform
          </div>

          <div className="space-y-5">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Manage AI Image Workflows Like a Real Team
            </h1>

            <p className="text-lg text-gray-400 max-w-xl">
              Generate product imagery, review outputs, collaborate with admins,
              manage revisions, and streamline creative workflows.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="border border-white/10 bg-white/5 rounded-2xl p-4">
              <ImageIcon className="h-6 w-6 mb-3 text-blue-400" />

              <h3 className="font-semibold">AI Generation</h3>

              <p className="text-sm text-gray-400 mt-2">
                Generate professional product visuals
              </p>
            </div>

            <div className="border border-white/10 bg-white/5 rounded-2xl p-4">
              <Shield className="h-6 w-6 mb-3 text-green-400" />

              <h3 className="font-semibold">Admin Review</h3>

              <p className="text-sm text-gray-400 mt-2">
                Review, approve and request revisions
              </p>
            </div>

            <div className="border border-white/10 bg-white/5 rounded-2xl p-4">
              <Sparkles className="h-6 w-6 mb-3 text-purple-400" />

              <h3 className="font-semibold">Smart Workflow</h3>

              <p className="text-sm text-gray-400 mt-2">
                Track progress with collaborative tools
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-bold">Welcome Back</h2>

              <p className="text-gray-400">Continue into your workspace</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() =>
                  signIn("google", {
                    callbackUrl: "/dashboard",
                  })
                }
                className="w-full h-14 rounded-2xl bg-white text-black font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-all"
              >
                <Globe className="h-5 w-5" />
                Continue with Google
              </button>

              <button
                onClick={() =>
                  signIn("github", {
                    callbackUrl: "/dashboard",
                  })
                }
                className="w-full h-14 rounded-2xl border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-3"
              >
               
                Continue with GitHub
              </button>
            </div>

            <div className="pt-4 border-t border-white/10 text-center text-sm text-gray-500">
              Secure authentication powered by OAuth
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
